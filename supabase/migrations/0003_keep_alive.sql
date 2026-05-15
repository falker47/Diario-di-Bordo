-- =============================================================
-- Tabella _keep_alive
-- Usata dal workflow GitHub "Keep Supabase Alive" per generare
-- attivita' di scrittura reale sul DB ed evitare l'auto-pause
-- del piano Free di Supabase. Un singolo record (id=1) viene
-- aggiornato (UPDATE) ad ogni run del workflow.
--
-- RLS attiva: nessuna policy per anon/authenticated.
-- Solo il service_role (workflow CI) puo' scrivere/leggere.
-- =============================================================

create table if not exists public._keep_alive (
  id smallint primary key,
  pinged_at timestamptz not null default now()
);

insert into public._keep_alive (id, pinged_at)
values (1, now())
on conflict (id) do nothing;

alter table public._keep_alive enable row level security;

-- Nessuna policy: con RLS attiva e nessuna policy, anon e
-- authenticated non hanno accesso. Il service_role bypassa
-- comunque le RLS, quindi il workflow CI funziona regolarmente.
