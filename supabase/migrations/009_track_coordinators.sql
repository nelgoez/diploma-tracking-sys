-- Track Coordinators table
-- Maps coordinators to the tracks they manage.
-- Referenced by coordinator routes; was missing from initial schema.

create table if not exists track_coordinators (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, track_id)
);

-- RLS: sysadmins and admins manage; coordinators read own
alter table track_coordinators enable row level security;

create policy "track_coordinators_select_own"
  on track_coordinators for select
  using (
    auth.uid() = user_id
    or exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'sysadmin'))
  );

create policy "track_coordinators_insert_admin"
  on track_coordinators for insert
  with check (
    exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'sysadmin'))
  );

create policy "track_coordinators_delete_admin"
  on track_coordinators for delete
  using (
    exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'sysadmin'))
  );

-- Index for coordinator lookups
create index if not exists idx_track_coordinators_user on track_coordinators(user_id);
create index if not exists idx_track_coordinators_track on track_coordinators(track_id);
