-- Package B (H-06--H-08): field-level progress merging, dynamic course IDs,
-- and a lossless per-user annotation limit. Run manually in Supabase SQL Editor.
begin;

alter table public.course_progress
  add column if not exists favorite_updated_at timestamptz;

update public.course_progress
set favorite_updated_at = coalesce(favorite_updated_at, client_updated_at, updated_at, created_at, now())
where favorite_updated_at is null;

alter table public.course_progress
  alter column favorite_updated_at set default now(),
  alter column favorite_updated_at set not null;

alter table public.course_progress drop constraint if exists course_progress_course_range;
alter table public.course_progress
  add constraint course_progress_course_range check (course_id >= 1);
alter table public.student_annotations drop constraint if exists student_annotations_course_range;
alter table public.student_annotations
  add constraint student_annotations_course_range check (course_id >= 1);

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

drop trigger if exists course_progress_prevent_stale on public.course_progress;
-- Repair timestamps already poisoned by a fast clock before enabling the new guard.
update public.course_progress
set client_updated_at = least(client_updated_at, clock_timestamp()),
    favorite_updated_at = least(favorite_updated_at, clock_timestamp())
where client_updated_at > clock_timestamp() + interval '5 minutes'
   or favorite_updated_at > clock_timestamp() + interval '5 minutes';
create trigger course_progress_prevent_stale
before insert or update on public.course_progress
for each row execute function public.prevent_stale_progress();

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

drop trigger if exists student_annotations_enforce_limit on public.student_annotations;
create trigger student_annotations_enforce_limit
before insert on public.student_annotations
for each row execute function public.enforce_student_annotation_limit();

commit;
