import type { IdTipoCavo } from './tipiCavoConfig'

export type Revisione = {
  numRevisione: string
  data: string
  descrizioneRevisione: string
}

export type RelazioneTecnicaParams = {
  nomeCommittente: string
  cognomeCommittente: string
  indirizzoCommittente: string
  codiceProgetto: string
  dataGenerazioneDocumento: string
  /** Checkbox: quali tipi di cavo includere nel PDF (nessuno, uno o più). */
  tipiDiCavo: Record<IdTipoCavo, boolean>
  luogoInstallazione: 'box condominiale' | 'parcheggio condominiale' | 'posto auto condominiale'
  descrizioneProgetto: string
  alimentazioneSgancio: string
  tensioneAlimentazione: '230' | '400'
  potenzaWallbox: string
  temperaturaAmbiente: string
  temperaturaTerreno: string
  revisioni: Revisione[]
}

export type CompileState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; pdfUrl: string }
  | { status: 'error'; message: string }

/** Voce modificabile in template.json → descrizioneProgettoPresets.items */
export type DescrizioneProgettoPreset = {
  id: string
  label: string
  text: string
}

/**
 * Campi usati in UI per l’elenco template.
 * GET /api/templates restituisce l’intero `template.json` per progetto (anche `latex`, `userParameters`, `compileRequest`, …).
 */
export type TemplateDefinition = {
  id: string
  name: string
  description: string
  tag: string
  descrizioneProgettoPresets?: {
    description?: string
    items?: DescrizioneProgettoPreset[]
  }
}
