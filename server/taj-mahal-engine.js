// server/taj-mahal-engine.js - Vollständige Spiellogik für Taj Mahal (Reiner Knizia)
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  COMMODITIES,
  INFLUENCE_TYPES,
  PROVINCES,
  CITIES,
  ROADS
} from './board-data.js';

export const CARD_COLORS = {
  RED: 'rot',
  YELLOW: 'gelb',
  GREEN: 'gruen',
  PURPLE: 'violett'
};

export const SYMBOLS = {
  VIZIER: 'Wesir',
  GENERAL: 'General',
  MONK: 'Mönch',
  PRINCESS: 'Prinzessin',
  MOGUL: 'Großmogul',
  ELEPHANT: 'Elefant'
};

export const SPECIAL_CARDS = {
  FREE_COLOR: 'Freie Farbwahl',     // Wesir (2 Wesir-Marken)
  BONUS_2VP: '+2 Einflusspunkte',   // General (2 General-Marken)
  MOGUL_PLUS1: '+1 Großmogul',       // Mönch (2 Mönch-Marken)
  ELEPHANT_PLUS1: '+1 Elefant'       // Prinzessin (2 Prinzessin-Marken)
};

export const PLAYER_COLORS = [
  { id: 'red', name: 'Rot', hex: '#d32f2f' },
  { id: 'blue', name: 'Blau', hex: '#1976d2' },
  { id: 'green', name: 'Grün', hex: '#388e3c' },
  { id: 'yellow', name: 'Gelb', hex: '#fbc02d' },
  { id: 'purple', name: 'Violett', hex: '#7b1fa2' }
];

export class TajMahalGame {
  constructor(options = {}) {
    this.maxPlayers = options.maxPlayers || 4;
    this.players = []; // { id, name, color, score, hand, playedCards, lockedColor, withdrawn, tokens, specialCards, commodities, palacesLeft }
    this.status = 'lobby'; // 'lobby', 'playing', 'finished'
    
    // Spielbrett-Zustand
    this.citiesState = {}; // cityId -> { normalPalace: playerId|null, crownPalace: playerId|null, bonusTile: tile|null }
    this.provinceTiles = []; // 12 Plättchen, index 0..11
    this.fortressBonusTiles = []; // 16 Plättchen auf Festungen
    
    // Kartenstapel
    this.deck = [];
    this.discardPile = [];
    this.marketCards = []; // Offener Kartennachschub
    this.specialCardsSupply = {
      [SPECIAL_CARDS.FREE_COLOR]: true,
      [SPECIAL_CARDS.BONUS_2VP]: true,
      [SPECIAL_CARDS.MOGUL_PLUS1]: true,
      [SPECIAL_CARDS.ELEPHANT_PLUS1]: true
    };
    
    // Runden- & Zugverwaltung
    this.currentVisitIndex = 0; // 0 bis 11 (entspricht Besuch 1 bis 12)
    this.currentProvince = null; // Aktuell besuchte Provinz
    this.startPlayerIndex = 0; // Startspieler der aktuellen Runde
    this.activePlayerIndex = 0; // Spieler, der gerade am Zug ist
    
    // Hof des Großmoguls (was liegt aktuell aus)
    this.court = {
      provinceTile: null,
      crown: true,
      tokens: {
        [INFLUENCE_TYPES.VIZIER]: true,
        [INFLUENCE_TYPES.GENERAL]: true,
        [INFLUENCE_TYPES.MONK]: true,
        [INFLUENCE_TYPES.PRINCESS]: true
      }
    };

    // Protokoll & Aktionen
    this.log = [];
    this.pendingWithdrawalChoice = null; // Wenn ein Spieler Paläste/Karten auswählen muss
    
    this.initializeBoard();
  }

  // --- Initialisierung ---
  initializeBoard() {
    // 49 Städte initialisieren
    CITIES.forEach(c => {
      this.citiesState[c.id] = {
        cityId: c.id,
        province: c.province,
        name: c.name,
        isFortress: c.isFortress,
        normalPalace: null,
        crownPalace: null,
        bonusTile: null
      };
    });
  }

  addPlayer(id, name, requestedColor = null) {
    if (this.status !== 'lobby') {
      throw new Error('Spiel läuft bereits.');
    }
    if (this.players.length >= 5) {
      throw new Error('Maximale Spielerzahl erreicht (5 Spieler).');
    }

    // Verfügbare Farbe finden
    const usedColors = this.players.map(p => p.color.id);
    let chosenColor = null;
    if (requestedColor) {
      chosenColor = PLAYER_COLORS.find(c => c.id === requestedColor && !usedColors.includes(c.id));
    }
    if (!chosenColor) {
      chosenColor = PLAYER_COLORS.find(c => !usedColors.includes(c.id));
    }

    const player = {
      id,
      name: name || `Spieler ${this.players.length + 1}`,
      color: chosenColor,
      score: 0,
      hand: [],
      playedCards: [],
      lockedColor: null,
      firstTurnNoCardsPlayed: true,
      withdrawn: false,
      palacesLeft: 20,
      tokens: {
        [INFLUENCE_TYPES.VIZIER]: 0,
        [INFLUENCE_TYPES.GENERAL]: 0,
        [INFLUENCE_TYPES.MONK]: 0,
        [INFLUENCE_TYPES.PRINCESS]: 0
      },
      specialCards: [], // ['Freie Farbwahl', ...]
      commodities: [], // ['Tee', 'Reis', ...]
      bonusTilesOwned: []
    };

    this.players.push(player);
    this.addLog(`${player.name} (${player.color.name}) ist der Partie beigetreten.`);
    return player;
  }

  removePlayer(id) {
    const idx = this.players.findIndex(p => p.id === id);
    if (idx !== -1) {
      const p = this.players[idx];
      this.players.splice(idx, 1);
      this.addLog(`${p.name} hat die Partie verlassen.`);
    }
  }

  startGame() {
    if (this.players.length < 2) {
      throw new Error('Mindestens 2 Spieler erforderlich (empfohlen 3-5).');
    }
    this.status = 'playing';

    // 1. Deck erstellen und mischen
    this.buildDeck();
    this.shuffle(this.deck);

    // 2. 12 Provinz-Plättchen vorbereiten
    this.setupProvinces();

    // 3. 16 Festungs-Bonusplättchen vorbereiten & verteilen
    this.setupBonusTiles();

    // 4. Jeder Spieler erhält 6 Handkarten
    this.players.forEach(p => {
      p.hand = this.drawCards(6);
    });

    // 5. Offenen Kartennachschub aufdecken
    // 3 Spieler -> 5, 4 Spieler -> 7, 5 Spieler -> 9 (2 Spieler -> 5)
    const marketCount = this.players.length <= 3 ? 5 : (this.players.length === 4 ? 7 : 9);
    this.marketCards = this.drawCards(marketCount);

    // 6. Startspieler & ersten Besuch starten
    this.startPlayerIndex = 0;
    this.currentVisitIndex = 0;
    this.startVisit(0);

    this.addLog(`Das Spiel beginnt! Erster Besuch in Provinz ${this.currentProvince.name} (Plättchen #${this.currentProvince.tileNumber}).`);
  }

  buildDeck() {
    this.deck = [];
    const colors = [
      { id: CARD_COLORS.RED, prefix: 'red', name: 'Rot' },
      { id: CARD_COLORS.YELLOW, prefix: 'yellow', name: 'Gelb' },
      { id: CARD_COLORS.GREEN, prefix: 'green', name: 'Grün' },
      { id: CARD_COLORS.PURPLE, prefix: 'violet', name: 'Violett' }
    ];

    const COLOR_CARD_TEMPLATES = [
      { num: 1, symbols: [SYMBOLS.ELEPHANT, SYMBOLS.GENERAL] },
      { num: 2, symbols: [SYMBOLS.ELEPHANT, SYMBOLS.MOGUL] },
      { num: 3, symbols: [SYMBOLS.ELEPHANT, SYMBOLS.MONK] },
      { num: 4, symbols: [SYMBOLS.ELEPHANT, SYMBOLS.PRINCESS] },
      { num: 5, symbols: [SYMBOLS.ELEPHANT, SYMBOLS.VIZIER] },
      { num: 6, symbols: [SYMBOLS.ELEPHANT, SYMBOLS.ELEPHANT] },
      { num: 7, symbols: [SYMBOLS.ELEPHANT, SYMBOLS.ELEPHANT] },
      { num: 8, symbols: [SYMBOLS.ELEPHANT, SYMBOLS.GENERAL] },
      { num: 9, symbols: [SYMBOLS.ELEPHANT, SYMBOLS.MOGUL] },
      { num: 10, symbols: [SYMBOLS.ELEPHANT, SYMBOLS.MONK] },
      { num: 11, symbols: [SYMBOLS.ELEPHANT, SYMBOLS.PRINCESS] },
      { num: 12, symbols: [SYMBOLS.ELEPHANT, SYMBOLS.VIZIER] },
      { num: 13, symbols: [SYMBOLS.PRINCESS, SYMBOLS.MONK] },
      { num: 14, symbols: [SYMBOLS.MONK, SYMBOLS.GENERAL] },
      { num: 15, symbols: [SYMBOLS.ELEPHANT, SYMBOLS.GENERAL] },
      { num: 16, symbols: [SYMBOLS.ELEPHANT, SYMBOLS.MOGUL] },
      { num: 17, symbols: [SYMBOLS.ELEPHANT, SYMBOLS.MONK] },
      { num: 18, symbols: [SYMBOLS.ELEPHANT, SYMBOLS.PRINCESS] },
      { num: 19, symbols: [SYMBOLS.GENERAL, SYMBOLS.MOGUL] },
      { num: 20, symbols: [SYMBOLS.VIZIER, SYMBOLS.PRINCESS] },
      { num: 21, symbols: [SYMBOLS.VIZIER, SYMBOLS.MOGUL] }
    ];

    // 84 Farbkarten: 21 pro Farbe (mit echten Fotos)
    colors.forEach(col => {
      COLOR_CARD_TEMPLATES.forEach(tmpl => {
        const numStr = String(tmpl.num).padStart(2, '0');
        this.deck.push({
          id: `${col.prefix}_${numStr}`,
          color: col.id,
          symbols: [...tmpl.symbols],
          image: `/assets/cards/${col.prefix}_${numStr}.jpg`,
          name: `${col.name} ${tmpl.symbols.join(' & ')}`
        });
      });
    });

    // 12 Weiße Karten (farblos mit echten Fotos)
    const WHITE_CARD_TEMPLATES = [
      { num: 1, symbols: [SYMBOLS.ELEPHANT] },
      { num: 2, symbols: [SYMBOLS.ELEPHANT] },
      { num: 3, symbols: [SYMBOLS.MONK] },
      { num: 4, symbols: [SYMBOLS.PRINCESS] },
      { num: 5, symbols: [SYMBOLS.ELEPHANT] },
      { num: 6, symbols: [SYMBOLS.ELEPHANT] },
      { num: 7, symbols: [SYMBOLS.ELEPHANT] },
      { num: 8, symbols: [SYMBOLS.GENERAL] },
      { num: 9, symbols: [SYMBOLS.VIZIER] },
      { num: 10, symbols: [SYMBOLS.ELEPHANT] },
      { num: 11, symbols: [SYMBOLS.ELEPHANT] },
      { num: 12, symbols: [SYMBOLS.MOGUL] }
    ];

    WHITE_CARD_TEMPLATES.forEach(tmpl => {
      const numStr = String(tmpl.num).padStart(2, '0');
      this.deck.push({
        id: `white_${numStr}`,
        color: 'weiss',
        isWhite: true,
        symbols: [...tmpl.symbols],
        image: `/assets/cards/white_${numStr}.jpg`,
        name: `Weißer ${tmpl.symbols.join(' & ')}`
      });
    });
  }

  setupProvinces() {
    // 12 achteckige Provinz-Plättchen (exakt nach fotografierten Originalteilen)
    const ALL_PROVINCE_TILES = [
      { number: 1, goods: [COMMODITIES.RICE] },
      { number: 2, goods: [COMMODITIES.JEWEL, COMMODITIES.TEA] },
      { number: 3, goods: [COMMODITIES.SPICE, COMMODITIES.JEWEL] },
      { number: 4, goods: [COMMODITIES.RICE, COMMODITIES.TEA] },
      { number: 5, goods: [COMMODITIES.SPICE, COMMODITIES.TEA] },
      { number: 6, goods: [COMMODITIES.RICE, COMMODITIES.JEWEL] },
      { number: 7, goods: [COMMODITIES.RICE, COMMODITIES.SPICE] },
      { number: 8, goods: [COMMODITIES.RICE, COMMODITIES.JEWEL] },
      { number: 9, goods: [COMMODITIES.SPICE, COMMODITIES.TEA] },
      { number: 10, goods: [COMMODITIES.SPICE, COMMODITIES.JEWEL] },
      { number: 11, goods: [COMMODITIES.RICE, COMMODITIES.TEA] },
      { number: 12, goods: [COMMODITIES.RICE, COMMODITIES.SPICE] }
    ];

    // Nr. 12 liegt immer in Agra (Provinz 8)
    // Nr. 1 bis 11 werden verdeckt gemischt auf die restlichen 11 Provinzen gelegt
    const tiles1to11 = ALL_PROVINCE_TILES.slice(0, 11).map(t => ({
      ...t,
      image: `/assets/tiles/tile_${String(t.number).padStart(2, '0')}.png`
    }));

    this.shuffle(tiles1to11);

    // Provinzen 1-7, 9-12 (alle außer Agra ID 8)
    const otherProvinces = PROVINCES.filter(p => p.id !== 8);
    this.provinceTiles = [];

    for (let i = 0; i < 11; i++) {
      const prov = otherProvinces[i];
      const tile = tiles1to11[i];
      prov.tileNumber = tile.number;
      prov.goods = tile.goods;
      this.provinceTiles.push({
        provinceId: prov.id,
        number: tile.number,
        goods: tile.goods,
        image: tile.image
      });
    }

    // Agra ist immer Plättchen 12
    const agraProv = PROVINCES.find(p => p.id === 8);
    const tile12 = ALL_PROVINCE_TILES[11];
    agraProv.tileNumber = 12;
    agraProv.goods = tile12.goods;
    this.provinceTiles.push({
      provinceId: agraProv.id,
      number: 12,
      goods: tile12.goods,
      image: `/assets/tiles/tile_12.png`
    });

    // Nach Plättchennummer sortieren (Besuchsreihenfolge 1 bis 12!)
    this.provinceTiles.sort((a, b) => a.number - b.number);
  }

  setupBonusTiles() {
    // 16 Festungen
    // Agra (C31) erhält Taj Mahal (+4 Punkte)
    this.citiesState['C31'].bonusTile = {
      type: 'taj_mahal',
      vp: 4,
      name: 'Taj Mahal (+4 VP)',
      image: '/assets/tokens/fortress_taj_mahal.png'
    };

    // 15 übrige Festungen: zufällig verteilt
    const tiles = [
      { type: 'vp', vp: 4, name: '+4 VP', image: '/assets/tokens/fortress_points.png' },
      { type: 'vp', vp: 4, name: '+4 VP', image: '/assets/tokens/fortress_points.png' },
      { type: 'vp', vp: 2, name: '+2 VP', image: '/assets/tokens/fortress_points.png' },
      { type: 'vp', vp: 2, name: '+2 VP', image: '/assets/tokens/fortress_points.png' },
      { type: 'vp', vp: 2, name: '+2 VP', image: '/assets/tokens/fortress_points.png' },
      { type: 'card', count: 1, name: '+1 Karte', image: '/assets/tokens/fortress_card.png' },
      { type: 'card', count: 1, name: '+1 Karte', image: '/assets/tokens/fortress_card.png' },
      { type: 'commodity', commodity: COMMODITIES.RICE, name: 'Reis', image: '/assets/tokens/fortress_points.png' },
      { type: 'commodity', commodity: COMMODITIES.RICE, name: 'Reis', image: '/assets/tokens/fortress_points.png' },
      { type: 'commodity', commodity: COMMODITIES.TEA, name: 'Tee', image: '/assets/tokens/fortress_tea.png' },
      { type: 'commodity', commodity: COMMODITIES.TEA, name: 'Tee', image: '/assets/tokens/fortress_tea.png' },
      { type: 'commodity', commodity: COMMODITIES.SPICE, name: 'Gewürze', image: '/assets/tokens/fortress_spice.png' },
      { type: 'commodity', commodity: COMMODITIES.SPICE, name: 'Gewürze', image: '/assets/tokens/fortress_spice.png' },
      { type: 'commodity', commodity: COMMODITIES.JEWEL, name: 'Edelsteine', image: '/assets/tokens/fortress_jewel.png' },
      { type: 'commodity', commodity: COMMODITIES.JEWEL, name: 'Edelsteine', image: '/assets/tokens/fortress_jewel.png' }
    ];

    this.shuffle(tiles);

    const fortressCities = CITIES.filter(c => c.isFortress && c.id !== 'C31');
    fortressCities.forEach((fc, idx) => {
      this.citiesState[fc.id].bonusTile = tiles[idx];
    });
  }

  startVisit(visitIdx) {
    this.currentVisitIndex = visitIdx;
    const provTile = this.provinceTiles[visitIdx];
    this.currentProvince = PROVINCES.find(p => p.id === provTile.provinceId);

    // Spieler-Zustand für neuen Besuch zurücksetzen
    this.players.forEach(p => {
      p.playedCards = [];
      p.lockedColor = null;
      p.firstTurnNoCardsPlayed = true;
      p.withdrawn = false;
    });

    // Hof des Großmoguls auffüllen
    this.court.provinceTile = provTile;
    this.court.crown = true;
    this.court.tokens = {
      [INFLUENCE_TYPES.VIZIER]: true,
      [INFLUENCE_TYPES.GENERAL]: true,
      [INFLUENCE_TYPES.MONK]: true,
      [INFLUENCE_TYPES.PRINCESS]: true
    };

    this.activePlayerIndex = this.startPlayerIndex;
    this.pendingWithdrawalChoice = null;
    this.addLog(`--- Besuch ${visitIdx + 1} von 12: Provinz ${this.currentProvince.name} (#${provTile.number}) beginnt! Startspieler: ${this.players[this.activePlayerIndex].name} ---`);
  }

  // --- Spielzug: 1 bis 2 Karten ausspielen ---
  playCards(playerId, colorCardId, extraCardId = null) {
    if (this.status !== 'playing') throw new Error('Spiel läuft nicht.');
    if (this.pendingWithdrawalChoice) throw new Error('Warte auf Entscheidung des sich zurückziehenden Spielers.');

    const activePlayer = this.players[this.activePlayerIndex];
    if (activePlayer.id !== playerId) throw new Error('Du bist nicht am Zug!');
    if (activePlayer.withdrawn) throw new Error('Du hast dich in dieser Provinz bereits zurückgezogen.');

    const colorCardIdx = activePlayer.hand.findIndex(c => c.id === colorCardId);
    if (colorCardIdx === -1) throw new Error('Farbkarte nicht auf der Hand.');
    const colorCard = activePlayer.hand[colorCardIdx];
    if (colorCard.isWhite || colorCard.isSpecial) throw new Error('Erste Karte muss eine reguläre Farbkarte sein.');

    let extraCard = null;
    let extraCardIdx = -1;
    if (extraCardId) {
      extraCardIdx = activePlayer.hand.findIndex(c => c.id === extraCardId);
      if (extraCardIdx === -1) throw new Error('Zusatzkarte nicht auf der Hand.');
      extraCard = activePlayer.hand[extraCardIdx];
      if (!extraCard.isWhite && !extraCard.isSpecial) {
        throw new Error('Zusatzkarte muss eine weiße Karte oder Sonderkarte sein.');
      }
    }

    // Farbzwang prüfen
    const hasWesirSpecial = extraCard && extraCard.specialType === SPECIAL_CARDS.FREE_COLOR;

    if (activePlayer.lockedColor && activePlayer.lockedColor !== colorCard.color && !hasWesirSpecial) {
      throw new Error(`Farbzwang! Du musst Karten der Farbe ${activePlayer.lockedColor.toUpperCase()} spielen.`);
    }

    // Wenn erster Zug der Runde
    if (!activePlayer.lockedColor) {
      if (hasWesirSpecial) {
        // Wesir im 1. Zug: Farbe wird erst mit der nächsten Karte festgelegt
        activePlayer.lockedColor = null;
      } else {
        activePlayer.lockedColor = colorCard.color;
      }
    }

    // Sonderkarten-Effekt sofort: General (+2 VP)
    if (extraCard && extraCard.specialType === SPECIAL_CARDS.BONUS_2VP) {
      activePlayer.score += 2;
      this.addLog(`${activePlayer.name} spielt Sonderkarte '+2 Einflusspunkte' aus (+2 VP)! Neuer Punktestand: ${activePlayer.score}.`);
    }

    // Karten aus Hand entfernen und in playedCards ablegen
    activePlayer.hand.splice(colorCardIdx, 1);
    activePlayer.playedCards.push(colorCard);

    if (extraCard) {
      // Index neu ermitteln (da colorCard schon entfernt wurde)
      const newExtraIdx = activePlayer.hand.findIndex(c => c.id === extraCardId);
      activePlayer.hand.splice(newExtraIdx, 1);
      activePlayer.playedCards.push(extraCard);
    }

    activePlayer.firstTurnNoCardsPlayed = false;

    this.addLog(`${activePlayer.name} spielt ${extraCard ? '2 Karten' : '1 Karte'} aus (${colorCard.color} ${colorCard.symbols.join('+')}${extraCard ? ', ' + (extraCard.specialType || 'weiß ' + extraCard.symbols.join('+')) : ''}).`);

    this.advanceTurn();
    return { success: true };
  }

  // --- Spielzug: Sich zurückziehen ---
  withdraw(playerId) {
    if (this.status !== 'playing') throw new Error('Spiel läuft nicht.');
    if (this.pendingWithdrawalChoice) throw new Error('Warte auf Entscheidung des vorherigen Rückzugs.');

    const player = this.players[this.activePlayerIndex];
    if (player.id !== playerId) throw new Error('Du bist nicht am Zug!');
    if (player.withdrawn) throw new Error('Bereits zurückgezogen.');

    player.withdrawn = true;
    const firstTurnWithdrawal = player.firstTurnNoCardsPlayed && player.playedCards.length === 0;

    this.addLog(`${player.name} zieht sich aus Provinz ${this.currentProvince.name} zurück!`);

    // Mehrheiten auswerten
    const evaluation = this.evaluateWithdrawal(player);

    // Punkte & Belohnungen anwenden
    this.applyWithdrawalRewards(player, evaluation, firstTurnWithdrawal);

    // Falls Paläste oder Kartenwahl anstehen, pendingChoice setzen
    if (evaluation.normalPalacesToPlace > 0 || evaluation.crownPalaceToPlace || evaluation.cardsToDraft > 0) {
      this.pendingWithdrawalChoice = {
        playerId: player.id,
        evaluation,
        normalPalacesLeft: evaluation.normalPalacesToPlace,
        crownPalaceLeft: evaluation.crownPalaceToPlace ? 1 : 0,
        cardsToDraftLeft: evaluation.cardsToDraft,
        selectedCards: []
      };
      return { success: true, pendingChoice: this.pendingWithdrawalChoice };
    }

    // Wenn keine weiteren Aktionen nötig sind, Rückzug abschließen
    this.finalizePlayerWithdrawal(player);
    return { success: true };
  }

  evaluateWithdrawal(player) {
    // Andere noch aktive Spieler (die sich noch nicht zurückgezogen haben)
    const otherActivePlayers = this.players.filter(p => p.id !== player.id && !p.withdrawn);

    // Symbol-Zählungen für den Spieler ermitteln
    const myCounts = this.countSymbols(player.playedCards);

    // Für jedes Symbol: Hat der Spieler STRIKT MEHR als jeder andere aktive Spieler?
    const wonSymbols = {};
    Object.values(SYMBOLS).forEach(sym => {
      const myVal = myCounts[sym] || 0;
      let isStrictMajority = myVal > 0;
      for (const op of otherActivePlayers) {
        const opCounts = this.countSymbols(op.playedCards);
        if ((opCounts[sym] || 0) >= myVal) {
          isStrictMajority = false;
          break;
        }
      }
      wonSymbols[sym] = isStrictMajority;
    });

    const result = {
      wonVizier: wonSymbols[SYMBOLS.VIZIER] && this.court.tokens[INFLUENCE_TYPES.VIZIER],
      wonGeneral: wonSymbols[SYMBOLS.GENERAL] && this.court.tokens[INFLUENCE_TYPES.GENERAL],
      wonMonk: wonSymbols[SYMBOLS.MONK] && this.court.tokens[INFLUENCE_TYPES.MONK],
      wonPrincess: wonSymbols[SYMBOLS.PRINCESS] && this.court.tokens[INFLUENCE_TYPES.PRINCESS],
      wonCrown: wonSymbols[SYMBOLS.MOGUL] && this.court.crown,
      wonElephant: wonSymbols[SYMBOLS.ELEPHANT] && this.court.provinceTile !== null,
      normalPalacesToPlace: 0,
      crownPalaceToPlace: false,
      cardsToDraft: 0
    };

    // Wie viele normale Paläste dürfen gesetzt werden? (Je 1 für Wesir, General, Mönch, Prinzessin)
    if (result.wonVizier) result.normalPalacesToPlace++;
    if (result.wonGeneral) result.normalPalacesToPlace++;
    if (result.wonMonk) result.normalPalacesToPlace++;
    if (result.wonPrincess) result.normalPalacesToPlace++;

    if (result.wonCrown) {
      result.crownPalaceToPlace = true;
    }

    // Kartennachschub: letzter Spieler bekommt 1 Karte, sonst 2 Karten
    const remainingActiveAfterThis = this.players.filter(p => !p.withdrawn).length;
    result.cardsToDraft = remainingActiveAfterThis === 0 ? 1 : 2;

    return result;
  }

  countSymbols(cards) {
    const counts = {
      [SYMBOLS.VIZIER]: 0,
      [SYMBOLS.GENERAL]: 0,
      [SYMBOLS.MONK]: 0,
      [SYMBOLS.PRINCESS]: 0,
      [SYMBOLS.MOGUL]: 0,
      [SYMBOLS.ELEPHANT]: 0
    };

    cards.forEach(c => {
      if (c.symbols) {
        c.symbols.forEach(s => {
          if (counts[s] !== undefined) counts[s]++;
        });
      }
      // Sonderkarten
      if (c.specialType === SPECIAL_CARDS.MOGUL_PLUS1) counts[SYMBOLS.MOGUL]++;
      if (c.specialType === SPECIAL_CARDS.ELEPHANT_PLUS1) counts[SYMBOLS.ELEPHANT]++;
    });

    return counts;
  }

  applyWithdrawalRewards(player, evalResult, firstTurnWithdrawal) {
    // 1. Einflussmarken vom Hof nehmen
    if (evalResult.wonVizier) {
      this.court.tokens[INFLUENCE_TYPES.VIZIER] = false;
      player.tokens[INFLUENCE_TYPES.VIZIER]++;
      this.addLog(`${player.name} gewinnt die Einflussmarke Wesir!`);
    }
    if (evalResult.wonGeneral) {
      this.court.tokens[INFLUENCE_TYPES.GENERAL] = false;
      player.tokens[INFLUENCE_TYPES.GENERAL]++;
      this.addLog(`${player.name} gewinnt die Einflussmarke General!`);
    }
    if (evalResult.wonMonk) {
      this.court.tokens[INFLUENCE_TYPES.MONK] = false;
      player.tokens[INFLUENCE_TYPES.MONK]++;
      this.addLog(`${player.name} gewinnt die Einflussmarke Mönch!`);
    }
    if (evalResult.wonPrincess) {
      this.court.tokens[INFLUENCE_TYPES.PRINCESS] = false;
      player.tokens[INFLUENCE_TYPES.PRINCESS]++;
      this.addLog(`${player.name} gewinnt die Einflussmarke Prinzessin!`);
    }
    if (evalResult.wonCrown) {
      this.court.crown = false;
      this.addLog(`${player.name} gewinnt die Krone des Großmoguls!`);
    }

    // 2. Elefant -> Provinz-Plättchen gewinnen & werten
    if (evalResult.wonElephant && this.court.provinceTile) {
      const pTile = this.court.provinceTile;
      this.court.provinceTile = null;

      // Punkteberechnung für Provinz-Plättchen:
      // 1 Punkt pro Ware auf dem Plättchen + 1 Punkt für jede passende bereits besessene Ware
      let pts = 0;
      pTile.goods.forEach(good => {
        pts += 1; // Für die Ware selbst
        // Jede passende Ware auf bisherigen Plättchen
        const existingCount = player.commodities.filter(g => g === good).length;
        pts += existingCount;
        player.commodities.push(good);
      });

      player.score += pts;
      this.addLog(`${player.name} gewinnt das Provinz-Plättchen #${pTile.number} (${pTile.goods.join(', ')}) und erhält ${pts} Einflusspunkte!`);
    }

    // 3. Sofortiger Rückzug ohne gelegte Karten: +1 verdeckte Karte vom Nachziehstapel
    if (firstTurnWithdrawal) {
      const bonusCard = this.drawCards(1);
      if (bonusCard.length > 0) {
        player.hand.push(bonusCard[0]);
        this.addLog(`${player.name} zog sich sofort zurück und erhält 1 zusätzliche verdeckte Karte vom Nachziehstapel.`);
      }
    }
  }

  // Spieler wählt Stadt für Palast
  placePalace(playerId, cityId, isCrown = false) {
    if (!this.pendingWithdrawalChoice || this.pendingWithdrawalChoice.playerId !== playerId) {
      throw new Error('Keine ausstehende Palast-Aktion für diesen Spieler.');
    }

    const choice = this.pendingWithdrawalChoice;
    const player = this.players.find(p => p.id === playerId);
    const city = this.citiesState[cityId];
    if (!city) throw new Error('Ungültige Stadt.');
    if (city.province !== this.currentProvince.id) {
      throw new Error('Palast darf nur in der aktuellen Provinz gebaut werden!');
    }

    if (isCrown) {
      if (choice.crownPalaceLeft <= 0) throw new Error('Kein Kronen-Palast verfügbar.');
      if (city.crownPalace !== null) throw new Error('In dieser Stadt steht bereits ein Kronen-Palast.');

      city.crownPalace = player.id;
      choice.crownPalaceLeft--;
      player.palacesLeft = Math.max(0, player.palacesLeft - 1);
      this.addLog(`${player.name} baut einen Kronen-Palast in ${city.name}.`);
    } else {
      if (choice.normalPalacesLeft <= 0) throw new Error('Kein normaler Palast verfügbar.');
      if (city.normalPalace !== null) throw new Error('Diese Stadt ist bereits besetzt!');

      city.normalPalace = player.id;
      choice.normalPalacesLeft--;
      player.palacesLeft = Math.max(0, player.palacesLeft - 1);
      this.addLog(`${player.name} baut einen Palast in ${city.name}.`);

      // Festungs-Bonus werten (nur normale Paläste!)
      if (city.bonusTile) {
        this.evaluateBonusTile(player, city.bonusTile, city);
        city.bonusTile = null; // Plättchen genommen
      }
    }

    // Wenn alle Paläste gesetzt sind: Palast-Netzwerkpunkte berechnen!
    if (choice.normalPalacesLeft === 0 && choice.crownPalaceLeft === 0) {
      const networkPts = this.calculatePalaceNetworkPoints(player, this.currentProvince.id);
      player.score += networkPts;
      this.addLog(`${player.name} erhält ${networkPts} Palast-Verbindungspunkte für Provinz ${this.currentProvince.name}! Neuer Gesamtstand: ${player.score}.`);

      // Prüfen, ob noch Karten gedraftet werden müssen
      if (choice.cardsToDraftLeft === 0) {
        this.pendingWithdrawalChoice = null;
        this.finalizePlayerWithdrawal(player);
      }
    }

    return { success: true, pendingChoice: this.pendingWithdrawalChoice };
  }

  evaluateBonusTile(player, tile, city) {
    if (tile.type === 'vp' || tile.type === 'taj_mahal') {
      player.score += tile.vp;
      this.addLog(`${player.name} nimmt Bonusplättchen von Festung ${city.name}: +${tile.vp} Einflusspunkte!`);
    } else if (tile.type === 'card') {
      const drawn = this.drawCards(1);
      if (drawn.length > 0) {
        player.hand.push(drawn[0]);
        this.addLog(`${player.name} nimmt Bonusplättchen von Festung ${city.name}: +1 Karte vom Nachziehstapel!`);
      }
    } else if (tile.type === 'commodity') {
      const good = tile.commodity;
      // 1 Punkt für dieses Plättchen + 1 für jedes passende bisherige Plättchen
      const count = player.commodities.filter(g => g === good).length;
      const pts = 1 + count;
      player.commodities.push(good);
      player.score += pts;
      this.addLog(`${player.name} nimmt Waren-Bonusplättchen ${good} von Festung ${city.name}: +${pts} Einflusspunkte!`);
    }
  }

  // --- Graph-Algorithmus: Berechnung der verbundenen Provinzen ---
  calculatePalaceNetworkPoints(player, currentProvinceId) {
    // 1. Hat der Spieler mindestens einen Palast in der aktuellen Provinz?
    const currentProvCitiesWithPalace = Object.values(this.citiesState).filter(c =>
      c.province === currentProvinceId && (c.normalPalace === player.id || c.crownPalace === player.id)
    );

    if (currentProvCitiesWithPalace.length === 0) return 0;

    // Mindestens 1 Punkt für die aktuelle Provinz
    const connectedProvinces = new Set([currentProvinceId]);

    // BFS Traversierung durch das Straßennetzwerk
    const visitedCities = new Set();
    const queue = currentProvCitiesWithPalace.map(c => c.cityId);
    queue.forEach(id => visitedCities.add(id));

    // Adjazenzliste aus ROADS aufbauen
    const adj = {};
    ROADS.forEach(([u, v]) => {
      if (!adj[u]) adj[u] = [];
      if (!adj[v]) adj[v] = [];
      adj[u].push(v);
      adj[v].push(u);
    });

    while (queue.length > 0) {
      const u = queue.shift();
      const neighbors = adj[u] || [];

      for (const v of neighbors) {
        if (!visitedCities.has(v)) {
          const targetCity = this.citiesState[v];
          // Straße ist nur ununterbrochen passierbar, wenn targetCity einen Palast des Spielers hat
          if (targetCity && (targetCity.normalPalace === player.id || targetCity.crownPalace === player.id)) {
            visitedCities.add(v);
            connectedProvinces.add(targetCity.province);
            queue.push(v);
          }
        }
      }
    }

    // 1 Punkt für aktuelle Provinz + 1 Punkt für jede weitere verbundene Provinz
    return connectedProvinces.size;
  }

  // Spieler wählt Karten aus dem offenen Nachschub
  draftMarketCards(playerId, cardIds) {
    if (!this.pendingWithdrawalChoice || this.pendingWithdrawalChoice.playerId !== playerId) {
      throw new Error('Keine ausstehende Kartenauswahl für diesen Spieler.');
    }
    const choice = this.pendingWithdrawalChoice;
    const player = this.players.find(p => p.id === playerId);

    if (cardIds.length > choice.cardsToDraftLeft) {
      throw new Error(`Du darfst maximal ${choice.cardsToDraftLeft} Karte(n) wählen.`);
    }

    cardIds.forEach(cid => {
      const mIdx = this.marketCards.findIndex(c => c.id === cid);
      if (mIdx === -1) throw new Error(`Karte ${cid} liegt nicht im offenen Nachschub.`);
      const card = this.marketCards.splice(mIdx, 1)[0];
      player.hand.push(card);
    });

    choice.cardsToDraftLeft -= cardIds.length;
    this.addLog(`${player.name} nimmt ${cardIds.length} Karte(n) aus dem offenen Nachschub auf die Hand.`);

    if (choice.cardsToDraftLeft === 0 && choice.normalPalacesLeft === 0 && choice.crownPalaceLeft === 0) {
      this.pendingWithdrawalChoice = null;
      this.finalizePlayerWithdrawal(player);
    }

    return { success: true };
  }

  finalizePlayerWithdrawal(player) {
    // Gespielte Karten abwerfen (Sonderkarten wandern zurück auf die Hand!)
    const cardsToDiscard = [];
    player.playedCards.forEach(c => {
      if (c.isSpecial) {
        player.hand.push(c); // Sonderkarten behält man!
      } else {
        cardsToDiscard.push(c);
      }
    });
    this.discardPile.push(...cardsToDiscard);
    player.playedCards = [];

    // Prüfen, ob alle Spieler sich zurückgezogen haben
    const remainingActive = this.players.filter(p => !p.withdrawn);
    if (remainingActive.length === 0) {
      this.endVisit();
    } else {
      this.advanceTurn();
    }
  }

  advanceTurn() {
    if (this.players.filter(p => !p.withdrawn).length === 0) return;

    let nextIdx = (this.activePlayerIndex + 1) % this.players.length;
    while (this.players[nextIdx].withdrawn) {
      nextIdx = (nextIdx + 1) % this.players.length;
    }
    this.activePlayerIndex = nextIdx;
  }

  endVisit() {
    this.addLog(`--- Besuch ${this.currentVisitIndex + 1} beendet! ---`);

    // 1. Tausch: 2 gleiche Einflussmarken gegen Sonderkarten
    this.checkSpecialCardExchanges();

    // 2. Nicht gewonnene Einflussmarken & Krone bleiben liegen, fehlende werden ersetzt
    // Provinzplättchen verfällt, falls nicht gewonnen
    // 3. Nächster Besuch oder Spielende?
    if (this.currentVisitIndex >= 11) {
      this.endGame();
    } else {
      // Startspielerstein an linken Nachbarn weitergeben
      this.startPlayerIndex = (this.startPlayerIndex + 1) % this.players.length;

      // Offenen Nachschub auffüllen
      const neededMarket = this.players.length <= 3 ? 5 : (this.players.length === 4 ? 7 : 9);
      while (this.marketCards.length < neededMarket) {
        const drawn = this.drawCards(1);
        if (drawn.length === 0) break;
        this.marketCards.push(drawn[0]);
      }

      // Nächste Provinz starten
      this.startVisit(this.currentVisitIndex + 1);
    }
  }

  checkSpecialCardExchanges() {
    const pairs = [
      { type: INFLUENCE_TYPES.VIZIER, card: SPECIAL_CARDS.FREE_COLOR },
      { type: INFLUENCE_TYPES.GENERAL, card: SPECIAL_CARDS.BONUS_2VP },
      { type: INFLUENCE_TYPES.MONK, card: SPECIAL_CARDS.MOGUL_PLUS1 },
      { type: INFLUENCE_TYPES.PRINCESS, card: SPECIAL_CARDS.ELEPHANT_PLUS1 }
    ];

    pairs.forEach(({ type, card }) => {
      this.players.forEach(p => {
        if (p.tokens[type] >= 2) {
          p.tokens[type] -= 2; // Marken zurück in den Vorrat
          this.awardSpecialCard(p, card);
        }
      });
    });
  }

  awardSpecialCard(player, specialName) {
    // Prüfen, ob ein anderer Spieler diese Karte hat
    for (const op of this.players) {
      const idx = op.hand.findIndex(c => c.specialType === specialName);
      if (idx !== -1) {
        const stolen = op.hand.splice(idx, 1)[0];
        player.hand.push(stolen);
        this.addLog(`${player.name} tauscht 2 Marken ein und übernimmt die Sonderkarte '${specialName}' von ${op.name}!`);
        return;
      }
    }

    // Wenn vom Tisch genommen
    player.hand.push({
      id: `special_${specialName.toLowerCase().replace(/\s+/g, '_')}`,
      isSpecial: true,
      specialType: specialName,
      name: specialName
    });
    this.addLog(`${player.name} tauscht 2 Marken ein und erhält die Sonderkarte '${specialName}'!`);
  }

  // --- Spielende & Schlusswertung ---
  endGame() {
    this.status = 'finished';
    this.addLog('==============================================');
    this.addLog('ALLE 12 PROVINZEN WURDEN BESUCHT! SCHLUSSWERTUNG:');

    // Wertung der Handkarten nach Seite 10 des Regelhefts:
    // 1 Punkt je:
    // - Sonderkarte
    // - weiße Karte
    // - Karte in der "längsten Farbe" (Farbe mit den meisten Karten)
    this.players.forEach(p => {
      let endVP = 0;
      let specialCount = 0;
      let whiteCount = 0;
      const colorCounts = { [CARD_COLORS.RED]: 0, [CARD_COLORS.YELLOW]: 0, [CARD_COLORS.GREEN]: 0, [CARD_COLORS.PURPLE]: 0 };

      p.hand.forEach(c => {
        if (c.isSpecial) specialCount++;
        else if (c.isWhite) whiteCount++;
        else if (c.color && colorCounts[c.color] !== undefined) {
          colorCounts[c.color]++;
        }
      });

      const maxColorCount = Math.max(...Object.values(colorCounts), 0);
      endVP = specialCount + whiteCount + maxColorCount;
      p.score += endVP;

      this.addLog(`${p.name}: +${endVP} Punkte bei Spielende (${specialCount} Sonderkarten, ${whiteCount} weiße, ${maxColorCount} längste Farbe). Endstand: ${p.score} Punkte.`);
    });

    // Gewinner ermitteln
    const sorted = [...this.players].sort((a, b) => b.score - a.score);
    const winner = sorted[0];
    this.addLog(`SIEGER IST ${winner.name} MIT ${winner.score} PUNKTEN! Herzlichen Glückwunsch!`);
    this.addLog('==============================================');
  }

  // --- Hilfsmethoden ---
  drawCards(count) {
    const drawn = [];
    for (let i = 0; i < count; i++) {
      if (this.deck.length === 0) {
        if (this.discardPile.length === 0) break;
        this.deck = [...this.discardPile];
        this.discardPile = [];
        this.shuffle(this.deck);
        this.addLog('Ablagestapel gemischt und neuer Nachziehstapel gebildet.');
      }
      drawn.push(this.deck.pop());
    }
    return drawn;
  }

  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  addLog(msg) {
    this.log.push({ timestamp: new Date().toLocaleTimeString('de-DE'), message: msg });
    if (this.log.length > 100) this.log.shift();
  }

  // Öffentlicher State für den Tisch-Client
  getTableState() {
    return {
      status: this.status,
      currentVisitIndex: this.currentVisitIndex,
      currentProvince: this.currentProvince,
      startPlayerIndex: this.startPlayerIndex,
      activePlayerIndex: this.activePlayerIndex,
      court: this.court,
      marketCards: this.marketCards,
      citiesState: this.citiesState,
      deckCount: this.deck.length,
      discardCount: this.discardPile.length,
      pendingWithdrawalChoice: this.pendingWithdrawalChoice,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
        score: p.score,
        handCount: p.hand.length,
        playedCards: p.playedCards,
        lockedColor: p.lockedColor,
        withdrawn: p.withdrawn,
        tokens: p.tokens,
        commodities: p.commodities,
        palacesLeft: p.palacesLeft
      })),
      log: this.log.slice(-15)
    };
  }

  // Privater State für einen Smartphone-Client
  getPlayerState(playerId) {
    const p = this.players.find(x => x.id === playerId);
    if (!p) return null;

    return {
      id: p.id,
      name: p.name,
      color: p.color,
      score: p.score,
      hand: p.hand,
      playedCards: p.playedCards,
      lockedColor: p.lockedColor,
      withdrawn: p.withdrawn,
      tokens: p.tokens,
      commodities: p.commodities,
      isMyTurn: this.status === 'playing' && this.players[this.activePlayerIndex]?.id === p.id && !p.withdrawn,
      pendingChoiceForMe: this.pendingWithdrawalChoice && this.pendingWithdrawalChoice.playerId === p.id ? this.pendingWithdrawalChoice : null,
      marketCards: this.marketCards,
      citiesState: this.citiesState,
      currentProvince: this.currentProvince,
      currentVisitIndex: this.currentVisitIndex,
      status: this.status
    };
  }
}
