const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, run } = require('../database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

async function findUserByUsername(username) {
  const rows = await query('SELECT * FROM users WHERE username = ?', [username]);
  return rows[0];
}

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    const user = await findUserByUsername(username);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        committee: user.committee_code,
        delegation: user.delegation
      },
      JWT_SECRET,
      { expiresIn: '12h' }
    );
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        committee: user.committee_code,
        delegation: user.delegation,
        flag: user.flag
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, password, role, committee, delegation, flag } = req.body;
    if (!username || !password || !role || !committee) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const result = await run(
      `INSERT INTO users (username, password, role, committee_code, delegation, flag)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [username, hashed, role, committee, delegation, flag]
    );
    res.json({ id: result.id, username });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Missing authorization header' });
  const token = header.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Invalid authorization header' });
  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.user = payload;
    next();
  });
}

module.exports = router;
module.exports.authMiddleware = authMiddleware;

