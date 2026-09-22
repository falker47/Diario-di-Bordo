# 📖 Diario di Bordo

> Web app mobile-first per digitalizzare il diario di bordo di una comunità educativa, con consultazione pubblica, area educatori e amministrazione separata.

[🌐 Applicazione](https://diariodibordo.netlify.app) · [🔒 Modello di sicurezza](docs/security-model.md) · [📘 Guida committente](docs/guida-committente.md)

![CI](https://github.com/falker47/Diario-di-Bordo/actions/workflows/ci.yml/badge.svg)

## Cosa fa

### Consultazione pubblica

- navigazione del diario per **giorno, settimana, mese e anno**;
- viste per categoria;
- lettura di contributi, allegati multimediali e commenti;
- interfaccia responsive pensata prima di tutto per smartphone e tablet.

### Area educatori

Gli educatori accedono con credenziali personali e possono:

- creare contributi con titolo, testo, foto e video;
- modificare i propri contributi;
- pubblicare ed eliminare i propri commenti;
- usare la stessa interfaccia pubblica mantenendo le azioni di scrittura riservate agli utenti autenticati.

### Area superadmin

Il superadmin dispone di un pannello separato per:

- creare, aggiornare, disattivare e riattivare gli account degli educatori;
- cercare e filtrare tutti i contributi;
- correggere/moderare qualsiasi contributo;
- moderare i commenti.

Le autorizzazioni non dipendono soltanto dall'interfaccia: il database applica **Row Level Security** e le operazioni privilegiate passano da **Supabase Edge Functions**.

## Architettura

| Livello | Tecnologia | Responsabilità |
| --- | --- | --- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS | UI, routing, viste temporali, editor e upload |
| Auth + database | Supabase Auth + PostgreSQL | sessioni, profili, contributi, commenti |
| Autorizzazione | Supabase RLS | enforcement delle regole di lettura/scrittura |
| Operazioni privilegiate | Supabase Edge Functions (Deno) | gestione utenti e operazioni server-side |
| Media | Cloudinary | upload e delivery di immagini/video |
| Hosting | Netlify | build e hosting della SPA |
| Verifica | GitHub Actions | typecheck e production build |

### Flusso essenziale

~~~text
Browser
  ├─ Supabase anon client ──> Auth + PostgreSQL (RLS)
  ├─ unsigned upload ───────> Cloudinary
  └─ authenticated invoke ─> Supabase Edge Functions
                                  ├─ service role -> Supabase
                                  └─ server secret -> Cloudinary
~~~

Il modello completo — ruoli, policy RLS, segreti e trade-off della cancellazione media — è documentato in [docs/security-model.md](docs/security-model.md).

## Confini e limitazioni

Questa repository documenta esplicitamente i limiti attuali invece di presentarli come proprietà già risolte:

- i contenuti del diario e i dati profilo usati per mostrare l'autore sono **pubblicamente leggibili per design**;
- gli upload Cloudinary usano un preset unsigned, che deve essere ristretto e monitorato dal lato Cloudinary;
- la Edge Function <code>delete-media</code> verifica che il chiamante sia autenticato, ma nel modello corrente **non verifica l'ownership del media**: è un trade-off deliberato per il contesto small-team/non-adversarial e va irrigidito prima di usare l'app in uno scenario ostile;
- la UI corrente espone creazione e modifica dei contributi; la policy RLS consente anche la cancellazione del proprio record, ma non viene presentata qui come feature utente finché non esiste un flusso UI completo e verificato.

## Sviluppo locale

### Requisiti

- Node.js 20 consigliato;
- npm;
- un progetto Supabase;
- un account Cloudinary con upload preset dedicato.

### Setup

~~~bash
npm ci
cp .env.example .env.local
npm run dev
~~~

Variabili browser richieste:

~~~text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_CLOUDINARY_CLOUD_NAME
VITE_CLOUDINARY_UPLOAD_PRESET
~~~

I valori reali non vanno committati.

### Verifica locale

~~~bash
npm run typecheck
npm run build
~~~

La stessa verifica viene eseguita automaticamente da GitHub Actions su pull request e su ogni push a <code>main</code>.

## Database ed Edge Functions

Le migration sono versionate in [supabase/migrations/](supabase/migrations/).

Le Edge Functions attuali sono:

- <code>create-user</code>
- <code>update-user</code>
- <code>deactivate-user</code>
- <code>reactivate-user</code>
- <code>delete-media</code>

Gli script operativi locali usano un file <code>.env.scripts.local</code> gitignored e includono seed/test utility per il database e le funzioni.

## Deploy

### Netlify

La configurazione è già versionata in [netlify.toml](netlify.toml):

- build: <code>npm run build</code>;
- directory pubblicata: <code>dist</code>;
- Node.js 20;
- fallback SPA verso <code>index.html</code>.

### Supabase

Il repository conserva migration ed Edge Functions, ma credenziali e service-role key restano fuori dal codice. Per dettagli operativi vedere la documentazione di progetto e il modello di sicurezza.

## Struttura

~~~text
src/
├── components/       UI e componenti del diario
├── hooks/            auth, query e stato applicativo
├── lib/              Supabase, Cloudinary, date e validazione media
├── pages/
│   ├── public/       viste giorno/settimana/mese/anno/categoria
│   ├── admin/        login e editor educatori
│   └── superadmin/   gestione utenti e moderazione
└── router.tsx

supabase/
├── migrations/       schema e policy RLS
└── functions/        Edge Functions Deno

docs/
├── guida-committente.md
├── credenziali-template.txt
└── security-model.md
~~~

## Stato del progetto

Diario di Bordo è un progetto applicativo reale con frontend, database, autenticazione, autorizzazione e gestione media separati. Il repository privilegia una descrizione verificabile dell'implementazione corrente: eventuali hardening ulteriori vengono trattati come lavoro futuro, non come garanzie implicite.
