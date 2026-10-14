-- Organisation workspace and membership management.
--
-- These RPCs are SECURITY DEFINER because direct INSERT/UPDATE/DELETE access
-- to workspace_members is intentionally not granted to browser-facing users.
-- Every function checks auth.uid() and the caller's Admin membership itself.

create function public.create_organisation_workspace(
  input_name text,
  input_slug text,
  input_reporting_currency public.currency_code
)
returns table (
  id uuid,
  name text,
  slug text,
  type public.workspace_type,
  reporting_currency public.currency_code,
  role public.workspace_role
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_profile_id uuid := (select auth.uid());
  new_workspace_id uuid;
begin
  if actor_profile_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  if char_length(btrim(input_name)) not between 1 and 120 then
    raise exception 'Workspace name must be between 1 and 120 characters.' using errcode = '22023';
  end if;

  if input_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'Workspace slug is invalid.' using errcode = '22023';
  end if;

  if not exists (select 1 from public.profiles where profiles.id = actor_profile_id) then
    raise exception 'Authenticated profile does not exist.' using errcode = '23503';
  end if;

  insert into public.workspaces (
    name,
    slug,
    type,
    reporting_currency,
    created_by_profile_id
  )
  values (
    btrim(input_name),
    input_slug,
    'organisation',
    input_reporting_currency,
    actor_profile_id
  )
  returning workspaces.id into new_workspace_id;

  insert into public.workspace_members (workspace_id, profile_id, role)
  values (new_workspace_id, actor_profile_id, 'admin');

  return query
  select
    workspaces.id,
    workspaces.name,
    workspaces.slug,
    workspaces.type,
    workspaces.reporting_currency,
    workspace_members.role
  from public.workspaces
  join public.workspace_members
    on workspace_members.workspace_id = workspaces.id
  where workspaces.id = new_workspace_id
    and workspace_members.profile_id = actor_profile_id;
end;
$$;

create function public.list_workspace_members(target_workspace_id uuid)
returns table (
  profile_id uuid,
  full_name text,
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
    workspace_members.role,
    workspace_members.joined_at
  from public.workspace_members
  join public.profiles on profiles.id = workspace_members.profile_id
  where workspace_members.workspace_id = target_workspace_id
  order by workspace_members.joined_at asc;
end;
$$;

create function public.add_workspace_member(
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

  if not exists (select 1 from public.profiles where profiles.id = target_profile_id) then
    raise exception 'The selected profile does not exist.' using errcode = '23503';
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

create function public.set_workspace_member_role(
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
  existing_role public.workspace_role;
  admin_count integer;
begin
  if not (select public.is_workspace_admin(target_workspace_id)) then
    raise exception 'Only a workspace Admin can change member roles.' using errcode = '42501';
  end if;

  -- Serialize Admin-role changes for one workspace. Without this lock, two
  -- concurrent requests could each see two Admins and both demote one.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(target_workspace_id::text));

  select workspaces.type into target_workspace_type
  from public.workspaces
  where workspaces.id = target_workspace_id;

  if target_workspace_type is distinct from 'organisation'::public.workspace_type then
    raise exception 'Member roles can only be changed in organisation workspaces.' using errcode = '22023';
  end if;

  select workspace_members.role into existing_role
  from public.workspace_members
  where workspace_members.workspace_id = target_workspace_id
    and workspace_members.profile_id = target_profile_id;

  if existing_role is null then
    raise exception 'The selected profile is not a workspace member.' using errcode = 'P0002';
  end if;

  if existing_role = 'admin' and target_role = 'member' then
    select count(*) into admin_count
    from public.workspace_members
    where workspace_id = target_workspace_id
      and role = 'admin';

    if admin_count <= 1 then
      raise exception 'An organisation workspace must retain at least one Admin.' using errcode = '23514';
    end if;
  end if;

  update public.workspace_members
  set role = target_role
  where workspace_id = target_workspace_id
    and profile_id = target_profile_id;
end;
$$;

create function public.remove_workspace_member(
  target_workspace_id uuid,
  target_profile_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_workspace_type public.workspace_type;
  existing_role public.workspace_role;
  admin_count integer;
begin
  if not (select public.is_workspace_admin(target_workspace_id)) then
    raise exception 'Only a workspace Admin can remove members.' using errcode = '42501';
  end if;

  -- See set_workspace_member_role: this keeps the last-Admin invariant safe
  -- when concurrent removal requests target the same workspace.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(target_workspace_id::text));

  select workspaces.type into target_workspace_type
  from public.workspaces
  where workspaces.id = target_workspace_id;

  if target_workspace_type is distinct from 'organisation'::public.workspace_type then
    raise exception 'Members can only be removed from organisation workspaces.' using errcode = '22023';
  end if;

  select workspace_members.role into existing_role
  from public.workspace_members
  where workspace_members.workspace_id = target_workspace_id
    and workspace_members.profile_id = target_profile_id;

  if existing_role is null then
    raise exception 'The selected profile is not a workspace member.' using errcode = 'P0002';
  end if;

  if existing_role = 'admin' then
    select count(*) into admin_count
    from public.workspace_members
    where workspace_id = target_workspace_id
      and role = 'admin';

    if admin_count <= 1 then
      raise exception 'An organisation workspace must retain at least one Admin.' using errcode = '23514';
    end if;
  end if;

  delete from public.workspace_members
  where workspace_id = target_workspace_id
    and profile_id = target_profile_id;
end;
$$;

revoke all on function public.create_organisation_workspace(text, text, public.currency_code) from public;
revoke all on function public.list_workspace_members(uuid) from public;
revoke all on function public.add_workspace_member(uuid, uuid, public.workspace_role) from public;
revoke all on function public.set_workspace_member_role(uuid, uuid, public.workspace_role) from public;
revoke all on function public.remove_workspace_member(uuid, uuid) from public;

grant execute on function public.create_organisation_workspace(text, text, public.currency_code) to authenticated;
grant execute on function public.list_workspace_members(uuid) to authenticated;
grant execute on function public.add_workspace_member(uuid, uuid, public.workspace_role) to authenticated;
grant execute on function public.set_workspace_member_role(uuid, uuid, public.workspace_role) to authenticated;
grant execute on function public.remove_workspace_member(uuid, uuid) to authenticated;
