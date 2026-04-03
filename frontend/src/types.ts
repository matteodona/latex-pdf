export type CompileState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; pdfUrl: string }
  | { status: 'error'; message: string }

export type TemplateFieldType =
  | 'text'
  | 'textarea'
  | 'date'
  | 'select'
  | 'number'
  | 'boolean'
  | 'checkboxes'
  | 'array'

export type TextareaPreset = {
  label: string
  text: string
}

export type TemplateScalarField = {
  key: string
  label: string
  type: Exclude<TemplateFieldType, 'array'>
  required?: boolean
  default?: string | number | boolean | string[]
  options?: string[]
  /** Solo per type textarea: testi pronti (es. da copiare o inserire nel campo). */
  presets?: TextareaPreset[]
  group?: string
}

export type TemplateArrayField = {
  key: string
  label: string
  type: 'array'
  required?: boolean
  default?: Array<Record<string, string | number | boolean>>
  group?: string
  item?: {
    fields?: TemplateScalarField[]
  }
}

export type TemplateField = TemplateScalarField | TemplateArrayField

export type TemplateFormSchema = {
  title?: string
  fields?: TemplateField[]
}

export type TemplateDefinitionBase = {
  id: string
  name: string
  description: string
  tag: string
}

export type TemplateDefinition = {
  app_key?: string
  manifest_version?: string
  compile_contract?: {
    input?: string
    output_filename?: string
  }
  capabilities?: Record<string, unknown>
  form_schema?: TemplateFormSchema
} & TemplateDefinitionBase
