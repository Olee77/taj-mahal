// public/player.js - Client-Logik für den Smartphone-Controller
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

let myPlayerId = localStorage.getItem('tm_player_id') || null;
let selectedColor = 'red';
let currentGameState = null;
let selectedCards = new Set();
let citiesData = [];

// DOM Elemente
const viewLobby = document.getElementById('view-lobby');
const viewGame = document.getElementById('view-game');

const playerNameInput = document.getElementById('player-name-input');
const colorPicker = document.getElementById('color-picker');
const btnJoinGame = document.getElementById('btn-join-game');

const headerColorDot = document.getElementById('header-color-dot');
const headerPlayerName = document.getElementById('header-player-name');
const headerScore = document.getElementById('header-score');
const headerPalaces = document.getElementById('header-palaces');

const turnBanner = document.getElementById('turn-banner');
const turnTitle = document.getElementById('turn-title');
const turnSubtitle = document.getElementById('turn-subtitle');
const colorLockBadge = document.getElementById('color-lock-badge');

const handCountEl = document.getElementById('hand-count');
const handCardsContainer = document.getElementById('hand-cards-container');
const selectedCountEl = document.getElementById('selected-count');
const btnPlayCards = document.getElementById('btn-play-cards');
const btnWithdraw = document.getElementById('btn-withdraw');

const inventoryToggle = document.getElementById('inventory-toggle');
const inventoryDrawer = document.getElementById('inventory-drawer');
const invArrow = document.getElementById('inv-arrow');
const invTokens = document.getElementById('inv-tokens');
const invCommodities = document.getElementById('inv-commodities');
const invSpecials = document.getElementById('inv-specials');

// Modals
const modalPalace = document.getElementById('modal-palace');
const palaceModalTitle = document.getElementById('palace-modal-title');
const palaceModalDesc = document.getElementById('palace-modal-desc');
const palaceCityList = document.getElementById('palace-city-list');

const modalDraft = document.getElementById('modal-draft');
const draftModalDesc = document.getElementById('draft-modal-desc');
const draftCardsGrid = document.getElementById('draft-cards-grid');
const btnConfirmDraft = document.getElementById('btn-confirm-draft');
let selectedDraftCards = new Set();

// Initialisierung
async function init() {
  // Städte-Daten für Palastplatzierung laden
  try {
    const bRes = await fetch('/api/board');
    const bData = await bRes.json();
    citiesData = bData.cities;
  } catch (e) {
    console.error('Fehler beim Laden der Board-Daten:', e);
  }

  // Farbauswahl in Lobby
  const colorOptions = colorPicker.querySelectorAll('.color-opt');
  colorOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      colorOptions.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedColor = opt.getAttribute('data-color');
    });
  });
  colorOptions[0].classList.add('selected');

  // Automatische Wiederverbindung
  if (myPlayerId) {
    socket.emit('join_game', { playerId: myPlayerId });
  }

  setupEventListeners();
}

function setupEventListeners() {
  btnJoinGame.addEventListener('click', () => {
    const name = playerNameInput.value.trim() || 'Spieler';
    socket.emit('join_game', { name, color: selectedColor });
  });

  btnPlayCards.addEventListener('click', onPlayCardsClicked);
  btnWithdraw.addEventListener('click', onWithdrawClicked);

  inventoryToggle.addEventListener('click', () => {
    const isClosed = inventoryDrawer.style.display === 'none';
    inventoryDrawer.style.display = isClosed ? 'flex' : 'none';
    invArrow.textContent = isClosed ? '▼' : '▲';
  });

  btnConfirmDraft.addEventListener('click', () => {
    if (selectedDraftCards.size > 0) {
      socket.emit('draft_market_cards', { cardIds: Array.from(selectedDraftCards) });
      selectedDraftCards.clear();
      modalDraft.style.display = 'none';
    }
  });
}

// Socket Events
socket.on('join_success', ({ playerId, player }) => {
  myPlayerId = playerId;
  localStorage.setItem('tm_player_id', playerId);
  viewLobby.style.display = 'none';
  viewGame.style.display = 'flex';
});

socket.on('player_state', state => {
  currentGameState = state;
  renderPlayerView(state);
});

socket.on('game_error', ({ message }) => {
  alert(`Regelhinweis: ${message}`);
});

// View Rendern
function renderPlayerView(state) {
  if (!state) return;

  // Header
  headerPlayerName.textContent = state.name;
  headerColorDot.style.background = state.color.hex;
  headerScore.textContent = `${state.score} VP`;

  // Farbzwang
  if (state.lockedColor) {
    colorLockBadge.textContent = state.lockedColor.toUpperCase();
    colorLockBadge.style.background = `var(--card-${state.lockedColor})`;
    colorLockBadge.style.color = '#fff';
  } else {
    colorLockBadge.textContent = 'FREI';
    colorLockBadge.style.background = '#443754';
    colorLockBadge.style.color = 'var(--gold-text)';
  }

  // Runden- & Zugbanner
  if (state.status === 'lobby') {
    turnTitle.textContent = 'Warten auf Spielstart...';
    turnSubtitle.textContent = 'Der Spielleiter startet die Partie am Tisch-Bildschirm.';
    turnBanner.className = 'turn-banner';
    btnPlayCards.disabled = true;
    btnWithdraw.disabled = true;
  } else if (state.status === 'playing') {
    const visitNum = (state.currentVisitIndex || 0) + 1;
    turnSubtitle.textContent = `Besuch ${visitNum}/12: ${state.currentProvince ? state.currentProvince.name : ''}`;

    if (state.withdrawn) {
      turnTitle.textContent = '🛑 Du hast dich zurückgezogen';
      turnBanner.className = 'turn-banner';
      btnPlayCards.disabled = true;
      btnWithdraw.disabled = true;
    } else if (state.isMyTurn) {
      turnTitle.textContent = '⭐ DU BIST AM ZUG!';
      turnBanner.className = 'turn-banner my-turn';
      btnWithdraw.disabled = false;
      updatePlayButton();
    } else {
      turnTitle.textContent = 'Warte auf Mitspieler...';
      turnBanner.className = 'turn-banner';
      btnPlayCards.disabled = true;
      btnWithdraw.disabled = true;
    }
  } else if (state.status === 'finished') {
    turnTitle.textContent = '🏆 Partie beendet!';
    turnSubtitle.textContent = `Dein Endstand: ${state.score} Punkte.`;
    turnBanner.className = 'turn-banner';
    btnPlayCards.disabled = true;
    btnWithdraw.disabled = true;
  }

  // Handkarten rendern
  renderHandCards(state);

  // Inventar aktualisieren
  renderInventory(state);

  // Ausstehende Aktionen prüfen (Palast setzen oder Nachschub wählen)
  handlePendingChoices(state);
}

function renderHandCards(state) {
  handCountEl.textContent = state.hand.length;
  handCardsContainer.innerHTML = '';

  state.hand.forEach(c => {
    const cardEl = document.createElement('div');
    const isSpecial = c.isSpecial;
    const isWhite = c.isWhite;
    const colorClass = isSpecial ? 'special' : (isWhite ? 'weiss' : c.color);

    cardEl.className = `player-card ${colorClass} ${selectedCards.has(c.id) ? 'selected' : ''}`;

    // Farbzwang-Prüfung: Falls Farbe gelockt ist und die Karte eine andere reguläre Farbe hat
    const isForbiddenColor = state.lockedColor && !isWhite && !isSpecial && c.color !== state.lockedColor;
    if (isForbiddenColor && !selectedCards.has(c.id)) {
      // Prüfen, ob eine Wesir-Sonderkarte ("Freie Farbwahl") gewählt ist
      const hasWesirSelected = Array.from(selectedCards).some(id => {
        const found = state.hand.find(x => x.id === id);
        return found && found.specialType === 'Freie Farbwahl';
      });
      if (!hasWesirSelected) {
        cardEl.classList.add('disabled');
      }
    }

    const syms = (c.symbols || []).map(s => SYMBOL_EMOJIS[s] || s).join(' ');
    const tagText = isSpecial ? 'SONDER' : (isWhite ? 'WEISS' : c.color.toUpperCase());
    const descText = isSpecial ? c.specialType : (c.symbols ? c.symbols.join(' + ') : '');

    cardEl.innerHTML = `
      <div class="card-top-tag">
        <span>${tagText}</span>
        <span>${isSpecial ? '★' : ''}</span>
      </div>
      <div class="card-center-syms">${syms || '★'}</div>
      <div class="card-bottom-desc">${descText}</div>
    `;

    cardEl.addEventListener('click', () => onCardClicked(c, state));
    handCardsContainer.appendChild(cardEl);
  });
}

function onCardClicked(card, state) {
  if (!state.isMyTurn || state.withdrawn) return;

  if (selectedCards.has(card.id)) {
    selectedCards.delete(card.id);
  } else {
    // Validierung: max. 1 Farbkarte + max. 1 weiße/Sonderkarte
    const isWhiteOrSpecial = card.isWhite || card.isSpecial;

    // Bereits ausgewählte analysieren
    let existingColorCard = null;
    let existingExtraCard = null;

    selectedCards.forEach(id => {
      const c = state.hand.find(x => x.id === id);
      if (c) {
        if (c.isWhite || c.isSpecial) existingExtraCard = c;
        else existingColorCard = c;
      }
    });

    if (isWhiteOrSpecial) {
      if (existingExtraCard) {
        selectedCards.delete(existingExtraCard.id);
      }
      selectedCards.add(card.id);
    } else {
      if (existingColorCard) {
        selectedCards.delete(existingColorCard.id);
      }
      selectedCards.add(card.id);
    }
  }

  updatePlayButton();
  renderHandCards(state);
}

function updatePlayButton() {
  selectedCountEl.textContent = selectedCards.size;

  if (!currentGameState || !currentGameState.isMyTurn || currentGameState.withdrawn) {
    btnPlayCards.disabled = true;
    return;
  }

  // Muss mindestens genau 1 reguläre Farbkarte enthalten!
  let hasColorCard = false;
  selectedCards.forEach(id => {
    const c = currentGameState.hand.find(x => x.id === id);
    if (c && !c.isWhite && !c.isSpecial) hasColorCard = true;
  });

  btnPlayCards.disabled = !hasColorCard || selectedCards.size > 2;
}

function onPlayCardsClicked() {
  if (!currentGameState || !currentGameState.isMyTurn) return;

  let colorCardId = null;
  let extraCardId = null;

  selectedCards.forEach(id => {
    const c = currentGameState.hand.find(x => x.id === id);
    if (c) {
      if (c.isWhite || c.isSpecial) extraCardId = c.id;
      else colorCardId = c.id;
    }
  });

  if (!colorCardId) {
    alert('Du musst mindestens 1 Farbkarte auswählen.');
    return;
  }

  socket.emit('play_cards', { colorCardId, extraCardId });
  selectedCards.clear();
  updatePlayButton();
}

function onWithdrawClicked() {
  if (!confirm('Möchtest du dich wirklich aus der aktuellen Provinz zurückziehen?')) return;
  socket.emit('withdraw');
  selectedCards.clear();
  updatePlayButton();
}

// Inventar rendern
function renderInventory(state) {
  // Marken
  invTokens.innerHTML = '';
  Object.entries(state.tokens || {}).forEach(([tok, count]) => {
    if (count > 0) {
      const chip = document.createElement('div');
      chip.className = 'inv-chip';
      chip.innerHTML = `${SYMBOL_EMOJIS[tok] || tok} ${tok}: <strong>${count}</strong>`;
      invTokens.appendChild(chip);
    }
  });
  if (invTokens.children.length === 0) invTokens.innerHTML = '<em>Keine Marken</em>';

  // Waren
  invCommodities.innerHTML = '';
  const cCounts = {};
  (state.commodities || []).forEach(c => cCounts[c] = (cCounts[c] || 0) + 1);
  Object.entries(cCounts).forEach(([c, cnt]) => {
    const chip = document.createElement('div');
    chip.className = 'inv-chip';
    chip.innerHTML = `${COMMODITY_EMOJIS[c] || c} ${c}: <strong>${cnt}</strong>`;
    invCommodities.appendChild(chip);
  });
  if (invCommodities.children.length === 0) invCommodities.innerHTML = '<em>Keine Waren</em>';

  // Sonderkarten
  invSpecials.innerHTML = '';
  const specials = state.hand.filter(c => c.isSpecial);
  specials.forEach(sc => {
    const chip = document.createElement('div');
    chip.className = 'inv-chip';
    chip.innerHTML = `★ ${sc.specialType}`;
    invSpecials.appendChild(chip);
  });
  if (invSpecials.children.length === 0) invSpecials.innerHTML = '<em>Keine</em>';
}

// Ausstehende Palast- & Karten-Entscheidungen
function handlePendingChoices(state) {
  const pChoice = state.pendingChoiceForMe;
  if (!pChoice) {
    modalPalace.style.display = 'none';
    modalDraft.style.display = 'none';
    return;
  }

  // 1. Palast-Platzierung
  if (pChoice.normalPalacesLeft > 0 || pChoice.crownPalaceLeft > 0) {
    modalDraft.style.display = 'none';
    modalPalace.style.display = 'flex';

    const isCrown = pChoice.crownPalaceLeft > 0 && pChoice.normalPalacesLeft === 0;
    palaceModalTitle.textContent = isCrown ? '👑 Kronen-Palast setzen!' : '🏰 Palast errichten!';
    palaceModalDesc.textContent = isCrown
      ? 'Wähle eine beliebige Stadt in der aktuellen Provinz für deinen Kronen-Palast (kann auch besetzt sein!).'
      : `Wähle eine freie Stadt für deinen Palast (noch ${pChoice.normalPalacesLeft} zu setzen):`;

    palaceCityList.innerHTML = '';
    const provCities = citiesData.filter(c => c.province === state.currentProvince.id);

    provCities.forEach(city => {
      const btn = document.createElement('button');
      btn.className = 'city-opt-btn';
      btn.innerHTML = `
        <div>
          <strong>${city.name}</strong>
          <span style="font-size:0.8rem; color:#b39ddb;">${city.isFortress ? ' [Festung]' : ''}</span>
        </div>
        <span class="badge badge-gold">Hier bauen</span>
      `;
      btn.addEventListener('click', () => {
        socket.emit('place_palace', { cityId: city.id, isCrown });
      });
      palaceCityList.appendChild(btn);
    });
    return;
  }

  // 2. Kartennachschub-Auswahl
  if (pChoice.cardsToDraftLeft > 0) {
    modalPalace.style.display = 'none';
    modalDraft.style.display = 'flex';

    draftModalDesc.textContent = `Wähle genau ${pChoice.cardsToDraftLeft} Karte(n) aus dem Nachschub (${selectedDraftCards.size}/${pChoice.cardsToDraftLeft} gewählt):`;
    draftCardsGrid.innerHTML = '';

    (state.marketCards || []).forEach(mc => {
      const cardEl = document.createElement('div');
      cardEl.className = `player-card ${mc.color || 'weiss'} ${selectedDraftCards.has(mc.id) ? 'selected' : ''}`;
      cardEl.style.height = '120px';

      const syms = (mc.symbols || []).map(s => SYMBOL_EMOJIS[s] || s).join(' ');
      cardEl.innerHTML = `
        <div class="card-top-tag">${mc.color ? mc.color.toUpperCase() : 'WEISS'}</div>
        <div class="card-center-syms" style="font-size:1.6rem;">${syms}</div>
      `;

      cardEl.addEventListener('click', () => {
        if (selectedDraftCards.has(mc.id)) {
          selectedDraftCards.delete(mc.id);
        } else {
          if (selectedDraftCards.size < pChoice.cardsToDraftLeft) {
            selectedDraftCards.add(mc.id);
          }
        }
        draftModalDesc.textContent = `Wähle genau ${pChoice.cardsToDraftLeft} Karte(n) (${selectedDraftCards.size}/${pChoice.cardsToDraftLeft} gewählt):`;
        btnConfirmDraft.disabled = selectedDraftCards.size !== pChoice.cardsToDraftLeft;
        handlePendingChoices(state);
      });

      draftCardsGrid.appendChild(cardEl);
    });

    btnConfirmDraft.disabled = selectedDraftCards.size !== pChoice.cardsToDraftLeft;
    return;
  }

  modalPalace.style.display = 'none';
  modalDraft.style.display = 'none';
}

init();
