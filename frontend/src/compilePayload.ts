import type { RelazioneTecnicaParams, Revisione } from './types'
import { tipiDiCavoBloccoLatex } from './tipiCavoConfig'

const CODICE_PROGETTO_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

/** Codice alfanumerico di 8 caratteri se l'utente non indica un codice progetto. */
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

/** Data documento per il pie` di pagina: dd-mm-yyyy (input form tipicamente yyyy-mm-dd). */
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

  // Supporta formati tipici browser/localizzazione:
  // - yyyy-mm-dd
  // - dd/mm/yyyy
  // - dd-mm-yyyy
  if (/^(\d{4})-(\d{2})-(\d{2})$/.test(s)) {
    const tIso = Date.parse(`${s}T12:00:00`)
    return Number.isNaN(tIso) ? Number.NEGATIVE_INFINITY : tIso
  }

  const dmy = /^(\d{2})[/-](\d{2})[/-](\d{4})$/.exec(s)
  if (dmy) {
    const [, dd, mm, yyyy] = dmy
    const tDmy = Date.parse(`${yyyy}-${mm}-${dd}T12:00:00`)
    return Number.isNaN(tDmy) ? Number.NEGATIVE_INFINITY : tDmy
  }

  const t = Date.parse(s)
  return Number.isNaN(t) ? Number.NEGATIVE_INFINITY : t
}

function parseNumeroRevisione(num: string): number {
  const normalized = String(num ?? '').trim().replace(',', '.')
  const n = Number.parseFloat(normalized)
  return Number.isFinite(n) ? n : Number.NEGATIVE_INFINITY
}

/** Numero revisione con data piu` recente (come in tabella revisioni). */
function ultimaRevisionePerData(rows: Pick<Revisione, 'numRevisione' | 'data'>[]): string {
  if (rows.length === 0) {
    return '0'
  }
  let best = rows[0]!
  let bestT = timestampDaDataRevisione(best.data)
  let bestNum = parseNumeroRevisione(best.numRevisione)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]!
    const t = timestampDaDataRevisione(row.data)
    const rowNum = parseNumeroRevisione(row.numRevisione)

    // Priorita`: data piu` recente.
    // Se data uguale o non interpretabile, usa numero revisione maggiore.
    if (
      t > bestT ||
      (t === bestT && rowNum >= bestNum) ||
      (t === Number.NEGATIVE_INFINITY &&
        bestT === Number.NEGATIVE_INFINITY &&
        rowNum >= bestNum)
    ) {
      bestT = t
      bestNum = rowNum
      best = row
    }
  }
  return String(best.numRevisione ?? '0')
}

function tabellaRevisioniPerCompilazione(params: RelazioneTecnicaParams): Revisione[] {
  return params.revisioni.length === 0
    ? [
        {
          numRevisione: '0',
          data: params.dataGenerazioneDocumento,
          descrizioneRevisione: 'Emissione documento',
        },
      ]
    : params.revisioni.map((rev, index) => ({
        numRevisione: index === 0 ? '0' : rev.numRevisione,
        data: index === 0 ? params.dataGenerazioneDocumento : rev.data,
        descrizioneRevisione: rev.descrizioneRevisione,
      }))
}

export function buildRelazioneTecnicaCompileBody(params: RelazioneTecnicaParams): {
  params: Record<string, unknown>
} {
  const tabellaRevisioni = tabellaRevisioniPerCompilazione(params)
  const tensioneAlimentazioneLatex = `${params.tensioneAlimentazione}\\,V`
  const correnteCortoCircuito = params.tensioneAlimentazione === '230' ? '6' : '10'
  const tensioneWallbox = params.tensioneAlimentazione === '230' ? 'F' : '3F'

  return {
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
          dataGenerazioneDocumento: dataDocumentoFooter(params.dataGenerazioneDocumento),
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
}
