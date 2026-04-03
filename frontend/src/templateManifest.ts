import type { DescrizioneProgettoPreset, TemplateDefinition } from './types'

/** Estrae i preset descrizione da template.json (campo descrizioneProgettoPresets.items). */
export function parseDescrizioneProgettoPresets(
  template: TemplateDefinition | null | undefined,
): DescrizioneProgettoPreset[] {
  const block = template?.descrizioneProgettoPresets
  const items = block?.items
  if (!Array.isArray(items)) {
    return []
  }
  return items.filter(
    (p): p is DescrizioneProgettoPreset =>
      Boolean(
        p &&
        typeof p === 'object' &&
        typeof p.id === 'string' &&
        typeof p.label === 'string' &&
        typeof p.text === 'string',
      ),
  )
}
