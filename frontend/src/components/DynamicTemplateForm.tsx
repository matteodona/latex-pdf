import type { FormEvent } from 'react'
import type { CompileState, TemplateField, TemplateFormSchema } from '../types'

type DynamicTemplateFormProps = {
  schema: TemplateFormSchema | undefined
  values: Record<string, unknown>
  compileState: CompileState
  onValueChange: (key: string, value: unknown) => void
  onSubmit: (event: FormEvent) => void
  onDownload: () => void
}

function asString(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return ''
}

function renderScalarField(
  field: TemplateField,
  values: Record<string, unknown>,
  onValueChange: (key: string, value: unknown) => void,
) {
  if (field.type === 'array') {
    return null
  }
  const commonProps = {
    required: Boolean(field.required),
  }
  const currentValue = values[field.key]
  if (field.type === 'textarea') {
    const presets = field.presets ?? []
    return (
      <div key={field.key} className="field field-textarea-block">
        <label className="field">
          <span>{field.label}</span>
          <textarea
            {...commonProps}
            rows={4}
            value={asString(currentValue)}
            onChange={(event) => onValueChange(field.key, event.target.value)}
          />
        </label>
        {presets.length > 0 && (
          <div className="textarea-presets" aria-label="Testi suggeriti per la descrizione">
            <span className="textarea-presets-heading">Testi suggeriti</span>
            <ul className="textarea-presets-list">
              {presets.map((preset, idx) => (
                <li key={`${field.key}-preset-${idx}`}>
                  <span className="textarea-presets-item-title">{preset.label}</span>
                  <p className="textarea-presets-snippet">{preset.text}</p>
                  <div className="textarea-presets-actions">
                    <button
                      type="button"
                      className="secondary textarea-presets-button"
                      onClick={() => {
                        void navigator.clipboard?.writeText(preset.text).catch(() => {
                          /* clipboard non disponibile */
                        })
                      }}
                    >
                      Copia
                    </button>
                    <button
                      type="button"
                      className="textarea-presets-button"
                      onClick={() => onValueChange(field.key, preset.text)}
                    >
                      Usa nel campo
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }
  if (field.type === 'select') {
    return (
      <label key={field.key} className="field">
        <span>{field.label}</span>
        <select
          {...commonProps}
          value={asString(currentValue)}
          onChange={(event) => onValueChange(field.key, event.target.value)}
        >
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    )
  }
  if (field.type === 'boolean') {
    return (
      <label key={field.key} className="field">
        <span>{field.label}</span>
        <select
          value={String(Boolean(currentValue))}
          onChange={(event) =>
            onValueChange(field.key, event.target.value === 'true')
          }
        >
          <option value="true">Si</option>
          <option value="false">No</option>
        </select>
      </label>
    )
  }
  if (field.type === 'checkboxes') {
    const options = field.options ?? []
    const selected = new Set(
      Array.isArray(currentValue)
        ? (currentValue as unknown[]).filter((x): x is string => typeof x === 'string')
        : [],
    )
    const toggle = (option: string, checked: boolean) => {
      const next = new Set(selected)
      if (checked) next.add(option)
      else next.delete(option)
      onValueChange(field.key, Array.from(next))
    }
    return (
      <div key={field.key} className="field field-checkboxes">
        <span className="field-checkboxes-label">{field.label}</span>
        <div className="field-checkboxes-list" role="group" aria-label={field.label}>
          {options.map((option) => (
            <label key={option} className="field-checkbox-row">
              <input
                type="checkbox"
                checked={selected.has(option)}
                onChange={(event) => toggle(option, event.target.checked)}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </div>
    )
  }
  return (
    <label key={field.key} className="field">
      <span>{field.label}</span>
      <input
        {...commonProps}
        type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
        value={asString(currentValue)}
        onChange={(event) => onValueChange(field.key, event.target.value)}
      />
    </label>
  )
}

export function DynamicTemplateForm({
  schema,
  values,
  compileState,
  onValueChange,
  onSubmit,
  onDownload,
}: DynamicTemplateFormProps) {
  const fields = schema?.fields ?? []
  const groups = Array.from(
    fields.reduce((map, field) => {
      const group = field.group ?? 'Parametri'
      const current = map.get(group) ?? []
      current.push(field)
      map.set(group, current)
      return map
    }, new Map<string, TemplateField[]>()),
  )

  return (
    <>
      <h2>{schema?.title ?? 'Parametri'}</h2>
      <form className="params-form" onSubmit={onSubmit}>
        {groups.map(([groupName, groupFields]) => (
          <fieldset key={groupName} className="field-group">
            <legend>{groupName}</legend>
            {groupFields.map((field) => {
              if (field.type !== 'array') {
                return renderScalarField(field, values, onValueChange)
              }

              const rows: Record<string, unknown>[] = Array.isArray(values[field.key])
                ? (values[field.key] as Record<string, unknown>[])
                : []
              const itemFields = field.item?.fields ?? []
              return (
                <div key={field.key}>
                  <p className="field-help">{field.label}</p>
                  {rows.map((row, rowIndex) => {
                    const rowValues =
                      row && typeof row === 'object'
                        ? (row as Record<string, unknown>)
                        : {}
                    return (
                      <div key={`${field.key}-${rowIndex}`} className="revision-row">
                        {itemFields.map((itemField) => (
                          <label key={itemField.key} className="field inline-field">
                            <span>{itemField.label}</span>
                            <input
                              type={itemField.type === 'date' ? 'date' : 'text'}
                              value={asString(rowValues[itemField.key])}
                              onChange={(event) => {
                                const next = [...rows]
                                const nextRow = {
                                  ...rowValues,
                                  [itemField.key]: event.target.value,
                                }
                                next[rowIndex] = nextRow
                                onValueChange(field.key, next)
                              }}
                            />
                          </label>
                        ))}
                        {rowIndex > 0 && (
                          <button
                            type="button"
                            className="secondary small"
                            onClick={() => {
                              const next = rows.filter((_, idx) => idx !== rowIndex)
                              onValueChange(field.key, next)
                            }}
                          >
                            Rimuovi
                          </button>
                        )}
                      </div>
                    )
                  })}
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      const firstDefaults = Object.fromEntries(
                        itemFields.map((f) => [f.key, typeof f.default === 'string' ? f.default : '']),
                      )
                      onValueChange(field.key, [...rows, firstDefaults])
                    }}
                  >
                    Aggiungi riga
                  </button>
                </div>
              )
            })}
          </fieldset>
        ))}

        <div className="actions">
          <button type="submit" disabled={compileState.status === 'loading'}>
            {compileState.status === 'loading'
              ? 'Generazione in corso...'
              : 'Genera PDF'}
          </button>
          {compileState.status === 'success' && (
            <button type="button" className="secondary" onClick={onDownload}>
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
