/** Identificativi interni per le checkbox «Tipi di cavo». */
export type IdTipoCavo = 'fg16om16' | 'fg16or16' | 'fs17' | 'lan'

/** Ordine fisso degli elenchi puntati nel PDF. */
export const TIPI_CAVO_ORDINE: IdTipoCavo[] = [
  'fg16om16',
  'fg16or16',
  'fs17',
  'lan',
]

export type VoceTipoCavo = {
  id: IdTipoCavo
  /** Testo mostrato accanto alla checkbox nel form. */
  etichetta: string
  /** Testo in elenco puntato nel PDF (può differire dall’etichetta). */
  testoDocumento: string
  /** Descrizione estesa mostrata nel PDF accanto al tipo cavo. */
  descrizioneDocumento: string
}

export const VOCI_TIPI_CAVO: VoceTipoCavo[] = [
  {
    id: 'fg16om16',
    etichetta: 'FG 16 (O) M 16',
    testoDocumento: 'FG 16 (O) M 16',
    descrizioneDocumento:
      'Cavo per energia a bassa tensione con isolamento e guaina idonei alla posa fissa in ambienti ordinari e in esterno, conforme ai requisiti CPR previsti dal progetto.',
  },
  {
    id: 'fg16or16',
    etichetta: 'FG 16 (O) R 16',
    testoDocumento: 'G 16 (O) R 16',
    descrizioneDocumento:
      'Cavo per energia a bassa tensione per posa fissa con caratteristiche costruttive adatte alla distribuzione dell\'impianto, nel rispetto delle prescrizioni CEI/UNEL richiamate nella relazione.',
  },
  {
    id: 'fs17',
    etichetta: 'FS 17',
    testoDocumento: 'S 17',
    descrizioneDocumento:
      'Conduttore unipolare 450/750 V per cablaggi e distribuzione in tubazioni/canalizzazioni, utilizzato secondo i criteri di dimensionamento e protezione indicati nel documento.',
  },
  {
    id: 'lan',
    etichetta: 'LAN',
    testoDocumento: 'LAN',
    descrizioneDocumento:
      'Cavo dati categoria 0 per comunicazione/controllo, posato in coesistenza con cavi di potenza solo nel rispetto delle condizioni CEI-UNEL 36762 riportate nel capitolo.',
  },
]

const MAPPA_VOCE: Record<IdTipoCavo, VoceTipoCavo> = Object.fromEntries(
  VOCI_TIPI_CAVO.map((v) => [v.id, v]),
) as Record<IdTipoCavo, VoceTipoCavo>

export function defaultTipiCavoSelezionati(): Record<IdTipoCavo, boolean> {
  return {
    fg16om16: false,
    fg16or16: false,
    fs17: false,
    lan: false,
  }
}

/** Frammento LaTeX per `\\{tipiDiCavoBlocco\\}` in 03-criteri. */
export function tipiDiCavoBloccoLatex(
  selezionati: Record<IdTipoCavo, boolean>,
): string {
  const ids = TIPI_CAVO_ORDINE.filter((id) => selezionati[id])
  if (ids.length === 0) {
    return 'Nessun tipo di cavo è stato selezionato nel modulo di generazione.'
  }
  const items = ids
    .map((id) => {
      const voce = MAPPA_VOCE[id]
      return `    \\item ${voce.testoDocumento}: ${voce.descrizioneDocumento}`
    })
    .join('\n')
  return `\\begin{itemize}\n${items}\n\\end{itemize}`
}
