const wa = require('@open-wa/wa-automate');
const orchestrator = require('./orchestrator');
const db = require('./db');

async function start(client) {
  console.log('WA Client Connected ✅');

  client.onMessage(async (message) => {
    try {
      if(message.isStatus || message.type === 'protocol') return;
      await orchestrator.handleMessage(client, message);
    } catch (e) {
      console.error('message handler error', e);
    }
  });
}

(async () => {
  await db.initDB();

  wa.create({
    sessionId: "abfrl-mvp",
    multiDevice: true,
    authTimeout: 60,
    blockCrashLogs: true,
    disableSpins: true,
    headless: true,
    logConsole: false,
    popup: true,
    qrTimeout: 0
  })
    .then((client) => start(client))
    .catch((err) => console.error('Failed to create WA client', err));
})();
