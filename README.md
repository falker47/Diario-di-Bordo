# 📖 Diario di Bordo

> Webapp mobile-first progettata per digitalizzare e semplificare la gestione del diario di bordo all'interno di una comunità educativa.

Una piattaforma moderna, sicura e facile da usare per educatori e amministratori, con supporto per contenuti multimediali e gestione avanzata degli utenti.

## ✨ Funzionalità Principali

- 👁️ **Vista Pubblica (Read-Only):** Consultazione agevole dei contributi filtrabili per giorno, settimana, mese e anno.
- ✍️ **Area Educatori (`/admin`):** Spazio riservato dove gli educatori possono creare, modificare ed eliminare i propri contributi, allegando anche foto e video.
- 🛡️ **Area Superadmin (`/superadmin`):** Pannello di controllo completo per la gestione degli utenti (creazione, disattivazione) e la moderazione/correzione di qualsiasi contributo.
- 📱 **Design Mobile-First:** Interfaccia utente ottimizzata per l'uso in mobilità da smartphone e tablet.
- ☁️ **Media Management Ottimizzato:** Gestione automatizzata degli allegati con caricamento sicuro su Cloudinary e pulizia automatica alla cancellazione tramite Edge Functions.

---

## 🛠️ Stack Tecnologico

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- **Database & Auth:** Supabase (PostgreSQL) con RLS (Row Level Security)
- **Media Storage:** Cloudinary (free tier 25 GB)
- **Serverless:** Supabase Edge Functions (Deno)
- **Hosting:** Netlify (Frontend)

---

## 🚀 Sviluppo Locale

### Prerequisiti
- Node.js (v18+)
- npm o yarn

### Setup

1. **Installa le dipendenze:**
   ```bash
   npm install
   ```

2. **Configura le variabili d'ambiente:**
   Copia il file `.env.example` e rinominalo in `.env.local`, quindi compila i 4 valori `VITE_*`.

3. **Avvia il server di sviluppo:**
   ```bash
   npm run dev
   ```
   L'app sarà disponibile all'indirizzo `http://localhost:5173`.

4. **Comandi aggiuntivi utili:**
   ```bash
   npm run typecheck    # Verifica i tipi TypeScript
   npm run build        # Crea la build per la produzione
   ```

---

## 📜 Script Utili

Gli script server-side leggono le configurazioni da `.env.scripts.local` (file gitignored). Assicurati che contenga: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD`.

| Comando | Descrizione |
|---|---|
| `npm run seed` | Popola il DB con un utente di test (`mario` / `mario2026`) e 6 contributi realistici |
| `npm run seed:down` | Rimuove utente, profilo e contributi generati dal seed |
| `npm run test:delete-media` | Smoke test della Edge Function `delete-media` (4 casi di test) |
| `npm run test:users -- --help` | Tool CLI per invocare le Edge Functions di gestione utenti |

---

## 📦 Deploy

### Frontend (Netlify)

1. Connetti il repo GitHub a Netlify.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Imposta le 4 variabili d'ambiente `VITE_*` dal pannello Netlify (Site configuration → Environment variables).
5. File [`netlify.toml`](netlify.toml) da configurare per includere le regole di routing `_redirects` necessarie per il fallback della SPA.

### Supabase Edge Functions

Ci sono 5 Edge Functions nella cartella `supabase/functions/`:
- `delete-media` — Cleanup su Cloudinary quando un utente elimina un contributo.
- `create-user`, `update-user`, `deactivate-user`, `reactivate-user` — Gestione sicura degli utenti (solo per superadmin).

Tutte le funzioni sono **single-file** (`index.ts` auto-contenuto) e possono essere deployate facilmente via UI o CLI.

#### Opzione A — Deploy via Dashboard UI (Consigliata)
Per ogni funzione:
1. Vai su Supabase Dashboard > Edge Functions > Deploy a new function.
2. Nome/slug: usa il nome esatto della cartella (es. `delete-media`).
3. Disattiva "Verify JWT with legacy secret" (la verifica viene fatta manualmente nel codice).
4. Copia e incolla il contenuto del file `index.ts` corrispondente nell'editor online.
5. Fai click su **Deploy**.

**Secrets richiesti** (da configurare nella Dashboard: Edge Functions → Secrets):
- `SUPERADMIN_EMAIL`: `admin@diario.internal` (usato dalle funzioni user)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: credenziali prese dal pannello Cloudinary (usato da `delete-media`).
*Nota: `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` sono già esposti di default.*

#### Opzione B — Deploy via Supabase CLI
Installa la CLI e autenticati:
```bash
supabase login
supabase link --project-ref <PROJECT_REF>
supabase secrets set SUPERADMIN_EMAIL=admin@diario.internal CLOUDINARY_CLOUD_NAME=... CLOUDINARY_API_KEY=... CLOUDINARY_API_SECRET=...
```
Deploy massivo:
```bash
supabase functions deploy
```

### Database (Migrations)

Lo schema completo del database si trova in `supabase/migrations/0001_init.sql`. (I successivi aggiornamenti sono in file numerati in sequenza).
Per il deploy, copia il contenuto dei file SQL ed eseguili nel **SQL Editor** della Dashboard Supabase in ordine. Lo script è idempotente.

---

## 📂 Struttura del Progetto

```text
src/                  # Frontend SPA
├── components/       # Componenti UI riutilizzabili, layout
├── hooks/            # Custom hooks (es. useAuth, useContributions, useToast)
├── lib/              # Utility (Supabase, Cloudinary, formattazione date)
├── pages/            # Pagine dell'applicazione
│   ├── public/       # Vista read-only (day/week/month/year)
│   ├── admin/        # Area riservata agli educatori loggati
│   └── superadmin/   # Area riservata al gestore (admin@diario.internal)
└── router.tsx        # Configurazione routing e guards
supabase/
├── migrations/       # Schema SQL del database
└── functions/        # Codice sorgente Edge Functions
scripts/              # Script utility (seed del DB, testing functions)
```

---

## 🔒 Area Superadmin

L'account di servizio per la gestione è `admin@diario.internal`. 
La password iniziale viene consegnata separatamente. In caso di smarrimento, è possibile forzare il reset direttamente dalla Dashboard di Supabase:
`Authentication` → `Users` → Seleziona l'utente → `...` → `Reset password`. *(Nota: la funzione "Send password recovery" non funziona poiché l'email è sintetica).*

**Importante:** Questo account ha solo finalità di amministrazione e moderazione e **non può scrivere contributi**. Le policy RLS (Row Level Security) bloccano la scrittura e l'interfaccia utente nasconde l'opzione di creazione.
