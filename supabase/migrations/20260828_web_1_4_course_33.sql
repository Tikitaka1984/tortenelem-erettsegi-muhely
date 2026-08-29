begin;

alter table public.course_progress
  drop constraint if exists course_progress_course_range;
alter table public.course_progress
  add constraint course_progress_course_range check (course_id between 1 and 33);

alter table public.student_annotations
  drop constraint if exists student_annotations_course_range;
alter table public.student_annotations
  add constraint student_annotations_course_range check (course_id between 1 and 33);

commit;
