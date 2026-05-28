# Sandi — Simple downloadable book site

This is a minimal site to sell a downloadable book using automatic mobile money payments.

Files included:

- `index.html` — main site with product and automatic payment form (submits to `/api/initiate-payment`).
- `admin.html` — admin UI to list confirmations (uses an admin key).
- `styles.css` — lightweight styles.
- `server.js` — minimal Express server to initiate payments, verify, and serve protected downloads.
- `package.json` — scripts to run the server.
- `confirmations.json` — storage for submitted confirmations.
- `private/book.txt` — private placeholder book used by the protected download.

How it works (automatic flow):

1. Buyer enters name, phone number (+255...), provider (M-Pesa/Airtel/Tigo), and password.
2. Buyer clicks "Initiate automatic payment" — the frontend POSTs to `/api/initiate-payment`.
3. The server processes the payment, auto-verifies it, and returns the download URL.
4. Buyer can immediately download the book.

Run locally:

```bash
cd sandi
npm install
SANDI_ADMIN_KEY=your_admin_key npm start
```

On Windows PowerShell:

```powershell
cd sandi
$env:SANDI_ADMIN_KEY="your_admin_key"; npm start
```

Admin UI:

- Open `http://localhost:3000/admin.html`, enter the `SANDI_ADMIN_KEY`, click "Load confirmations" to see all automatic payments received.

API endpoints:

1) Automatic payment initiation (buyer):

```bash
curl -X POST http://localhost:3000/api/initiate-payment \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane","phone":"+255744873006","provider":"mpesa","password":"1234"}'
```

Returns:
```json
{"id":"abc123","message":"Payment processed successfully","downloadUrl":"/download/abc123"}
```

2) List payments (seller/admin):

```bash
curl http://localhost:3000/api/list?key=your_admin_key
```

3) Download (after payment):

```bash
curl -O http://localhost:3000/download/abc123
```

Security notes:

- This demo uses a simple automatic flow. In production, integrate with:  - M-Pesa API (STK Push or B2C)   - Airtel Money API   - Tigo Pesa API
- The password is not validated against a real operator — in production, verify via the operator's API.
- Use HTTPS in production.
- Replace the placeholder private book with a real PDF.
- Change the default `SANDI_ADMIN_KEY` and keep it secret.

*** End Patch
