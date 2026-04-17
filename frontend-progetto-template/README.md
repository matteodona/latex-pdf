# Frontend Progetto Template

Questa cartella e` il punto di partenza per un nuovo frontend dedicato a un progetto/backend specifico.

## Come creare un nuovo frontend progetto

1. Duplica l'app relazione:
   - copia `frontend/` in `frontend-<nome-progetto>/`
2. In `frontend-<nome-progetto>/` aggiorna:
   - `package.json` (`name`)
   - `.env`/variabili deploy (`VITE_BACKEND_URL`)
   - UI e payload hardcoded del progetto
3. Avvia e testa in modo indipendente:
   - `npm install`
   - `npm run dev`
   - `npm run build`
   - `npm run lint`

## Convenzione repository

- `frontend/`: frontend attivo per relazione tecnico specialistica
- `frontend-<nome-progetto>/`: frontend dedicato ad altri progetti/template

Ogni frontend e` deployabile separatamente e punta al proprio backend/API tramite `VITE_BACKEND_URL`.
