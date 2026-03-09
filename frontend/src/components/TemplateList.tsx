import type { TemplateDefinition } from '../types'

type TemplateListProps = {
  templates: TemplateDefinition[]
  onSelect: (template: TemplateDefinition) => void
}

export function TemplateList({ templates, onSelect }: TemplateListProps) {
  return (
    <div>
      <header className="app-header">
        <div>
          <h1>Genera documento</h1>
          <p className="app-subtitle">
            Scegli un template, inserisci i parametri e scarica il PDF pronto
            all&apos;uso.
          </p>
        </div>
      </header>

      <main>
        <h2 className="templates-title">Template disponibili</h2>
        <div className="templates-grid">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              className="template-card"
              onClick={() => onSelect(template)}
            >
              <div className="template-card-header">
                <h3>{template.name}</h3>
                <span className="template-tag">{template.tag}</span>
              </div>
              <p className="template-description">{template.description}</p>
              <span className="template-cta">Usa questo template</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}

