-- ============================================================
-- Master Speaking LMS — Supabase Schema
-- Execute este SQL no Supabase SQL Editor
-- ============================================================

-- ─── Extensions ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Enums ──────────────────────────────────────────────────
create type user_role as enum ('teacher', 'student');
create type module_type as enum ('summary', 'tasks', 'speaking');
create type upload_status as enum ('processing', 'completed', 'error');

-- ─── Profiles ───────────────────────────────────────────────
create table profiles (
  id           uuid references auth.users on delete cascade primary key,
  role         user_role not null default 'student',
  full_name    text,
  email        text,
  avatar_url   text,
  created_at   timestamptz default now() not null,
  updated_at   timestamptz default now() not null
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'student')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── Lessons ────────────────────────────────────────────────
create table lessons (
  id            uuid default gen_random_uuid() primary key,
  title         text not null,
  description   text,
  cover_emoji   text default '📚',
  order_index   integer not null default 0,
  is_published  boolean default false,
  created_by    uuid references profiles(id) on delete set null,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

-- ─── Modules (3 por aula: summary | tasks | speaking) ───────
create table modules (
  id            uuid default gen_random_uuid() primary key,
  lesson_id     uuid references lessons(id) on delete cascade not null,
  type          module_type not null,
  title         text not null,
  content_json  jsonb,
  order_index   integer not null default 0,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null,
  unique(lesson_id, type)
);

-- ─── Scores ─────────────────────────────────────────────────
create table scores (
  id                   uuid default gen_random_uuid() primary key,
  student_id           uuid references profiles(id) on delete cascade not null,
  module_id            uuid references modules(id) on delete cascade not null,
  lesson_id            uuid references lessons(id) on delete cascade not null,
  score                integer not null check (score between 0 and 100),
  time_spent_seconds   integer,
  completed_at         timestamptz default now() not null,
  unique(student_id, module_id)
);

-- ─── PPT Uploads ────────────────────────────────────────────
create table ppt_uploads (
  id            uuid default gen_random_uuid() primary key,
  filename      text not null,
  storage_path  text not null,
  lesson_id     uuid references lessons(id) on delete set null,
  status        upload_status default 'processing',
  uploaded_by   uuid references profiles(id) on delete set null,
  created_at    timestamptz default now() not null
);

-- ─── Views: Performance dos Alunos ──────────────────────────
create or replace view student_performance as
  select
    s.student_id,
    p.full_name as student_name,
    s.lesson_id,
    l.title as lesson_title,
    round(avg(s.score))::integer as avg_score,
    count(s.id) as modules_completed,
    max(s.completed_at) as last_activity
  from scores s
  join profiles p on p.id = s.student_id
  join lessons l on l.id = s.lesson_id
  group by s.student_id, p.full_name, s.lesson_id, l.title;

-- ─── Row Level Security (RLS) ───────────────────────────────
alter table profiles    enable row level security;
alter table lessons     enable row level security;
alter table modules     enable row level security;
alter table scores      enable row level security;
alter table ppt_uploads enable row level security;

-- Profiles: usuário vê/edita apenas o próprio perfil; teacher vê todos
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Teachers can view all profiles"
  on profiles for select
  using (exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'teacher'
  ));

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Lessons: teacher gerencia; aluno vê as publicadas
create policy "Teachers can manage lessons"
  on lessons for all
  using (exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'teacher'
  ));

create policy "Students can view published lessons"
  on lessons for select
  using (is_published = true);

-- Modules: teacher gerencia; aluno vê módulos de aulas publicadas
create policy "Teachers can manage modules"
  on modules for all
  using (exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'teacher'
  ));

create policy "Students can view modules of published lessons"
  on modules for select
  using (exists (
    select 1 from lessons l where l.id = lesson_id and l.is_published = true
  ));

-- Scores: aluno gerencia os próprios; teacher vê todos
create policy "Students can manage own scores"
  on scores for all using (auth.uid() = student_id);

create policy "Teachers can view all scores"
  on scores for select
  using (exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'teacher'
  ));

-- PPT uploads: somente teacher
create policy "Teachers can manage uploads"
  on ppt_uploads for all
  using (exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'teacher'
  ));

-- ─── Seed: Aula 1 (Speaker Support - conteúdo existente) ────
insert into lessons (title, description, cover_emoji, order_index, is_published)
values ('Speaker Support', 'Vocabulário e comunicação profissional em eventos', '🎙️', 1, true);
