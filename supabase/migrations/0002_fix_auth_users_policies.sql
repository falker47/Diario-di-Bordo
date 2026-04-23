-- =============================================================
-- Hotfix policy RLS contributions
-- Le versioni originali in 0001 facevano SELECT su auth.users,
-- ma il ruolo `authenticated` non ha permesso su quello schema:
--   ERROR: permission denied for table users
-- Sostituiamo con auth.jwt()->>'email', letto dal token firmato.
-- =============================================================

drop policy if exists "contributions_insert_own" on public.contributions;
create policy "contributions_insert_own"
  on public.contributions for insert
  to authenticated
  with check (
    auth.uid() = author_id
    and (auth.jwt() ->> 'email') <> 'admin@diario.internal'
  );

drop policy if exists "contributions_update_superadmin" on public.contributions;
create policy "contributions_update_superadmin"
  on public.contributions for update
  to authenticated
  using (
    (auth.jwt() ->> 'email') = 'admin@diario.internal'
  );
