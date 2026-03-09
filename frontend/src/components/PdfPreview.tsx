import type { CompileState } from '../types'

type PdfPreviewProps = {
  compileState: CompileState
}

export function PdfPreview({ compileState }: PdfPreviewProps) {
  return (
    <>
      <h2>Anteprima PDF</h2>
      <div className="preview-container">
        {compileState.status === 'idle' && (
          <p className="preview-placeholder">
            Compila i parametri e clicca su &quot;Genera PDF&quot; per vedere
            l&apos;anteprima.
          </p>
        )}
        {compileState.status === 'loading' && (
          <p className="preview-placeholder">Generazione PDF in corso...</p>
        )}
        {compileState.status === 'error' && (
          <p className="preview-placeholder">
            Impossibile mostrare l&apos;anteprima a causa di un errore.
          </p>
        )}
        {compileState.status === 'success' && (
          <iframe
            title="Anteprima PDF relazione tecnica"
            src={compileState.pdfUrl}
            className="preview-frame"
          />
        )}
      </div>
    </>
  )
}

