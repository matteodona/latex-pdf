export type RelazioneTecnicaParams = {
  nomeCommittente: string
  cognomeCommittente: string
  indirizzoCommittente: string
  codProgetto: string
  dataGenerazioneDocumento: string
  tipoDiCavo: string
  luogoInstallazione: string
}

export type CompileState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; pdfUrl: string }
  | { status: 'error'; message: string }

export type TemplateId = 'relazione-tecnica'

export type TemplateDefinition = {
  id: TemplateId
  name: string
  description: string
  tag: string
}

