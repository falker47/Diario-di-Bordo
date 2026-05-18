-- =============================================================
-- Migration: aggiunge tabella comments (commenti sui contributi)
-- NON eseguire con Supabase CLI — incolla in SQL Editor Dashboard.
-- =============================================================

-- -------------------------------------------------------------
-- 1. Tabella comments
-- -------------------------------------------------------------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid not null references public.contributions(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  text_content text not null check (char_length(text_content) between 1 and 2000),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists comments_contribution_idx
  on public.comments (contribution_id, created_at);

create index if not exists comments_author_idx
  on public.comments (author_id);

-- -------------------------------------------------------------
-- 2. Trigger updated_at
-- -------------------------------------------------------------
create or replace function public.update_comment_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tr_comments_updated_at on public.comments;
create trigger tr_comments_updated_at
before update on public.comments
for each row execute function public.update_comment_timestamp();

-- -------------------------------------------------------------
-- 3. Row Level Security
-- -------------------------------------------------------------
alter table public.comments enable row level security;

-- Lettura pubblica (coerente con i contributi)
drop policy if exists "comments_public_read" on public.comments;
create policy "comments_public_read"
  on public.comments for select
  using (true);

-- Insert: solo se autore == utente loggato e NON è il superadmin
drop policy if exists "comments_insert_own" on public.comments;
create policy "comments_insert_own"
  on public.comments for insert
  to authenticated
  with check (
    auth.uid() = author_id
    and (auth.jwt() ->> 'email') <> 'admin@diario.internal'
  );

-- Delete: l'autore può eliminare i propri commenti
drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own"
  on public.comments for delete
  to authenticated
  using (auth.uid() = author_id);

-- Delete: il superadmin può eliminare qualsiasi commento (moderazione)
drop policy if exists "comments_delete_superadmin" on public.comments;
create policy "comments_delete_superadmin"
  on public.comments for delete
  to authenticated
  using (
    (auth.jwt() ->> 'email') = 'admin@diario.internal'
  );

-- Volutamente nessuna policy UPDATE: i commenti non sono modificabili.
