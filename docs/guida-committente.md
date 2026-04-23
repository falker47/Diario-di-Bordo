# Diario di Bordo — guida all'uso

Questa guida è pensata per chi riceve l'applicazione in consegna e deve gestirla per la comunità educativa. Stampala o tienila vicina al computer.

---

## 1. Cos'è

Una webapp mobile-first dove gli educatori scrivono ogni giorno cosa è successo in comunità (attività, uscite, osservazioni) e allegano foto o brevi video. Il diario è **consultabile pubblicamente** da chiunque abbia il link: non serve login per leggere. Il login serve solo a chi deve **scrivere**.

---

## 2. Come accedere

1. Apri il browser (Chrome, Safari, Edge, Firefox — tutti vanno bene).
2. Vai all'indirizzo indicato nel foglio delle credenziali (finisce in `.netlify.app`).
3. Vedrai subito la giornata di oggi. Puoi leggere tutto senza fare login.
4. Per scrivere: in alto a destra, click su **"Accedi"**.
5. Inserisci username e password che ti sono stati forniti (o che hai creato tu dalla gestione utenti).

> Il form chiede "username", non "email". Si tratta di un nickname corto (es. `mario`), tutto minuscolo.

---

## 3. Navigare il diario

Una volta dentro, o anche senza login:

- **Vista Giorno**: contributi di una singola giornata, divisi in Quotidiani, Speciali, Rilancio.
- **Vista Settimana**: una card per ogni giorno della settimana corrente.
- **Vista Mese**: un calendario con un pallino sui giorni in cui qualcuno ha scritto.
- **Vista Anno**: una heatmap "tipo GitHub" che mostra tutto l'anno a colpo d'occhio.

Per spostarti:
- **Frecce ‹ ›** in cima alla pagina
- **Selezione data** (il campo giorno cliccabile)
- **Tasto "Vai alla giornata di oggi"** sotto la data
- Da computer: tasti freccia sinistra/destra ← → e **T** per tornare a oggi
- Da smartphone: **scorri con il dito** sinistra/destra per cambiare giorno

---

## 4. Scrivere un contributo (educatori)

1. Accedi con le tue credenziali.
2. Dalla dashboard "Ciao <Nome>", clicca **"+ Nuovo contributo"**.
3. Compila:
   - **Data**: di default oggi. Puoi scegliere una data passata fino a 2 anni indietro (utile se scrivi in ritardo). Non puoi scegliere date future.
   - **Sezione**: scegli tra Quotidiani, Speciali, Rilancio.
   - **Testo**: racconta con parole tue.
   - **Foto e video**: bottone "+ Aggiungi foto o video". Puoi selezionare più file. Formati accettati: JPG, PNG, WEBP, HEIC, MP4, MOV. Max 50 MB per file, video max 60 secondi.
4. Click **"Pubblica"**.

**Serve internet**? Sì, le foto vengono caricate online. Su una rete lenta la barra di progresso ti dice a che punto è.

---

## 5. Modificare o eliminare un proprio contributo

1. Dalla dashboard vedi i tuoi ultimi 20 contributi.
2. **"Modifica"** apre lo stesso editor, puoi cambiare qualsiasi cosa (anche la data o la sezione).
3. **"Elimina"** chiede conferma, poi rimuove il contributo e le sue foto.

Ogni modifica viene tracciata: nella vista pubblica appare "Modificato il [data]" (non mostra chi ha modificato, solo la data).

---

## 6. Gestione utenti (solo amministrazione)

L'account speciale `admin` non scrive contributi. Serve solo a gestire chi può accedere.

Dopo il login con `admin`:

1. **Modifica post esistenti** — Puoi correggere qualsiasi contributo (tuo o altrui). Appare un avviso giallo quando stai modificando il contributo di un'altra persona. **Non puoi eliminare** i contributi altrui: solo correggerli.
2. **Gestisci utenti** — Vedi la lista di tutti gli educatori.

### Creare un nuovo utente

- Click **"+ Nuovo utente"**
- **Username**: nickname corto minuscolo, lettere/numeri/underscore, 3-20 caratteri (es. `giulia`, `luca_b`). Viene auto-corretto mentre digiti.
- **Nome** e **Cognome**: visibili pubblicamente sotto ogni contributo (es. "Giulia Verdi").
- **Password**: minimo 8 caratteri. Annotala e consegnala a voce (o in chat privata) all'educatore.

### Modificare un utente esistente

- Puoi cambiare username, nome completo, oppure **resettare la password** (campo opzionale nel modal — se vuoto resta quella corrente).
- Se cambi l'username, anche l'accesso dell'utente cambia (dovrà usare il nuovo).

### Disattivare un utente

- Click **"Disattiva"** sulla riga.
- Conferma: l'utente non può più loggarsi. **I suoi contributi restano visibili pubblicamente**, mantengono il suo nome.
- Per farlo tornare attivo, click **"Riattiva"**: non serve conferma.

---

## 7. Cose da sapere

- **Nessun limite di testo**: scrivi quanto vuoi.
- **Backup**: il database ha backup automatici da parte del provider. Fai comunque una copia manuale saltuaria se vuoi (vedi guida tecnica dello sviluppatore).
- **Password dimenticata?** Se un educatore la dimentica, chiedi all'amministrazione di resettargliela dalla "Modifica utente".
- **Password `admin` dimenticata?** Va resettata dalla dashboard del servizio Supabase. Chiedi supporto allo sviluppatore — è un'operazione di 1 minuto che si fa una volta sola.

---

## 8. In caso di problemi

- **"Non posso loggarmi"**: controlla username e password. Se sei stato disattivato l'amministrazione deve riattivarti.
- **"L'upload della foto è bloccato a metà"**: connessione lenta o file troppo grande. Riprova, o usa una foto più piccola.
- **"Non vedo il contributo che ho appena pubblicato"**: ricarica la pagina (F5 o pull-to-refresh da smartphone).
- **Schermo bianco o errore strano**: ricarica. Se persiste, contatta lo sviluppatore con uno screenshot.

---

*Questo documento accompagna la consegna della webapp. Per dettagli tecnici (architettura, deploy, backup) vedi il `README.md` del progetto.*
