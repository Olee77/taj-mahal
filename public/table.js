// public/table.js - Client-Logik für das Hauptbrett (Tisch-Ansicht)
import { generateAnalogCardSvg } from './card-art.js';

const socket = io();

const SYMBOL_EMOJIS = {
  'Wesir': '👳',
  'General': '⚔️',
  'Mönch': '📿',
  'Prinzessin': '👸',
  'Großmogul': '👑',
  'Elefant': '🐘'
};

const COMMODITY_EMOJIS = {
  'Reis': '🍚',
  'Tee': '🍵',
  'Gewürze': '🌶️',
  'Edelsteine': '💎'
};

let boardData = { cities: [], provinces: [] };
let latestState = null;

// DOM Elemente
const svgCitiesLayer = document.getElementById('layer-cities');
const svgCourtLayer = document.getElementById('layer-court');
const svgProvinceGlow = document.getElementById('layer-province-glow');
const svgScoreTrack = document.getElementById('layer-score-track');

const visitBadge = document.getElementById('visit-badge');
const provinceName = document.getElementById('province-name');
const btnStartGame = document.getElementById('btn-start-game');
const btnShowQr = document.getElementById('btn-show-qr');
const btnCloseQr = document.getElementById('btn-close-qr');
const qrModal = document.getElementById('qr-modal');
const qrImg = document.getElementById('qr-img');
const joinUrlText = document.getElementById('join-url-text');

const marketCardsEl = document.getElementById('market-cards');
const deckCountsEl = document.getElementById('deck-counts');
const playersListEl = document.getElementById('players-list');
const playedCardsContainerEl = document.getElementById('played-cards-container');
const activeTurnBadge = document.getElementById('active-turn-badge');
const logStreamEl = document.getElementById('log-stream');

// Initialisierung
async function init() {
  try {
    // 1. Board-Daten laden
    const bRes = await fetch('/api/board');
    boardData = await bRes.json();

    // 2. Netzwerk- & QR-Info laden
    const infoRes = await fetch('/api/info');
    const info = await infoRes.json();
    qrImg.src = info.qrDataUrl;
    joinUrlText.textContent = info.joinUrl;

    // 3. Socket Registrierung
    socket.emit('register_table');
  } catch (err) {
    console.error('Initialisierungsfehler:', err);
  }
}

// Event Listeners
btnShowQr.addEventListener('click', () => qrModal.style.display = 'flex');
btnCloseQr.addEventListener('click', () => qrModal.style.display = 'none');
qrModal.addEventListener('click', (e) => {
  if (e.target === qrModal) qrModal.style.display = 'none';
});

btnStartGame.addEventListener('click', () => {
  socket.emit('start_game');
});

// Socket Events
socket.on('table_state', state => {
  latestState = state;
  renderTable(state);
});

socket.on('game_error', ({ message }) => {
  alert(`Hinweis: ${message}`);
});

// Haupt-Render-Methode
function renderTable(state) {
  renderHeader(state);
  renderBoardSvg(state);
  renderMarket(state);
  renderPlayers(state);
  renderBidding(state);
  renderLogs(state);
}

function renderHeader(state) {
  if (state.status === 'lobby') {
    visitBadge.textContent = 'LOBBY';
    provinceName.textContent = `Warte auf Spieler (${state.players.length}/5)...`;
    btnStartGame.style.display = 'inline-flex';
    btnStartGame.disabled = state.players.length < 2;
  } else if (state.status === 'playing') {
    btnStartGame.style.display = 'none';
    const visitNum = state.currentVisitIndex + 1;
    visitBadge.textContent = `BESUCH ${visitNum}/12`;
    provinceName.textContent = state.currentProvince
      ? `${state.currentProvince.name} (Plättchen #${state.currentProvince.tileNumber || visitNum})`
      : 'In Auswertung...';
  } else if (state.status === 'finished') {
    visitBadge.textContent = 'SPIELENDE';
    provinceName.textContent = 'Partie abgeschlossen! Siehe Endwertung.';
    btnStartGame.style.display = 'none';
  }
}

// SVG Spielbrett rendern
function renderBoardSvg(state) {
  if (!boardData.cities.length) return;

  // 1. Aktive Provinz Glow
  svgProvinceGlow.innerHTML = '';
  if (state.status === 'playing' && state.currentProvince) {
    const prov = boardData.provinces.find(p => p.id === state.currentProvince.id);
    if (prov) {
      const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      glow.setAttribute('cx', prov.center.x);
      glow.setAttribute('cy', prov.center.y);
      glow.setAttribute('r', '75');
      glow.setAttribute('fill', 'rgba(255, 215, 0, 0.25)');
      glow.setAttribute('stroke', '#ffd700');
      glow.setAttribute('stroke-width', '3');
      glow.setAttribute('class', 'province-glow-circle');
      svgProvinceGlow.appendChild(glow);

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', prov.center.x);
      label.setAttribute('y', prov.center.y - 82);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('fill', '#ffd700');
      label.setAttribute('font-size', '16');
      label.setAttribute('font-weight', 'bold');
      label.setAttribute('filter', 'drop-shadow(0 2px 4px #000)');
      label.textContent = `AKTIV: ${prov.name}`;
      svgProvinceGlow.appendChild(label);
    }
  }

  // 2. Städte & Paläste
  svgCitiesLayer.innerHTML = '';
  boardData.cities.forEach(c => {
    const cState = state.citiesState[c.id] || {};
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'city-node');

    // Grundkreis der Stadt
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', c.x);
    circle.setAttribute('cy', c.y);
    circle.setAttribute('r', c.isFortress ? '16' : '13');
    circle.setAttribute('class', `city-base ${c.isFortress ? 'fortress' : ''}`);
    g.appendChild(circle);

    // Festungs-Bonusplättchen (falls noch nicht genommen)
    if (cState.bonusTile) {
      const btImg = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      btImg.setAttribute('href', cState.bonusTile.image || '/assets/tokens/fortress_points.png');
      btImg.setAttribute('x', c.x - 12);
      btImg.setAttribute('y', c.y - 12);
      btImg.setAttribute('width', '24');
      btImg.setAttribute('height', '24');
      btImg.setAttribute('class', 'fortress-tile-img');
      g.appendChild(btImg);
    }

    // Normaler Palast (authentische 3D-Palastminiatur)
    if (cState.normalPalace) {
      const p = state.players.find(x => x.id === cState.normalPalace);
      const palMap = {
        'red': '/assets/palaces/palace_red.png',
        'blue': '/assets/palaces/palace_blue.png',
        'green': '/assets/palaces/palace_brown.png',
        'yellow': '/assets/palaces/palace_beige.png',
        'purple': '/assets/palaces/palace_grey.png'
      };
      const palImg = (p && palMap[p.color.id]) || '/assets/palaces/palace_beige.png';

      const palace = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      palace.setAttribute('href', palImg);
      palace.setAttribute('x', c.x - 14);
      palace.setAttribute('y', c.y - 20);
      palace.setAttribute('width', '28');
      palace.setAttribute('height', '28');
      palace.setAttribute('class', 'palace-miniature');
      g.appendChild(palace);
    }

    // Kronen-Palast (Zweiter Palast mit Krone oben drauf)
    if (cState.crownPalace) {
      const p = state.players.find(x => x.id === cState.crownPalace);
      const palMap = {
        'red': '/assets/palaces/palace_red.png',
        'blue': '/assets/palaces/palace_blue.png',
        'green': '/assets/palaces/palace_brown.png',
        'yellow': '/assets/palaces/palace_beige.png',
        'purple': '/assets/palaces/palace_grey.png'
      };
      const palImg = (p && palMap[p.color.id]) || '/assets/palaces/palace_beige.png';

      const crownPal = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      crownPal.setAttribute('href', palImg);
      crownPal.setAttribute('x', c.x - 2);
      crownPal.setAttribute('y', c.y - 24);
      crownPal.setAttribute('width', '22');
      crownPal.setAttribute('height', '22');
      crownPal.setAttribute('class', 'palace-miniature');
      g.appendChild(crownPal);

      const crownIcon = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      crownIcon.setAttribute('href', '/assets/tokens/crown.png');
      crownIcon.setAttribute('x', c.x + 4);
      crownIcon.setAttribute('y', c.y - 30);
      crownIcon.setAttribute('width', '16');
      crownIcon.setAttribute('height', '16');
      crownIcon.setAttribute('class', 'crown-mark');
      g.appendChild(crownIcon);
    }

    svgCitiesLayer.appendChild(g);
  });

  // 3. Hof des Großmoguls (Court Panel rechts oben)
  svgCourtLayer.innerHTML = '';
  if (state.court) {
    // a) Achteckiges Provinz-Plättchen (Originalfoto)
    if (state.court.provinceTile) {
      const tileImg = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      const numStr = String(state.court.provinceTile.number).padStart(2, '0');
      tileImg.setAttribute('href', state.court.provinceTile.image || `/assets/tiles/tile_${numStr}.png`);
      tileImg.setAttribute('x', '764');
      tileImg.setAttribute('y', '166');
      tileImg.setAttribute('width', '56');
      tileImg.setAttribute('height', '56');
      tileImg.setAttribute('class', 'court-province-tile');
      svgCourtLayer.appendChild(tileImg);
    }

    // b) Krone (Originalfoto)
    const crownImg = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    crownImg.setAttribute('href', '/assets/tokens/crown.png');
    crownImg.setAttribute('x', '844');
    crownImg.setAttribute('y', '166');
    crownImg.setAttribute('width', '44');
    crownImg.setAttribute('height', '44');
    crownImg.setAttribute('opacity', state.court.crown ? '1' : '0.22');
    crownImg.setAttribute('class', 'court-crown');
    svgCourtLayer.appendChild(crownImg);

    // c) 4 Einflussmarken (Originalfotos)
    const tokenInfo = {
      'Wesir': { x: 820, y: 114, img: '/assets/tokens/influence_vizier.png' },
      'General': { x: 868, y: 114, img: '/assets/tokens/influence_general.png' },
      'Mönch': { x: 820, y: 216, img: '/assets/tokens/influence_monk.png' },
      'Prinzessin': { x: 868, y: 216, img: '/assets/tokens/influence_princess.png' }
    };

    Object.entries(tokenInfo).forEach(([type, info]) => {
      const isAvailable = state.court.tokens && state.court.tokens[type];
      const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      img.setAttribute('href', info.img);
      img.setAttribute('x', info.x);
      img.setAttribute('y', info.y);
      img.setAttribute('width', '40');
      img.setAttribute('height', '40');
      img.setAttribute('opacity', isAvailable ? '1' : '0.22');
      img.setAttribute('class', 'court-influence-token');
      svgCourtLayer.appendChild(img);
    });
  }

  // 4. Wertungsleiste (0 - 65)
  svgScoreTrack.innerHTML = '';
  state.players.forEach((p, idx) => {
    const pos = getScoreTrackCoord(p.score, idx, state.players.length);
    const stone = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    stone.setAttribute('cx', pos.x);
    stone.setAttribute('cy', pos.y);
    stone.setAttribute('r', '9');
    stone.setAttribute('fill', p.color.hex);
    stone.setAttribute('class', 'score-stone');
    svgScoreTrack.appendChild(stone);

    const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    txt.setAttribute('x', pos.x);
    txt.setAttribute('y', pos.y + 4);
    txt.setAttribute('text-anchor', 'middle');
    txt.setAttribute('fill', '#fff');
    txt.setAttribute('font-size', '10');
    txt.setAttribute('font-weight', 'bold');
    txt.textContent = p.name.substring(0, 1).toUpperCase();
    svgScoreTrack.appendChild(txt);
  });
}

function getScoreTrackCoord(score, playerIdx, totalPlayers) {
  const norm = ((score % 66) + 66) % 66;
  const padX = 42;
  const padY = 36;
  const W = 1024 - padX * 2;
  const H = 719 - padY * 2;

  let base = { x: padX, y: padY };
  if (norm <= 15) {
    const t = norm / 15;
    base = { x: padX, y: padY + H * (1 - t) };
  } else if (norm <= 35) {
    const t = (norm - 15) / 20;
    base = { x: padX + W * t, y: padY };
  } else if (norm <= 50) {
    const t = (norm - 35) / 15;
    base = { x: padX + W, y: padY + H * t };
  } else {
    const t = (norm - 50) / 16;
    base = { x: padX + W * (1 - t), y: padY + H };
  }

  // Offset bei mehreren Spielern auf demselben Feld
  const offset = (playerIdx - (totalPlayers - 1) / 2) * 5;
  return { x: base.x + offset, y: base.y + offset };
}

// Offenen Nachschub rendern
function renderMarket(state) {
  deckCountsEl.textContent = `Nachziehstapel: ${state.deckCount} | Ablage: ${state.discardCount}`;
  marketCardsEl.innerHTML = '';

  state.marketCards.forEach(c => {
    const cardEl = document.createElement('div');
    cardEl.className = 'market-card-wrapper';
    cardEl.title = `${c.color ? c.color.toUpperCase() : 'WEISS'}: ${(c.symbols || []).join(' + ')}`;
    if (c.image) {
      cardEl.innerHTML = `<img src="${c.image}" class="market-photo-card" alt="${c.name || 'Karte'}" />`;
    } else {
      cardEl.innerHTML = generateAnalogCardSvg(c, { width: 62, height: 93, isMini: false });
    }
    marketCardsEl.appendChild(cardEl);
  });
}

function createMiniCard(c) {
  const div = document.createElement('div');
  div.className = 'table-mini-card-wrapper';
  div.title = `${c.color ? c.color.toUpperCase() : 'WEISS'}: ${(c.symbols || []).join(' + ')}`;
  if (c.image) {
    div.innerHTML = `<img src="${c.image}" class="table-mini-card-photo" alt="${c.name || 'Karte'}" />`;
  } else {
    div.innerHTML = generateAnalogCardSvg(c, { width: 44, height: 66, isMini: true });
  }
  return div;
}

// Spielerliste in Sidebar
function renderPlayers(state) {
  playersListEl.innerHTML = '';
  if (state.players.length === 0) {
    playersListEl.innerHTML = '<div class="empty-state">Noch keine Spieler verbunden...</div>';
    return;
  }

  state.players.forEach(p => {
    const div = document.createElement('div');
    div.className = 'player-row';
    div.style.borderLeftColor = p.color.hex;

    // Waren-Icons zählen
    const commCounts = {};
    p.commodities.forEach(c => commCounts[c] = (commCounts[c] || 0) + 1);
    const commStr = Object.entries(commCounts)
      .map(([k, v]) => `${COMMODITY_EMOJIS[k] || k}x${v}`)
      .join(' ');

    div.innerHTML = `
      <div class="player-info">
        <span class="player-badge" style="background:${p.color.hex}"></span>
        <span class="player-name-text">${p.name}</span>
      </div>
      <div class="player-stats">
        <span class="player-items" title="Waren">${commStr || '—'}</span>
        <span class="player-items" title="Paläste übrig">🏰 ${p.palacesLeft}</span>
        <span class="player-score">${p.score} VP</span>
      </div>
    `;
    playersListEl.appendChild(div);
  });
}

// Aktueller Kampf um die Provinz (Ausgelegte Karten)
function renderBidding(state) {
  playedCardsContainerEl.innerHTML = '';
  if (state.status !== 'playing') {
    activeTurnBadge.textContent = state.status.toUpperCase();
    return;
  }

  const activeP = state.players[state.activePlayerIndex];
  activeTurnBadge.textContent = activeP ? `Am Zug: ${activeP.name}` : '--';

  state.players.forEach(p => {
    const tableau = document.createElement('div');
    tableau.className = `player-tableau ${p.withdrawn ? 'withdrawn' : ''} ${activeP && activeP.id === p.id ? 'active-turn' : ''}`;

    // Symbol-Summen berechnen
    const tally = { 'Wesir': 0, 'General': 0, 'Mönch': 0, 'Prinzessin': 0, 'Großmogul': 0, 'Elefant': 0 };
    p.playedCards.forEach(c => {
      (c.symbols || []).forEach(s => { if (tally[s] !== undefined) tally[s]++; });
      if (c.specialType === '+1 Großmogul') tally['Großmogul']++;
      if (c.specialType === '+1 Elefant') tally['Elefant']++;
    });

    const tallyHtml = Object.entries(tally)
      .filter(([_, count]) => count > 0)
      .map(([sym, count]) => `<span class="tally-item">${SYMBOL_EMOJIS[sym] || sym} <strong>${count}</strong></span>`)
      .join('');

    tableau.innerHTML = `
      <div class="tableau-header">
        <span style="color:${p.color.hex}">● ${p.name}</span>
        <span>${p.withdrawn ? '🛑 Zurückgezogen' : (p.lockedColor ? `Farbe: ${p.lockedColor.toUpperCase()}` : 'Noch keine Farbe')}</span>
      </div>
      <div class="tableau-symbols-tally">${tallyHtml || '<em>Keine Karten ausgelegt</em>'}</div>
      <div class="tableau-cards-row"></div>
    `;

    const row = tableau.querySelector('.tableau-cards-row');
    p.playedCards.forEach(c => {
      row.appendChild(createMiniCard(c));
    });

    playedCardsContainerEl.appendChild(tableau);
  });
}

// Protokoll-Stream
function renderLogs(state) {
  logStreamEl.innerHTML = '';
  (state.log || []).forEach(entry => {
    const div = document.createElement('div');
    div.className = 'log-entry';
    div.innerHTML = `<span class="log-time">[${entry.timestamp}]</span> ${entry.message}`;
    logStreamEl.appendChild(div);
  });
  logStreamEl.scrollTop = logStreamEl.scrollHeight;
}

// Start
init();
