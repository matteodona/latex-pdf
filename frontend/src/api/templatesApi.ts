import type { TemplateDefinition } from '../types'

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001'

export async function listTemplates(): Promise<TemplateDefinition[]> {
  const response = await fetch(`${API_BASE_URL}/api/templates`)
  if (!response.ok) {
    throw new Error('Impossibile caricare l’elenco dei template.')
  }
  const data = (await response.json()) as { templates?: TemplateDefinition[] }
  return data.templates ?? []
}

export async function getTemplateSchema(
  templateId: string,
): Promise<TemplateDefinition> {
  const response = await fetch(
    `${API_BASE_URL}/api/templates/${encodeURIComponent(templateId)}`,
  )
  if (!response.ok) {
    throw new Error('Impossibile caricare i dettagli del template.')
  }
  const data = (await response.json()) as { template?: TemplateDefinition }
  if (!data.template) {
    throw new Error('Template non trovato.')
  }
  return data.template
}

export async function compileTemplate(
  templateId: string,
  params: Record<string, unknown>,
  authHeader: string | null,
): Promise<Blob> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (authHeader) {
    headers.Authorization = authHeader
  }

  const response = await fetch(
    `${API_BASE_URL}/api/templates/${encodeURIComponent(templateId)}/compile`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ params }),
    },
  )

  if (!response.ok) {
    let message = 'Errore durante la compilazione del PDF.'
    try {
      const data = (await response.json()) as {
        error?: string
        fields?: Record<string, string>
      }
      if (data?.fields && Object.keys(data.fields).length > 0) {
        const firstEntry = Object.entries(data.fields)[0]
        if (firstEntry) {
          message = `${firstEntry[0]}: ${firstEntry[1]}`
        }
      } else if (data?.error) {
        message = data.error
      }
    } catch {
      // keep generic message
    }
    throw new Error(message)
  }

  return response.blob()
}
