require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// === In-memory user store & chat history (replace with DB in prod) ===
const users = {}; // username: { passwordHash }
const chatHistories = {}; // username: [ { message, reply, timestamp } ]

// === Auth Helpers ===
function generateToken(username) {
  return jwt.sign({ username }, JWT_SECRET, { expiresIn: '2h' });
}
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  const token = auth.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.user = decoded.username;
    next();
  });
}

// === Rate Limiting ===
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,                 // limit each IP to 30 requests/minute
  message: { error: 'Too many requests, slow down!' }
});
app.use(limiter);

// === Health Check ===
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// === User Registration ===
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });
  if (users[username])
    return res.status(400).json({ error: 'User already exists' });
  const passwordHash = await bcrypt.hash(password, 10);
  users[username] = { passwordHash };
  chatHistories[username] = [];
  res.json({ message: 'User registered' });
});

// === User Login ===
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!users[username])
    return res.status(400).json({ error: 'User not found' });
  const valid = await bcrypt.compare(password, users[username].passwordHash);
  if (!valid) return res.status(400).json({ error: 'Wrong password' });
  const token = generateToken(username);
  res.json({ token });
});

// === Chat Endpoint (AI Integration) ===
app.post('/chat', authMiddleware, async (req, res) => {
  try {
    const userMessage = req.body.message;
    if (!userMessage) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    // Example: Hugging Face Inference API (replace with your model)
    const HF_API_KEY = process.env.HF_API_KEY;
    const response = await fetch('https://api-inference.huggingface.co/models/gpt2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: userMessage })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ error: 'AI API error', details: errorText });
    }

    const data = await response.json();
    const botReply = Array.isArray(data) && data[0]?.generated_text ? data[0].generated_text : "Sorry, I couldn't generate a reply.";

    // Save chat
    const chatRecord = { message: userMessage, reply: botReply, timestamp: Date.now() };
    chatHistories[req.user].push(chatRecord);

    res.json({ reply: botReply });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// === Get Chat History ===
app.get('/history', authMiddleware, (req, res) => {
  res.json({ history: chatHistories[req.user] || [] });
});

// === Centralized Error Handling ===
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Server error', details: err.message });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
