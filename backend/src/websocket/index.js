import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { parse } from 'url';

// rooms: Map<boardId, Set<ws>>
const rooms = new Map();
// clients: Map<ws, { userId }>
const clients = new Map();
// userSockets: Map<userId, Set<ws>>
const userSockets = new Map();

let wss;

export function createWebSocketServer(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const { query: qs } = parse(req.url, true);
    const token = qs.token;

    let userId;
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      userId = payload.sub;
    } catch {
      ws.close(4001, 'Unauthorized');
      return;
    }

    clients.set(ws, { userId });
    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(ws);

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'subscribe' && msg.boardId) {
          if (!rooms.has(msg.boardId)) rooms.set(msg.boardId, new Set());
          rooms.get(msg.boardId).add(ws);
        }
        if (msg.type === 'unsubscribe' && msg.boardId) {
          rooms.get(msg.boardId)?.delete(ws);
        }
      } catch {}
    });

    ws.on('close', () => {
      const meta = clients.get(ws);
      if (meta) {
        userSockets.get(meta.userId)?.delete(ws);
        if (!userSockets.get(meta.userId)?.size) userSockets.delete(meta.userId);
      }
      clients.delete(ws);
      rooms.forEach(set => set.delete(ws));
    });

    ws.send(JSON.stringify({ type: 'connected' }));
  });

  return wss;
}

// Broadcast a board refresh signal to all subscribers of that board
export function broadcastBoardUpdate(boardId) {
  const sockets = rooms.get(boardId);
  if (!sockets) return;
  const msg = JSON.stringify({ type: 'board:update', boardId });
  sockets.forEach(ws => {
    if (ws.readyState === 1) ws.send(msg);
  });
}

// Push a notification to a specific user (all their open connections)
export function pushNotification(userId, notification) {
  const sockets = userSockets.get(userId);
  if (!sockets) return;
  const msg = JSON.stringify({ type: 'notification', notification });
  sockets.forEach(ws => {
    if (ws.readyState === 1) ws.send(msg);
  });
}
