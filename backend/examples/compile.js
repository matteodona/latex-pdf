/**
 * Esempio: compila il progetto "relazione-tecnica" con parametri.
 * Esegui dalla cartella backend: npm run compile
 */
const path = require('path');
const { compileToPdf } = require('../src');

const projectDir = path.join(__dirname, '..', 'projects', 'relazione-tecnica');

const paramsStructure = {
  sections: {
    fontespizio: {
      nomeCommittente: 'Mario',
      cognomeCommittente: 'Rossi',
      indirizzoCommittente: 'Via Roma 1, 00100 Roma',
      tabellaRevisioni: [
        { numRevisione: '0', data: '01/01/2025', descrizioneRevisione: 'Emissione documento' },
        { numRevisione: '1', data: '15/02/2025', descrizioneRevisione: 'Revisione tecnica' },
      ],
    },
    footer: {
      codProgetto: 'PRG-2025-001',
      dataGenerazioneDocumento: '08/03/2025',
    },
    chapters: {
      '03-criteri': {
        tipoDiCavo: 'FG16M16/FG16(O)M16',
      },
      '04-soluzione': {
        luogoInstallazione: 'Box condominiale',
        nomeCommittente: 'Mario',
        cognomeCommittente: 'Rossi',
        indirizzoCommittente: 'Via Roma 1, 00100 Roma',
        descrizioneProgetto: 'Il quadro elettrico per la Wallbox viene realizzato in materiale isolante che garantisca un doppio isolamento (Classe II) e sarà installato nel locale contatori. Al suo interno sarà presente un interruttore automatico magnetotermico differenziale e tale interruttore proteggerà la wallbox monofase (F+N+PE), tale linea sarà collegata in parallelo all\'impianto esistente, in modo da avere una linea ed una protezione dedicata per la Wallbox.',
        tensioneAlimentazione: '230\\,V',
        potenzaWallbox: '7,4',
        temperaturaAmbiente: '30',
        temperaturaTerreno: '25',
        correnteCortoCircuito: '6',
      },
    },
  },
};

try {
  const pdfPath = compileToPdf(projectDir, paramsStructure);
  console.log('PDF salvato con successo:', pdfPath);
} catch (err) {
  console.error('Errore:', err.message);
  process.exit(1);
}
