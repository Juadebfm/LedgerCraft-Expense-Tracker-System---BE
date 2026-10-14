-- LedgerCraft foundation: authenticated people, workspace tenancy, and roles.
--
-- The auth schema is managed by Supabase. This migration adds the application
-- tables that refer to auth.users(id), then provisions a personal workspace
-- whenever Supabase Auth creates a user.

create type public.currency_code as enum ('NGN', 'USD');
create type public.workspace_type as enum ('personal', 'organisation');
create type public.workspace_role as enum ('admin', 'member');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 1 and 120),
  avatar_path text,
  timezone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  type public.workspace_type not null,
  reporting_currency public.currency_code not null default 'NGN',
  budget_visible_to_members boolean not null default false,
  created_by_profile_id uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role public.workspace_role not null,
  joined_at timestamptz not null default now(),
  primary key (workspace_id, profile_id)
);

-- Policies filter membership by profile ID, so this index is intentionally
-- separate from the composite primary key whose leading column is workspace_id.
create index workspace_members_profile_id_idx
  on public.workspace_members (profile_id);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

create trigger set_workspaces_updated_at
before update on public.workspaces
for each row execute procedure public.set_updated_at();

revoke all on function public.set_updated_at() from public;

-- These functions read membership without recursively applying the policies on
-- workspace_members. Their empty search path and fully qualified references are
-- deliberate safeguards for SECURITY DEFINER functions.
create function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members as membership
    where membership.workspace_id = target_workspace_id
      and membership.profile_id = (select auth.uid())
  );
$$;

create function public.is_workspace_admin(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members as membership
    where membership.workspace_id = target_workspace_id
      and membership.profile_id = (select auth.uid())
      and membership.role = 'admin'
  );
$$;

revoke all on function public.is_workspace_member(uuid) from public;
revoke all on function public.is_workspace_admin(uuid) from public;
grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.is_workspace_admin(uuid) to authenticated;

-- Supabase Auth runs this trigger when a user signs up. A SECURITY DEFINER
-- function is required because the auth management role does not otherwise have
-- privileges to insert into public application tables.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_currency public.currency_code;
  personal_workspace_id uuid := gen_random_uuid();
begin
  selected_currency := case new.raw_user_meta_data ->> 'reporting_currency'
    when 'USD' then 'USD'::public.currency_code
    when 'NGN' then 'NGN'::public.currency_code
    else 'NGN'::public.currency_code
  end;

  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'LedgerCraft user'
    )
  );

  insert into public.workspaces (
    id,
    name,
    slug,
    type,
    reporting_currency,
    created_by_profile_id
  )
  values (
    personal_workspace_id,
    'Personal workspace',
    'personal-' || new.id::text,
    'personal',
    selected_currency,
    new.id
  );

  insert into public.workspace_members (workspace_id, profile_id, role)
  values (personal_workspace_id, new.id, 'admin');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

revoke all on function public.handle_new_user() from public;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

-- Start from no browser-facing access, then grant only the operations each
-- table needs. Server-only workflows use a trusted server credential and retain
-- their own application authorization checks.
revoke all on public.profiles from anon, authenticated;
revoke all on public.workspaces from anon, authenticated;
revoke all on public.workspace_members from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (full_name, avatar_path, timezone) on public.profiles to authenticated;
grant select on public.workspaces to authenticated;
grant update (name, reporting_currency, budget_visible_to_members) on public.workspaces to authenticated;
grant select on public.workspace_members to authenticated;

create policy "Profiles are visible only to their owner"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Profiles are editable only by their owner"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Workspace members can view their workspaces"
  on public.workspaces
  for select
  to authenticated
  using ((select public.is_workspace_member(id)));

create policy "Workspace admins can update their workspaces"
  on public.workspaces
  for update
  to authenticated
  using ((select public.is_workspace_admin(id)))
  with check ((select public.is_workspace_admin(id)));

create policy "Workspace members can view workspace memberships"
  on public.workspace_members
  for select
  to authenticated
  using ((select public.is_workspace_member(workspace_id)));
