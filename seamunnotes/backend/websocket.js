const expressWs = require('express-ws');
const { query } = require('./database');

const connections = new Map();

function registerWebsocket(app, authMiddleware) {
  expressWs(app);
  app.ws('/ws', (ws, req) => {
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
  }, authMiddleware);
}

async function broadcastNote(committee, noteId) {
  const noteRows = await query(
    `SELECT n.*, u.username as from_username, u.flag as from_flag
     FROM notes n
     JOIN users u ON n.from_user_id = u.id
     WHERE n.id = ?`,
    [noteId]
  );
  const note = noteRows[0];
  if (!note) return;
  const payload = JSON.stringify({ type: 'new_note', note });
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

