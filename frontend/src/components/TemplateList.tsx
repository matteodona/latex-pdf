import type { ReactNode } from 'react'
import type { TemplateDefinition } from '../types'

type TemplateListProps = {
  templates: TemplateDefinition[]
  onSelect: (template: TemplateDefinition) => void
  headerRight?: ReactNode
}

export function TemplateList({ templates, onSelect, headerRight }: TemplateListProps) {
  return (
    <div>
      <header className="app-header">
        <div>
          <h1 className="app-title">Generatore di template per documenti tecnici</h1>
        </div>
        {headerRight && <div className="app-header-right">{headerRight}</div>}
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

