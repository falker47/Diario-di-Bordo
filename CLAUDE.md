# Progetto Diario di Bordo

Webapp per digitalizzare il diario di bordo di una comunità educativa.
Specifica completa in `PLAN.md` — leggilo sempre prima di agire.

## Regole tecniche non negoziabili

- **Stack esatto come da §2 di PLAN.md**: React 18 + Vite + TypeScript + Tailwind, Supabase, Cloudinary, Netlify. Non sostituire librerie senza chiedere.
- **Schema DB e policy RLS esattamente come §4 e §9 di PLAN.md**. Se devi aggiungere indici o trigger, segnalalo.
- **Mobile-first**: ogni componente progettato prima per smartphone, poi esteso a desktop.
- **TypeScript strict**: niente `any` impliciti, niente `// @ts-ignore` senza commento giustificato.
- **Nessuna logica di business nei componenti**: usa hook dedicati (`useContributions`, `useAuth`, ecc.) come da §12 di PLAN.md.
- **Lingua UI**: italiano. Lingua codice/commenti/nomi variabili: inglese.

## Qualità

- Stati di loading, errore e vuoto gentili su ogni schermata — mai pagine bianche.
- Errori Supabase/Cloudinary mostrati con toast comprensibili, non stack trace.
- Accessibilità base: focus ring visibile, `aria-label` sui bottoni icon-only, contrasto minimo AA.
- Nessuna dipendenza npm extra non menzionata nel piano senza chiedermelo.

## Modalità di lavoro

- Procedi per fasi sequenziali come da §14 di PLAN.md (Fase 0 → Fase 6).
- Alla fine di ogni fase fermati, riassumi cosa hai fatto, e aspetta OK prima di proseguire.
- Ambiguità o decisioni non previste → fermati e chiedi.
- Errori o incoerenze nel PLAN.md → segnalameli prima di proseguire.

## Output di ogni fase

- ✅ Checklist item completati (numerazione 1-45 del piano)
- 📁 File creati/modificati
- ⚠️ Deviazioni o scelte da validare
- ▶️ Cosa farai nella prossima fase
