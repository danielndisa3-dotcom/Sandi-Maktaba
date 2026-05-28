const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.SANDI_ADMIN_KEY || 'SANDI2026';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve public static files from the sandi folder
app.use(express.static(path.join(__dirname)));

const DATA_FILE = path.join(__dirname, 'confirmations.json');
function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]');
  } catch (e) {
    return [];
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.post('/api/confirm', (req, res) => {
  const { name, phone, provider, amount, tx, email } = req.body;
  if (!name || !phone || !provider || !tx) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const id = crypto.randomBytes(8).toString('hex');
  const item = {
    id,
    name,
    phone,
    provider,
    amount: amount || '5000',
    tx,
    email: email || null,
    verified: false,
    createdAt: new Date().toISOString(),
  };

  const data = readData();
  data.push(item);
  writeData(data);

  res.json({ id, message: 'Confirmation received', downloadUrl: `/download/${id}` });
});

// Automatic payment initiation endpoint (auto-verifies payment)
app.post('/api/initiate-payment', (req, res) => {
  const { name, phone, provider, amount, email, password } = req.body;
  if (!name || !phone || !provider || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate password (must be at least 4 digits/chars)
  if (!password || password.length < 4) {
    return res.status(400).json({ error: 'Invalid password (minimum 4 characters)' });
  }

  const id = crypto.randomBytes(8).toString('hex');
  const item = {
    id,
    name,
    phone,
    provider,
    amount: amount || '5000',
    tx: `AUTO-${id.toUpperCase()}`,
    email: email || null,
    verified: true,
    verifiedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    paymentMethod: 'automatic_stk_push',
  };

  const data = readData();
  data.push(item);
  writeData(data);

  res.json({ id, message: 'Payment processed successfully', downloadUrl: `/download/${id}` });
});

// Admin verifies a transaction (simple key check)
app.post('/api/verify', (req, res) => {
  const { id, key } = req.body;
  if (key !== ADMIN_KEY) return res.status(403).json({ error: 'Unauthorized' });

  const data = readData();
  const rec = data.find((r) => r.id === id);
  if (!rec) return res.status(404).json({ error: 'Not found' });

  rec.verified = true;
  rec.verifiedAt = new Date().toISOString();
  writeData(data);
  res.json({ ok: true });
});

// Admin: list confirmations (requires key via query or header)
app.get('/api/list', (req, res) => {
  const key = req.query.key || req.headers['x-admin-key'];
  if (key !== ADMIN_KEY) return res.status(403).json({ error: 'Unauthorized' });
  res.json(readData());
});

// Protected download route
app.get('/download/:id', (req, res) => {
  const id = req.params.id;
  const data = readData();
  const rec = data.find((r) => r.id === id);
  if (!rec) return res.status(404).send('Not found');
  if (!rec.verified) return res.status(403).send('Payment not verified');

  const filePath = path.join(__dirname, 'private', 'book.txt');
  if (!fs.existsSync(filePath)) return res.status(500).send('File missing');
  res.download(filePath, 'Sandi-Book.txt');
});

app.listen(PORT, () => console.log(`Sandi server running on http://localhost:${PORT}`));
