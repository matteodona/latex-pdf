/* eslint-disable no-console */
const path = require('path');
const bcrypt = require('bcryptjs');

// Assicura che i path siano risolti rispetto alla root del backend
// in modo che possa essere eseguito con: node scripts/createUser.js <username> <password>
// dalla cartella backend.
const db = require(path.join(__dirname, '..', 'src', 'db'));

async function main() {
  const [, , username, password] = process.argv;

  if (!username || !password) {
    console.error('Uso: node scripts/createUser.js <username> <password>');
    process.exit(1);
  }

  try {
    const existing = db.getUserByUsername(username);
    if (existing) {
      console.error(`L'utente "${username}" esiste già.`);
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = db.createUser({ username, passwordHash });
    console.log('Utente creato con successo:');
    console.log(`  id: ${user.id}`);
    console.log(`  username: ${user.username}`);
  } catch (err) {
    console.error('Errore durante la creazione utente:', err);
    process.exit(1);
  }
}

main();

