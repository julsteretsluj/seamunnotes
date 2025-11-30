const express = require('express');
const { query } = require('../database');
const { authMiddleware } = require('./auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const committee = req.user.committee;
    const users = await query(
      `SELECT id, username, role, committee_code, delegation, flag, credentials_day
       FROM users
       WHERE committee_code = ? AND id != ?
       ORDER BY role DESC, delegation`,
      [committee, req.user.id]
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/delegations', authMiddleware, async (req, res) => {
  try {
    const committee = req.user.committee;
    const rows = await query(
      `SELECT DISTINCT delegation, flag
       FROM users
       WHERE committee_code = ? AND delegation IS NOT NULL AND delegation != ''
       ORDER BY delegation`,
      [committee]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const rows = await query(
      `SELECT id, username, role, committee_code, delegation, flag, credentials_day
       FROM users WHERE id = ?`,
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

