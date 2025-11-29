const expressWs = require('express-ws');
const jwt = require('jsonwebtoken');
const { query } = require('./database');

const connections = new Map();
const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

function wsAuthMiddleware(req, res, next) {
  const token = req.query.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function registerWebsocket(app) {
  expressWs(app);
  app.ws('/ws', wsAuthMiddleware, (ws, req) => {
    const user = req.user;
    if (!user) {
      ws.close();
      return;
    }
    if (!connections.has(user.committee)) {
      connections.set(user.committee, new Set());
    }
    connections.get(user.committee).add(ws);
    ws.on('close', () => {
      connections.get(user.committee)?.delete(ws);
    });
  });
}

async function broadcastNote(committee, noteId) {
  const noteRows = await query(
    `SELECT n.*, u.username as from_username, u.flag as from_flag, u.delegation as from_delegation
     FROM notes n
     JOIN users u ON n.from_user_id = u.id
     WHERE n.id = ?`,
    [noteId]
  );
  const note = noteRows[0];
  if (!note) return;
  const recipients = await query(
    `SELECT recipient_type, recipient_ref FROM note_recipients WHERE note_id = ?`,
    [noteId]
  );
  const payload = JSON.stringify({
    type: 'new_note',
    note: {
      id: note.id,
      fromId: note.from_user_id,
      fromUsername: note.from_username,
      fromFlag: note.from_flag,
      fromDelegation: note.from_delegation,
      fromCommittee: note.committee_code,
      topic: note.topic,
      content: note.content,
      timestamp: note.created_at,
      recipients: recipients.map(r => ({ type: r.recipient_type, id: r.recipient_ref }))
    }
  });
  const sockets = connections.get(committee);
  if (!sockets) return;
  sockets.forEach((socket) => {
    if (socket.readyState === socket.OPEN) {
      socket.send(payload);
    }
  });
}

module.exports = {
  registerWebsocket,
  broadcastNote
};

