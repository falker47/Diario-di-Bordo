-- =============================================================
-- Diario di Bordo — migration iniziale
-- Crea: tabelle profiles, contributions, trigger, policy RLS.
-- Eseguire UNA SOLA VOLTA, da Supabase Dashboard → SQL Editor.
-- =============================================================

-- -------------------------------------------------------------
-- 1. Tabella profiles (estende auth.users)
-- -------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text unique not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

create index if not exists profiles_username_idx on public.profiles (username);

-- -------------------------------------------------------------
-- 2. Tabella contributions
-- -------------------------------------------------------------
create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  diary_date date not null,
  author_id uuid not null references public.profiles(id) on delete restrict,
  section text not null check (section in ('quotidiani','speciali','rilancio')),
  text_content text,
  media jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_edited_at timestamptz
);

create index if not exists contributions_diary_date_idx on public.contributions (diary_date);
create index if not exists contributions_author_id_idx on public.contributions (author_id);
create index if not exists contributions_date_section_idx on public.contributions (diary_date, section);

-- -------------------------------------------------------------
-- 3. Trigger updated_at / last_edited_at
-- -------------------------------------------------------------
create or replace function public.update_timestamps()
returns trigger as $$
begin
  new.updated_at = now();
  if old.text_content is distinct from new.text_content
     or old.media is distinct from new.media
     or old.section is distinct from new.section
     or old.diary_date is distinct from new.diary_date
  then
    new.last_edited_at = now();
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists tr_contributions_timestamps on public.contributions;
create trigger tr_contributions_timestamps
before update on public.contributions
for each row execute function public.update_timestamps();

-- -------------------------------------------------------------
-- 4. Row Level Security
-- -------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.contributions enable row level security;

-- Profiles: lettura pubblica (serve per mostrare full_name)
drop policy if exists "profiles_public_read" on public.profiles;
create policy "profiles_public_read"
  on public.profiles for select
  using (true);

-- (INSERT/UPDATE/DELETE su profiles solo via Edge Function con service role)

-- Contributions: lettura pubblica
drop policy if exists "contributions_public_read" on public.contributions;
create policy "contributions_public_read"
  on public.contributions for select
  using (true);

-- Contributions: insert solo se autore == utente loggato e NON è il superadmin
-- Nota: usiamo auth.jwt()->>'email' invece di una query su auth.users
-- perché il ruolo `authenticated` non ha SELECT su auth.users (schema riservato).
drop policy if exists "contributions_insert_own" on public.contributions;
create policy "contributions_insert_own"
  on public.contributions for insert
  to authenticated
  with check (
    auth.uid() = author_id
    and (auth.jwt() ->> 'email') <> 'admin@diario.internal'
  );

-- Contributions: update sui propri record
drop policy if exists "contributions_update_own" on public.contributions;
create policy "contributions_update_own"
  on public.contributions for update
  to authenticated
  using (auth.uid() = author_id);

-- Contributions: delete sui propri record
drop policy if exists "contributions_delete_own" on public.contributions;
create policy "contributions_delete_own"
  on public.contributions for delete
  to authenticated
  using (auth.uid() = author_id);

-- Contributions: il superadmin può aggiornare qualsiasi record (NO delete)
drop policy if exists "contributions_update_superadmin" on public.contributions;
create policy "contributions_update_superadmin"
  on public.contributions for update
  to authenticated
  using (
    (auth.jwt() ->> 'email') = 'admin@diario.internal'
  );
