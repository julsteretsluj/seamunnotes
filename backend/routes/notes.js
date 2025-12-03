const express = require('express');
const { authMiddleware } = require('./auth');
const { query, run } = require('../database');
const { broadcastNote } = require('../websocket');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const committee = req.user.committee;
    const userId = req.user.id;
    const rows = await query(
      `SELECT n.*, u.username as from_username, u.flag as from_flag, u.delegation as from_delegation
       FROM notes n
       JOIN users u ON n.from_user_id = u.id
       WHERE n.committee_code = ?
       ORDER BY n.created_at DESC`,
      [committee]
    );
    const notesWithRecipients = await Promise.all(
      rows.map(async (note) => {
        const recipients = await query(
          `SELECT recipient_type, recipient_ref FROM note_recipients WHERE note_id = ?`,
          [note.id]
        );
        const isRead = await query(
          `SELECT is_read FROM note_recipients WHERE note_id = ? AND recipient_type = 'user' AND recipient_ref = ?`,
          [note.id, String(userId)]
        );
        const isStarred = await query(
          `SELECT is_starred FROM note_recipients WHERE note_id = ? AND recipient_type = 'user' AND recipient_ref = ?`,
          [note.id, String(userId)]
        );
        const isConcern = checkInappropriateContent(note.topic, note.content);
        return {
          id: note.id,
          fromId: note.from_user_id,
          fromUsername: note.from_username,
          fromFlag: note.from_flag,
          fromDelegation: note.from_delegation,
          fromCommittee: note.committee_code,
          topic: note.topic,
          content: note.content,
          timestamp: note.created_at,
          recipients: recipients.map(r => ({ type: r.recipient_type, id: r.recipient_ref })),
          isRead: isRead.length > 0 ? Boolean(isRead[0].is_read) : false,
          isStarred: isStarred.length > 0 ? Boolean(isStarred[0].is_starred) : false,
          isConcern: isConcern
        };
      })
    );
    res.json(notesWithRecipients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function checkInappropriateContent(topic, content) {
  const APPROVED_TOPICS = [
    'Bloc Forming',
    'POIs or POCs',
    'Unrelated Questions'
  ];

  // List of inappropriate words/phrases (case-insensitive)
  const inappropriateWords = [
    'fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard', 'crap',
    'hate', 'kill', 'die', 'stupid', 'idiot', 'moron', 'retard',
    'sex', 'sexual', 'nude', 'naked', 'porn', 'pornography',
    'drug', 'cocaine', 'heroin', 'marijuana', 'weed', 'alcohol',
    'violence', 'fight', 'attack', 'hurt', 'harm', 'threat', 'threaten'
  ];

  // Check content for inappropriate words
  const contentLower = content.toLowerCase();
  const hasInappropriateLanguage = inappropriateWords.some(word => 
    contentLower.includes(word.toLowerCase())
  );

  // Check for inappropriate topics (anything not in the approved list)
  const hasInappropriateTopic = !APPROVED_TOPICS.includes(topic);

  return hasInappropriateLanguage || hasInappropriateTopic;
}

router.post('/', authMiddleware, async (req, res) => {
  try {
    // Check if note passing is suspended for this committee
    const settings = await query(
      `SELECT note_passing_suspended FROM committee_settings WHERE committee_code = ?`,
      [req.user.committee]
    );
    const isSuspended = settings.length > 0 && Boolean(settings[0].note_passing_suspended);
    if (isSuspended) {
      return res.status(403).json({ error: 'Note passing is currently suspended. Please wait for the chair to resume note passing.' });
    }

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

    // Check for inappropriate content and automatically star for all chairs
    const isInappropriate = checkInappropriateContent(topic, content);
    if (isInappropriate) {
      // Get all chairs in the committee
      const chairs = await query(
        `SELECT id FROM users WHERE committee_code = ? AND role = 'chair'`,
        [req.user.committee]
      );
      // Automatically star the note for all chairs
      for (const chair of chairs) {
        const existing = await query(
          `SELECT id FROM note_recipients 
           WHERE note_id = ? AND recipient_type = 'user' AND recipient_ref = ?`,
          [noteId, String(chair.id)]
        );
        if (existing.length > 0) {
          await run(
            `UPDATE note_recipients 
             SET is_starred = 1 
             WHERE note_id = ? AND recipient_type = 'user' AND recipient_ref = ?`,
            [noteId, String(chair.id)]
          );
        } else {
          await run(
            `INSERT INTO note_recipients (note_id, recipient_type, recipient_ref, is_starred)
             VALUES (?, 'user', ?, 1)`,
            [noteId, String(chair.id)]
          );
        }
      }
    }

    broadcastNote(req.user.committee, noteId);
    res.json({ id: noteId, isConcern: isInappropriate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const noteId = req.params.id;
    const userId = String(req.user.id);
    const existing = await query(
      `SELECT id FROM note_recipients 
       WHERE note_id = ? AND recipient_type = 'user' AND recipient_ref = ?`,
      [noteId, userId]
    );
    if (existing.length > 0) {
      await run(
        `UPDATE note_recipients 
         SET is_read = 1 
         WHERE note_id = ? AND recipient_type = 'user' AND recipient_ref = ?`,
        [noteId, userId]
      );
    } else {
      await run(
        `INSERT INTO note_recipients (note_id, recipient_type, recipient_ref, is_read)
         VALUES (?, 'user', ?, 1)`,
        [noteId, userId]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/star', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'chair') {
      return res.status(403).json({ error: 'Only chairs can star notes' });
    }
    const noteId = req.params.id;
    const userId = String(req.user.id);
    const { starred } = req.body;
    const existing = await query(
      `SELECT id FROM note_recipients 
       WHERE note_id = ? AND recipient_type = 'user' AND recipient_ref = ?`,
      [noteId, userId]
    );
    if (existing.length > 0) {
      await run(
        `UPDATE note_recipients 
         SET is_starred = ? 
         WHERE note_id = ? AND recipient_type = 'user' AND recipient_ref = ?`,
        [starred ? 1 : 0, noteId, userId]
      );
    } else {
      await run(
        `INSERT INTO note_recipients (note_id, recipient_type, recipient_ref, is_starred)
         VALUES (?, 'user', ?, ?)`,
        [noteId, userId, starred ? 1 : 0]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get suspended state for committee
router.get('/suspended', authMiddleware, async (req, res) => {
  try {
    const settings = await query(
      `SELECT note_passing_suspended FROM committee_settings WHERE committee_code = ?`,
      [req.user.committee]
    );
    const isSuspended = settings.length > 0 && Boolean(settings[0].note_passing_suspended);
    res.json({ suspended: isSuspended });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle suspended state (chair only)
router.post('/suspend', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'chair') {
      return res.status(403).json({ error: 'Only chairs can suspend note passing' });
    }
    const { suspended } = req.body;
    await run(
      `INSERT INTO committee_settings (committee_code, note_passing_suspended, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(committee_code) DO UPDATE SET
       note_passing_suspended = ?,
       updated_at = CURRENT_TIMESTAMP`,
      [req.user.committee, suspended ? 1 : 0, suspended ? 1 : 0]
    );
    res.json({ success: true, suspended: Boolean(suspended) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

