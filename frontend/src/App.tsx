import './App.css'

import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import type { CompileState, TemplateDefinition } from './types'
import { TemplateList } from './components/TemplateList'
import { DynamicTemplateForm } from './components/DynamicTemplateForm'
import { PdfPreview } from './components/PdfPreview'
import { useAuth } from './auth/AuthContext'
import {
  compileTemplate,
  getTemplateSchema,
  listTemplates,
} from './api/templatesApi'

type TemplatesLoadState = 'idle' | 'loading' | 'loaded' | 'error'

function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}

function resolveDefaultValue(value: unknown): unknown {
  if (value === '__TODAY__') {
    return todayString()
  }
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (item && typeof item === 'object') {
        return Object.fromEntries(
          Object.entries(item as Record<string, unknown>).map(([key, val]) => [
            key,
            resolveDefaultValue(val),
          ]),
        )
      }
      return item
    })
  }
  return value
}

function defaultParamsFromTemplate(template: TemplateDefinition | null) {
  const fields = template?.form_schema?.fields ?? []
  const out: Record<string, unknown> = {}
  for (const field of fields) {
    const key = field.key
    if (!key) continue
    if (field.default !== undefined) {
      out[key] = resolveDefaultValue(field.default)
      continue
    }
    if (field.type === 'array') {
      out[key] = []
      continue
    }
    if (field.type === 'checkboxes') {
      out[key] = Array.isArray(field.default) ? [...field.default] : []
      continue
    }
    if (field.type === 'boolean') {
      out[key] = false
      continue
    }
    out[key] = ''
  }
  if (typeof out.dataGenerazioneDocumento !== 'string') {
    out.dataGenerazioneDocumento = todayString()
  }
  if (typeof out.dataDocumento !== 'string') {
    out.dataDocumento = todayString()
  }
  if (!Array.isArray(out.revisioni)) {
    out.revisioni = [
      {
        numRevisione: '0',
        data: todayString(),
        descrizioneRevisione: 'Emissione documento',
      },
    ]
  }
  return out
}

function syncRevisionsWithDocumentDate(params: Record<string, unknown>) {
  const date =
    typeof params.dataGenerazioneDocumento === 'string'
      ? params.dataGenerazioneDocumento
      : todayString()
  const revisioni = Array.isArray(params.revisioni) ? params.revisioni : []
  if (revisioni.length === 0) {
    return [
      {
        numRevisione: '0',
        data: date,
        descrizioneRevisione: 'Emissione documento',
      },
    ]
  }
  return revisioni.map((row, index) => {
    const current =
      row && typeof row === 'object' ? (row as Record<string, unknown>) : {}
    return {
      ...current,
      numRevisione: index === 0 ? '0' : String(current.numRevisione ?? ''),
      data: index === 0 ? date : String(current.data ?? ''),
      descrizioneRevisione: String(current.descrizioneRevisione ?? ''),
    }
  })
}

async function compileTemplatePdf(
  params: Record<string, unknown>,
  authHeader: string | null,
  templateSlug: string,
): Promise<Blob> {
  const body = {
    ...params,
    revisioni: syncRevisionsWithDocumentDate(params),
  }
  return compileTemplate(templateSlug, body, authHeader)
}

function App() {
  const navigate = useNavigate()
  const { templateId } = useParams<{ templateId?: string }>()
  const { state: authState, logout } = useAuth()

  const [templates, setTemplates] = useState<TemplateDefinition[]>([])
  const [templatesState, setTemplatesState] =
    useState<TemplatesLoadState>('idle')
  const [templatesError, setTemplatesError] = useState<string | null>(null)
  const [params, setParams] = useState<Record<string, unknown>>({})
  const [compileState, setCompileState] = useState<CompileState>({
    status: 'idle',
  })

  const selectedTemplate = templates.find((t) => t.id === templateId) ?? null

  useEffect(() => {
    let cancelled = false
    setTemplatesState('loading')
    setTemplatesError(null)
    listTemplates()
      .then((list) => {
        if (!cancelled) {
          setTemplates(list)
          setTemplatesState('loaded')
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setTemplatesError(
            e instanceof Error ? e.message : 'Errore di connessione',
          )
          setTemplatesState('error')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (templatesState !== 'loaded' || !templateId) return
    if (!templates.some((t) => t.id === templateId)) {
      navigate('/', { replace: true })
    }
  }, [templatesState, templateId, templates, navigate])

  useEffect(() => {
    if (!selectedTemplate) return
    let cancelled = false
    setCompileState({ status: 'idle' })
    getTemplateSchema(selectedTemplate.id)
      .then((fullTemplate) => {
        if (cancelled) return
        setTemplates((prev) =>
          prev.map((item) => (item.id === fullTemplate.id ? fullTemplate : item)),
        )
        setParams(defaultParamsFromTemplate(fullTemplate))
      })
      .catch(() => {
        if (!cancelled) {
          setParams(defaultParamsFromTemplate(selectedTemplate))
        }
      })
    return () => {
      cancelled = true
    }
  }, [selectedTemplate?.id])

  const handleValueChange = (key: string, value: unknown) => {
    setParams((prev) => ({ ...prev, [key]: value }))
  }

  const handleGeneratePdf = async (event: FormEvent) => {
    event.preventDefault()
    setCompileState({ status: 'loading' })
    try {
      const authHeader =
        authState.status === 'authenticated' ? authState.authHeader : null
      const slug = selectedTemplate?.id
      if (!slug) {
        throw new Error('Nessun template selezionato.')
      }
      const blob = await compileTemplatePdf(params, authHeader, slug)
      const url = URL.createObjectURL(blob)
      setCompileState({ status: 'success', pdfUrl: url })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Si e verificato un errore imprevisto.'
      setCompileState({ status: 'error', message })
    }
  }

  const handleDownload = () => {
    if (compileState.status !== 'success' || !selectedTemplate) return
    const link = document.createElement('a')
    link.href = compileState.pdfUrl
    link.download = `${selectedTemplate.id}.pdf`
    link.click()
  }

  const handleSelectTemplate = (template: TemplateDefinition) => {
    navigate(`/${template.id}`)
  }

  if (templatesState === 'loading') {
    return (
      <div className="app-root">
        <p className="preview-placeholder">Caricamento template...</p>
      </div>
    )
  }

  if (templatesState === 'error') {
    return (
      <div className="app-root">
        <p className="error-message">{templatesError}</p>
      </div>
    )
  }

  if (!selectedTemplate) {
    const headerRight =
      authState.status === 'authenticated' ? (
        <>
          {authState.role === 'superuser' && (
            <Link to="/admin" className="secondary small link-button">
              Admin
            </Link>
          )}
          <button type="button" className="secondary small" onClick={logout}>
            Esci ({authState.username})
          </button>
        </>
      ) : undefined
    return (
      <div className="app-root">
        <TemplateList
          templates={templates}
          onSelect={handleSelectTemplate}
          headerRight={headerRight}
          greetingUsername={
            authState.status === 'authenticated' ? authState.username : null
          }
        />
      </div>
    )
  }

  return (
    <div className="app-root">
      <header className="app-header">
        <div>
          <button
            type="button"
            className="back-button"
            onClick={() => navigate('/')}
          >
            <span className="back-icon">←</span>
            <span>Tutti i template</span>
          </button>
          <h1 className="app-title">{selectedTemplate.name}</h1>
          <p className="app-subtitle">
            Compila i parametri e genera il PDF della {selectedTemplate.name}.
          </p>
          {authState.status === 'authenticated' && (
            <p className="app-greeting-banner">
              Ciao <span className="app-greeting-name">{authState.username}</span>
            </p>
          )}
        </div>
        <div className="app-header-right">
          <span className="app-template-badge">
            {templates.length === 1
              ? '1 template disponibile'
              : `${templates.length} template disponibili`}
          </span>
          {authState.status === 'authenticated' && (
            <>
              {authState.role === 'superuser' && (
                <Link to="/admin" className="secondary small link-button">
                  Admin
                </Link>
              )}
              <button
                type="button"
                className="secondary small"
                onClick={logout}
              >
                Esci ({authState.username})
              </button>
            </>
          )}
        </div>
      </header>

      <main className="app-main">
        <section className="pane pane-left">
          <DynamicTemplateForm
            schema={selectedTemplate.form_schema}
            values={params}
            compileState={compileState}
            onValueChange={handleValueChange}
            onSubmit={handleGeneratePdf}
            onDownload={handleDownload}
          />
        </section>
        <section className="pane pane-right">
          <PdfPreview compileState={compileState} />
        </section>
      </main>
    </div>
  )
}

export default App
