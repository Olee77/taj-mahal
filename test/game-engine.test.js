// test/game-engine.test.js - Validierung der Spiellogik nach tadschmahal.pdf
import test from 'node:test';
import assert from 'node:assert';
import { TajMahalGame, CARD_COLORS, SYMBOLS, SPECIAL_CARDS } from '../server/taj-mahal-engine.js';
import { PROVINCES, CITIES, ROADS } from '../server/board-data.js';

test('Board Data: 12 Provinzen, 49 Städte (16 Festungen)', () => {
  assert.strictEqual(PROVINCES.length, 12, 'Es müssen genau 12 Provinzen sein');
  assert.strictEqual(CITIES.length, 49, 'Es müssen genau 49 Städte sein');

  const fortresses = CITIES.filter(c => c.isFortress);
  assert.strictEqual(fortresses.length, 16, 'Es müssen genau 16 Festungen sein');

  // Agra muss genau 5 Städte haben, alle anderen 4
  const agraCities = CITIES.filter(c => c.province === 8);
  assert.strictEqual(agraCities.length, 5, 'Agra muss genau 5 Städte haben');

  for (let provId = 1; provId <= 12; provId++) {
    if (provId !== 8) {
      const pCities = CITIES.filter(c => c.province === provId);
      assert.strictEqual(pCities.length, 4, `Provinz ${provId} muss genau 4 Städte haben`);
    }
  }
});

test('Spielstart: 3 Spieler, Hände, Kartennachschub & Provinzen', () => {
  const game = new TajMahalGame();
  const p1 = game.addPlayer('p1', 'Akbar', 'red');
  const p2 = game.addPlayer('p2', 'Babur', 'blue');
  const p3 = game.addPlayer('p3', 'Humayun', 'green');

  assert.strictEqual(game.players.length, 3);
  game.startGame();

  // Jeder Spieler muss 6 Karten haben
  assert.strictEqual(p1.hand.length, 6);
  assert.strictEqual(p2.hand.length, 6);
  assert.strictEqual(p3.hand.length, 6);

  // Kartennachschub bei 3 Spielern: 5 Karten
  assert.strictEqual(game.marketCards.length, 5);

  // 12 Provinzen in Reihenfolge 1 bis 12
  assert.strictEqual(game.provinceTiles.length, 12);
  assert.strictEqual(game.currentVisitIndex, 0);
  assert.strictEqual(game.currentProvince.tileNumber, 1);
});

test('Spielzug: Farbzwang greift ab der zweiten Karte', () => {
  const game = new TajMahalGame();
  const p1 = game.addPlayer('p1', 'Spieler 1', 'red');
  const p2 = game.addPlayer('p2', 'Spieler 2', 'blue');
  game.startGame();

  // Hand von p1 gezielt mit roter und gelber Karte bestücken
  p1.hand = [
    { id: 'c_red_1', color: 'rot', symbols: [SYMBOLS.VIZIER] },
    { id: 'c_red_2', color: 'rot', symbols: [SYMBOLS.GENERAL] },
    { id: 'c_yellow_1', color: 'gelb', symbols: [SYMBOLS.MONK] }
  ];

  // 1. Zug: Rot spielen -> erfolgreich
  game.playCards('p1', 'c_red_1');
  assert.strictEqual(p1.lockedColor, 'rot');

  // p2 ist am Zug
  p2.hand = [{ id: 'c_p2_1', color: 'gruen', symbols: [SYMBOLS.ELEPHANT] }];
  game.playCards('p2', 'c_p2_1');

  // p1 ist wieder am Zug: Versuch, gelbe Karte zu spielen -> muss Fehler werfen!
  assert.throws(() => {
    game.playCards('p1', 'c_yellow_1');
  }, /Farbzwang/);

  // Rote Karte spielen -> erfolgreich
  const res = game.playCards('p1', 'c_red_2');
  assert.strictEqual(res.success, true);
});

test('Rückzug: Auswertung strenger Mehrheiten & Palast-Netzwerk', () => {
  const game = new TajMahalGame();
  const p1 = game.addPlayer('p1', 'Anna', 'red');
  const p2 = game.addPlayer('p2', 'Bernd', 'blue');
  game.startGame();

  // Anna legt 2 Wesire und 1 Elefanten aus
  p1.playedCards = [
    { id: 'c1', color: 'rot', symbols: [SYMBOLS.VIZIER, SYMBOLS.ELEPHANT] },
    { id: 'c2', color: 'rot', symbols: [SYMBOLS.VIZIER] }
  ];

  // Bernd legt nur 1 Wesir aus
  p2.playedCards = [
    { id: 'c3', color: 'blau', symbols: [SYMBOLS.VIZIER] }
  ];

  // Annas Rückzug auswerten
  const evalResult = game.evaluateWithdrawal(p1);
  assert.strictEqual(evalResult.wonVizier, true, 'Anna hat 2 Wesire gegen 1 Wesir -> gewinnt Wesir');
  assert.strictEqual(evalResult.wonElephant, true, 'Anna hat 1 Elefant gegen 0 -> gewinnt Elefant');
  assert.strictEqual(evalResult.wonGeneral, false, 'Keine Generale');
  assert.strictEqual(evalResult.normalPalacesToPlace, 1, '1 Palast für Wesir');
});
