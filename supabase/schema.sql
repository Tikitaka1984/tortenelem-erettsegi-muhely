begin;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (char_length(btrim(display_name)) between 1 and 80)
);

create table if not exists public.course_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id integer not null,
  progress_percent numeric(5,2) not null default 0,
  status text not null default 'not_started',
  section_id text,
  scroll_position integer not null default 0,
  favorite boolean not null default false,
  last_opened_at timestamptz,
  client_updated_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, course_id),
  constraint course_progress_course_range check (course_id between 1 and 32),
  constraint course_progress_percent_range check (progress_percent between 0 and 100),
  constraint course_progress_status_values check (status in ('not_started', 'in_progress', 'completed')),
  constraint course_progress_scroll_nonnegative check (scroll_position >= 0),
  constraint course_progress_section_length check (section_id is null or char_length(section_id) <= 200),
  constraint course_progress_completion_consistency check (
    (status = 'completed' and completed_at is not null and progress_percent = 100)
    or (status <> 'completed' and completed_at is null)
  )
);

create index if not exists course_progress_last_opened_idx
  on public.course_progress (user_id, last_opened_at desc nulls last);

create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = public
as $$ begin new.updated_at = now(); return new; end; $$;

create or replace function public.prevent_stale_progress()
returns trigger language plpgsql security invoker set search_path = public
as $$
begin
  if new.client_updated_at < old.client_updated_at then
    raise exception 'stale_progress_update';
  end if;
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''), nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'Tanuló')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists course_progress_prevent_stale on public.course_progress;
create trigger course_progress_prevent_stale before update on public.course_progress
for each row execute function public.prevent_stale_progress();

drop trigger if exists course_progress_set_updated_at on public.course_progress;
create trigger course_progress_set_updated_at before update on public.course_progress
for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.course_progress enable row level security;
alter table public.profiles force row level security;
alter table public.course_progress force row level security;

revoke all on table public.profiles from anon;
revoke all on table public.course_progress from anon;
grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.course_progress to authenticated;

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy profiles_insert_own on public.profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy profiles_delete_own on public.profiles for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists course_progress_select_own on public.course_progress;
drop policy if exists course_progress_insert_own on public.course_progress;
drop policy if exists course_progress_update_own on public.course_progress;
drop policy if exists course_progress_delete_own on public.course_progress;
create policy course_progress_select_own on public.course_progress for select to authenticated using ((select auth.uid()) = user_id);
create policy course_progress_insert_own on public.course_progress for insert to authenticated with check ((select auth.uid()) = user_id);
create policy course_progress_update_own on public.course_progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy course_progress_delete_own on public.course_progress for delete to authenticated using ((select auth.uid()) = user_id);

commit;
