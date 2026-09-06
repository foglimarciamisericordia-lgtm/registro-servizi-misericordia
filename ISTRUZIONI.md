# Come caricare il programma su Cloudflare (con dati condivisi)

Questo pacchetto contiene:
- `index.html` → l'intera applicazione (HTML, CSS, JavaScript, logo)
- `functions/api/kv.js` → la funzione che salva/legge i dati condivisi

I dati (utenti, mezzi, servizi) sono ora salvati in un vero database
condiviso su Cloudflare (KV), quindi saranno **uguali per tutti gli
utenti**, da qualunque telefono o computer, ovunque si trovino.

## Passaggi

### 1. Crea il database (KV namespace)

1. Accedi al secondo account Cloudflare.
2. Vai su **Archiviazione e database** → **KV**.
3. Clicca **Crea namespace**, dagli un nome, ad esempio
   `registro-servizi-kv`, e conferma.

### 2. Crea il progetto Pages

1. Vai su **Workers & Pages** → **Crea applicazione** → scheda
   **Pages** → **Carica risorse (Direct Upload)**.
2. Dai un nome al progetto, ad esempio `registro-servizi-misericordia`.
3. Trascina dentro la finestra **l'intera cartella** di questo
   pacchetto (deve contenere sia `index.html` sia la cartella
   `functions`) e avvia il deployment.

### 3. Collega il database al progetto

1. Apri il progetto appena creato → scheda **Impostazioni** →
   **Associazioni delle funzioni** (Functions bindings) →
   **KV namespace bindings**.
2. Aggiungi un'associazione con:
   - Nome variabile: `REGISTRO_KV` (esattamente così, senza cambiarlo)
   - Namespace KV: quello creato al punto 1 (`registro-servizi-kv`)
3. Salva. Cloudflare potrebbe chiederti di rifare il deployment: se lo
   chiede, esegui di nuovo l'upload della stessa cartella (o clicca
   "Ridistribuisci" se disponibile).

### 4. Verifica

Apri l'indirizzo del sito (es.
`https://registro-servizi-misericordia.pages.dev`), accedi con
`admin` / `admin123`, crea un servizio di prova e ricaricalo da un
altro dispositivo: se lo vedi comparire, il collegamento al database
funziona correttamente.

## Nota importante

Se salti il punto 3 (collegamento del namespace KV), il programma si
apre ma non riesce a salvare né leggere alcun dato: comparirà un
avviso di errore al salvataggio. Il nome della variabile deve essere
esattamente `REGISTRO_KV`, perché è quello che la funzione
`functions/api/kv.js` si aspetta di trovare.

## Sicurezza dei dati

Chiunque conosca l'indirizzo del sito può aprirlo; l'accesso alle
funzioni del programma resta comunque protetto dal login (nome
utente/password) creato da amministratore. Ricorda di cambiare la
password dell'account `admin` predefinito appena possibile.
