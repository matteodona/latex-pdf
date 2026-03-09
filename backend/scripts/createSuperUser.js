/* eslint-disable no-console */
const path = require('path');
const bcrypt = require('bcryptjs');

const db = require(path.join(__dirname, '..', 'src', 'db'));

async function main() {
  const [, , username, password] = process.argv;

  if (!username || !password) {
    console.error('Uso: node scripts/createSuperUser.js <username> <password>');
    process.exit(1);
  }

  try {
    const existing = db.getUserByUsername(username);
    if (existing) {
      console.error(`L'utente "${username}" esiste già.`);
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = db.createUser({
      username,
      passwordHash,
      role: 'superuser',
      status: 'approved',
    });
    console.log('Superutente creato con successo:');
    console.log(`  id: ${user.id}`);
    console.log(`  username: ${user.username}`);
  } catch (err) {
    console.error('Errore durante la creazione superutente:', err);
    process.exit(1);
  }
}

main();
