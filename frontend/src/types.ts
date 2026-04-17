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
  documentVersion?: string
  compileRequest?: CompileRequestNode
  userParameters?: UserParametersBlock
  derivedAtCompile?: {
    description?: string
    items?: DerivedItem[]
  }
  descrizioneProgettoPresets?: {
    description?: string
    items?: DescrizioneProgettoPreset[]
  }
}

export type UserFieldOption = {
  id: string
  label: string
  documentText?: string
}

export type UserParameterField = {
  key: string
  label: string
  valueType: 'string' | 'date' | 'enum' | 'multiCheckbox'
  required?: boolean
  multiline?: boolean
  note?: string
  allowedValues?: string[]
  options?: UserFieldOption[]
  presetsManifestKey?: string
  compileTo?: {
    placeholder?: string
    transform?: string
    order?: string[]
  }
}

export type UserParameterArrayGroup = {
  id: string
  label: string
  valueType: 'array'
  note?: string
  itemShape?: Record<string, string>
}

export type UserParameterFieldsGroup = {
  id: string
  label: string
  fields: UserParameterField[]
}

export type UserParameterGroup = UserParameterFieldsGroup | UserParameterArrayGroup

export type UserParametersBlock = {
  description?: string
  groups?: UserParameterGroup[]
}

export type CompileRequestLeaf = {
  texFile?: string
  keys?: string[]
}

export type CompileRequestNode = {
  description?: string
  sections?: Record<string, CompileRequestNode | CompileRequestLeaf>
  [key: string]: unknown
}

export type DerivedItem = {
  key: string
  from?: string
  where?: string
}

export type DynamicFormValues = Record<string, unknown>
