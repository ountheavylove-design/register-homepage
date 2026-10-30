# Registration Page

A standalone registration form that collects name and Telegram phone number, then pushes the data to a Telegram bot and stores it in a Google Sheet.

## Tech stack

- Node.js + Express (server)
- Plain HTML/CSS/JS (frontend)
- node-telegram-bot-api (Telegram)
- googleapis (Google Sheets API)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables. Copy `.env.example` to `.env` and fill in real values:

```bash
cp .env.example .env
```

### Telegram
- Create a bot via [@BotFather](https://t.me/botfather) to get `TELEGRAM_BOT_TOKEN`.
- Get your chat ID (e.g. by messaging the bot and reading updates, or via @userinfobot) for `TELEGRAM_CHAT_ID`.

### Google Sheets
- Create a Google Cloud project, enable the Google Sheets API, and create a Service Account. Download the JSON key.
- Open the JSON file and copy the `client_email` and `private_key` fields into your `.env`:
  - `GOOGLE_CLIENT_EMAIL` = the `client_email` value
  - `GOOGLE_PRIVATE_KEY` = the `private_key` value (PEM block, keep the `\n` escapes)
- Create a Google Sheet, share it with the service account email, and copy its ID (from the URL) into `GOOGLE_SPREADSHEET_ID`.

Alternative: set `GOOGLE_APPLICATION_CREDENTIALS` to the path of the downloaded JSON key file instead.

## Run

```bash
npm run dev
```

Then open http://localhost:3000 (serves `public/registration.html`).

## Embedding in another website

The registration page is self-contained. Copy `public/registration.html` into your site, and set the API endpoint before the script runs:

```html
<script>
  window.REGISTER_API_URL = "https://your-domain.com/api/register";
</script>
<script src="registration.html"></script>
```

The form will post to that endpoint. You can also host the backend separately and point any frontend at it via `window.REGISTER_API_URL`.