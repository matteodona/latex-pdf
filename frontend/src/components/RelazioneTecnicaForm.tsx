import type { FormEvent } from 'react'
import type { CompileState, RelazioneTecnicaParams } from '../types'

type RelazioneTecnicaFormProps = {
  params: RelazioneTecnicaParams
  compileState: CompileState
  onChange: (field: keyof RelazioneTecnicaParams, value: string) => void
  onRevisionChange: (
    index: number,
    field: 'numRevisione' | 'data' | 'descrizioneRevisione',
    value: string,
  ) => void
  onAddRevision: () => void
  onRemoveRevision: (index: number) => void
  onSubmit: (event: FormEvent) => void
  onDownload: () => void
}

export function RelazioneTecnicaForm({
  params,
  compileState,
  onChange,
  onRevisionChange,
  onAddRevision,
  onRemoveRevision,
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
              value={params.codiceProgetto}
              onChange={(event) =>
                onChange('codiceProgetto', event.target.value)
              }
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
          <legend>Elenco revisioni</legend>
          <p className="field-help">
            La revisione corrente (0) userà sempre la data di generazione
            indicata sopra.
          </p>
          {params.revisioni.map((rev, index) => (
            <div key={index} className="revision-row">
              <label className="field inline-field">
                <span>Revisione</span>
                <input
                  type="text"
                  value={rev.numRevisione}
                  onChange={(event) =>
                    onRevisionChange(
                      index,
                      'numRevisione',
                      event.target.value,
                    )
                  }
                />
              </label>
              <label className="field inline-field">
                <span>Data</span>
                <input
                  type="date"
                  value={rev.data}
                  onChange={(event) =>
                    onRevisionChange(index, 'data', event.target.value)
                  }
                />
              </label>
              <label className="field">
                <span>Descrizione</span>
                <input
                  type="text"
                  value={rev.descrizioneRevisione}
                  onChange={(event) =>
                    onRevisionChange(
                      index,
                      'descrizioneRevisione',
                      event.target.value,
                    )
                  }
                />
              </label>
              {index > 0 && (
                <button
                  type="button"
                  className="secondary small"
                  onClick={() => onRemoveRevision(index)}
                >
                  Rimuovi
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="secondary"
            onClick={onAddRevision}
          >
            Aggiungi revisione
          </button>
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
            <select
              value={params.luogoInstallazione}
              onChange={(event) =>
                onChange(
                  'luogoInstallazione',
                  event.target.value as RelazioneTecnicaParams['luogoInstallazione'],
                )
              }
              required
            >
              <option value="box condominiale">Box condominiale</option>
              <option value="parcheggio condominiale">
                Parcheggio condominiale
              </option>
              <option value="posto auto condominiale">
                Posto auto condominiale
              </option>
            </select>
          </label>
          <label className="field">
            <span>Tensione di alimentazione</span>
            <select
              value={params.tensioneAlimentazione}
              onChange={(event) =>
                onChange(
                  'tensioneAlimentazione',
                  event.target.value as RelazioneTecnicaParams['tensioneAlimentazione'],
                )
              }
              required
            >
              <option value="230">230 V</option>
              <option value="400">400 V</option>
            </select>
          </label>
          <label className="field">
            <span>Potenza Wallbox (kW)</span>
            <input
              type="text"
              value={params.potenzaWallbox}
              onChange={(event) =>
                onChange('potenzaWallbox', event.target.value)
              }
              required
            />
          </label>
          <label className="field">
            <span>Temperatura ambiente (°C)</span>
            <input
              type="number"
              value={params.temperaturaAmbiente}
              onChange={(event) =>
                onChange('temperaturaAmbiente', event.target.value)
              }
              required
            />
          </label>
          <label className="field">
            <span>Temperatura terreno (°C)</span>
            <input
              type="number"
              value={params.temperaturaTerreno}
              onChange={(event) =>
                onChange('temperaturaTerreno', event.target.value)
              }
              required
            />
          </label>
        </fieldset>

        <fieldset className="field-group">
          <legend>Descrizione progetto</legend>
          <label className="field">
            <span>Descrizione</span>
            <textarea
              value={params.descrizioneProgetto}
              onChange={(event) =>
                onChange('descrizioneProgetto', event.target.value)
              }
              rows={4}
              required
            />
          </label>
          <label className="field">
            <span>Alimentazione sgancio</span>
            <input
              type="text"
              value={params.alimentazioneSgancio}
              onChange={(event) =>
                onChange('alimentazioneSgancio', event.target.value)
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

