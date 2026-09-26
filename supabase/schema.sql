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
  favorite_updated_at timestamptz not null default now(),
  last_opened_at timestamptz,
  client_updated_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, course_id),
  constraint course_progress_course_range check (course_id >= 1),
  constraint course_progress_percent_range check (progress_percent between 0 and 100),
  constraint course_progress_status_values check (status in ('not_started', 'in_progress', 'completed')),
  constraint course_progress_scroll_nonnegative check (scroll_position >= 0),
  constraint course_progress_section_length check (section_id is null or char_length(section_id) <= 200),
  constraint course_progress_completion_consistency check (
    (status = 'completed' and completed_at is not null and progress_percent = 100)
    or (status <> 'completed' and completed_at is null)
  )
);

create table if not exists public.student_annotations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id integer not null,
  annotation_type text not null,
  section_id text,
  scroll_position integer not null default 0,
  anchor_key text not null,
  anchor_text text not null default '',
  note_text text,
  client_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_annotations_course_range check (course_id >= 1),
  constraint student_annotations_type_values check (annotation_type in ('bookmark', 'note', 'review')),
  constraint student_annotations_section_length check (section_id is null or char_length(section_id) <= 200),
  constraint student_annotations_scroll_nonnegative check (scroll_position >= 0),
  constraint student_annotations_anchor_key_length check (char_length(anchor_key) between 1 and 300),
  constraint student_annotations_anchor_text_length check (char_length(anchor_text) <= 500),
  constraint student_annotations_note_length check (
    (annotation_type = 'note' and note_text is not null and char_length(btrim(note_text)) between 1 and 2000)
    or (annotation_type <> 'note' and note_text is null)
  ),
  constraint student_annotations_anchor_unique unique (user_id, course_id, annotation_type, anchor_key)
);

create index if not exists course_progress_last_opened_idx
  on public.course_progress (user_id, last_opened_at desc nulls last);

create index if not exists student_annotations_user_updated_idx
  on public.student_annotations (user_id, updated_at desc);

create index if not exists student_annotations_user_type_idx
  on public.student_annotations (user_id, annotation_type, updated_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = public
as $$ begin new.updated_at = now(); return new; end; $$;

create or replace function public.prevent_stale_progress()
returns trigger language plpgsql security invoker set search_path = public
as $$
declare
  server_now timestamptz := clock_timestamp();
  progress_is_stale boolean;
  favorite_is_stale boolean;
begin
  -- A badly fast client clock may lead by at most five minutes, and is clamped
  -- to server time beyond that window so it cannot lock out real later edits.
  if new.client_updated_at > server_now + interval '5 minutes' then
    new.client_updated_at := server_now;
  end if;
  if new.favorite_updated_at > server_now + interval '5 minutes' then
    new.favorite_updated_at := server_now;
  end if;

  if tg_op = 'INSERT' then return new; end if;

  progress_is_stale := new.client_updated_at < old.client_updated_at;
  favorite_is_stale := new.favorite_updated_at < old.favorite_updated_at;

  if progress_is_stale and favorite_is_stale then
    raise exception 'stale_progress_update';
  end if;
  if progress_is_stale then
    new.progress_percent := old.progress_percent;
    new.status := old.status;
    new.section_id := old.section_id;
    new.scroll_position := old.scroll_position;
    new.last_opened_at := old.last_opened_at;
    new.completed_at := old.completed_at;
    new.client_updated_at := old.client_updated_at;
  end if;
  if favorite_is_stale then
    new.favorite := old.favorite;
    new.favorite_updated_at := old.favorite_updated_at;
  end if;
  return new;
end;
$$;

create or replace function public.prevent_stale_annotation()
returns trigger language plpgsql security invoker set search_path = public
as $$
begin
  if new.client_updated_at < old.client_updated_at then
    raise exception 'stale_annotation_update';
  end if;
  return new;
end;
$$;

create or replace function public.enforce_student_annotation_limit()
returns trigger language plpgsql security invoker set search_path = public
as $$
begin
  -- BEFORE INSERT also runs on UPSERT. Existing IDs or natural keys must remain
  -- writable even for accounts already at/above the limit; no rows are deleted.
  if exists (
    select 1 from public.student_annotations existing
    where existing.id = new.id
       or (existing.user_id = new.user_id
           and existing.course_id = new.course_id
           and existing.annotation_type = new.annotation_type
           and existing.anchor_key = new.anchor_key)
  ) then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));
  if exists (
    select 1 from public.student_annotations existing
    where existing.id = new.id
       or (existing.user_id = new.user_id
           and existing.course_id = new.course_id
           and existing.annotation_type = new.annotation_type
           and existing.anchor_key = new.anchor_key)
  ) then
    return new;
  end if;
  if (select count(*) from public.student_annotations where user_id = new.user_id) >= 1000 then
    raise exception 'annotation_limit_exceeded' using errcode = 'P0001';
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
create trigger course_progress_prevent_stale before insert or update on public.course_progress
for each row execute function public.prevent_stale_progress();

drop trigger if exists course_progress_set_updated_at on public.course_progress;
create trigger course_progress_set_updated_at before update on public.course_progress
for each row execute function public.set_updated_at();

drop trigger if exists student_annotations_prevent_stale on public.student_annotations;
create trigger student_annotations_prevent_stale before update on public.student_annotations
for each row execute function public.prevent_stale_annotation();

drop trigger if exists student_annotations_enforce_limit on public.student_annotations;
create trigger student_annotations_enforce_limit
before insert on public.student_annotations
for each row execute function public.enforce_student_annotation_limit();

drop trigger if exists student_annotations_set_updated_at on public.student_annotations;
create trigger student_annotations_set_updated_at before update on public.student_annotations
for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.course_progress enable row level security;
alter table public.student_annotations enable row level security;
alter table public.profiles force row level security;
alter table public.course_progress force row level security;
alter table public.student_annotations force row level security;

revoke all on table public.profiles from anon;
revoke all on table public.course_progress from anon;
revoke all on table public.student_annotations from anon;
grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.course_progress to authenticated;
grant select, insert, update, delete on table public.student_annotations to authenticated;

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

drop policy if exists student_annotations_select_own on public.student_annotations;
drop policy if exists student_annotations_insert_own on public.student_annotations;
drop policy if exists student_annotations_update_own on public.student_annotations;
drop policy if exists student_annotations_delete_own on public.student_annotations;
create policy student_annotations_select_own on public.student_annotations for select to authenticated using ((select auth.uid()) = user_id);
create policy student_annotations_insert_own on public.student_annotations for insert to authenticated with check ((select auth.uid()) = user_id);
create policy student_annotations_update_own on public.student_annotations for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy student_annotations_delete_own on public.student_annotations for delete to authenticated using ((select auth.uid()) = user_id);

commit;
