
const path = require('path');
let db;

async function initDB() {
  if (!db) {
    const { Low } = await import('lowdb');
  const { JSONFile } = await import('lowdb/node');
    const file = path.join(__dirname, 'db.json');
    const adapter = new JSONFile(file);
    db = new Low(adapter, { users: {} });
  }
  await db.read();
  await db.write();
}

async function getUser(phoneId) {
  await db.read();
  return db.data.users[phoneId] || null;
}

async function setUser(phoneId, data) {
  await db.read();
  db.data.users[phoneId] = data;
  await db.write();
}

async function clearUser(phoneId) {
  await db.read();
  delete db.data.users[phoneId];
  await db.write();
}

module.exports = { initDB, getUser, setUser, clearUser };
