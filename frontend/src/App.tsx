import './App.css'

import { useState } from 'react'
import type { FormEvent } from 'react'

import type {
  CompileState,
  RelazioneTecnicaParams,
  TemplateDefinition,
} from './types'
import { TemplateList } from './components/TemplateList'
import { RelazioneTecnicaForm } from './components/RelazioneTecnicaForm'
import { PdfPreview } from './components/PdfPreview'

const TEMPLATES: TemplateDefinition[] = [
  {
    id: 'relazione-tecnica',
    name: 'Relazione tecnica',
    description:
      'Genera una relazione tecnica completa a partire da pochi parametri essenziali.',
    tag: 'Impianti elettrici',
  },
]

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001'

async function compileRelazioneTecnica(
  params: RelazioneTecnicaParams,
): Promise<Blob> {
  const body = {
    projectPath: 'relazione-tecnica',
    params: {
      sections: {
        fontespizio: {
          nomeCommittente: params.nomeCommittente,
          cognomeCommittente: params.cognomeCommittente,
          indirizzoCommittente: params.indirizzoCommittente,
        },
        footer: {
          codProgetto: params.codProgetto,
          dataGenerazioneDocumento: params.dataGenerazioneDocumento,
        },
        chapters: {
          '03-criteri': {
            tipoDiCavo: params.tipoDiCavo,
          },
          '04-soluzione': {
            luogoInstallazione: params.luogoInstallazione,
          },
        },
      },
    },
  }

  const response = await fetch(`${API_BASE_URL}/api/compile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    let message = 'Errore durante la compilazione del PDF.'
    try {
      const data = (await response.json()) as { error?: string }
      if (data?.error) {
        message = data.error
      }
    } catch {
      // se non è JSON, manteniamo il messaggio generico
    }
    throw new Error(message)
  }

  return response.blob()
}

function App() {
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateDefinition | null>(null)

  const [params, setParams] = useState<RelazioneTecnicaParams>({
    nomeCommittente: '',
    cognomeCommittente: '',
    indirizzoCommittente: '',
    codProgetto: '',
    dataGenerazioneDocumento: '',
    tipoDiCavo: '',
    luogoInstallazione: '',
  })

  const [compileState, setCompileState] = useState<CompileState>({
    status: 'idle',
  })

  const handleChange = (
    field: keyof RelazioneTecnicaParams,
    value: string,
  ) => {
    setParams((prev) => ({ ...prev, [field]: value }))
  }

  const handleGeneratePdf = async (event: FormEvent) => {
    event.preventDefault()
    setCompileState({ status: 'loading' })

    try {
      const blob = await compileRelazioneTecnica(params)
      const url = URL.createObjectURL(blob)
      setCompileState({ status: 'success', pdfUrl: url })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Si è verificato un errore imprevisto.'
      setCompileState({ status: 'error', message })
    }
  }

  const handleDownload = () => {
    if (compileState.status !== 'success') return
    const link = document.createElement('a')
    link.href = compileState.pdfUrl
    link.download = 'relazione-tecnica.pdf'
    link.click()
  }

  const handleSelectTemplate = (template: TemplateDefinition) => {
    setSelectedTemplate(template)
    setCompileState({ status: 'idle' })
  }

  const handleChangeTemplate = () => {
    setSelectedTemplate(null)
    setCompileState({ status: 'idle' })
  }

  if (!selectedTemplate) {
    return (
      <div className="app-root">
        <TemplateList templates={TEMPLATES} onSelect={handleSelectTemplate} />
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
            onClick={handleChangeTemplate}
          >
            <span className="back-icon">←</span>
            <span>Tutti i template</span>
          </button>
          <h1 className="app-title">{selectedTemplate.name}</h1>
          <p className="app-subtitle">
            Compila i parametri e genera il PDF della {selectedTemplate.name}.
          </p>
        </div>
        <span className="app-template-badge">1 template disponibile</span>
      </header>

      <main className="app-main">
        <section className="pane pane-left">
          <RelazioneTecnicaForm
            params={params}
            compileState={compileState}
            onChange={handleChange}
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
