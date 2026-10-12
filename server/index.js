// server/index.js - Express & Socket.io Server mit QR-Code und Echtzeit-Synchronisation
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
import { TajMahalGame, PLAYER_COLORS } from './taj-mahal-engine.js';
import { CITIES, PROVINCES } from './board-data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const PORT = process.env.PORT || 3000;

export function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address);
      }
    }
  }
  return addresses.length > 0 ? addresses : ['127.0.0.1'];
}

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*' }
});

app.use(express.static(PUBLIC_DIR));
app.use(express.json());

// Singleton Spielinstanz (für lokale Spielabende)
let game = new TajMahalGame();

// Map von Socket-Verbindungen
const socketPlayerMap = new Map(); // socket.id -> playerId
const playerSockets = new Map(); // playerId -> socket.id

// API Endpoint für QR-Code und Netzwerk-Info (funktioniert lokal und auf Render.com)
app.get('/api/info', async (req, res) => {
  const localIps = getLocalIpAddresses();
  const hostIp = localIps[0];
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const hostHeader = req.headers.host;
  const isLocal = !hostHeader || hostHeader.startsWith('localhost') || hostHeader.startsWith('127.0.0.1');

  const baseUrl = !isLocal ? `${protocol}://${hostHeader}` : `http://${hostIp}:${PORT}`;
  const joinUrl = `${baseUrl}/player.html`;

  try {
    const qrDataUrl = await QRCode.toDataURL(joinUrl, { width: 260, margin: 1 });
    res.json({
      port: PORT,
      hostIp,
      baseUrl,
      joinUrl,
      qrDataUrl,
      colors: PLAYER_COLORS
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Board Data Endpoint für Clients
app.get('/api/board', (req, res) => {
  res.json({
    cities: CITIES,
    provinces: PROVINCES
  });
});

function broadcastAll() {
  // 1. Öffentlichen Tisch-State an alle Tisch-Clients senden
  io.emit('table_state', game.getTableState());

  // 2. Privaten Spieler-State gezielt an jeden einzelnen Handy-Client senden
  for (const player of game.players) {
    const socketId = playerSockets.get(player.id);
    if (socketId) {
      io.to(socketId).emit('player_state', game.getPlayerState(player.id));
    }
  }
}

io.on('connection', socket => {
  // --- Tisch-Client registrieren ---
  socket.on('register_table', () => {
    socket.emit('table_state', game.getTableState());
  });

  // --- Spieler beitreten oder wiederverbinden ---
  socket.on('join_game', ({ playerId, name, color }) => {
    try {
      let existing = null;
      if (playerId) {
        existing = game.players.find(p => p.id === playerId);
      }

      if (existing) {
        // Wiederverbindung
        socketPlayerMap.set(socket.id, existing.id);
        playerSockets.set(existing.id, socket.id);
        socket.emit('join_success', { playerId: existing.id, player: existing });
        socket.emit('player_state', game.getPlayerState(existing.id));
        broadcastAll();
        return;
      }

      // Neuer Spieler beitreten
      const id = playerId || `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newPlayer = game.addPlayer(id, name, color);
      socketPlayerMap.set(socket.id, newPlayer.id);
      playerSockets.set(newPlayer.id, socket.id);

      socket.emit('join_success', { playerId: newPlayer.id, player: newPlayer });
      socket.emit('player_state', game.getPlayerState(newPlayer.id));
      broadcastAll();
    } catch (err) {
      socket.emit('game_error', { message: err.message });
    }
  });

  // --- Spiel starten ---
  socket.on('start_game', () => {
    try {
      game.startGame();
      broadcastAll();
    } catch (err) {
      socket.emit('game_error', { message: err.message });
    }
  });

  // --- Spielzug: Karten spielen ---
  socket.on('play_cards', ({ colorCardId, extraCardId }) => {
    const playerId = socketPlayerMap.get(socket.id);
    if (!playerId) return socket.emit('game_error', { message: 'Nicht angemeldet.' });

    try {
      game.playCards(playerId, colorCardId, extraCardId);
      broadcastAll();
    } catch (err) {
      socket.emit('game_error', { message: err.message });
    }
  });

  // --- Spielzug: Sich zurückziehen ---
  socket.on('withdraw', () => {
    const playerId = socketPlayerMap.get(socket.id);
    if (!playerId) return socket.emit('game_error', { message: 'Nicht angemeldet.' });

    try {
      game.withdraw(playerId);
      broadcastAll();
    } catch (err) {
      socket.emit('game_error', { message: err.message });
    }
  });

  // --- Palast platzieren ---
  socket.on('place_palace', ({ cityId, isCrown }) => {
    const playerId = socketPlayerMap.get(socket.id);
    if (!playerId) return socket.emit('game_error', { message: 'Nicht angemeldet.' });

    try {
      game.placePalace(playerId, cityId, isCrown);
      broadcastAll();
    } catch (err) {
      socket.emit('game_error', { message: err.message });
    }
  });

  // --- Karten nach Rückzug draften ---
  socket.on('draft_market_cards', ({ cardIds }) => {
    const playerId = socketPlayerMap.get(socket.id);
    if (!playerId) return socket.emit('game_error', { message: 'Nicht angemeldet.' });

    try {
      game.draftMarketCards(playerId, cardIds);
      broadcastAll();
    } catch (err) {
      socket.emit('game_error', { message: err.message });
    }
  });

  // --- Neues Spiel / Reset ---
  socket.on('reset_game', () => {
    game = new TajMahalGame();
    socketPlayerMap.clear();
    playerSockets.clear();
    broadcastAll();
  });

  socket.on('disconnect', () => {
    const pid = socketPlayerMap.get(socket.id);
    if (pid) {
      socketPlayerMap.delete(socket.id);
      playerSockets.delete(pid);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const localIps = getLocalIpAddresses();
  console.log(`\n=================================================`);
  console.log(` Taj Mahal Server läuft!`);
  console.log(` Lokale Tisch-Ansicht: http://localhost:${PORT}/table.html`);
  console.log(` Handy-Controller:    http://${localIps[0]}:${PORT}/player.html`);
  console.log(`=================================================\n`);
});
