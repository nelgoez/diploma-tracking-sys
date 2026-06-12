-- Migration: diploma_files table + storage bucket
-- Generates and tracks diploma PDFs for approved enrollments

create table if not exists diploma_files (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references enrollments(id) on delete cascade,
  status varchar(20) not null default 'pending'
    check (status in ('pending', 'generated', 'error')),
  file_path text,
  reference_code varchar(12) unique,
  generated_at timestamptz,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists idx_diploma_files_enrollment
  on diploma_files (enrollment_id);

-- Row Level Security
alter table diploma_files enable row level security;

-- Students can read their own diploma
create policy "students_read_own" on diploma_files
  for select
  using (
    exists (
      select 1 from enrollments e
      where e.id = enrollment_id
      and e.student_id = auth.uid()
    )
  );

-- Staff can read all
create policy "staff_read_all" on diploma_files
  for select
  using (
    coalesce(
      (select role from users where id = auth.uid()) in ('coordinador', 'admin', 'sysadmin'),
      false
    )
  );

-- Staff can insert/update
create policy "staff_insert" on diploma_files
  for insert
  with check (
    coalesce(
      (select role from users where id = auth.uid()) in ('coordinador', 'admin', 'sysadmin'),
      false
    )
  );

create policy "staff_update" on diploma_files
  for update
  using (
    coalesce(
      (select role from users where id = auth.uid()) in ('coordinador', 'admin', 'sysadmin'),
      false
    )
  );

-- Auto-update updated_at
create trigger set_updated_at_diploma_files
  before update on diploma_files
  for each row
  execute function update_updated_at();

-- Storage bucket for diploma PDFs
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'diplomas',
  'diplomas',
  true,
  5242880, -- 5MB
  array['application/pdf']
)
on conflict (id) do nothing;

-- Storage policy: authenticated users can read diploma files
create policy "authenticated_read_diplomas"
  on storage.objects
  for select
  using (
    bucket_id = 'diplomas'
    and auth.role() = 'authenticated'
  );

-- Storage policy: service role can upload
create policy "service_upload_diplomas"
  on storage.objects
  for insert
  with check (
    bucket_id = 'diplomas'
    and auth.role() = 'service_role'
  );
