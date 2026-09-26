begin;

alter table public.course_progress
  add column if not exists favorite_updated_at timestamptz;

update public.course_progress
set favorite_updated_at = coalesce(client_updated_at, updated_at, created_at, now())
where favorite_updated_at is null;

alter table public.course_progress
  alter column favorite_updated_at set default '-infinity'::timestamptz,
  alter column favorite_updated_at set not null;

create or replace function public.prevent_stale_progress()
returns trigger language plpgsql security invoker set search_path = public
as $$
begin
  if new.client_updated_at > now() + interval '5 minutes' then
    new.client_updated_at = now();
  end if;
  if new.favorite_updated_at is null or new.favorite_updated_at = '-infinity'::timestamptz then
    new.favorite_updated_at = new.client_updated_at;
  elsif new.favorite_updated_at > now() + interval '5 minutes' then
    new.favorite_updated_at = now();
  end if;
  if tg_op = 'INSERT' then
    return new;
  end if;
  if new.client_updated_at < old.client_updated_at
     and new.favorite is not distinct from old.favorite
     and new.favorite_updated_at <= old.favorite_updated_at then
    raise exception 'stale_progress_update';
  end if;
  if new.client_updated_at < old.client_updated_at then
    new.progress_percent = old.progress_percent;
    new.status = old.status;
    new.section_id = old.section_id;
    new.scroll_position = old.scroll_position;
    new.last_opened_at = old.last_opened_at;
    new.completed_at = old.completed_at;
    new.client_updated_at = old.client_updated_at;
  end if;
  if new.favorite_updated_at < old.favorite_updated_at then
    new.favorite = old.favorite;
    new.favorite_updated_at = old.favorite_updated_at;
  end if;
  return new;
end;
$$;

drop trigger if exists course_progress_prevent_stale on public.course_progress;
create trigger course_progress_prevent_stale
before insert or update on public.course_progress
for each row execute function public.prevent_stale_progress();

alter table public.course_progress
  drop constraint if exists course_progress_course_range;
alter table public.course_progress
  add constraint course_progress_course_range check (course_id >= 1);

alter table public.student_annotations
  drop constraint if exists student_annotations_course_range;
alter table public.student_annotations
  add constraint student_annotations_course_range check (course_id >= 1);

create or replace function public.enforce_annotation_limit()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));
  if exists (
    select 1 from public.student_annotations
    where user_id = new.user_id
      and course_id = new.course_id
      and annotation_type = new.annotation_type
      and anchor_key = new.anchor_key
  ) then
    return new;
  end if;
  if (select count(*) from public.student_annotations where user_id = new.user_id) >= 1000 then
    raise exception 'annotation_limit_reached';
  end if;
  return new;
end;
$$;

drop trigger if exists student_annotations_enforce_limit on public.student_annotations;
create trigger student_annotations_enforce_limit
before insert on public.student_annotations
for each row execute function public.enforce_annotation_limit();

commit;
