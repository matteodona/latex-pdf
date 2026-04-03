# Template LaTeX e compilazione

Ogni documento generato dall’applicazione corrisponde a una **cartella** sotto `backend/projects/`. Il backend Django individua i template validi tramite convenzioni su file system e un file **`template.json`** (manifest).

## 1. Requisiti per una cartella progetto

1. Percorso: `backend/projects/<slug>/`
2. Il **nome della cartella** (`<slug>`) deve essere uno **slug** valido: solo lettere minuscole, numeri e trattini, es. `relazione-tecnico-specialistica-domestico-tt-cpi`.
3. Deve esistere **`main.tex`** (entry point LaTeX).
4. Deve esistere **`template.json`** coerente con la cartella (vedi sotto).

La funzione `list_templates` in `api/templates_registry.py` scandisce `projects/` e include solo le directory che soddisfano questi vincoli.

---

## 2. File `template.json` (manifest)

È un file JSON UTF-8 nella root del progetto template. Chiavi obbligatorie per il manifest “minimo”:

| Chiave | Tipo | Descrizione |
|--------|------|-------------|
| `id` | string | Deve coincidere esattamente con il nome della cartella (slug) |
| `name` | string | Titolo mostrato in UI |
| `description` | string | Descrizione breve |
| `tag` | string | Etichetta (es. categoria) |

Chiavi opzionali usate dal codice:

| Chiave | Descrizione |
|--------|-------------|
| `manifest_version` | Versione del manifest (stringa) |
| `app_key` | Identificativo logico del “tipo” di form (es. `legacy`) |
| `compile_contract` | Oggetto con `input` (es. `schema`) e `output_filename` (default `main.pdf`) |
| `form_schema` | Schema per validazione parametri lato server (`api/schema_validation.py`) |
| `capabilities` | Metadati aggiuntivi per il frontend |

L’endpoint `GET /api/templates/<slug>` restituisce il manifest normalizzato.

---

## 3. Parametri e placeholder nei `.tex`

La compilazione (`api/compile_latex.py`, funzione `compile_to_pdf`):

1. Risolve la directory del progetto
2. Se sono forniti parametri strutturati, può copiare il progetto in una directory temporanea e sostituire **placeholder** nei file `.tex`
3. Esegue **pdflatex** (tipicamente due passate per riferimenti incrociati)
4. Restituisce il percorso del PDF generato

I dettagli della sostituzione (chiavi annidate, sezioni, tabelle) dipendono dalla struttura passata a `compile_to_pdf` e dagli **adapter** in `api/template_adapters.py`, che trasformano i parametri del form (o del JSON API) nel dizionario atteso dal motore di sostituzione.

Convenzione tipica nei sorgenti LaTeX: placeholder del tipo `{nomeParametro}` allineati alle chiavi del dizionario di compilazione.

---

## 4. Validazione `form_schema`

Se `template.json` contiene `form_schema` con `fields`, i parametri inviati a `POST /api/templates/<slug>/compile` vengono validati prima della compilazione. In caso di errori, la risposta è **400** con un oggetto `fields` che indica i problemi per campo.

---

## 5. Aggiungere un nuovo template

1. Creare `backend/projects/mio-template/` con `main.tex` e `template.json` (`id` = `mio-template`).
2. Verificare che lo slug sia ammesso dalla regex in `templates_registry.py`.
3. Riavviare o aggiornare il backend: **non** è necessario modificare `urls.py` per ogni nuovo template; lo slug nell’URL seleziona automaticamente la cartella.
4. Nel frontend, aggiungere la voce alla lista template e assicurarsi che le chiamate API usino  
   `POST /api/templates/mio-template/compile` con il body `params` atteso dallo schema.

Se il template riusa lo stesso “tipo” di form di un altro progetto, allineare `app_key` / struttura `params` come negli adapter esistenti.

---

## 6. Dipendenze LaTeX (Docker)

L’immagine `backend/Dockerfile` installa un sottoinsieme di **TeX Live** (italiano, pacchetti consigliati/extra, ghostscript). Se un template richiede pacchetti non inclusi, vanno aggiunte le dipendenze `apt` nel Dockerfile o riducendo il template ai pacchetti disponibili.
