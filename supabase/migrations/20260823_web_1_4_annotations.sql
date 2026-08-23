begin;

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
  constraint student_annotations_course_range check (course_id between 1 and 32),
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

create index if not exists student_annotations_user_updated_idx
  on public.student_annotations (user_id, updated_at desc);

create index if not exists student_annotations_user_type_idx
  on public.student_annotations (user_id, annotation_type, updated_at desc);

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

drop trigger if exists student_annotations_prevent_stale on public.student_annotations;
create trigger student_annotations_prevent_stale before update on public.student_annotations
for each row execute function public.prevent_stale_annotation();

drop trigger if exists student_annotations_set_updated_at on public.student_annotations;
create trigger student_annotations_set_updated_at before update on public.student_annotations
for each row execute function public.set_updated_at();

alter table public.student_annotations enable row level security;
alter table public.student_annotations force row level security;

revoke all on table public.student_annotations from anon;
grant select, insert, update, delete on table public.student_annotations to authenticated;

drop policy if exists student_annotations_select_own on public.student_annotations;
drop policy if exists student_annotations_insert_own on public.student_annotations;
drop policy if exists student_annotations_update_own on public.student_annotations;
drop policy if exists student_annotations_delete_own on public.student_annotations;

create policy student_annotations_select_own
  on public.student_annotations for select to authenticated
  using ((select auth.uid()) = user_id);

create policy student_annotations_insert_own
  on public.student_annotations for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy student_annotations_update_own
  on public.student_annotations for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy student_annotations_delete_own
  on public.student_annotations for delete to authenticated
  using ((select auth.uid()) = user_id);

commit;
