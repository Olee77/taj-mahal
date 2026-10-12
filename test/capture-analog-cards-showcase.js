// test/capture-analog-cards-showcase.js
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
const ARTIFACT_DIR = 'C:\\Users\\olee\\.gemini\\antigravity\\brain\\25d30f89-f9ea-40fc-9684-a35be3e2a666';

if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 3336;

async function run() {
  console.log('--- STARTE ANALOG-KARTEN SCREENSHOT SHOWCASE ---');

  // 1. Showcase HTML für alle Kartentypen
  const showcaseHtml = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Taj Mahal - Analoge Karten Kollektion</title>
  <link rel="stylesheet" href="/common.css">
  <style>
    body {
      background: radial-gradient(circle at center, #231b2d 0%, #110d17 100%);
      color: #f7eed8;
      font-family: 'Cinzel', Georgia, serif;
      padding: 30px;
      margin: 0;
    }
    h1 {
      text-align: center;
      color: #ffd700;
      font-size: 2rem;
      margin-bottom: 8px;
      letter-spacing: 2px;
      text-shadow: 0 2px 10px rgba(0,0,0,0.8);
    }
    p.subtitle {
      text-align: center;
      color: #d7ccc8;
      margin-bottom: 28px;
      font-size: 1rem;
    }
    .section-title {
      font-size: 1.2rem;
      color: #e0a020;
      border-bottom: 1px solid rgba(224, 160, 32, 0.4);
      padding-bottom: 6px;
      margin: 24px 0 16px;
    }
    .cards-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      justify-content: center;
    }
    .card-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .card-caption {
      font-size: 0.8rem;
      color: #cebfa4;
      text-align: center;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <h1>TAJ MAHAL - ANALOGE KARTENKOLLEKTION</h1>
  <p class="subtitle">Originalgetreues Design im Stil von Franz Vohwinkel & Reiner Knizia: Mogul-Spitzbögen (Mihrab), edles Pergament, Juwelenfarben & historische Charakterillustrationen</p>

  <div class="section-title">1. Die Hof-Figuren & Rollen (Einzel-Symbole in den 4 Spielfarben & Weiß)</div>
  <div class="cards-grid" id="grid-figures"></div>

  <div class="section-title">2. Doppel-Symbolkarten (Kombinationen) & neutrale weiße Karten</div>
  <div class="cards-grid" id="grid-doubles"></div>

  <div class="section-title">3. Die 4 Sonderkarten (Einfluss & Paläste)</div>
  <div class="cards-grid" id="grid-specials"></div>

  <script type="module">
    import { generateAnalogCardSvg } from './card-art.js';

    const figureCards = [
      { id: 'c_rot_wesir', color: 'rot', symbols: ['Wesir'], label: 'Wesir (Rot / Politik)' },
      { id: 'c_gelb_general', color: 'gelb', symbols: ['General'], label: 'General (Gelb / Militär)' },
      { id: 'c_gruen_moench', color: 'gruen', symbols: ['Mönch'], label: 'Mönch (Grün / Religion)' },
      { id: 'c_violett_prinzessin', color: 'violett', symbols: ['Prinzessin'], label: 'Prinzessin (Violett / Hof)' },
      { id: 'c_rot_mogul', color: 'rot', symbols: ['Großmogul'], label: 'Großmogul (Rot / Herrscher)' },
      { id: 'c_gelb_elefant', color: 'gelb', symbols: ['Elefant'], label: 'Elefant (Gelb / Macht)' }
    ];

    const doubleCards = [
      { id: 'c_rot_w_g', color: 'rot', symbols: ['Wesir', 'General'], label: 'Wesir + General (Rot)' },
      { id: 'c_gruen_m_p', color: 'gruen', symbols: ['Mönch', 'Prinzessin'], label: 'Mönch + Prinzessin (Grün)' },
      { id: 'c_violett_mog_ele', color: 'violett', symbols: ['Großmogul', 'Elefant'], label: 'Großmogul + Elefant (Violett)' },
      { id: 'c_weiss_wesir', color: 'weiss', isWhite: true, symbols: ['Wesir'], label: 'Weißer Joker (Wesir)' },
      { id: 'c_weiss_general', color: 'weiss', isWhite: true, symbols: ['General'], label: 'Weißer Joker (General)' },
      { id: 'c_weiss_elefant', color: 'weiss', isWhite: true, symbols: ['Elefant'], label: 'Weißer Joker (Elefant)' }
    ];

    const specialCards = [
      { id: 'sc_wesir', isSpecial: true, specialType: 'Freie Farbwahl', label: 'Wesir-Sonderkarte' },
      { id: 'sc_general', isSpecial: true, specialType: '+2 Einflusspunkte', label: 'General-Sonderkarte' },
      { id: 'sc_moench', isSpecial: true, specialType: '+1 Großmogul', label: 'Mönch-Sonderkarte' },
      { id: 'sc_prinzessin', isSpecial: true, specialType: '+1 Elefant', label: 'Prinzessin-Sonderkarte' }
    ];

    function renderGrid(containerId, list, w, h) {
      const container = document.getElementById(containerId);
      list.forEach(c => {
        const item = document.createElement('div');
        item.className = 'card-item';
        item.innerHTML = generateAnalogCardSvg(c, { width: w, height: h }) + '<div class="card-caption">' + c.label + '</div>';
        container.appendChild(item);
      });
    }

    renderGrid('grid-figures', figureCards, 140, 210);
    renderGrid('grid-doubles', doubleCards, 140, 210);
    renderGrid('grid-specials', specialCards, 140, 210);
  </script>
</body>
</html>
  `;

  fs.writeFileSync(path.join(PUBLIC_DIR, 'cards-showcase.html'), showcaseHtml);

  // 2. Server starten
  const app = express();
  const server = http.createServer(app);
  const io = new SocketIOServer(server, { cors: { origin: '*' } });

  app.use(express.static(PUBLIC_DIR));
  app.use(express.json());

  let game = new TajMahalGame();
  const playerSockets = new Map();
  const socketPlayerMap = new Map();

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

    socket.on('join_game', ({ name, color }) => {
      try {
        const id = `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const p = game.addPlayer(id, name, color);
        playerSockets.set(p.id, socket.id);
        socketPlayerMap.set(socket.id, p.id);
        socket.emit('join_success', { playerId: p.id, player: p });
        socket.emit('player_state', game.getPlayerState(p.id));
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
      try {
        const playerId = socketPlayerMap.get(socket.id);
        if (playerId) {
          game.playCards(playerId, colorCardId, extraCardId);
          broadcastAll();
        }
      } catch (err) {
        socket.emit('game_error', { message: err.message });
      }
    });
  });

  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`Server läuft auf Port ${PORT}`);

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // 1. Screenshot: Die komplette Kollektion aller analogen Karten
  const pageGallery = await browser.newPage();
  await pageGallery.setViewport({ width: 1200, height: 1100, deviceScaleFactor: 2 });
  await pageGallery.goto(`http://localhost:${PORT}/cards-showcase.html`, { waitUntil: 'domcontentloaded' });
  await pageGallery.waitForSelector('.analog-card-svg');

  const galleryPath = path.join(SCREENSHOTS_DIR, 'analog_cards_showcase.png');
  await pageGallery.screenshot({ path: galleryPath, fullPage: true });
  console.log('Screenshot gespeichert:', galleryPath);

  // 2. Screenshot: Handy-Client mit echten analogen Handkarten
  const ctxTable = await browser.createBrowserContext();
  const pageTable = await ctxTable.newPage();
  pageTable.on('dialog', d => d.dismiss());
  await pageTable.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
  await pageTable.goto(`http://localhost:${PORT}/table.html`, { waitUntil: 'domcontentloaded' });

  const ctx1 = await browser.createBrowserContext();
  const pagePhone1 = await ctx1.newPage();
  pagePhone1.on('dialog', d => d.dismiss());
  await pagePhone1.setViewport({ width: 420, height: 860, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await pagePhone1.goto(`http://localhost:${PORT}/player.html`, { waitUntil: 'domcontentloaded' });

  const ctx2 = await browser.createBrowserContext();
  const pagePhone2 = await ctx2.newPage();
  pagePhone2.on('dialog', d => d.dismiss());
  await pagePhone2.setViewport({ width: 420, height: 860, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await pagePhone2.goto(`http://localhost:${PORT}/player.html`, { waitUntil: 'domcontentloaded' });

  // Spieler 1 beitreten
  await pagePhone1.waitForSelector('#player-name-input');
  await pagePhone1.type('#player-name-input', 'Maharaja Akbar');
  await pagePhone1.click('#btn-join-game');
  await new Promise(r => setTimeout(r, 600));

  // Spieler 2 beitreten
  await pagePhone2.waitForSelector('#player-name-input');
  await pagePhone2.type('#player-name-input', 'Prinzessin Nur');
  await pagePhone2.click('.color-opt[data-color="blue"]');
  await pagePhone2.click('#btn-join-game');
  await new Promise(r => setTimeout(r, 600));

  // Spiel starten
  await pageTable.click('#btn-start-game');
  await new Promise(r => setTimeout(r, 1000));

  // Screenshot Handy-Handkarten in voller Pracht
  await pagePhone1.waitForSelector('.player-card-wrapper');
  const phonePath = path.join(SCREENSHOTS_DIR, 'analog_phone_hand.png');
  await pagePhone1.screenshot({ path: phonePath });
  console.log('Screenshot gespeichert:', phonePath);

  // Eine Farbkarte auf dem Handy selektieren (schöner Gold-Schein-Effekt)
  await pagePhone1.click('.player-card-wrapper');
  await new Promise(r => setTimeout(r, 400));
  const phoneSelectedPath = path.join(SCREENSHOTS_DIR, 'analog_phone_card_selected.png');
  await pagePhone1.screenshot({ path: phoneSelectedPath });
  console.log('Screenshot gespeichert:', phoneSelectedPath);

  // Spieler 1 spielt die ausgewählte Karte aus falls Button aktiv
  const isPlayActive = await pagePhone1.$eval('#btn-play-cards', btn => !btn.disabled).catch(() => false);
  if (isPlayActive) {
    await pagePhone1.click('#btn-play-cards');
    await new Promise(r => setTimeout(r, 1000));
  }

  // Screenshot Haupttisch mit offenem Nachschub und ausgelegter Karte im Biet-Kampf
  const tableCardsPath = path.join(SCREENSHOTS_DIR, 'analog_table_view.png');
  await pageTable.screenshot({ path: tableCardsPath });
  console.log('Screenshot gespeichert:', tableCardsPath);

  // Kopiere die Screenshots in den Artifact-Ordner
  const artifactsToCopy = [
    { src: galleryPath, dest: path.join(ARTIFACT_DIR, 'analog_cards_showcase.png') },
    { src: phonePath, dest: path.join(ARTIFACT_DIR, 'analog_phone_hand.png') },
    { src: phoneSelectedPath, dest: path.join(ARTIFACT_DIR, 'analog_phone_card_selected.png') },
    { src: tableCardsPath, dest: path.join(ARTIFACT_DIR, 'analog_table_view.png') }
  ];

  for (const item of artifactsToCopy) {
    if (fs.existsSync(item.src)) {
      fs.copyFileSync(item.src, item.dest);
      console.log('Kopiert zu Artifact:', item.dest);
    }
  }

  await browser.close();
  server.close();
  console.log('=== SHOWCASE ERFOLGREICH ABGESCHLOSSEN ===');
}

run().catch(err => {
  console.error('Fehler beim Showcase:', err);
  process.exit(1);
});
