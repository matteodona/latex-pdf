# latex-pdf-backend

Tutto il progetto è in questa cartella: compilazione LaTeX, parametri per file, server API per il frontend.

## Requisiti

- Node.js ≥ 16
- TeX Live (o MacTeX) con `pdflatex` nel PATH

## Installazione e avvio

```bash
cd backend
npm install
npm start
```

Server in ascolto su http://localhost:3001 (o `PORT` se impostata).

## Struttura

```
backend/
├── projects/                    # Un progetto per sottocartella
│   └── relazione-tecnica/      # Progetto LaTeX (main.tex, sections/...)
├── src/                         # Modulo compilazione
│   ├── compileLatex.js
│   └── index.js
├── examples/
│   └── compile.js
├── index.js                     # Server Express (API)
├── package.json
└── README.md
```

Per aggiungere un nuovo tipo di documento: crea una sottocartella in `projects/` (es. `projects/preventivo/`) con il suo albero LaTeX e usa `projectPath: "preventivo"` nell’API.

## Script

| Comando | Descrizione |
|--------|-------------|
| `npm start` | Avvia il server API (porta 3001) |
| `npm run compile` | Compila il progetto relazione-tecnica con l’esempio |

## API

### GET /api/health

Health check. Risposta: `{ "status": "ok", "timestamp": "..." }`.

### POST /api/compile

Compila e restituisce il PDF.

**Body (JSON):**
```json
{
  "projectPath": "relazione-tecnica",
  "params": {
    "sections": {
      "fontespizio": { "nomeCommittente": "...", "cognomeCommittente": "...", "indirizzoCommittente": "...", "tabellaRevisioni": [...] },
      "footer": { "codProgetto": "...", "dataGenerazioneDocumento": "..." },
      "chapters": {
        "03-criteri": { "tipoDiCavo": "..." },
        "04-soluzione": { "luogoInstallazione": "...", ... }
      }
    }
  }
}
```

- **projectPath** (obbligatorio): nome della sottocartella in `projects/` (es. `"relazione-tecnica"`).
- **params** (opzionale): struttura che ricalca cartelle/file del progetto scelto.

**Successo 200:** corpo = PDF (attachment). **Errore 400/500:** `{ "error": "messaggio" }`.

**Esempio dal frontend:**
```js
const res = await fetch('http://localhost:3001/api/compile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ projectPath: 'relazione-tecnica', params: { ... } }),
});
const blob = await res.blob();
// es. URL.createObjectURL(blob) per anteprima o download
```

## Uso modulo (da script)

```js
const path = require('path');
const { compileToPdf } = require('./src');
const pdfPath = compileToPdf(path.join(__dirname, 'projects', 'relazione-tecnica'), paramsStructure);
```

## Placeholder nei .tex

Nei file `.tex` usa `\{nomeParametro\}` (es. `\{nomeCommittente\}`, `\{codProgetto\}`). Per la tabella revisioni: parametro `tabellaRevisioni` (array di `{ numRevisione, data, descrizioneRevisione }`).

## Licenza

MIT
