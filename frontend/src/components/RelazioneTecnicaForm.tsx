import type { FormEvent } from 'react'
import type { CompileState, RelazioneTecnicaParams } from '../types'

type RelazioneTecnicaFormProps = {
  params: RelazioneTecnicaParams
  compileState: CompileState
  onChange: (field: keyof RelazioneTecnicaParams, value: string) => void
  onSubmit: (event: FormEvent) => void
  onDownload: () => void
}

export function RelazioneTecnicaForm({
  params,
  compileState,
  onChange,
  onSubmit,
  onDownload,
}: RelazioneTecnicaFormProps) {
  return (
    <>
      <h2>Parametri</h2>
      <form className="params-form" onSubmit={onSubmit}>
        <fieldset className="field-group">
          <legend>Dati committente</legend>
          <label className="field">
            <span>Nome</span>
            <input
              type="text"
              value={params.nomeCommittente}
              onChange={(event) => onChange('nomeCommittente', event.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Cognome</span>
            <input
              type="text"
              value={params.cognomeCommittente}
              onChange={(event) => onChange('cognomeCommittente', event.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Indirizzo</span>
            <input
              type="text"
              value={params.indirizzoCommittente}
              onChange={(event) =>
                onChange('indirizzoCommittente', event.target.value)
              }
              required
            />
          </label>
        </fieldset>

        <fieldset className="field-group">
          <legend>Dati documento</legend>
          <label className="field">
            <span>Codice progetto</span>
            <input
              type="text"
              value={params.codProgetto}
              onChange={(event) => onChange('codProgetto', event.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Data generazione</span>
            <input
              type="date"
              value={params.dataGenerazioneDocumento}
              onChange={(event) =>
                onChange('dataGenerazioneDocumento', event.target.value)
              }
              required
            />
          </label>
        </fieldset>

        <fieldset className="field-group">
          <legend>Dettagli tecnici</legend>
          <label className="field">
            <span>Tipo di cavo</span>
            <input
              type="text"
              value={params.tipoDiCavo}
              onChange={(event) => onChange('tipoDiCavo', event.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Luogo installazione</span>
            <input
              type="text"
              value={params.luogoInstallazione}
              onChange={(event) =>
                onChange('luogoInstallazione', event.target.value)
              }
              required
            />
          </label>
        </fieldset>

        <div className="actions">
          <button type="submit" disabled={compileState.status === 'loading'}>
            {compileState.status === 'loading'
              ? 'Generazione in corso...'
              : 'Genera PDF'}
          </button>
          {compileState.status === 'success' && (
            <button
              type="button"
              className="secondary"
              onClick={onDownload}
            >
              Scarica PDF
            </button>
          )}
        </div>

        {compileState.status === 'error' && (
          <p className="error-message">{compileState.message}</p>
        )}
      </form>
    </>
  )
}

