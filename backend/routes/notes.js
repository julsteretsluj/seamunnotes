const express = require('express');
const { authMiddleware } = require('./auth');
const { query, run } = require('../database');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const committee = req.user.committee;
    const rows = await query(
      `SELECT n.*, u.username as from_username, u.flag as from_flag
       FROM notes n
       JOIN users u ON n.from_user_id = u.id
       WHERE n.committee_code = ?
       ORDER BY n.created_at DESC`,
      [committee]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { topic, content, recipients } = req.body;
    if (!topic || !content || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Topic, content, and recipients required.' });
    }
    const insert = await run(
      `INSERT INTO notes (from_user_id, committee_code, topic, content)
       VALUES (?, ?, ?, ?)`,
      [req.user.id, req.user.committee, topic, content]
    );
    const noteId = insert.id;
    for (const recipient of recipients) {
      await run(
        `INSERT INTO note_recipients (note_id, recipient_type, recipient_ref)
         VALUES (?, ?, ?)`,
        [noteId, recipient.type, recipient.id]
      );
    }
    res.json({ id: noteId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

