require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// ---- Telegram bot ----
const telegramBot = process.env.TELEGRAM_BOT_TOKEN
  ? new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false })
  : null;

const telegramChatId = process.env.TELEGRAM_CHAT_ID || null;

async function sendTelegramNotification(data) {
  if (!telegramBot || !telegramChatId) {
    console.warn('Telegram not configured (missing TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID)');
    return { ok: false, skipped: true };
  }
  const text =
    `New registration:\n` +
    `Name: ${data.name}\n` +
    `Phone: ${data.phone}`;
  await telegramBot.sendMessage(telegramChatId, text);
  return { ok: true };
}

// ---- Google Sheets ----
function buildAuth() {
  // Option 1: path to the downloaded service-account JSON key file
  const keyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (keyFilePath) {
    return new google.auth.GoogleAuth({
      keyFile: keyFilePath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  }

  // Option 2: client email + private key from env vars
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (clientEmail && privateKey) {
    return new google.auth.JWT(clientEmail, null, privateKey, [
      'https://www.googleapis.com/auth/spreadsheets',
    ]);
  }
  return null;
}

async function appendToSheet(data) {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  const range = process.env.GOOGLE_SHEET_RANGE || 'Sheet1!A:B';

  if (!spreadsheetId) {
    console.warn('Google Sheets not configured (missing GOOGLE_SPREADSHEET_ID)');
    return { ok: false, skipped: true };
  }

  const auth = buildAuth();
  if (!auth) {
    console.warn('Google Sheets auth not configured (set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CLIENT_EMAIL/GOOGLE_PRIVATE_KEY)');
    return { ok: false, skipped: true };
  }
  await auth.authorize();
  const sheets = google.sheets({ version: 'v4', auth });

  const values = [[data.name, data.phone]];
  const res = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: { values },
  });
  return { ok: true, updatedRange: res.data.updates?.range };
}

// ---- API ----
app.post('/api/register', async (req, res) => {
  const { name, phone } = req.body || {};
  if (!name || !phone) {
    return res.status(400).json({ error: 'name and phone are required' });
  }

  const errors = {};
  const tg = await sendTelegramNotification({ name, phone }).catch((e) => {
    errors.telegram = e.message;
    return { ok: false };
  });
  const gs = await appendToSheet({ name, phone }).catch((e) => {
    errors.sheet = e.message;
    return { ok: false };
  });

  const allSkipped = tg.skipped && gs.skipped;
  if (allSkipped) {
    return res.status(500).json({
      error: 'No integrations configured. Set TELEGRAM_* and GOOGLE_* env vars.',
    });
  }

  return res.json({
    success: true,
    telegram: tg.ok,
    sheet: gs.ok,
    errors: Object.keys(errors).length ? errors : undefined,
  });
});

app.get('/', (req, res) => res.redirect('/registration.html'));

// Serve the T24H website at /t24h (its form posts to /api/register)
app.use('/t24h', express.static('t24h-website'));
app.get('/t24h/', (req, res) => res.redirect('/t24h/index.html'));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});