// server/board-data.js - Taj Mahal Board Graph & Geometrie (1024 x 719)
// 12 Provinzen, 49 Städte (16 Festungen), Straßen-Netzwerk

export const BOARD_WIDTH = 1024;
export const BOARD_HEIGHT = 719;

export const COMMODITIES = {
  RICE: 'Reis',
  TEA: 'Tee',
  SPICE: 'Gewürze',
  JEWEL: 'Edelsteine'
};

export const INFLUENCE_TYPES = {
  VIZIER: 'Wesir',        // Politik -> Freie Farbwahl
  GENERAL: 'General',      // Militär -> +2 Punkte
  MONK: 'Mönch',          // Religion -> +1 Mogul
  PRINCESS: 'Prinzessin',  // Gesellschaft -> +1 Elefant
  MOGUL: 'Großmogul',     // Krone / Kronenpalast
  ELEPHANT: 'Elefant'     // Provinzplättchen
};

// 12 Provinzen
export const PROVINCES = [
  { id: 1, name: 'Kaschmir (Kaiser)', color: '#d8b98b', center: { x: 310, y: 160 } },
  { id: 2, name: 'Pandschab (Dame)', color: '#b97a56', center: { x: 460, y: 220 } },
  { id: 3, name: 'Himalaya (Terrasse)', color: '#c49eb0', center: { x: 640, y: 160 } },
  { id: 4, name: 'Sindh (Schlangenbeschwörer)', color: '#e0a0a5', center: { x: 180, y: 350 } },
  { id: 5, name: 'Radschastan (Tiger)', color: '#9d7c86', center: { x: 400, y: 440 } },
  { id: 6, name: 'Gujarat (Küste)', color: '#7ba29e', center: { x: 190, y: 530 } },
  { id: 7, name: 'Malwa (Garten)', color: '#7ea46a', center: { x: 400, y: 570 } },
  { id: 8, name: 'Agra (Großmogul & Taj Mahal)', color: '#97a46e', center: { x: 650, y: 360 } }, // 5 Städte!
  { id: 9, name: 'Awadh (Schreiber)', color: '#578a7c', center: { x: 810, y: 370 } },
  { id: 10, name: 'Gwalior (Wächter)', color: '#776288', center: { x: 620, y: 530 } },
  { id: 11, name: 'Dekkan (Hofversammlung)', color: '#527c88', center: { x: 620, y: 670 } },
  { id: 12, name: 'Bengalen (Reiter)', color: '#a0785c', center: { x: 810, y: 560 } }
];

// 49 Städte: x & y in Pixeln (Basis 1024 x 719), isFortress: true (16 Festungen)
export const CITIES = [
  // Provinz 1: Kaschmir (4 Städte)
  { id: 'C01', province: 1, name: 'Srinagar', x: 366, y: 112, isFortress: false },
  { id: 'C02', province: 1, name: 'Gilgit', x: 232, y: 163, isFortress: true },
  { id: 'C03', province: 1, name: 'Jammu', x: 344, y: 190, isFortress: false },
  { id: 'C04', province: 1, name: 'Leh', x: 280, y: 242, isFortress: false },

  // Provinz 2: Pandschab (4 Städte)
  { id: 'C05', province: 2, name: 'Lahore', x: 506, y: 128, isFortress: false },
  { id: 'C06', province: 2, name: 'Amritsar', x: 410, y: 237, isFortress: true },
  { id: 'C07', province: 2, name: 'Multan', x: 484, y: 275, isFortress: false },
  { id: 'C08', province: 2, name: 'Patiala', x: 466, y: 384, isFortress: false },

  // Provinz 3: Himalaya (4 Städte)
  { id: 'C09', province: 3, name: 'Shimla', x: 576, y: 120, isFortress: true },
  { id: 'C10', province: 3, name: 'Dharamsala', x: 601, y: 200, isFortress: false },
  { id: 'C11', province: 3, name: 'Dehradun', x: 680, y: 120, isFortress: true },
  { id: 'C12', province: 3, name: 'Rishikesh', x: 711, y: 200, isFortress: false },

  // Provinz 4: Sindh (4 Städte)
  { id: 'C13', province: 4, name: 'Karatschi', x: 128, y: 302, isFortress: false },
  { id: 'C14', province: 4, name: 'Hyderabad-Sindh', x: 227, y: 300, isFortress: true },
  { id: 'C15', province: 4, name: 'Sukkur', x: 113, y: 390, isFortress: true },
  { id: 'C16', province: 4, name: 'Larkana', x: 242, y: 400, isFortress: false },

  // Provinz 5: Radschastan (4 Städte)
  { id: 'C17', province: 5, name: 'Jaipur', x: 366, y: 327, isFortress: false },
  { id: 'C18', province: 5, name: 'Jodhpur', x: 338, y: 438, isFortress: true },
  { id: 'C19', province: 5, name: 'Ajmer', x: 465, y: 485, isFortress: false },
  { id: 'C20', province: 5, name: 'Udaipur', x: 452, y: 568, isFortress: false },

  // Provinz 6: Gujarat (4 Städte)
  { id: 'C21', province: 6, name: 'Dwarka', x: 152, y: 463, isFortress: false },
  { id: 'C22', province: 6, name: 'Porbandar', x: 237, y: 477, isFortress: false },
  { id: 'C23', province: 6, name: 'Somnath', x: 164, y: 580, isFortress: true },
  { id: 'C24', province: 6, name: 'Surat', x: 238, y: 623, isFortress: false },

  // Provinz 7: Malwa (4 Städte)
  { id: 'C25', province: 7, name: 'Ujjain', x: 322, y: 520, isFortress: false },
  { id: 'C26', province: 7, name: 'Indore', x: 347, y: 604, isFortress: false },
  { id: 'C27', province: 7, name: 'Mandu', x: 463, y: 632, isFortress: true },
  { id: 'C28', province: 7, name: 'Bhopal', x: 470, y: 533, isFortress: false },

  // Provinz 8: Agra (5 Städte! Agra ist die 5. Stadt mit Taj Mahal)
  { id: 'C29', province: 8, name: 'Mathura', x: 594, y: 276, isFortress: false },
  { id: 'C30', province: 8, name: 'Aligarh', x: 693, y: 292, isFortress: false },
  { id: 'C31', province: 8, name: 'Agra (Taj Mahal)', x: 670, y: 368, isFortress: true }, // Hauptfestung Agra
  { id: 'C32', province: 8, name: 'Bharatpur', x: 549, y: 427, isFortress: true },
  { id: 'C33', province: 8, name: 'Firozabad', x: 713, y: 384, isFortress: false },

  // Provinz 9: Awadh (4 Städte)
  { id: 'C34', province: 9, name: 'Lucknow', x: 835, y: 290, isFortress: true },
  { id: 'C35', province: 9, name: 'Kanpur', x: 760, y: 320, isFortress: false },
  { id: 'C36', province: 9, name: 'Varanasi', x: 880, y: 405, isFortress: false },
  { id: 'C37', province: 9, name: 'Ayodhya', x: 792, y: 402, isFortress: true },

  // Provinz 10: Gwalior (4 Städte)
  { id: 'C38', province: 10, name: 'Jhansi', x: 559, y: 497, isFortress: false },
  { id: 'C39', province: 10, name: 'Orchha', x: 673, y: 503, isFortress: false },
  { id: 'C40', province: 10, name: 'Gwalior-Fort', x: 562, y: 571, isFortress: true },
  { id: 'C41', province: 10, name: 'Shivpuri', x: 680, y: 576, isFortress: false },

  // Provinz 11: Dekkan (4 Städte)
  { id: 'C42', province: 11, name: 'Nagpur', x: 552, y: 650, isFortress: false },
  { id: 'C43', province: 11, name: 'Aurangabad', x: 693, y: 650, isFortress: false },
  { id: 'C44', province: 11, name: 'Daulatabad', x: 546, y: 705, isFortress: false },
  { id: 'C45', province: 11, name: 'Ellora', x: 714, y: 710, isFortress: true },

  // Provinz 12: Bengalen (4 Städte)
  { id: 'C46', province: 12, name: 'Patna', x: 766, y: 462, isFortress: false },
  { id: 'C47', province: 12, name: 'Kalkutta', x: 874, y: 482, isFortress: true },
  { id: 'C48', province: 12, name: 'Murshidabad', x: 762, y: 548, isFortress: false },
  { id: 'C49', province: 12, name: 'Chittagong', x: 824, y: 626, isFortress: false }
];

// Straßen-Verbindungen (Ungerichtete Kanten zwischen Stadt-IDs)
export const ROADS = [
  // Kaschmir (P1) interne & externe
  ['C01', 'C05'], ['C01', 'C03'], ['C01', 'C02'],
  ['C02', 'C04'], ['C02', 'C13'],
  ['C03', 'C04'], ['C03', 'C06'],
  ['C04', 'C14'], ['C04', 'C06'], ['C04', 'C17'],

  // Pandschab (P2)
  ['C05', 'C09'], ['C05', 'C06'],
  ['C06', 'C07'], ['C06', 'C17'],
  ['C07', 'C10'], ['C07', 'C08'],
  ['C08', 'C17'], ['C08', 'C29'], ['C08', 'C19'],

  // Himalaya (P3)
  ['C09', 'C11'], ['C09', 'C10'],
  ['C10', 'C12'], ['C10', 'C29'],
  ['C11', 'C12'],
  ['C12', 'C30'], ['C12', 'C34'],

  // Sindh (P4)
  ['C13', 'C14'], ['C13', 'C15'],
  ['C14', 'C16'], ['C14', 'C17'],
  ['C15', 'C16'], ['C15', 'C21'],
  ['C16', 'C18'], ['C16', 'C22'],

  // Radschastan (P5)
  ['C17', 'C18'], ['C17', 'C19'],
  ['C18', 'C22'], ['C18', 'C25'],
  ['C19', 'C20'], ['C19', 'C32'], ['C19', 'C38'],
  ['C20', 'C27'], ['C20', 'C28'], ['C20', 'C38'],

  // Gujarat (P6)
  ['C21', 'C22'], ['C21', 'C23'],
  ['C22', 'C24'], ['C22', 'C25'],
  ['C23', 'C24'],
  ['C24', 'C26'],

  // Malwa (P7)
  ['C25', 'C26'], ['C25', 'C28'],
  ['C26', 'C27'],
  ['C27', 'C42'], ['C27', 'C44'],
  ['C28', 'C38'], ['C28', 'C40'],

  // Agra (P8)
  ['C29', 'C30'], ['C29', 'C31'], ['C29', 'C32'],
  ['C30', 'C35'], ['C30', 'C31'],
  ['C31', 'C33'], ['C31', 'C32'], ['C31', 'C35'],
  ['C32', 'C38'],
  ['C33', 'C35'], ['C33', 'C37'], ['C33', 'C39'],

  // Awadh (P9)
  ['C34', 'C35'], ['C34', 'C36'],
  ['C35', 'C37'], ['C35', 'C46'],
  ['C36', 'C47'], ['C36', 'C46'],
  ['C37', 'C46'],

  // Gwalior (P10)
  ['C38', 'C39'], ['C38', 'C40'],
  ['C39', 'C41'], ['C39', 'C46'],
  ['C40', 'C41'], ['C40', 'C42'],
  ['C41', 'C43'], ['C41', 'C48'],

  // Dekkan (P11)
  ['C42', 'C43'], ['C42', 'C44'],
  ['C43', 'C45'], ['C43', 'C48'],
  ['C44', 'C45'],
  ['C45', 'C49'],

  // Bengalen (P12)
  ['C46', 'C47'], ['C46', 'C48'],
  ['C47', 'C49'],
  ['C48', 'C49']
];

// Hof des Großmoguls (Positionen für UI & Marker)
export const COURT_POSITIONS = {
  provinceTile: { x: 792, y: 195, shape: 'octagon' },
  crown: { x: 866, y: 185, shape: 'crown' },
  tokens: {
    [INFLUENCE_TYPES.VIZIER]: { x: 843, y: 138 },
    [INFLUENCE_TYPES.GENERAL]: { x: 887, y: 138 },
    [INFLUENCE_TYPES.MONK]: { x: 843, y: 232 },
    [INFLUENCE_TYPES.PRINCESS]: { x: 887, y: 232 }
  }
};

// Wertungsleiste (0 bis 65) Koordinaten auf dem Rahmen
export function getScoreTrackPosition(score) {
  const norm = ((score % 66) + 66) % 66;
  const paddingX = 40;
  const paddingY = 32;
  const W = BOARD_WIDTH - paddingX * 2;
  const H = BOARD_HEIGHT - paddingY * 2;

  // Track verläuft im Uhrzeigersinn:
  // 0-15: Linker Rand von unten (y=H) nach oben (y=0)
  // 15-35: Oberer Rand von links (x=0) nach rechts (x=W)
  // 35-50: Rechter Rand von oben (y=0) nach unten (y=H)
  // 50-65: Unterer Rand von rechts (x=W) nach links (x=0)
  if (norm <= 15) {
    const t = norm / 15;
    return { x: paddingX, y: paddingY + H * (1 - t) };
  } else if (norm <= 35) {
    const t = (norm - 15) / 20;
    return { x: paddingX + W * t, y: paddingY };
  } else if (norm <= 50) {
    const t = (norm - 35) / 15;
    return { x: paddingX + W, y: paddingY + H * t };
  } else {
    const t = (norm - 50) / 16;
    return { x: paddingX + W * (1 - t), y: paddingY + H };
  }
}
