import './App.css'

import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import type {
  CompileState,
  RelazioneTecnicaParams,
  TemplateDefinition,
} from './types'
import { TemplateList } from './components/TemplateList'
import { RelazioneTecnicaForm } from './components/RelazioneTecnicaForm'
import { PdfPreview } from './components/PdfPreview'
import { useAuth } from './auth/AuthContext'

const TEMPLATES: TemplateDefinition[] = [
  {
    id: 'relazione-tecnico-specialistica-domestico-tt-cpi',
    name: 'Relazione tecnico specialistica DOMESTICO TT CPI',
    description:
      'Genera una relazione tecnica completa a partire da pochi parametri essenziali.',
    tag: 'Impianti elettrici',
  },
]

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001'

async function compileRelazioneTecnica(
  params: RelazioneTecnicaParams,
  authHeader: string | null,
): Promise<Blob> {
  const tabellaRevisioni =
    params.revisioni.length === 0
      ? [
          {
            numRevisione: '0',
            data: params.dataGenerazioneDocumento,
            descrizioneRevisione: 'Emissione documento',
          },
        ]
      : params.revisioni.map((rev, index) => ({
          numRevisione: index === 0 ? '0' : rev.numRevisione,
          data:
            index === 0 ? params.dataGenerazioneDocumento : rev.data,
          descrizioneRevisione: rev.descrizioneRevisione,
        }))

  const tensioneAlimentazioneLatex = `${params.tensioneAlimentazione}\\,V`
  const correnteCortoCircuito =
    params.tensioneAlimentazione === '230' ? '6' : '10'
  const tensioneWallbox =
    params.tensioneAlimentazione === '230' ? 'F' : '3F'

  const body = {
    projectPath: 'relazione-tecnico-specialistica-domestico-tt-cpi',
    params: {
      sections: {
        fontespizio: {
          nomeCommittente: params.nomeCommittente,
          cognomeCommittente: params.cognomeCommittente,
          indirizzoCommittente: params.indirizzoCommittente,
          tabellaRevisioni,
        },
        footer: {
          codiceProgetto: params.codiceProgetto,
          dataGenerazioneDocumento: params.dataGenerazioneDocumento,
        },
        chapters: {
          '03-criteri': {
            tipoDiCavo: params.tipoDiCavo,
          },
          '04-soluzione': {
            luogoInstallazione: params.luogoInstallazione,
            nomeCommittente: params.nomeCommittente,
            cognomeCommittente: params.cognomeCommittente,
            indirizzoCommittente: params.indirizzoCommittente,
            descrizioneProgetto: params.descrizioneProgetto,
            alimentazioneSgancio: params.alimentazioneSgancio,
            tensioneAlimentazione: tensioneAlimentazioneLatex,
            potenzaWallbox: params.potenzaWallbox,
            temperaturaAmbiente: params.temperaturaAmbiente,
            temperaturaTerreno: params.temperaturaTerreno,
            correnteCortoCircuito,
            tensioneWallbox,
          },
        },
      },
    },
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (authHeader) {
    headers.Authorization = authHeader
  }

  const response = await fetch(`${API_BASE_URL}/api/compile`, {
    method: 'POST',
    headers,
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
  const navigate = useNavigate()
  const { templateId } = useParams<{ templateId?: string }>()
  const { state: authState, logout } = useAuth()

  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateDefinition | null>(
      TEMPLATES.find((t) => t.id === templateId) ?? null,
    )

  const [params, setParams] = useState<RelazioneTecnicaParams>({
    nomeCommittente: '',
    cognomeCommittente: '',
    indirizzoCommittente: '',
    codiceProgetto: '',
    dataGenerazioneDocumento: '',
    tipoDiCavo: '',
    luogoInstallazione: 'box condominiale',
    descrizioneProgetto: '',
    alimentazioneSgancio: '',
    tensioneAlimentazione: '230',
    potenzaWallbox: '',
    temperaturaAmbiente: '',
    temperaturaTerreno: '',
    revisioni: [],
  })

  const [compileState, setCompileState] = useState<CompileState>({
    status: 'idle',
  })

  useEffect(() => {
    const template = TEMPLATES.find((t) => t.id === templateId) ?? null
    setSelectedTemplate(template)
    setCompileState({ status: 'idle' })
  }, [templateId])

  const handleChange = (
    field: keyof RelazioneTecnicaParams,
    value: string,
  ) => {
    setParams((prev) => ({ ...prev, [field]: value }))
  }

  const handleRevisionChange = (
    index: number,
    field: 'numRevisione' | 'data' | 'descrizioneRevisione',
    value: string,
  ) => {
    setParams((prev) => {
      const revisioni = [...prev.revisioni]
      const current = revisioni[index] ?? {
        numRevisione: '',
        data: '',
        descrizioneRevisione: '',
      }
      revisioni[index] = { ...current, [field]: value }
      return { ...prev, revisioni }
    })
  }

  const handleAddRevision = () => {
    setParams((prev) => ({
      ...prev,
      revisioni: [
        ...prev.revisioni,
        { numRevisione: '', data: '', descrizioneRevisione: '' },
      ],
    }))
  }

  const handleRemoveRevision = (index: number) => {
    setParams((prev) => ({
      ...prev,
      revisioni: prev.revisioni.filter((_, i) => i !== index),
    }))
  }

  const handleGeneratePdf = async (event: FormEvent) => {
    event.preventDefault()
    setCompileState({ status: 'loading' })

    try {
      const authHeader =
        authState.status === 'authenticated' ? authState.authHeader : null
      const blob = await compileRelazioneTecnica(params, authHeader)
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
    link.download = 'relazione-tecnico-specialistica-domestico-tt-cpi.pdf'
    link.click()
  }

  const handleSelectTemplate = (template: TemplateDefinition) => {
    navigate(`/${template.id}`)
  }

  const handleChangeTemplate = () => {
    navigate('/')
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
          <button
            type="button"
            className="secondary small"
            onClick={logout}
          >
            Esci ({authState.username})
          </button>
        </>
      ) : undefined
    return (
      <div className="app-root">
        <TemplateList
          templates={TEMPLATES}
          onSelect={handleSelectTemplate}
          headerRight={headerRight}
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
        <div className="app-header-right">
          <span className="app-template-badge">1 template disponibile</span>
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
          <RelazioneTecnicaForm
            params={params}
            compileState={compileState}
            onChange={handleChange}
            onRevisionChange={handleRevisionChange}
            onAddRevision={handleAddRevision}
            onRemoveRevision={handleRemoveRevision}
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
