import type { FormEvent } from 'react'
import type {
  CompileState,
  DescrizioneProgettoPreset,
  RelazioneTecnicaParams,
} from '../types'
import type { IdTipoCavo } from '../tipiCavoConfig'
import { VOCI_TIPI_CAVO } from '../tipiCavoConfig'

type RelazioneTecnicaFormProps = {
  params: RelazioneTecnicaParams
  compileState: CompileState
  descrizioneProgettoPresets: DescrizioneProgettoPreset[]
  onChange: (field: keyof RelazioneTecnicaParams, value: string) => void
  onTipiDiCavoChange: (id: IdTipoCavo, checked: boolean) => void
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
  descrizioneProgettoPresets,
  onChange,
  onTipiDiCavoChange,
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
              placeholder="Lasciare vuoto per codice automatico (8 caratteri)"
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
          <div className="field">
            <span>Tipi di cavo</span>
            <p className="field-help">
              Opzionale: seleziona uno o più tipi. Nel PDF compariranno come elenco
              puntato, nell’ordine indicato sotto. Se non selezioni nulla, nel documento
              comparirà una nota esplicita.
            </p>
            <div className="checkbox-stack" role="group" aria-label="Tipi di cavo">
              {VOCI_TIPI_CAVO.map((voce) => (
                <label key={voce.id} className="field checkbox-field">
                  <input
                    type="checkbox"
                    checked={params.tipiDiCavo[voce.id]}
                    onChange={(event) =>
                      onTipiDiCavoChange(voce.id, event.target.checked)
                    }
                  />
                  <span>{voce.etichetta}</span>
                </label>
              ))}
            </div>
          </div>
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
            {descrizioneProgettoPresets.length > 0 && (
              <div className="description-presets">
                <div className="description-presets-buttons">
                  {descrizioneProgettoPresets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className="secondary small"
                      onClick={() =>
                        onChange('descrizioneProgetto', preset.text)
                      }
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <textarea
              value={params.descrizioneProgetto}
              onChange={(event) =>
                onChange('descrizioneProgetto', event.target.value)
              }
              rows={6}
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

