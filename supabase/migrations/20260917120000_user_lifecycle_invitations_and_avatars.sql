-- Complete the first user-management slice:
--
-- * a user can soft-delete their own account;
-- * an inactive user loses database access immediately, even if an old JWT has
--   not reached its expiry time yet; and
-- * avatars are public to read but writable only by their owner.

alter table public.profiles
  add column deleted_at timestamptz;

-- A caller whose profile is inactive must not retain workspace access through
-- an already-issued JWT. Both functions are used by RLS policies and by the
-- member-management SQL functions.
create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members as membership
    join public.profiles on profiles.id = membership.profile_id
    where membership.workspace_id = target_workspace_id
      and membership.profile_id = (select auth.uid())
      and profiles.deleted_at is null
  );
$$;

create or replace function public.is_workspace_admin(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members as membership
    join public.profiles on profiles.id = membership.profile_id
    where membership.workspace_id = target_workspace_id
      and membership.profile_id = (select auth.uid())
      and membership.role = 'admin'
      and profiles.deleted_at is null
  );
$$;

drop policy "Profiles are visible only to their owner" on public.profiles;
create policy "Active profiles are visible only to their owner"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id and deleted_at is null);

drop policy "Profiles are editable only by their owner" on public.profiles;
create policy "Active profiles are editable only by their owner"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id and deleted_at is null)
  with check ((select auth.uid()) = id and deleted_at is null);

-- An active Admin must transfer the role before deleting their account if they
-- are the last active Admin of an organisation workspace. The advisory lock
-- prevents two Admins from passing the check at the same time.
create function public.soft_delete_current_profile()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  organisation_workspace_id uuid;
  active_admin_count integer;
begin
  if (select auth.uid()) is null then
    raise exception 'A signed-in user is required.' using errcode = '42501';
  end if;

  for organisation_workspace_id in
    select workspace_members.workspace_id
    from public.workspace_members
    join public.workspaces on workspaces.id = workspace_members.workspace_id
    where workspace_members.profile_id = (select auth.uid())
      and workspace_members.role = 'admin'
      and workspaces.type = 'organisation'::public.workspace_type
  loop
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtext(organisation_workspace_id::text)
    );

    select count(*) into active_admin_count
    from public.workspace_members
    join public.profiles on profiles.id = workspace_members.profile_id
    where workspace_members.workspace_id = organisation_workspace_id
      and workspace_members.role = 'admin'
      and profiles.deleted_at is null;

    if active_admin_count <= 1 then
      raise exception 'Transfer the final Admin role before deleting this account.'
        using errcode = '23514';
    end if;
  end loop;

  update public.profiles
  set deleted_at = now()
  where id = (select auth.uid())
    and deleted_at is null;

  if not found then
    raise exception 'The active profile does not exist.' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.soft_delete_current_profile() from public;
grant execute on function public.soft_delete_current_profile() to authenticated;

-- Existing member addition remains useful when an Admin already knows the
-- profile ID. It must not reactivate or add a soft-deleted account.
create or replace function public.add_workspace_member(
  target_workspace_id uuid,
  target_profile_id uuid,
  target_role public.workspace_role
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_workspace_type public.workspace_type;
begin
  if not (select public.is_workspace_admin(target_workspace_id)) then
    raise exception 'Only a workspace Admin can add members.' using errcode = '42501';
  end if;

  select workspaces.type into target_workspace_type
  from public.workspaces
  where workspaces.id = target_workspace_id;

  if target_workspace_type is distinct from 'organisation'::public.workspace_type then
    raise exception 'Members can only be added to organisation workspaces.' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.profiles
    where profiles.id = target_profile_id
      and profiles.deleted_at is null
  ) then
    raise exception 'The selected active profile does not exist.' using errcode = '23503';
  end if;

  if exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace_id
      and profile_id = target_profile_id
  ) then
    raise exception 'The selected profile is already a workspace member.' using errcode = '23505';
  end if;

  insert into public.workspace_members (workspace_id, profile_id, role)
  values (target_workspace_id, target_profile_id, target_role);
end;
$$;

-- The member list now supplies an avatar path. The API turns this Storage path
-- into the public URL that React can put directly in an image element.
drop function public.list_workspace_members(uuid);
create function public.list_workspace_members(target_workspace_id uuid)
returns table (
  profile_id uuid,
  full_name text,
  avatar_path text,
  role public.workspace_role,
  joined_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.is_workspace_admin(target_workspace_id)) then
    raise exception 'Only a workspace Admin can view the member list.' using errcode = '42501';
  end if;

  return query
  select
    profiles.id,
    profiles.full_name,
    profiles.avatar_path,
    workspace_members.role,
    workspace_members.joined_at
  from public.workspace_members
  join public.profiles on profiles.id = workspace_members.profile_id
  where workspace_members.workspace_id = target_workspace_id
  order by workspace_members.joined_at asc;
end;
$$;

revoke all on function public.list_workspace_members(uuid) from public;
grant execute on function public.list_workspace_members(uuid) to authenticated;

-- A public bucket lets anyone load an avatar URL. Uploading or replacing an
-- object remains protected by RLS and is restricted to one fixed object path
-- for each active user.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Active users can create their avatar"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and name = (select auth.uid()::text || '/avatar')
    and exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.deleted_at is null
    )
  );

create policy "Active users can inspect their avatar"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and name = (select auth.uid()::text || '/avatar')
    and exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.deleted_at is null
    )
  );

create policy "Active users can replace their avatar"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and name = (select auth.uid()::text || '/avatar')
    and exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.deleted_at is null
    )
  )
  with check (
    bucket_id = 'avatars'
    and name = (select auth.uid()::text || '/avatar')
    and exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.deleted_at is null
    )
  );
