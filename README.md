# 📖 Diario di Bordo

> Web app mobile-first per raccogliere e consultare il diario di bordo di una comunità educativa. La lettura è pubblica, mentre la pubblicazione dei contributi e la gestione degli utenti richiedono l'accesso a un'area riservata.

[🌐 Applicazione](https://diariodibordo.netlify.app) · [🔒 Modello di sicurezza](docs/security-model.md) · [📘 Guida committente](docs/guida-committente.md)

![CI](https://github.com/falker47/Diario-di-Bordo/actions/workflows/ci.yml/badge.svg)

![Diario di Bordo — anteprima dell'interfaccia](docs/diario-di-bordo-preview.webp)

## Cosa fa

Diario di Bordo permette agli educatori di documentare attività, esperienze e osservazioni della comunità attraverso contributi testuali, fotografie e video. I contenuti vengono organizzati per data e sezione, così da poter ricostruire quanto accaduto nel tempo senza affidarsi a documenti separati o a una cronologia di messaggi.

### Consultazione pubblica

Chi visita l'applicazione può:

- consultare il diario per **giorno, settimana, mese e anno**;
- esplorare le sezioni **Quotidiani, Speciali ed Équipe**;
- cercare contributi per titolo o testo e filtrarli per periodo nelle viste per categoria;
- leggere i contributi, visualizzare foto e video e consultare i commenti;
- navigare da smartphone, tablet e computer, con controlli adattati alle diverse dimensioni dello schermo.

**Non è richiesto un account per leggere.** I contenuti pubblicati, i commenti e i dati dei profili accessibili tramite il database devono quindi essere considerati informazioni pubbliche.

### Area educatori

Gli educatori accedono con un nome utente e una password personali. Possono:

- creare contributi con data, sezione, titolo opzionale, testo, fotografie e video;
- modificare i propri contributi;
- eliminare i propri contributi dalla vista per categoria, dopo una richiesta di conferma;
- pubblicare ed eliminare i propri commenti.

L'editor consente di inserire contributi relativi alla giornata corrente o a date passate entro due anni. È necessario aggiungere almeno un testo o un allegato; il solo titolo non è sufficiente.

La rimozione di un contributo dal database e la cancellazione dei suoi file su Cloudinary sono operazioni distinte: **l'eliminazione dei media non è garantita**. I limiti sono descritti più avanti.

### Area superadmin

L'amministrazione dispone di un pannello dedicato per:

- creare, aggiornare, disattivare e riattivare gli account degli educatori;
- cercare e filtrare i contributi per autore, sezione, periodo e contenuto;
- correggere i contributi pubblicati dagli educatori;
- eliminare commenti nell'ambito della moderazione.

Il superadmin non pubblica contributi o commenti e non dispone di una funzione per eliminare i contributi altrui.

I controlli dell'interfaccia servono a presentare le azioni disponibili, ma non costituiscono da soli una protezione. Le autorizzazioni vengono applicate tramite **Row Level Security (RLS)** nel database e, per le operazioni privilegiate, tramite **Supabase Edge Functions**.

## Architettura

| Livello | Tecnologia | Responsabilità |
| --- | --- | --- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS | Interfaccia, navigazione temporale, editor e gestione degli allegati |
| Autenticazione e database | Supabase Auth, PostgreSQL | Sessioni, profili, contributi e commenti |
| Autorizzazione | PostgreSQL RLS | Regole di accesso ai record |
| Operazioni privilegiate | Supabase Edge Functions (Deno) | Gestione degli utenti e cancellazione dei media |
| Media | Cloudinary | Caricamento, conservazione e distribuzione di immagini e video |
| Hosting | Netlify | Build e pubblicazione dell'applicazione web |
| CI | GitHub Actions | Controllo TypeScript e build di produzione |

### Flusso essenziale

```text
Browser
  ├─ Supabase client (anon key) ──> Auth + PostgreSQL (RLS)
  ├─ Upload unsigned ────────────> Cloudinary
  └─ Richieste autenticate ──────> Supabase Edge Functions
                                        ├─ Service role → Supabase
                                        └─ Credenziali server → Cloudinary
```

Il browser utilizza la chiave pubblica di Supabase e le impostazioni pubbliche del preset Cloudinary. La **service-role key di Supabase** e le credenziali private di Cloudinary devono rimanere negli ambienti server.

La documentazione dettagliata dei ruoli, delle policy e dei confini di sicurezza è disponibile in [docs/security-model.md](docs/security-model.md).

## Sicurezza, media e privacy

Il progetto distingue i permessi di lettura e scrittura, ma presenta limiti che devono essere considerati prima di utilizzarlo con informazioni riservate.

### Visibilità dei dati

Le policy RLS versionate consentono la lettura pubblica delle tabelle `contributions`, `comments` e `profiles`. Non si tratta quindi di un diario privato accessibile soltanto agli educatori.

La lettura pubblica dei profili non è limitata alla sola visualizzazione del nome dell'autore nell'interfaccia: la policy permette di interrogare i dati di profilo esposti dalla tabella.

Prima di inserire testi, immagini o video che riguardano persone della comunità educativa, occorre verificare che quei contenuti possano effettivamente essere pubblicati. L'autenticazione degli educatori non limita la visibilità dei contributi già pubblicati.

### Upload Cloudinary

L'applicazione carica i file direttamente dal browser attraverso un **upload preset unsigned**.

L'interfaccia applica controlli sui formati e sulle dimensioni:

- immagini: JPG, JPEG, PNG, WEBP e HEIC;
- video: MP4 e MOV;
- dimensione massima per file: 50 MiB;
- durata massima dei video: 60 secondi.

Le immagini vengono inoltre compresse nel browser prima del caricamento. Questi controlli lato client non sostituiscono le restrizioni che devono essere configurate direttamente su Cloudinary, comprese quelle relative a formati, dimensioni, destinazioni e utilizzo delle risorse.

### Cancellazione dei media

La Edge Function `delete-media` verifica la presenza di un utente autenticato, ma **non controlla che il `public_id` richiesto appartenga a un contributo di quell'utente**. Di conseguenza, il codice non impedisce a un utente autenticato di richiedere direttamente la cancellazione di un media altrui conoscendone l'identificativo.

Quando un educatore elimina un proprio contributo dalla vista per categoria, l'applicazione tenta di rimuovere i relativi file Cloudinary e poi cancella il record dal database. La pulizia è di tipo *best effort*: se alcuni file non vengono rimossi, possono rimanere su Cloudinary anche dopo la cancellazione del contributo.

Inoltre, togliere un allegato dall'editor modifica l'elenco dei media del contributo, ma non garantisce l'eliminazione del file remoto. Anche un caricamento non seguito dal salvataggio può lasciare un file non più associato a un contributo.

Questi comportamenti sono limiti dell'implementazione corrente, non garanzie di cancellazione completa. Il [modello di sicurezza](docs/security-model.md) descrive anche il controllo di proprietà necessario per rafforzare `delete-media`.

## Sviluppo locale

### Requisiti

- Node.js 20, utilizzato anche dal workflow CI;
- npm;
- un progetto Supabase configurato;
- un account Cloudinary con un preset unsigned dedicato.

### Installazione e avvio

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Il file `.env.local` deve contenere i valori necessari all'applicazione:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_CLOUDINARY_CLOUD_NAME
VITE_CLOUDINARY_UPLOAD_PRESET
```

Lo schema di configurazione è in [.env.example](.env.example).

Le variabili con prefisso `VITE_` vengono utilizzate nel frontend e non devono contenere credenziali riservate. Le chiavi di servizio e i segreti Cloudinary necessari alle Edge Functions devono essere configurati separatamente, lato server.

I file con le credenziali reali non devono essere pubblicati nel repository.

### Verifiche disponibili

```bash
npm run typecheck
npm run build
```

È disponibile anche `npm run preview` per visualizzare localmente la build prodotta.

Il workflow [CI](.github/workflows/ci.yml) esegue `npm ci`, `npm run typecheck` e `npm run build` sulle pull request e sui push a `main`.

Queste verifiche controllano i tipi TypeScript e la produzione degli artefatti Vite. **Non includono una suite automatica di test funzionali, end-to-end o di sicurezza.**

Nella cartella [scripts/](scripts/) sono presenti anche utility di seed e verifica delle Edge Functions. Utilizzano un file locale `.env.scripts.local` e possono effettuare operazioni reali sui servizi remoti, compresa la creazione, modifica o cancellazione di dati e account. Vanno utilizzate soltanto in ambienti di prova appropriati, non eseguite indiscriminatamente sul database di produzione.

## Database ed Edge Functions

Le modifiche allo schema sono conservate in [supabase/migrations/](supabase/migrations/).

Le migrazioni versionano:

- le tabelle `profiles` e `contributions`, con indici, timestamp e policy RLS;
- le correzioni alle policy di autorizzazione;
- la tabella tecnica `_keep_alive`;
- il titolo opzionale dei contributi;
- la rinomina della sezione `rilancio` in `equipe`;
- la tabella `comments` e le relative autorizzazioni.

Il repository contiene cinque Edge Functions:

- `create-user`
- `update-user`
- `deactivate-user`
- `reactivate-user`
- `delete-media`

Le prime quattro gestiscono gli account e verificano lato server che il chiamante sia il superadmin. `delete-media` utilizza credenziali Cloudinary server-side, con la limitazione di autorizzazione descritta sopra.

La presenza delle migrazioni nel repository non dimostra che siano state applicate a uno specifico database remoto. L'esecuzione delle migrazioni e la configurazione delle funzioni richiedono un ambiente Supabase controllato.

## Deploy

### Netlify

La configurazione è versionata in [netlify.toml](netlify.toml):

- comando di build: `npm run build`;
- directory pubblicata: `dist`;
- versione Node.js: 20;
- fallback delle route della SPA verso `index.html`.

L'applicazione pubblica dichiarata dal progetto è disponibile all'indirizzo [diariodibordo.netlify.app](https://diariodibordo.netlify.app).

La configurazione del repository descrive come costruire e distribuire il frontend, ma non certifica da sola la revisione effettivamente distribuita, lo stato del progetto Netlify o il funzionamento dei servizi collegati.

### Supabase e Cloudinary

Database, autenticazione, Edge Functions e media dipendono da servizi configurati separatamente. Le relative credenziali server e le impostazioni di produzione non sono incluse nella configurazione pubblica del frontend.

Il repository contiene inoltre il workflow [Keep Supabase Alive](.github/workflows/keep-supabase-alive.yml), che esegue periodicamente un aggiornamento sulla tabella tecnica `_keep_alive`. Questo controllo è distinto dalla CI di build e non verifica le funzionalità applicative.

## Documentazione e struttura

```text
src/
├── components/       Componenti dell'interfaccia, editor e media
├── hooks/            Autenticazione, interrogazioni e stato
├── lib/              Client Supabase, Cloudinary, date e validazioni
├── pages/
│   ├── public/       Viste giorno, settimana, mese, anno e categoria
│   ├── admin/        Login e gestione dei propri contributi
│   └── superadmin/   Gestione utenti e moderazione
└── router.tsx

supabase/
├── migrations/       Schema PostgreSQL e policy RLS
└── functions/        Edge Functions Deno

docs/
├── security-model.md
├── guida-committente.md
├── credenziali-template.txt
└── diario-di-bordo-preview.webp
```

Per approfondire:

- [Modello di sicurezza](docs/security-model.md): autorizzazioni, segreti, accesso pubblico e limiti della cancellazione media.
- [Guida committente](docs/guida-committente.md): istruzioni di utilizzo e gestione. Alcune indicazioni storiche sulle schermate e sui nomi delle sezioni richiedono un riallineamento con l'interfaccia corrente.
- [PLAN.md](PLAN.md): piano di implementazione originale, utile come riferimento progettuale ma non come inventario aggiornato delle funzionalità.

## Licenza e riutilizzo

Nel repository non è presente un file `LICENSE` né una concessione esplicita di licenza per il progetto nel suo complesso.

La disponibilità pubblica del codice su GitHub non implica, da sola, un'autorizzazione generale a copiarlo, modificarlo o redistribuirlo. Le librerie e i servizi di terze parti rimangono soggetti alle rispettive condizioni e licenze.

## Stato del progetto

Il repository contiene un'applicazione web con navigazione pubblica, interfacce di scrittura e amministrazione, autenticazione, database, gestione dei media e configurazione di deploy.

Le funzionalità descritte corrispondono ai percorsi presenti nel codice. La loro presenza, insieme a una build riuscita, non equivale tuttavia a un collaudo completo dell'ambiente di produzione. Rimangono in particolare da considerare i limiti documentati sulla visibilità dei dati, sull'autorizzazione alla cancellazione dei media e sulla pulizia degli allegati.
