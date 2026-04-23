# Diario di Bordo — Piano di Implementazione

> Documento di specifica destinato a Claude Code per l'implementazione completa della webapp. Fornisce contesto, architettura, schema, flussi, policy e todo-list ordinata.

---

## 1. Contesto e obiettivo

**Cliente**: comunità di educatori (~10 utenti attivi).
**Problema**: hanno un diario di bordo cartaceo che vogliono digitalizzare per consultazione e aggiornamento condivisi.
**Deliverable**: webapp mobile-first consultabile pubblicamente in lettura, con area protetta per la scrittura. Una volta consegnata, deve essere autogestibile dagli utenti finali senza interventi sul codice.

**Filosofia**: semplicità prima di tutto. Non è un sistema enterprise. Sicurezza ragionevole ma non paranoica. Lo strumento deve durare anni senza manutenzione.

---

## 2. Stack tecnologico

| Layer               | Scelta                         | Note                                |
| ------------------- | ------------------------------ | ----------------------------------- |
| Frontend            | React 18 + Vite                | SPA, mobile-first                   |
| Routing             | React Router v6                |                                     |
| Styling             | Tailwind CSS                   | Rapido, coerente                    |
| Deploy frontend     | Netlify                        | Free tier, dominio `*.netlify.app`  |
| Database            | Supabase (Postgres)            | Free tier sufficiente               |
| Auth                | Supabase Auth                  | Email sintetiche `@diario.internal` |
| Storage media       | Cloudinary                     | Free tier 25GB, compressione auto   |
| Superadmin ops      | Supabase Edge Functions (Deno) | Service role side                   |
| Compressione client | `browser-image-compression`    | Solo immagini                       |

**Perché Cloudinary e non Supabase Storage**: free tier Supabase è solo 1GB. Con ~10 foto + 1 video al giorno si satura in meno di un anno. Cloudinary regala 25GB, compressione intelligente (`f_auto,q_auto`) e thumbnail video automatici.

---

## 3. Architettura generale

```
┌──────────────────────────────────────────────────────────┐
│  Netlify (React SPA)                                     │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐  │
│  │ Vista pub    │   │ /admin       │   │ /superadmin  │  │
│  │ (read-only)  │   │ (auth)       │   │ (speciale)   │  │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘  │
└─────────┼──────────────────┼──────────────────┼──────────┘
          │                  │                  │
          │ anon key         │ JWT utente       │ JWT superadmin
          ▼                  ▼                  ▼
┌──────────────────────────────────────────────────────────┐
│  Supabase                                                │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐  │
│  │ Postgres    │  │ Auth        │  │ Edge Functions   │  │
│  │ + RLS       │  │ (email-pwd) │  │ (user CRUD)      │  │
│  └─────────────┘  └─────────────┘  └──────────────────┘  │
└──────────────────────────────────────────────────────────┘
                            │
                            ▼ (upload diretto da browser)
                  ┌───────────────────┐
                  │  Cloudinary       │
                  │  unsigned preset  │
                  └───────────────────┘
```

---

## 4. Schema Database

### Tabella `profiles`

Estende `auth.users`. Contiene i dati visibili degli utenti.

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text unique not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

create index on profiles (username);
```

**Regole**:

- `username`: usato per login (es. "mario"). Univoco. Minuscolo, no spazi.
- `full_name`: mostrato pubblicamente (es. "Mario Rossi"). Univoco.
- Se un utente viene rimosso, i suoi contributi restano ma `full_name` viene mostrato normalmente (soft delete via `is_active = false`, no cascade).
- **Non esistono ruoli**: tutti gli utenti registrati sono pari. Il superadmin è gestito separatamente (vedi §5).

### Tabella `contributions`

Un contributo = un blocco scritto da un utente in una certa giornata, dentro una certa sezione.

```sql
create table contributions (
  id uuid primary key default gen_random_uuid(),
  diary_date date not null,
  author_id uuid not null references profiles(id) on delete restrict,
  section text not null check (section in ('quotidiani','speciali','rilancio')),
  text_content text,
  media jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_edited_at timestamptz
);

create index on contributions (diary_date);
create index on contributions (author_id);
create index on contributions (diary_date, section);
```

**Campo `media`** — array di oggetti:

```json
[
  {
    "type": "image",
    "public_id": "diario/2026/04/abc123",
    "url": "https://res.cloudinary.com/.../abc123.jpg",
    "width": 1920,
    "height": 1080
  },
  {
    "type": "video",
    "public_id": "diario/2026/04/xyz789",
    "url": "https://res.cloudinary.com/.../xyz789.mp4",
    "thumbnail": "https://res.cloudinary.com/.../xyz789.jpg",
    "duration": 42
  }
]
```

**Campo `last_edited_at`**:

- `NULL` al momento della creazione.
- Popolato via trigger quando il superadmin (o lo stesso autore) modifica il record.
- Il frontend mostra "Modificato il [data]" se non NULL, **senza nome** di chi ha modificato (scelta deliberata di trasparenza minima).

### Trigger `updated_at` / `last_edited_at`

```sql
create or replace function update_timestamps()
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

create trigger tr_contributions_timestamps
before update on contributions
for each row execute function update_timestamps();
```

---

## 5. Autenticazione

### 5.1 Utenti normali (educatori)

- Supabase Auth email+password, ma **usiamo email sintetiche** per non esporre il concetto di email agli utenti.
- Al momento della creazione utente: `email = {username}@diario.internal`.
- **Disabilitare "Confirm email"** in Supabase Dashboard → Authentication → Providers → Email. Altrimenti Supabase prova a mandare una conferma e l'utente resta non attivo.
- Il form di login chiede solo "Username" e "Password". Il client concatena internamente:
  ```ts
  const email = `${username.toLowerCase().trim()}@diario.internal`;
  await supabase.auth.signInWithPassword({ email, password });
  ```

**Motivo**: zero gestione mail, zero deliverability, zero UX "controlla la tua casella". Il dominio `.internal` è riservato da RFC, nessun rischio di collisione.

### 5.2 Superadmin — account di servizio

Non è una persona reale, è un grimaldello di gestione della comunità.

- Credenziali **hardcoded in variabili d'ambiente** del backend (Supabase Edge Function).
- L'autenticazione avviene sullo stesso form `/admin/login`.
- Quando il login riesce, il frontend legge una claim o fa una query su una tabella/function per capire se l'utente è superadmin.

**Implementazione consigliata**: creare un account Supabase Auth normale con username riservato `admin` (email sintetica `admin@diario.internal`). Il frontend, dopo login, fa:

```ts
const {
  data: { user },
} = await supabase.auth.getUser();
const isSuperadmin = user?.email === "admin@diario.internal";
```

Non serve nessuna colonna in `profiles` per distinguerlo. L'account `admin` può anche non avere una riga in `profiles` (o averla con `full_name = 'Amministrazione'` e non usarla mai come autore di contributi). **Regola: l'account superadmin non deve mai pubblicare contributi**, solo modificare quelli esistenti. Il frontend impedisce di usarlo per scrivere.

### 5.3 Password superadmin

- Impostata manualmente una volta sola via Supabase Dashboard al momento del setup.
- Documentata su un foglio di carta consegnato alla committente.
- Se la dimenticano, reset manuale via Dashboard Supabase (1 minuto).

---

## 6. Route e pagine

### 6.1 Area pubblica (nessuna auth)

| Route                 | Descrizione                                                                  |
| --------------------- | ---------------------------------------------------------------------------- |
| `/`                   | Redirect a `/giorno/{oggi}`                                                  |
| `/giorno/:date`       | Vista giornata singola con i contributi raggruppati per sezione              |
| `/settimana/:isoWeek` | Vista settimanale (es. `/settimana/2026-W17`), card compatte per ogni giorno |
| `/mese/:yyyymm`       | Calendario mensile con indicatori "c'è contenuto"                            |
| `/anno/:yyyy`         | Heatmap annuale tipo GitHub                                                  |

**Navigazione fluida**:

- Frecce avanti/indietro (← →) in ogni vista
- Date picker sempre visibile
- Breadcrumb Anno › Mese › Settimana › Giorno
- Swipe orizzontale su mobile tra giorni adiacenti
- Shortcut tastiera su desktop (freccia sx/dx, T = oggi)
- Click su un giorno nella vista settimanale/mensile → apre vista giornaliera di quel giorno

### 6.2 Area admin

| Route                          | Descrizione                                                    | Accesso                         |
| ------------------------------ | -------------------------------------------------------------- | ------------------------------- |
| `/admin/login`                 | Form username + password                                       | pubblico                        |
| `/admin`                       | Dashboard utente: crea/modifica propri contributi, date picker | utente loggato (non superadmin) |
| `/admin/nuovo?date=YYYY-MM-DD` | Editor nuovo contributo                                        | utente loggato                  |
| `/admin/modifica/:id`          | Editor contributo esistente (proprio)                          | autore del contributo           |
| `/superadmin`                  | Menu superadmin: [Modifica post esistenti] [Gestisci utenti]   | solo account `admin`            |
| `/superadmin/posts`            | Lista di tutti i contributi, con filtri. Click → editor        | solo `admin`                    |
| `/superadmin/utenti`           | CRUD utenti                                                    | solo `admin`                    |

**Logica post-login**:

- Se l'utente è `admin@diario.internal` → redirect a `/superadmin`
- Altrimenti → redirect a `/admin`

---

## 7. Flussi utente

### 7.1 Scrittura nuovo contributo (utente normale)

1. Login `/admin/login` con username + password.
2. Dashboard `/admin` mostra date picker (default oggi) e bottone "Nuovo contributo".
3. Click → `/admin/nuovo?date=YYYY-MM-DD`.
4. Form:
   - Data (modificabile, include date passate → **upload retroattivo**)
   - Sezione (radio: Quotidiani / Speciali / Rilancio)
   - Testo (textarea, markdown-light opzionale)
   - Upload media (dropzone, multiselect)
5. Per ogni file caricato:
   - Se immagine: `browser-image-compression` (max 1920px lato lungo, q 0.85) → upload unsigned a Cloudinary → ricevi `public_id` + `secure_url`
   - Se video: upload diretto a Cloudinary senza compressione client; limite frontend 50MB o 60s
6. Al submit: `INSERT into contributions` con `author_id = auth.uid()`, `media = [...]`.
7. Redirect alla vista giornaliera pubblica della data inserita.

### 7.2 Modifica/eliminazione propri contributi

Dashboard `/admin` mostra lista "I miei ultimi contributi" con edit/delete. UPDATE/DELETE protetti da RLS (solo se `auth.uid() = author_id`).

### 7.3 Flusso superadmin — modifica qualsiasi post

1. Login con credenziali superadmin su `/admin/login`.
2. Redirect a `/superadmin` → menu con due opzioni.
3. Click "Modifica post esistenti" → `/superadmin/posts`.
4. Lista filtrata (per data, per autore, per sezione).
5. Click su post → editor identico a quello utente, ma con permessi estesi tramite RLS policy dedicata.
6. Save → UPDATE. Trigger popola `last_edited_at`.

### 7.4 Flusso superadmin — gestione utenti

1. `/superadmin/utenti` → tabella utenti (username, full_name, stato, azioni).
2. Azioni disponibili:
   - **Crea utente**: form (username, nome, cognome, password). Chiama Edge Function `create-user`.
   - **Modifica utente**: cambia username / full_name / reset password. Chiama Edge Function `update-user`.
   - **Disattiva utente**: soft delete (`is_active = false`). Chiama Edge Function `deactivate-user`. I contributi restano visibili.
   - **Riattiva utente**: `is_active = true`.

**Edge Functions necessarie** (Deno, Supabase):

- `create-user` — input `{username, first_name, last_name, password}` → crea `auth.users` con email sintetica + riga in `profiles` con `full_name = first_name + ' ' + last_name`. Verifica che il chiamante sia superadmin.
- `update-user` — input `{id, username?, full_name?, password?}`.
- `deactivate-user` — input `{id}` → set `is_active = false`.
- `reactivate-user` — input `{id}` → set `is_active = true`.

Tutte verificano che `auth.jwt().email === 'admin@diario.internal'` prima di procedere (Service Role Key solo server-side).

---

## 8. Media handling (Cloudinary)

### 8.1 Setup Cloudinary

1. Crea account free su cloudinary.com.
2. In Settings → Upload → Add upload preset:
   - **Signing Mode**: Unsigned
   - **Folder**: `diario`
   - **Use filename**: false
   - **Unique filename**: true
   - **Overwrite**: false
   - **Quality**: `auto:good`
   - **Format**: `auto`
   - **Allowed formats**: `jpg,png,webp,heic,mp4,mov`
   - **Max file size**: 50 MB
   - **Max video duration**: 60s (opzionale)
3. Salva il `cloud_name` e il `upload_preset` come env var nel frontend.

### 8.2 Compressione client (solo immagini)

```ts
import imageCompression from "browser-image-compression";

const compressed = await imageCompression(file, {
  maxSizeMB: 2,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  initialQuality: 0.85,
});
```

Compressione **non aggressiva**: leggera perdita di qualità visiva, riduzione peso 60-80%. Cloudinary poi applica `q_auto:good` a sua volta, ma sempre meglio partire già leggeri per velocizzare l'upload da mobile.

### 8.3 Upload

```ts
const formData = new FormData();
formData.append("file", compressed);
formData.append("upload_preset", PRESET);
formData.append("folder", `diario/${yyyy}/${mm}`);

const res = await fetch(
  `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
  { method: "POST", body: formData },
);
const { public_id, secure_url, width, height, duration, resource_type } =
  await res.json();
```

### 8.4 Rendering

- **Immagini**: usa l'URL Cloudinary con trasformazioni on-the-fly per responsive:
  - Thumbnail (lista giornate): `w_400,h_400,c_fill,f_auto,q_auto`
  - Full view: `w_1600,f_auto,q_auto`
- **Video**: tag `<video>` con poster = thumbnail generato da Cloudinary.

### 8.5 Eliminazione media

Quando un contributo viene eliminato o un media rimosso, chiamare Cloudinary Admin API per eliminare il file. Richiede API Secret → **solo da Edge Function**, non dal client.

Edge Function `delete-media`: input `{public_id}`, chiama Cloudinary, restituisce esito. Chiamata dal client solo se l'utente è autore del contributo o è superadmin.

---

## 9. Policy RLS (Row Level Security)

**Abilita RLS su tutte le tabelle**:

```sql
alter table profiles enable row level security;
alter table contributions enable row level security;
```

### Profili

```sql
-- Lettura pubblica di profiles (per mostrare full_name nella vista pubblica)
create policy "profiles_public_read"
  on profiles for select
  using (true);

-- Solo superadmin può modificare/cancellare profili (via Edge Function con service role)
-- Nessuna policy anon/authenticated per INSERT/UPDATE/DELETE
```

### Contributi

```sql
-- Lettura pubblica
create policy "contributions_public_read"
  on contributions for select
  using (true);

-- Utenti autenticati possono inserire solo con se stessi come autore
-- (e solo se NON sono l'account superadmin)
-- NB: l'email si legge da auth.jwt(), NON da auth.users — il ruolo
-- `authenticated` non ha SELECT sullo schema `auth` (errore RLS reale visto in dev).
create policy "contributions_insert_own"
  on contributions for insert
  with check (
    auth.uid() = author_id
    and (auth.jwt() ->> 'email') <> 'admin@diario.internal'
  );

-- Utenti possono aggiornare i propri contributi
create policy "contributions_update_own"
  on contributions for update
  using (auth.uid() = author_id);

-- Utenti possono eliminare i propri contributi
create policy "contributions_delete_own"
  on contributions for delete
  using (auth.uid() = author_id);

-- Superadmin può aggiornare tutti i contributi
create policy "contributions_update_superadmin"
  on contributions for update
  using (
    (auth.jwt() ->> 'email') = 'admin@diario.internal'
  );
```

Nota: il superadmin **non ha policy DELETE**. Volutamente: può solo modificare, non cancellare. Se serve cancellare, passa dall'autore originale o rimuove l'utente.

---

## 10. Environment variables

### Frontend (Netlify)

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
VITE_CLOUDINARY_CLOUD_NAME=xxxxxxxx
VITE_CLOUDINARY_UPLOAD_PRESET=diario_unsigned
```

### Edge Functions (Supabase Secrets)

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
CLOUDINARY_CLOUD_NAME=xxxxxxxx
CLOUDINARY_API_KEY=xxxxxxxx
CLOUDINARY_API_SECRET=xxxxxxxx
SUPERADMIN_EMAIL=admin@diario.internal
```

---

## 11. Setup iniziale (runbook per il dev)

### Supabase

1. Crea progetto su supabase.com.
2. Esegui lo script SQL di creazione tabelle, trigger, policy.
3. Authentication → Providers → Email: **disattiva "Confirm email"**.
4. Dashboard → Authentication → Users → "Add user" manualmente:
   - Email: `admin@diario.internal`
   - Password: (scegli e annota)
   - Auto Confirm User: ✅
5. Deploy Edge Functions.
6. Copia URL e anon key nel frontend `.env`.

### Cloudinary

1. Crea account.
2. Crea upload preset unsigned come descritto in §8.1.
3. Copia `cloud_name`, `api_key`, `api_secret` dove servono.

### Netlify

1. Connetti repo GitHub.
2. Build command: `npm run build`.
3. Publish directory: `dist`.
4. Imposta le env vars `VITE_*`.
5. `_redirects` file per SPA fallback:
   ```
   /* /index.html 200
   ```

---

## 12. Struttura progetto consigliata

```
diario-bordo/
├── public/
├── src/
│   ├── components/
│   │   ├── ui/              # Bottoni, input, modali (riusabili)
│   │   ├── DayView.tsx
│   │   ├── WeekView.tsx
│   │   ├── MonthView.tsx
│   │   ├── YearHeatmap.tsx
│   │   ├── ContributionCard.tsx
│   │   ├── ContributionEditor.tsx
│   │   ├── MediaUploader.tsx
│   │   └── MediaGallery.tsx
│   ├── pages/
│   │   ├── public/
│   │   │   ├── DayPage.tsx
│   │   │   ├── WeekPage.tsx
│   │   │   ├── MonthPage.tsx
│   │   │   └── YearPage.tsx
│   │   ├── admin/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── NewContributionPage.tsx
│   │   │   └── EditContributionPage.tsx
│   │   └── superadmin/
│   │       ├── MenuPage.tsx
│   │       ├── PostsPage.tsx
│   │       ├── EditPostPage.tsx
│   │       └── UsersPage.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useContributions.ts
│   │   └── useDateNavigation.ts
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── cloudinary.ts
│   │   ├── compression.ts
│   │   └── dates.ts         # helper ISO week, formatting, etc.
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── router.tsx
├── supabase/
│   ├── migrations/
│   │   └── 0001_init.sql
│   └── functions/
│       ├── create-user/
│       ├── update-user/
│       ├── deactivate-user/
│       ├── reactivate-user/
│       └── delete-media/
├── .env.example
├── netlify.toml
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

---

## 13. Acceptance criteria per feature

### Vista pubblica

- [ ] Aprendo `/` vedo la giornata di oggi con i contributi pubblicati divisi per sezione.
- [ ] Se oggi non c'è nulla, mostro stato vuoto gentile ("Nessun contributo per oggi").
- [ ] Posso navigare al giorno precedente/successivo con frecce.
- [ ] Posso saltare a una data qualsiasi con date picker.
- [ ] Passando alla vista settimanale vedo una card per ogni giorno della settimana corrente.
- [ ] Vista mensile = calendario con pallini/badge sui giorni che hanno contenuto.
- [ ] Vista annuale = heatmap 12 mesi, click su una cella apre il giorno.
- [ ] Ogni contributo mostra: full_name autore, orario, sezione, testo, media.
- [ ] Se il contributo è stato modificato, appare "Modificato il [data]".
- [ ] Mobile-first: usabile con una mano su smartphone.

### Login

- [ ] Form username + password su `/admin/login`.
- [ ] Login errato mostra messaggio gentile ("Username o password non validi").
- [ ] Login riuscito di utente normale → redirect `/admin`.
- [ ] Login riuscito del superadmin → redirect `/superadmin`.
- [ ] Sessione persiste tra reload.
- [ ] Logout button visibile nell'area admin.

### Admin (utente normale)

- [ ] Dashboard mostra i miei ultimi 20 contributi con edit/delete.
- [ ] Posso creare un contributo per oggi o per una data passata.
- [ ] Upload multiplo di immagini funziona, con progress.
- [ ] Upload video funziona, con limite 50MB/60s.
- [ ] Posso modificare solo i miei contributi (RLS lo garantisce, il frontend nasconde i pulsanti per gli altri).
- [ ] Eliminando un contributo vengono eliminati anche i suoi media da Cloudinary.
- [ ] L'account `admin@diario.internal` non può creare contributi (UI nasconde il pulsante + RLS blocca).

### Superadmin

- [ ] Menu iniziale con due card grandi: "Modifica post" e "Gestisci utenti".
- [ ] In "Modifica post" vedo lista di tutti i contributi, filtrabile per autore/data/sezione.
- [ ] Posso aprire e modificare qualsiasi contributo.
- [ ] Non posso eliminare contributi (pulsante assente).
- [ ] In "Gestisci utenti" posso creare un nuovo utente (username, nome, cognome, password).
- [ ] Username duplicati rifiutati con messaggio chiaro.
- [ ] Nome+cognome duplicati rifiutati.
- [ ] Posso modificare username, full_name e password di un utente.
- [ ] Posso disattivare un utente (soft delete).
- [ ] Utenti disattivati non possono loggarsi ma i loro contributi restano visibili.

---

## 14. TODO list ordinata di implementazione

### Fase 0 — Setup

1. Bootstrap progetto Vite + React + TypeScript + Tailwind.
2. Installa dipendenze: `@supabase/supabase-js`, `react-router-dom`, `browser-image-compression`, `date-fns`.
3. Crea progetto Supabase, esegui migration SQL.
4. Disattiva "Confirm email" in Supabase Auth settings.
5. Crea manualmente l'account `admin@diario.internal`.
6. Crea preset Cloudinary unsigned.
7. Setup `.env.local` e `.env.example`.

### Fase 1 — Core infra

8. `src/lib/supabase.ts` — client configurato.
9. `src/lib/cloudinary.ts` — helper upload/delete.
10. `src/lib/dates.ts` — helper formattazione, ISO week, range.
11. `src/types/index.ts` — tipi TS per `Profile`, `Contribution`, `MediaItem`.
12. `src/hooks/useAuth.ts` — stato auth, login, logout, flag `isSuperadmin`.
13. Router base con route protette (`RequireAuth`, `RequireSuperadmin`).

### Fase 2 — Vista pubblica

14. `DayView` component — rendering di una giornata con contributi raggruppati.
15. `ContributionCard` — singolo contributo con autore, testo, media.
16. `MediaGallery` — griglia immagini + player video, lightbox.
17. `DayPage` — hook fetch contributi per data, navigazione.
18. `WeekPage`, `MonthPage`, `YearPage`.
19. Date picker component riusabile.
20. Breadcrumb e navigazione cross-view.

### Fase 3 — Admin

21. `LoginPage` con form username+password e conversione a email sintetica.
22. Logica redirect post-login (superadmin vs utente).
23. `DashboardPage` — lista miei contributi.
24. `ContributionEditor` component (riusato da nuovo ed edit).
25. `MediaUploader` con compressione client e progress.
26. `NewContributionPage`, `EditContributionPage`.
27. Delete flow con conferma + cleanup Cloudinary.

### Fase 4 — Superadmin

28. `MenuPage` con due card.
29. Edge Functions: `create-user`, `update-user`, `deactivate-user`, `reactivate-user`, `delete-media`.
30. Deploy Edge Functions e test con curl.
31. `PostsPage` + filtri + link a edit.
32. `EditPostPage` (superadmin edit mode).
33. `UsersPage` con tabella + modali crea/modifica.

### Fase 5 — Rifinitura

34. Gestione errori globale con toast.
35. Loading skeletons.
36. Stati vuoti gentili.
37. Responsive testing (iPhone SE → desktop).
38. Swipe gestures su mobile.
39. Shortcut tastiera desktop.
40. Accessibilità base (focus ring, aria-label, contrasto).

### Fase 6 — Deploy

41. Setup Netlify, connessione repo.
42. Env vars su Netlify.
43. `_redirects` per SPA fallback.
44. Test end-to-end in produzione.
45. Consegna credenziali superadmin su carta + mini-guida PDF per la committente.

---

## 15. Note aperte / decisioni future

- **Ricerca testuale full-text**: non inclusa in MVP. Se richiesta in futuro, Postgres supporta `tsvector`/`tsquery` nativamente.
- **Export PDF mensile/annuale per stampa**: non richiesto, ma fattibile con `jspdf` o server-side Puppeteer.
- **Notifiche (es. "nuovo contributo pubblicato")**: non richieste. Se servissero, Supabase Realtime.
- **Backup**: Supabase fa backup automatici nel free tier (limitati). Valutare export SQL manuale periodico per sicurezza.
- **Dominio custom**: al momento `.netlify.app`. Se un domani vogliono un dominio proprio, è configurazione di 10 minuti.
- **Statistiche** (chi scrive di più, quali sezioni vengono usate): non richieste, ma i dati ci sono tutti per farle in un momento.

---

## 16. Glossario rapido per il dev

- **Contributo**: unità atomica di scrittura. Un utente, una data, una sezione, testo + media.
- **Giornata**: collezione di contributi che condividono `diary_date`.
- **Sezione**: una delle tre categorie (`quotidiani`, `speciali`, `rilancio`). Fisse in MVP, estendibili in futuro aggiungendo valori al CHECK.
- **Superadmin**: account unico di servizio, non persona, per gestire utenti e correggere post. Identificato dall'email sintetica `admin@diario.internal`.
- **Upload retroattivo**: un utente sceglie una data nel passato come `diary_date` di un nuovo contributo.
- **Email sintetica**: email non valida/non consegnabile (`{username}@diario.internal`) usata internamente da Supabase Auth per non dover chiedere email vere agli utenti.

---

**Fine del piano.** Claude Code può partire dalla Fase 0 e procedere sequenzialmente. Ogni fase è autocontenuta e termina con uno stato funzionante parziale testabile.
