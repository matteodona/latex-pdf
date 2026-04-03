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
import type { IdTipoCavo } from './tipiCavoConfig'
import {
  defaultTipiCavoSelezionati,
  tipiDiCavoBloccoLatex,
} from './tipiCavoConfig'
import { useAuth } from './auth/AuthContext'
import { parseDescrizioneProgettoPresets } from './templateManifest'

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001'

type TemplatesLoadState = 'idle' | 'loading' | 'loaded' | 'error'

async function fetchTemplates(): Promise<TemplateDefinition[]> {
  const response = await fetch(`${API_BASE_URL}/api/templates`)
  if (!response.ok) {
    throw new Error('Impossibile caricare l’elenco dei template.')
  }
  const data = (await response.json()) as { templates?: TemplateDefinition[] }
  return data.templates ?? []
}

/** Valori iniziali del form (data revisione 0 allineata alla data documento). */
function defaultRelazioneParams(): RelazioneTecnicaParams {
  const today = new Date().toISOString().slice(0, 10)
  return {
    nomeCommittente: 'Mario',
    cognomeCommittente: 'Rossi',
    indirizzoCommittente: 'Via Roma 1, 20100 Milano',
    codiceProgetto: 'PROG-2026-001',
    dataGenerazioneDocumento: today,
    tipiDiCavo: defaultTipiCavoSelezionati(),
    luogoInstallazione: 'box condominiale',
    descrizioneProgetto:
      'Installazione di wallbox per ricarica veicolo elettrico in box condominiale.',
    alimentazioneSgancio: '230 V AC',
    tensioneAlimentazione: '230',
    potenzaWallbox: '7,4',
    temperaturaAmbiente: '30',
    temperaturaTerreno: '20',
    revisioni: [
      {
        numRevisione: '0',
        data: today,
        descrizioneRevisione: 'Emissione documento',
      },
    ],
  }
}

const CODICE_PROGETTO_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

/** Codice alfanumerico di 8 caratteri se l’utente non indica un codice progetto. */
function codiceProgettoPerCompilazione(codiceUtente: string): string {
  if (codiceUtente.trim() !== '') {
    return codiceUtente.trim()
  }
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  let out = ''
  for (let i = 0; i < 8; i++) {
    out += CODICE_PROGETTO_ALPHABET[bytes[i]! % CODICE_PROGETTO_ALPHABET.length]
  }
  return out
}

/** Data documento per il piè di pagina: dd-mm-yyyy (input form tipicamente yyyy-mm-dd). */
function dataDocumentoFooter(isoOrPlain: string): string {
  const s = isoOrPlain.trim()
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (m) {
    return `${m[3]}-${m[2]}-${m[1]}`
  }
  return s
}

function timestampDaDataRevisione(data: string): number {
  const s = data.trim()
  if (!s) {
    return Number.NEGATIVE_INFINITY
  }
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.test(s) ? `${s}T12:00:00` : s
  const t = Date.parse(iso)
  return Number.isNaN(t) ? Number.NEGATIVE_INFINITY : t
}

/** Numero revisione con data più recente (come in tabella revisioni). */
function ultimaRevisionePerData(
  rows: { numRevisione: string; data: string }[],
): string {
  if (rows.length === 0) {
    return '0'
  }
  let best = rows[0]!
  let bestT = timestampDaDataRevisione(best.data)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]!
    const t = timestampDaDataRevisione(row.data)
    if (t >= bestT) {
      bestT = t
      best = row
    }
  }
  return String(best.numRevisione ?? '0')
}

async function postTemplateCompile(
  templateSlug: string,
  body: unknown,
  authHeader: string | null,
): Promise<Blob> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (authHeader) {
    headers.Authorization = authHeader
  }

  const response = await fetch(
    `${API_BASE_URL}/api/templates/${encodeURIComponent(templateSlug)}/compile`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    },
  )

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

async function compileRelazioneTecnica(
  params: RelazioneTecnicaParams,
  authHeader: string | null,
  templateSlug: string,
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
    params: {
      sections: {
        fontespizio: {
          nomeCommittente: params.nomeCommittente,
          cognomeCommittente: params.cognomeCommittente,
          indirizzoCommittente: params.indirizzoCommittente,
          tabellaRevisioni,
        },
        footer: {
          codiceProgetto: codiceProgettoPerCompilazione(params.codiceProgetto),
          dataGenerazioneDocumento: dataDocumentoFooter(
            params.dataGenerazioneDocumento,
          ),
          ultimaRevisione: ultimaRevisionePerData(tabellaRevisioni),
        },
        chapters: {
          '01-premessa': {
            nomeCommittente: params.nomeCommittente,
            cognomeCommittente: params.cognomeCommittente,
            indirizzoCommittente: params.indirizzoCommittente,
          },
          '03-criteri': {
            tipiDiCavoBlocco: tipiDiCavoBloccoLatex(params.tipiDiCavo),
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

  return postTemplateCompile(templateSlug, body, authHeader)
}

function App() {
  const navigate = useNavigate()
  const { templateId } = useParams<{ templateId?: string }>()
  const { state: authState, logout } = useAuth()

  const [templates, setTemplates] = useState<TemplateDefinition[]>([])
  const [templatesState, setTemplatesState] =
    useState<TemplatesLoadState>('idle')
  const [templatesError, setTemplatesError] = useState<string | null>(null)

  const selectedTemplate =
    templates.find((t) => t.id === templateId) ?? null

  const [params, setParams] = useState<RelazioneTecnicaParams>(() =>
    defaultRelazioneParams(),
  )

  const [compileState, setCompileState] = useState<CompileState>({
    status: 'idle',
  })

  useEffect(() => {
    let cancelled = false
    setTemplatesState('loading')
    setTemplatesError(null)
    fetchTemplates()
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
    setCompileState({ status: 'idle' })
    setParams(defaultRelazioneParams())
  }, [templateId, selectedTemplate?.id])

  const handleChange = (
    field: keyof RelazioneTecnicaParams,
    value: string,
  ) => {
    setParams((prev) => ({ ...prev, [field]: value }))
  }

  const handleTipiDiCavoChange = (id: IdTipoCavo, checked: boolean) => {
    setParams((prev) => ({
      ...prev,
      tipiDiCavo: { ...prev.tipiDiCavo, [id]: checked },
    }))
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
      const slug = selectedTemplate?.id
      if (!slug) {
        throw new Error('Nessun template selezionato.')
      }
      const blob = await compileRelazioneTecnica(params, authHeader, slug)
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
    if (compileState.status !== 'success' || !selectedTemplate) return
    const link = document.createElement('a')
    link.href = compileState.pdfUrl
    link.download = `${selectedTemplate.id}.pdf`
    link.click()
  }

  const handleSelectTemplate = (template: TemplateDefinition) => {
    navigate(`/${template.id}`)
  }

  const handleChangeTemplate = () => {
    navigate('/')
  }

  if (templatesState === 'loading') {
    return (
      <div className="app-root">
        <p className="preview-placeholder">Caricamento template…</p>
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
            onClick={handleChangeTemplate}
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
          <RelazioneTecnicaForm
            params={params}
            compileState={compileState}
            descrizioneProgettoPresets={parseDescrizioneProgettoPresets(
              selectedTemplate,
            )}
            onChange={handleChange}
            onTipiDiCavoChange={handleTipiDiCavoChange}
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
