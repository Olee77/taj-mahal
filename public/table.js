// public/table.js - Client-Logik für das Hauptbrett (Tisch-Ansicht)
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
      const bt = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bt.setAttribute('x', c.x - 11);
      bt.setAttribute('y', c.y - 11);
      bt.setAttribute('width', '22');
      bt.setAttribute('height', '22');
      bt.setAttribute('rx', '4');
      bt.setAttribute('fill', '#4a154b');
      bt.setAttribute('stroke', '#e1bee7');
      bt.setAttribute('stroke-width', '1.5');
      g.appendChild(bt);

      const bText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      bText.setAttribute('x', c.x);
      bText.setAttribute('y', c.y + 4);
      bText.setAttribute('text-anchor', 'middle');
      bText.setAttribute('fill', '#fff');
      bText.setAttribute('font-size', '10');
      bText.setAttribute('font-weight', 'bold');
      bText.textContent = cState.bonusTile.type === 'commodity'
        ? (COMMODITY_EMOJIS[cState.bonusTile.commodity] || '📦')
        : (cState.bonusTile.vp ? `+${cState.bonusTile.vp}` : '🎴');
      g.appendChild(bText);
    }

    // Normaler Palast
    if (cState.normalPalace) {
      const p = state.players.find(x => x.id === cState.normalPalace);
      const colorHex = p ? p.color.hex : '#fff';

      // Palast-Symbol (Stilisiertes Holzkuppel-Icon)
      const palace = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      palace.setAttribute('x', c.x - 9);
      palace.setAttribute('y', c.y - 9);
      palace.setAttribute('width', '18');
      palace.setAttribute('height', '18');
      palace.setAttribute('rx', '3');
      palace.setAttribute('fill', colorHex);
      palace.setAttribute('stroke', '#fff');
      palace.setAttribute('stroke-width', '1.5');
      palace.setAttribute('class', 'palace-mark');
      g.appendChild(palace);
    }

    // Kronen-Palast (Zweiter Palast oder Krone oben drauf)
    if (cState.crownPalace) {
      const p = state.players.find(x => x.id === cState.crownPalace);
      const colorHex = p ? p.color.hex : '#ffd700';

      const crownP = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      crownP.setAttribute('cx', c.x + 6);
      crownP.setAttribute('cy', c.y - 6);
      crownP.setAttribute('r', '8');
      crownP.setAttribute('fill', colorHex);
      crownP.setAttribute('stroke', '#ffd700');
      crownP.setAttribute('stroke-width', '2');
      g.appendChild(crownP);

      const crownIcon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      crownIcon.setAttribute('x', c.x + 6);
      crownIcon.setAttribute('y', c.y - 2);
      crownIcon.setAttribute('text-anchor', 'middle');
      crownIcon.setAttribute('font-size', '10');
      crownIcon.setAttribute('class', 'crown-mark');
      crownIcon.textContent = '👑';
      g.appendChild(crownIcon);
    }

    svgCitiesLayer.appendChild(g);
  });

  // 3. Hof des Großmoguls (Court Panel rechts oben)
  svgCourtLayer.innerHTML = '';
  if (state.court) {
    // a) Achteckiges Provinz-Plättchen (x: 792, y: 195)
    const ptG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const ptBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    ptBox.setAttribute('x', '767');
    ptBox.setAttribute('y', '170');
    ptBox.setAttribute('width', '50');
    ptBox.setAttribute('height', '50');
    ptBox.setAttribute('rx', '8');
    ptBox.setAttribute('fill', state.court.provinceTile ? '#2e1c0c' : '#111');
    ptBox.setAttribute('stroke', state.court.provinceTile ? '#d7a15c' : '#444');
    ptBox.setAttribute('stroke-width', '2');
    ptG.appendChild(ptBox);

    if (state.court.provinceTile) {
      const ptText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      ptText.setAttribute('x', '792');
      ptText.setAttribute('y', '192');
      ptText.setAttribute('text-anchor', 'middle');
      ptText.setAttribute('fill', '#ffd700');
      ptText.setAttribute('font-size', '14');
      ptText.setAttribute('font-weight', 'bold');
      ptText.textContent = `#${state.court.provinceTile.number}`;
      ptG.appendChild(ptText);

      const goodsStr = state.court.provinceTile.goods.map(g => COMMODITY_EMOJIS[g] || g).join(' ');
      const ptGoods = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      ptGoods.setAttribute('x', '792');
      ptGoods.setAttribute('y', '210');
      ptGoods.setAttribute('text-anchor', 'middle');
      ptGoods.setAttribute('font-size', '11');
      ptGoods.textContent = goodsStr;
      ptG.appendChild(ptGoods);
    }
    svgCourtLayer.appendChild(ptG);

    // b) Krone (x: 866, y: 185)
    const crownG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const crownTxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    crownTxt.setAttribute('x', '866');
    crownTxt.setAttribute('y', '192');
    crownTxt.setAttribute('text-anchor', 'middle');
    crownTxt.setAttribute('font-size', '22');
    crownTxt.setAttribute('opacity', state.court.crown ? '1' : '0.2');
    crownTxt.textContent = '👑';
    crownG.appendChild(crownTxt);
    svgCourtLayer.appendChild(crownG);

    // c) 4 Einflussmarken
    const tokenCoords = {
      'Wesir': { x: 843, y: 138, sym: '👳' },
      'General': { x: 887, y: 138, sym: '⚔️' },
      'Mönch': { x: 843, y: 232, sym: '📿' },
      'Prinzessin': { x: 887, y: 232, sym: '👸' }
    };

    Object.entries(tokenCoords).forEach(([type, info]) => {
      const isAvailable = state.court.tokens && state.court.tokens[type];
      const tg = document.createElementNS('http://www.w3.org/2000/svg', 'g');

      const oval = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      oval.setAttribute('cx', info.x);
      oval.setAttribute('cy', info.y);
      oval.setAttribute('rx', '18');
      oval.setAttribute('ry', '13');
      oval.setAttribute('fill', isAvailable ? '#3d2514' : '#1a181e');
      oval.setAttribute('stroke', isAvailable ? '#ffd700' : '#444');
      oval.setAttribute('stroke-width', '1.5');
      oval.setAttribute('opacity', isAvailable ? '1' : '0.35');
      tg.appendChild(oval);

      const sym = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      sym.setAttribute('x', info.x);
      sym.setAttribute('y', info.y + 5);
      sym.setAttribute('text-anchor', 'middle');
      sym.setAttribute('font-size', '14');
      sym.setAttribute('opacity', isAvailable ? '1' : '0.35');
      sym.textContent = info.sym;
      tg.appendChild(sym);

      svgCourtLayer.appendChild(tg);
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
    const cardEl = createMiniCard(c);
    marketCardsEl.appendChild(cardEl);
  });
}

function createMiniCard(c) {
  const div = document.createElement('div');
  div.className = `card-mini ${c.color || 'weiss'}`;

  const syms = (c.symbols || []).map(s => SYMBOL_EMOJIS[s] || s).join('');
  div.innerHTML = `
    <span class="card-color-tag">${c.color ? c.color.toUpperCase() : 'WEISS'}</span>
    <div class="card-syms">${syms}</div>
  `;
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
