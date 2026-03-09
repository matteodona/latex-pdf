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
  tipoDiCavo: string
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

export type TemplateId = 'relazione-tecnico-specialistica-domestico-tt-cpi'

export type TemplateDefinition = {
  id: TemplateId
  name: string
  description: string
  tag: string
}

