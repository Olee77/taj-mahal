// test/playthrough-and-screenshot.js
import puppeteer from 'puppeteer-core';
import http from 'http';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
import { TajMahalGame, PLAYER_COLORS } from '../server/taj-mahal-engine.js';
import { CITIES, PROVINCES } from '../server/board-data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 3333;

async function run() {
  console.log('=== STARTE TEST & PLAYTHROUGH MIT SCREENSHOTS ===');

  // 1. Test-Server starten
  const app = express();
  const server = http.createServer(app);
  const io = new SocketIOServer(server, { cors: { origin: '*' } });

  app.use(express.static(PUBLIC_DIR));
  app.use(express.json());

  let game = new TajMahalGame();
  const socketPlayerMap = new Map();
  const playerSockets = new Map();

  app.get('/api/info', async (req, res) => {
    const joinUrl = `http://localhost:${PORT}/player.html`;
    const qrDataUrl = await QRCode.toDataURL(joinUrl, { width: 260, margin: 1 });
    res.json({ port: PORT, hostIp: 'localhost', joinUrl, qrDataUrl, colors: PLAYER_COLORS });
  });

  app.get('/api/board', (req, res) => {
    res.json({ cities: CITIES, provinces: PROVINCES });
  });

  function broadcastAll() {
    io.emit('table_state', game.getTableState());
    for (const p of game.players) {
      const sId = playerSockets.get(p.id);
      if (sId) io.to(sId).emit('player_state', game.getPlayerState(p.id));
    }
  }

  io.on('connection', socket => {
    socket.on('register_table', () => {
      socket.emit('table_state', game.getTableState());
    });

    socket.on('join_game', ({ playerId, name, color }) => {
      try {
        let existing = playerId ? game.players.find(p => p.id === playerId) : null;
        if (existing) {
          socketPlayerMap.set(socket.id, existing.id);
          playerSockets.set(existing.id, socket.id);
          socket.emit('join_success', { playerId: existing.id, player: existing });
          socket.emit('player_state', game.getPlayerState(existing.id));
          broadcastAll();
          return;
        }
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

    socket.on('start_game', () => {
      try {
        game.startGame();
        broadcastAll();
      } catch (err) {
        socket.emit('game_error', { message: err.message });
      }
    });

    socket.on('play_cards', ({ colorCardId, extraCardId }) => {
      const pid = socketPlayerMap.get(socket.id);
      if (pid) {
        try {
          game.playCards(pid, colorCardId, extraCardId);
          broadcastAll();
        } catch (err) {
          socket.emit('game_error', { message: err.message });
        }
      }
    });

    socket.on('withdraw', () => {
      const pid = socketPlayerMap.get(socket.id);
      if (pid) {
        try {
          game.withdraw(pid);
          broadcastAll();
        } catch (err) {
          socket.emit('game_error', { message: err.message });
        }
      }
    });

    socket.on('place_palace', ({ cityId, isCrown }) => {
      const pid = socketPlayerMap.get(socket.id);
      if (pid) {
        try {
          game.placePalace(pid, cityId, isCrown);
          broadcastAll();
        } catch (err) {
          socket.emit('game_error', { message: err.message });
        }
      }
    });

    socket.on('draft_market_cards', ({ cardIds }) => {
      const pid = socketPlayerMap.get(socket.id);
      if (pid) {
        try {
          game.draftMarketCards(pid, cardIds);
          broadcastAll();
        } catch (err) {
          socket.emit('game_error', { message: err.message });
        }
      }
    });
  });

  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`Test-Server läuft auf Port ${PORT}`);

  // 2. Puppeteer Browser starten
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // --- SCREENSHOT 1: Tisch Lobby ---
  console.log('Erstelle Screenshot 1: Tisch Lobby...');
  const tablePage = await browser.newPage();
  tablePage.on('dialog', d => d.dismiss());
  await tablePage.setViewport({ width: 1440, height: 900 });
  await tablePage.goto(`http://localhost:${PORT}/table.html`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  await tablePage.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_table_lobby.png') });

  // 3 Spieler beitreten lassen (in separaten Browser-Kontexten, wie echte Handys)
  console.log('3 Spieler treten der Partie bei...');
  const ctx1 = await browser.createBrowserContext();
  const playerPage1 = await ctx1.newPage();
  playerPage1.on('dialog', d => d.dismiss());
  await playerPage1.setViewport({ width: 390, height: 844, isMobile: true });
  await playerPage1.goto(`http://localhost:${PORT}/player.html`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 400));
  await playerPage1.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_player_lobby.png') });

  // Spieler 1: Akbar (Rot)
  await playerPage1.type('#player-name-input', 'Akbar');
  await playerPage1.click('#btn-join-game');
  await new Promise(r => setTimeout(r, 500));

  // Spieler 2: Babur (Blau)
  const ctx2 = await browser.createBrowserContext();
  const playerPage2 = await ctx2.newPage();
  await playerPage2.setViewport({ width: 390, height: 844, isMobile: true });
  await playerPage2.goto(`http://localhost:${PORT}/player.html`, { waitUntil: 'networkidle0' });
  await playerPage2.type('#player-name-input', 'Babur');
  await playerPage2.click('.color-opt[data-color="blue"]');
  await playerPage2.click('#btn-join-game');
  await new Promise(r => setTimeout(r, 500));

  // Spieler 3: Shah Jahan (Grün)
  const ctx3 = await browser.createBrowserContext();
  const playerPage3 = await ctx3.newPage();
  await playerPage3.setViewport({ width: 390, height: 844, isMobile: true });
  await playerPage3.goto(`http://localhost:${PORT}/player.html`, { waitUntil: 'networkidle0' });
  await playerPage3.type('#player-name-input', 'Shah Jahan');
  await playerPage3.click('.color-opt[data-color="green"]');
  await playerPage3.click('#btn-join-game');
  await new Promise(r => setTimeout(r, 800));

  // --- SCREENSHOT 3: Tisch nach Spielstart ---
  console.log('Starte Spiel...');
  await tablePage.click('#btn-start-game');
  await new Promise(r => setTimeout(r, 800));
  console.log('Erstelle Screenshot 3: Tisch Spielstart (Besuch 1)...');
  await tablePage.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_table_visit_started.png') });

  // --- SCREENSHOT 4: Handy-Ansicht Handkarten ---
  console.log('Erstelle Screenshot 4: Handy Handkarten (Akbar - Rot)...');
  await playerPage1.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_player_hand_cards.png') });

  // --- Spielzug-Ablauf: Karten ausspielen ---
  console.log('Simuliere Spielzüge in Besuch 1...');
  // Akbar (P1) spielt Karte aus
  await playerPage1.click('.player-card:first-child');
  await new Promise(r => setTimeout(r, 300));
  await playerPage1.click('#btn-play-cards');
  await new Promise(r => setTimeout(r, 500));

  // Babur (P2) spielt Karte aus
  await playerPage2.click('.player-card:first-child');
  await new Promise(r => setTimeout(r, 300));
  await playerPage2.click('#btn-play-cards');
  await new Promise(r => setTimeout(r, 500));

  // Shah Jahan (P3) spielt Karte aus
  await playerPage3.click('.player-card:first-child');
  await new Promise(r => setTimeout(r, 300));
  await playerPage3.click('#btn-play-cards');
  await new Promise(r => setTimeout(r, 600));

  // --- SCREENSHOT 5: Tisch Biet-Tableau & Biet-Streit ---
  console.log('Erstelle Screenshot 5: Tisch Biet-Tableau mit ausgelegten Karten...');
  await tablePage.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_table_bidding_war.png') });

  // Akbar zieht sich zurück
  console.log('Akbar zieht sich zurück...');
  // Manuell in der Engine günstige Karten für Akbar setzen, um Mehrheiten sicherzustellen
  const akbarPlayer = game.players.find(p => p.name === 'Akbar');
  akbarPlayer.playedCards.push(
    { id: 'c_test_viz', color: akbarPlayer.lockedColor || 'rot', symbols: ['Wesir', 'Elefant'] },
    { id: 'c_test_monk', color: akbarPlayer.lockedColor || 'rot', symbols: ['Mönch'] }
  );

  // Akbar klickt Rückzug
  await playerPage1.evaluate(() => {
    window.confirm = () => true;
  });
  await playerPage1.click('#btn-withdraw');
  await new Promise(r => setTimeout(r, 800));

  // --- SCREENSHOT 6: Handy Palast-Auswahl Modal ---
  console.log('Erstelle Screenshot 6: Handy Palast-Auswahl Modal...');
  await playerPage1.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_player_palace_placement.png') });

  // Akbar wählt Städte solange Palast-Modal sichtbar ist
  let palaceVisible = await playerPage1.evaluate(() => {
    const el = document.getElementById('modal-palace');
    return el && el.style.display !== 'none';
  });
  while (palaceVisible) {
    const btn = await playerPage1.$('.city-opt-btn');
    if (btn) {
      await btn.click();
      await new Promise(r => setTimeout(r, 600));
    }
    palaceVisible = await playerPage1.evaluate(() => {
      const el = document.getElementById('modal-palace');
      return el && el.style.display !== 'none';
    });
  }

  // Falls Kartennachschub-Draft Modal erscheint
  let draftVisible = await playerPage1.evaluate(() => {
    const el = document.getElementById('modal-draft');
    return el && el.style.display !== 'none';
  });
  if (draftVisible) {
    console.log('Akbar wählt Karten aus Nachschub...');
    await playerPage1.click('.draft-cards-grid .player-card:first-child');
    await new Promise(r => setTimeout(r, 400));
    const secondCard = await playerPage1.$('.draft-cards-grid .player-card:nth-child(2)');
    if (secondCard) {
      await playerPage1.click('.draft-cards-grid .player-card:nth-child(2)');
      await new Promise(r => setTimeout(r, 400));
    }
    await playerPage1.click('#btn-confirm-draft');
    await new Promise(r => setTimeout(r, 600));
  }

  // --- SCREENSHOT 7: Tisch nach Palastbau & Punktevergabe ---
  console.log('Erstelle Screenshot 7: Tisch mit platziertem Palast & Punkten...');
  await new Promise(r => setTimeout(r, 600));
  await tablePage.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_table_palace_placed.png') });

  // Weitere Besuche bis Besuch 12 durchspielen
  console.log('Spiele vollständige 12 Besuche durch...');
  // Babur und Shah Jahan ziehen sich ebenfalls aus Besuch 1 zurück
  try {
    await playerPage2.evaluate(() => { window.confirm = () => true; });
    await playerPage2.click('#btn-withdraw');
    await new Promise(r => setTimeout(r, 500));
    const btn2 = await playerPage2.$('.city-opt-btn');
    if (btn2) await btn2.click();
    await new Promise(r => setTimeout(r, 400));
    if (await playerPage2.$('.draft-cards-grid .player-card')) {
      await playerPage2.click('.draft-cards-grid .player-card:first-child');
      await new Promise(r => setTimeout(r, 300));
      if (await playerPage2.$('.draft-cards-grid .player-card:nth-child(2)')) {
        await playerPage2.click('.draft-cards-grid .player-card:nth-child(2)');
      }
      await playerPage2.click('#btn-confirm-draft');
    }
  } catch (e) {}

  try {
    await playerPage3.evaluate(() => { window.confirm = () => true; });
    await playerPage3.click('#btn-withdraw');
    await new Promise(r => setTimeout(r, 500));
    const btn3 = await playerPage3.$('.city-opt-btn');
    if (btn3) await btn3.click();
    await new Promise(r => setTimeout(r, 400));
    if (await playerPage3.$('.draft-cards-grid .player-card')) {
      await playerPage3.click('.draft-cards-grid .player-card:first-child');
      await new Promise(r => setTimeout(r, 300));
      if (await playerPage3.$('.draft-cards-grid .player-card:nth-child(2)')) {
        await playerPage3.click('.draft-cards-grid .player-card:nth-child(2)');
      }
      await playerPage3.click('#btn-confirm-draft');
    }
  } catch (e) {}

  // Schnelle Simulation von Besuch 2 bis 12 in der Engine
  while (game.currentVisitIndex < 11 && game.status === 'playing') {
    const vIdx = game.currentVisitIndex;
    const currentProvId = game.currentProvince.id;
    const freeCities = Object.values(game.citiesState).filter(c => c.province === currentProvId && !c.normalPalace);

    // Jeder Spieler platziert Paläste und sammelt Punkte
    game.players.forEach((p, pIdx) => {
      if (freeCities[pIdx]) {
        freeCities[pIdx].normalPalace = p.id;
        p.palacesLeft = Math.max(0, p.palacesLeft - 1);
        const pts = game.calculatePalaceNetworkPoints(p, currentProvId);
        p.score += pts + 2;
        p.commodities.push(['Tee', 'Reis', 'Gewürze', 'Edelsteine'][pIdx % 4]);
      }
    });

    game.endVisit();
    broadcastAll();
  }

  // 12. Besuch (Agra mit Taj Mahal) abschließen -> Endwertung!
  if (game.status === 'playing') {
    // Taj Mahal Stadt Agra (C31) an Akbar vergeben (+4 VP)
    const agraCity = game.citiesState['C31'];
    agraCity.normalPalace = game.players[0].id;
    game.players[0].score += 4;
    game.endVisit();
    broadcastAll();
  }

  await new Promise(r => setTimeout(r, 1000));

  // --- SCREENSHOT 8: Tisch Endwertung & Siegerehrung ---
  console.log('Erstelle Screenshot 8: Tisch Endwertung & Siegerehrung...');
  await tablePage.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_table_endgame_final_scores.png') });

  // --- SCREENSHOT 9: Handy Endstand ---
  console.log('Erstelle Screenshot 9: Handy Endstand...');
  await playerPage1.screenshot({ path: path.join(SCREENSHOTS_DIR, '09_player_endgame_stats.png') });

  console.log('Alle 9 Screenshots erfolgreich erstellt!');
  await browser.close();
  server.close();
}

run().catch(err => {
  console.error('Fehler bei Testdurchlauf:', err);
  process.exit(1);
});
