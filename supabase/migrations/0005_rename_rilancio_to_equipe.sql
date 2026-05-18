-- =============================================================
-- Migration: rinomina sezione 'rilancio' → 'equipe'
-- NON eseguire con Supabase CLI — incolla in SQL Editor Dashboard.
-- =============================================================

-- 1. Drop temporaneo del CHECK per poter aggiornare i dati
alter table public.contributions
  drop constraint if exists contributions_section_check;

-- 2. Migra i dati esistenti
update public.contributions
  set section = 'equipe'
  where section = 'rilancio';

-- 3. Ricrea CHECK con il nuovo set di valori ammessi
alter table public.contributions
  add constraint contributions_section_check
  check (section in ('quotidiani','speciali','equipe'));
