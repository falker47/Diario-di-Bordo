# Diario di Bordo

Webapp mobile-first per digitalizzare il diario di bordo di una comunità educativa.

- Vista pubblica read-only per consultare i contributi (giorno, settimana, mese, anno).
- Area riservata `/admin` per gli educatori: creano, modificano ed eliminano i propri contributi con foto/video.
- Area `/superadmin` per la gestione utenti e la correzione di qualsiasi contributo.

Specifica completa in [PLAN.md](PLAN.md).

## Stack

- Frontend: React 18 + Vite + TypeScript + Tailwind (deploy su Netlify)
- Database + Auth: Supabase Postgres
- Media: Cloudinary (free tier 25 GB)
- Edge Functions: Supabase Edge Runtime (Deno)

## Sviluppo locale

```bash
npm install
npm run dev            # avvia Vite su http://localhost:5173
npm run typecheck
npm run build
```

Variabili d'ambiente frontend: copia [.env.example](.env.example) in `.env.local` e compila i 4 valori `VITE_*`.

## Script utili

| Comando | Cosa fa |
|---|---|
| `npm run seed` | Popola il DB con un utente di test (`mario` / `mario2026`) e 6 contributi realistici |
| `npm run seed:down` | Rimuove utente + profilo + contributi del seed |
| `npm run test:delete-media` | Smoke test della Edge Function `delete-media` (4 casi) |
| `npm run test:users -- --help` | Tool CLI per invocare le Edge Functions di user management |

Gli script server-side leggono da `.env.scripts.local` (gitignored): deve contenere `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD`.

## Deploy

### Frontend (Netlify)

1. Connetti il repo GitHub a Netlify.
2. Build command: `npm run build`. Publish directory: `dist`.
3. Imposta le 4 env vars `VITE_*` dal pannello Netlify (Site configuration → Environment variables).
4. File [`netlify.toml`](netlify.toml) (da creare in Fase 6) con `_redirects` per SPA fallback.

### Edge Functions

Ci sono 5 Edge Functions nella cartella [supabase/functions/](supabase/functions/):

- `delete-media` — cleanup Cloudinary quando un utente elimina un contributo.
- `create-user`, `update-user`, `deactivate-user`, `reactivate-user` — gestione utenti, solo superadmin.

Tutte sono **single-file**: un unico `index.ts` auto-contenuto per ciascuna. Nessun import relativo, nessun bundling — si possono deployare copia-incollando il codice nell'editor web della Supabase Dashboard.

#### Opzione A — Deploy via Dashboard UI (consigliata, zero setup)

Per ogni function (ripeti il processo 5 volte):

1. Apri https://supabase.com/dashboard/project/<PROJECT_REF>/functions
2. Click **"Deploy a new function"** (o **"Edit"** su una esistente).
3. Scegli **"Via editor"** se richiesto.
4. Name/slug: usa esattamente il nome della cartella (es. `delete-media`, `create-user`, …).
5. Verify JWT with legacy secret: **disattivato** (verifica auth manuale nel codice).
6. Cancella il contenuto placeholder nell'editor, apri il file `supabase/functions/<nome>/index.ts` del repo, copia tutto, incolla nell'editor.
7. Click **"Deploy function"**.

**Secrets richiesti** (impostali una sola volta, serviranno a tutte le function):

Vai su `Project Settings → Edge Functions → Secrets` (o tab "Secrets Manager"):

| Secret | Usato da | Valore |
|---|---|---|
| `SUPERADMIN_EMAIL` | create/update/deactivate/reactivate-user | `admin@diario.internal` |
| `CLOUDINARY_CLOUD_NAME` | delete-media | il cloud name del tuo account |
| `CLOUDINARY_API_KEY` | delete-media | dal pannello Cloudinary |
| `CLOUDINARY_API_SECRET` | delete-media | dal pannello Cloudinary |

`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` sono automaticamente disponibili alle Edge Functions, non vanno settate.

#### Opzione B — Deploy via Supabase CLI (sviluppo attivo)

Utile se stai iterando su più function: un solo comando le deploya tutte.

Install (Windows, via Scoop):
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

Setup iniziale (una tantum):
```bash
supabase login
supabase link --project-ref <PROJECT_REF>
supabase secrets set SUPERADMIN_EMAIL=admin@diario.internal \
  CLOUDINARY_CLOUD_NAME=... CLOUDINARY_API_KEY=... CLOUDINARY_API_SECRET=...
```

Deploy di tutte le function in una volta:
```bash
supabase functions deploy
```

Oppure una specifica:
```bash
supabase functions deploy delete-media
```

Log in tempo reale:
```bash
supabase functions logs delete-media --follow
```

### Database (migrations)

Lo schema completo è in [supabase/migrations/0001_init.sql](supabase/migrations/0001_init.sql). Eventuali hotfix in `0002_*.sql` e successivi.

Deploy: apri il SQL Editor della Dashboard, incolla il file di migration e premi Run. Idempotente (usa `if exists` / `if not exists`).

## Struttura cartelle

```
src/                  # frontend SPA (vedi PLAN §12)
  components/         # UI riusabili, layout
  hooks/              # useAuth, useToast, useContributions, …
  lib/                # supabase, cloudinary, dates, mediaValidation
  pages/
    public/           # vista read-only (day/week/month/year)
    admin/            # area riservata utente loggato
    superadmin/       # area riservata account admin@diario.internal
  router.tsx          # createBrowserRouter + guard
supabase/
  migrations/         # schema SQL
  functions/          # Edge Functions single-file
scripts/              # seed, test Edge Functions
```

## Superadmin

L'account di servizio è `admin@diario.internal`. La password iniziale è consegnata su carta alla committente. Se si perde: reset da Supabase Dashboard → Authentication → Users → trova l'utente → "Send password recovery" non funziona (email sintetica) → usa "..." → "Reset password".

Questo account **non scrive contributi**. Le RLS lo bloccano e la UI nasconde il pulsante.
