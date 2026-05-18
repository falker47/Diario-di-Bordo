-- 0004: add optional title to contributions
-- Run this in Supabase Dashboard → SQL Editor

alter table public.contributions
  add column if not exists title text;

alter table public.contributions
  add constraint contributions_title_length
  check (title is null or char_length(title) <= 120);

-- Update the timestamps trigger to also track title changes for last_edited_at
create or replace function update_timestamps()
returns trigger as $$
begin
  new.updated_at = now();
  if old.text_content is distinct from new.text_content
     or old.media is distinct from new.media
     or old.section is distinct from new.section
     or old.diary_date is distinct from new.diary_date
     or old.title is distinct from new.title
  then
    new.last_edited_at = now();
  end if;
  return new;
end;
$$ language plpgsql;
