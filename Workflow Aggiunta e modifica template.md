# Workflow Aggiunta e modifica template

Questa guida descrive, in modo operativo, come:

- modificare un template esistente;
- aggiungere/eliminare parametri;
- aggiungere un nuovo progetto template end-to-end;
- verificare che tutto continui a funzionare.

## 1) Come funziona oggi il flusso

1. Il backend espone i template validi con `GET /api/templates` leggendo le cartelle in `backend/projects/<slug>`.
2. Il frontend mostra la lista template e, per il template selezionato, usa il form per raccogliere i dati.
3. Alla generazione PDF il frontend invia `POST /api/templates/<slug>/compile` con body `params`.
4. Il backend sostituisce i placeholder `\{chiave\}` nei `.tex`, compila con `pdflatex` e restituisce il PDF.

File principali:

- Backend registry/lista template: `backend/api/templates_registry.py`
- Backend compile endpoint: `backend/api/views.py`
- Backend compilazione LaTeX: `backend/api/compile_latex.py`
- Frontend pagina principale e submit compile: `frontend/src/App.tsx`
- Frontend payload builder compile: `frontend/src/compilePayload.ts`
- Frontend form: `frontend/src/components/RelazioneTecnicaForm.tsx`
- Contratto template (manifest): `backend/projects/<slug>/template.json`

## 2) Modificare un template esistente (backend + frontend)

### 2.1 Backend (template e LaTeX)

Parti da una cartella template esistente: `backend/projects/<slug>/`.

1. Aggiorna i file `.tex` in cui vuoi usare i dati.
   - Inserisci i placeholder nel formato: `\{nomeParametro\}`.
2. Aggiorna `template.json` del progetto:
   - sezione `latex.parts[*].placeholders`;
   - sezione `compileRequest` (struttura attesa in `params`);
   - sezione `userParameters` (descrizione campi lato form).
3. Mantieni coerenza tra:
   - path logici in `compileRequest` (es. `sections.chapters.04-soluzione`);
   - path reali `.tex` (es. `sections/chapters/04-soluzione.tex`);
   - placeholder nei file LaTeX.

Nota: lo slug del template deve coincidere con `template.json.id`.

### 2.2 Frontend (form e mapping payload)

Per il template attuale (`relazione-tecnico-specialistica-domestico-tt-cpi`) i campi sono gestiti in modo esplicito.

1. Aggiorna tipo dati in `frontend/src/types.ts` (`RelazioneTecnicaParams`).
2. Aggiorna la UI form in `frontend/src/components/RelazioneTecnicaForm.tsx`.
3. Aggiorna il mapping verso il payload compile in `frontend/src/compilePayload.ts`.
   - qui vanno anche eventuali campi derivati (formattazioni, valori calcolati).
4. Se il parametro e` una lista checkbox tipi cavo:
   - aggiorna anche `frontend/src/tipiCavoConfig.ts`.

## 3) Aggiungere un parametro (checklist rapida)

Usa questa sequenza per ridurre errori.

1. **Template LaTeX**
   - aggiungi `\{nuovoParametro\}` nel `.tex` corretto.
2. **Manifest**
   - aggiungi il placeholder in `latex.parts`;
   - aggiungi la chiave in `compileRequest` nella sezione giusta;
   - aggiungi il campo in `userParameters`.
3. **Frontend**
   - aggiungi campo in `RelazioneTecnicaParams`;
   - aggiungi input nel form;
   - mappa il campo in `buildRelazioneTecnicaCompileBody`.
4. **Verifica**
   - genera PDF con valore compilato;
   - verifica che il placeholder non resti vuoto nel documento.

## 4) Eliminare un parametro (checklist rapida)

1. Rimuovi il placeholder dai `.tex`.
2. Rimuovi la chiave da `template.json` (`latex.parts`, `compileRequest`, `userParameters`).
3. Rimuovi campo da:
   - `frontend/src/types.ts`;
   - `frontend/src/components/RelazioneTecnicaForm.tsx`;
   - `frontend/src/compilePayload.ts`;
   - eventuale `tipiCavoConfig.ts` se correlato.
4. Rigenera PDF e verifica che la compilazione non fallisca.

## 5) Modificare un parametro esistente

Se cambi nome o posizione di un parametro:

1. aggiorna placeholder `.tex`;
2. aggiorna `template.json` nelle sezioni citate;
3. aggiorna tipo+form+payload builder frontend;
4. verifica compile end-to-end.

Attenzione: rinominare solo in un punto rompe la catena e produce output mancante o errore compile.

## 6) Workflow completo per aggiungere un nuovo progetto template

## 6.1 Creazione struttura backend

1. Crea cartella: `backend/projects/<nuovo-slug>/`.
2. Inserisci almeno:
   - `main.tex`;
   - `template.json`;
   - eventuali `sections/...` inclusi in `main.tex`.
3. Regole minime per essere visibile in `GET /api/templates`:
   - nome cartella slug valido (`lowercase-kebab-case`);
   - `main.tex` presente;
   - `template.json` valido e con chiavi stringa richieste (`id`, `name`, `description`, `tag`);
   - `template.json.id` uguale allo slug cartella.

## 6.2 Definizione contratto manifest

Nel nuovo `template.json` definisci:

- metadati template (`id`, `name`, `description`, `tag`);
- mappa parti LaTeX (`latex.parts`);
- schema payload compile (`compileRequest`);
- parametri utente (`userParameters`).

## 6.3 Integrazione frontend

Stato attuale: il form e il payload sono specializzati sul template relazione tecnica.

Per supportare un nuovo template hai due opzioni:

1. **Rapida (attuale):** creare nuova variante form + mapping payload dedicato.
2. **Evolutiva:** introdurre renderer dinamico basato su `template.json` (refactor piu` ampio).

Con l’architettura corrente, per una nuova variante:

- aggiungi tipo parametri dedicato;
- crea componente form dedicato;
- crea funzione builder payload dedicata;
- instrada in `App.tsx` in base a `selectedTemplate.id`.

## 7) Test consigliati prima del merge

## 7.1 Smoke API esistente

Da root:

```bash
python3 api-tests/run_api_tests.py --base-url "http://localhost:3001/api"
```

Oppure con credenziali admin per coprire anche flusso utenti:

```bash
python3 api-tests/run_api_tests.py \
  --base-url "http://localhost:3001/api" \
  --admin-user "<admin_user>" \
  --admin-pass "<admin_pass>"
```

## 7.2 Test backend sicurezza compile

Da `backend/`:

```bash
python3 -m unittest api.tests.test_compile_latex
```

Copertura aggiunta:

- chiavi invalide nei params ignorate;
- tentativi di scrittura fuori directory template bloccati.

## 7.3 Build frontend

Da `frontend/`:

```bash
npm run build
```

Serve a validare TypeScript e bundle dopo modifiche a form/payload.

## 8) Errori frequenti e dove guardare

- Template non visibile in lista:
  - controlla slug cartella, `main.tex`, `template.json.id`.
- PDF non valorizza un campo:
  - verifica coerenza placeholder `.tex` vs chiave in payload builder.
- Compile fallisce:
  - verifica sintassi LaTeX e placeholder residui;
  - controlla output `main.log`.
- Campo aggiornato ma UI non cambia:
  - ricontrolla `types.ts` e `RelazioneTecnicaForm.tsx`.

## 9) Regola d’oro di manutenzione

Ogni parametro vive in quattro punti che devono sempre restare allineati:

1. placeholder nel `.tex`;
2. dichiarazione nel `template.json`;
3. campo raccolto nel form frontend;
4. mapping nel payload compile frontend.
