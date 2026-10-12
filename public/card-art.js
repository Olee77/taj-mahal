// public/card-art.js - Vektorbasiertes Analog-Kartendesign für Taj Mahal (Reiner Knizia)
// Erstellt authentische Mogul-Karten mit Spitzbogen (Mihrab), Pergament-Textur & Charakter-Illustrationen

export const CARD_SUIT_THEMES = {
  'rot': {
    name: 'Rot',
    mainColor: '#a71d2a',
    lightColor: '#f9e8ea',
    accentColor: '#d32f2f',
    goldColor: '#c89b3c',
    archBg: 'linear-gradient(180deg, #5c0f17 0%, #2b060a 100%)',
    textColor: '#ffffff'
  },
  'gelb': {
    name: 'Gelb',
    mainColor: '#c97d0c',
    lightColor: '#fff8e7',
    accentColor: '#f57f17',
    goldColor: '#e0a020',
    archBg: 'linear-gradient(180deg, #663d00 0%, #331f00 100%)',
    textColor: '#ffffff'
  },
  'gruen': {
    name: 'Grün',
    mainColor: '#1d6f30',
    lightColor: '#eaf5ed',
    accentColor: '#2e7d32',
    goldColor: '#c89b3c',
    archBg: 'linear-gradient(180deg, #0d3816 0%, #051a0a 100%)',
    textColor: '#ffffff'
  },
  'violett': {
    name: 'Violett',
    mainColor: '#5c1d7a',
    lightColor: '#f4eaf9',
    accentColor: '#6a1b9a',
    goldColor: '#c89b3c',
    archBg: 'linear-gradient(180deg, #300a42 0%, #170420 100%)',
    textColor: '#ffffff'
  },
  'weiss': {
    name: 'Weiß',
    mainColor: '#6c6775',
    lightColor: '#faf8f5',
    accentColor: '#9e9e9e',
    goldColor: '#8a7d65',
    archBg: 'linear-gradient(180deg, #38353d 0%, #1e1d21 100%)',
    textColor: '#ffffff'
  },
  'special': {
    name: 'Sonderkarte',
    mainColor: '#8c6a25',
    lightColor: '#fdf9ee',
    accentColor: '#ffd700',
    goldColor: '#ffd700',
    archBg: 'linear-gradient(180deg, #4d380f 0%, #241a05 100%)',
    textColor: '#ffffff'
  }
};

// SVG-Pfade für die 6 authentischen Figuren & Siegel
export const FIGURE_ICONS = {
  'Wesir': {
    name: 'Wesir',
    role: 'Politik',
    tokenColor: '#2e7d32',
    svgPath: `
      <g transform="scale(0.85) translate(8, 5)">
        <!-- Turban mit Schmuckbrosche -->
        <path d="M40 24 C30 24 22 30 22 40 C22 52 32 58 40 58 C48 58 58 52 58 40 C58 30 50 24 40 24 Z" fill="#e8d5b5" stroke="#c89b3c" stroke-width="2"/>
        <path d="M40 20 C32 18 28 24 26 28 C34 26 46 26 54 28 C52 24 48 18 40 20 Z" fill="#2e7d32" stroke="#c89b3c" stroke-width="1.5"/>
        <circle cx="40" cy="28" r="4" fill="#ffd700"/>
        <circle cx="40" cy="28" r="2" fill="#d32f2f"/>
        <!-- Gesicht & Bart -->
        <ellipse cx="40" cy="46" rx="10" ry="12" fill="#d7a17a"/>
        <path d="M34 50 Q40 58 46 50" fill="#222"/>
        <!-- Gewand & Zepter -->
        <path d="M26 58 L14 110 L66 110 L54 58 Z" fill="#1b5e20" stroke="#c89b3c" stroke-width="2"/>
        <path d="M34 58 L34 110 M46 58 L46 110" stroke="#ffd700" stroke-width="2" stroke-dasharray="3,3"/>
        <path d="M52 70 L68 62 L64 105" stroke="#ffd700" stroke-width="3" stroke-linecap="round"/>
        <circle cx="68" cy="62" r="4" fill="#ffd700"/>
      </g>
    `
  },
  'General': {
    name: 'General',
    role: 'Militär',
    tokenColor: '#c62828',
    svgPath: `
      <g transform="scale(0.85) translate(8, 5)">
        <!-- Helm mit Spitze & Feder -->
        <path d="M40 16 L44 26 L36 26 Z" fill="#ffd700"/>
        <path d="M24 38 C24 26 32 24 40 24 C48 24 56 26 56 38 Z" fill="#8d99ae" stroke="#ffd700" stroke-width="2"/>
        <!-- Gesicht & Kettenhemd-Schutz -->
        <circle cx="40" cy="44" r="10" fill="#c99166"/>
        <path d="M26 44 L26 56 C26 62 54 62 54 56 L54 44 Z" fill="#5c677d" stroke="#333" stroke-width="1.5"/>
        <!-- Rüstung & Talwar (Krummsäbel) -->
        <path d="M22 58 L12 110 L68 110 L58 58 Z" fill="#b71c1c" stroke="#ffd700" stroke-width="2"/>
        <circle cx="28" cy="80" r="14" fill="#ffd700" stroke="#444" stroke-width="2"/>
        <circle cx="28" cy="80" r="4" fill="#b71c1c"/>
        <!-- Krummschwert -->
        <path d="M48 65 Q65 75 60 98 Q55 85 46 72" fill="#e0e0e0" stroke="#333" stroke-width="1.5"/>
      </g>
    `
  },
  'Mönch': {
    name: 'Mönch',
    role: 'Religion',
    tokenColor: '#1565c0',
    svgPath: `
      <g transform="scale(0.85) translate(8, 5)">
        <!-- Heiligenschein / Sonnen-Aura -->
        <circle cx="40" cy="40" r="24" fill="none" stroke="#ffd700" stroke-width="2" stroke-dasharray="2,3"/>
        <!-- Kopf kahl / Mala Perlen -->
        <circle cx="40" cy="38" r="11" fill="#c99166"/>
        <path d="M35 46 Q40 50 45 46" stroke="#444" stroke-width="1" fill="none"/>
        <!-- Safran/Orangenes Mönchsgewand -->
        <path d="M24 54 Q14 80 16 110 L64 110 Q66 80 56 54 Z" fill="#e65100" stroke="#ffb74d" stroke-width="2"/>
        <!-- Gebetskette (Mala) -->
        <path d="M32 58 C32 76 48 76 48 58" fill="none" stroke="#ffe082" stroke-width="3" stroke-dasharray="2,3"/>
        <!-- Lotusblüte am Boden -->
        <path d="M30 110 C35 102 45 102 50 110 Z" fill="#ff80ab"/>
      </g>
    `
  },
  'Prinzessin': {
    name: 'Prinzessin',
    role: 'Gesellschaft',
    tokenColor: '#f9a825',
    svgPath: `
      <g transform="scale(0.85) translate(8, 5)">
        <!-- Feines Diadem / Krone -->
        <path d="M30 26 L35 18 L40 24 L45 18 L50 26 Z" fill="#ffd700" stroke="#b8860b" stroke-width="1"/>
        <circle cx="40" cy="16" r="2.5" fill="#e91e63"/>
        <!-- Edles Gesicht mit Sari-Schleier -->
        <ellipse cx="40" cy="38" rx="10" ry="12" fill="#e0a986"/>
        <path d="M26 28 C20 40 22 70 20 110 L60 110 C58 70 60 40 54 28 Z" fill="none" stroke="#f48fb1" stroke-width="3" opacity="0.6"/>
        <!-- Bestickter königlicher Seidensari -->
        <path d="M25 52 L14 110 L66 110 L55 52 Z" fill="#ad1457" stroke="#ffd700" stroke-width="1.5"/>
        <path d="M25 52 Q40 85 55 110" stroke="#ffd700" stroke-width="2.5"/>
        <!-- Zarter Papagei / Lotus auf der Hand -->
        <circle cx="58" cy="62" r="5" fill="#4caf50"/>
        <path d="M58 64 L65 72" stroke="#4caf50" stroke-width="2"/>
      </g>
    `
  },
  'Großmogul': {
    name: 'Großmogul',
    role: 'Herrscher',
    tokenColor: '#ffd700',
    svgPath: `
      <g transform="scale(0.85) translate(8, 5)">
        <!-- Kaiserliche Zackenkrone (Imperial Mughal Crown) -->
        <path d="M22 28 L28 14 L40 22 L52 14 L58 28 Z" fill="#ffd700" stroke="#5a3d00" stroke-width="2"/>
        <circle cx="28" cy="14" r="3" fill="#00bcd4"/>
        <circle cx="40" cy="20" r="4" fill="#d32f2f"/>
        <circle cx="52" cy="14" r="3" fill="#4caf50"/>
        <!-- Gesicht mit Schnurrbart & Perlenschmuck -->
        <ellipse cx="40" cy="42" rx="11" ry="13" fill="#d7a17a"/>
        <path d="M33 46 Q40 52 47 46" fill="#111"/>
        <path d="M30 46 C34 56 46 56 50 46" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="2,2"/>
        <!-- Pfauenthron / Kaiserliche Brokatrobe -->
        <path d="M18 56 L10 110 L70 110 L62 56 Z" fill="#ffb300" stroke="#5a3d00" stroke-width="2"/>
        <path d="M30 56 L24 110 M50 56 L56 110" stroke="#c2185b" stroke-width="3"/>
        <circle cx="40" cy="74" r="6" fill="#d32f2f" stroke="#ffd700" stroke-width="1.5"/>
      </g>
    `
  },
  'Elefant': {
    name: 'Elefant',
    role: 'Provinzmacht',
    tokenColor: '#546e7a',
    svgPath: `
      <g transform="scale(0.82) translate(10, 8)">
        <!-- Rumpf & Beine des Prachtelefanten -->
        <path d="M22 65 C18 45 35 34 54 36 C70 38 78 52 74 70 L74 96 L64 96 L64 78 L52 78 L52 96 L42 96 L42 80 L32 80 L32 96 L22 96 Z" fill="#78909c" stroke="#37474f" stroke-width="2"/>
        <!-- Rüssel nach oben geschwungen -->
        <path d="M22 55 Q10 52 8 40 Q14 38 18 48 Z" fill="#78909c" stroke="#37474f" stroke-width="1.5"/>
        <!-- Stoßzahn -->
        <path d="M18 54 Q10 52 14 46" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
        <!-- Verziertes Ohr -->
        <path d="M34 42 C30 42 26 50 28 58 C30 64 38 64 40 54 Z" fill="#90a4ae" stroke="#37474f" stroke-width="1.5"/>
        <circle cx="33" cy="46" r="2" fill="#ffd700"/>
        <!-- Prunk-Satteldecke (Howdah / Schabracke) -->
        <path d="M38 45 L62 45 L60 68 L40 68 Z" fill="#c62828" stroke="#ffd700" stroke-width="2"/>
        <path d="M40 68 L60 68" stroke="#ffd700" stroke-width="3" stroke-dasharray="3,2"/>
        <!-- Goldene Glocken & Bänder -->
        <circle cx="50" cy="56" r="4" fill="#ffd700"/>
      </g>
    `
  }
};

/**
 * Erstellt ein vollständiges, authentisches analoges Karten-SVG
 * @param {Object} card Karten-Objekt ({ id, color, symbols, isWhite, isSpecial, specialType })
 * @param {Object} options { width: 140, height: 210, isMini: false }
 */
export function generateAnalogCardSvg(card, options = {}) {
  // Feste interne Koordinaten (140x210) für saubere Vektorskalierung über jedes Seitenverhältnis
  const VB_W = 140;
  const VB_H = 210;
  const displayW = options.width || VB_W;
  const displayH = options.height || VB_H;
  const isMini = options.isMini || false;

  const isSpecial = card.isSpecial;
  const isWhite = card.isWhite || card.color === 'weiss';
  const suitKey = isSpecial ? 'special' : (isWhite ? 'weiss' : (card.color || 'rot'));
  const theme = CARD_SUIT_THEMES[suitKey] || CARD_SUIT_THEMES['rot'];

  const symbols = card.symbols || [];
  const symbolCount = symbols.length;

  // Eindeutige ID für SVGs, damit Farbgradienten und Clip-Pfade nicht kollidieren
  const uid = 'tm_' + (card.id ? String(card.id).replace(/[^a-zA-Z0-9_-]/g, '_') : 'x') + '_' + Math.floor(Math.random() * 1000000);

  // Spitzbogen-Definition (Mihrab)
  const archTop = 28;
  const archLeft = 14;
  const archW = VB_W - 28;
  const archH = VB_H - 56;

  // Figuren-Rendering innerhalb des Bogens
  let figureContent = '';
  if (isSpecial) {
    figureContent = renderSpecialCardFigure(card, VB_W, VB_H, uid);
  } else if (symbolCount === 1) {
    const fig = FIGURE_ICONS[symbols[0]];
    if (fig) {
      figureContent = `
        <g transform="translate(${(VB_W - 80) / 2}, ${(VB_H - 120) / 2})">
          ${fig.svgPath}
        </g>
      `;
    }
  } else if (symbolCount === 2) {
    // 2 Symbole nebeneinander elegant arrangiert
    const fig1 = FIGURE_ICONS[symbols[0]];
    const fig2 = FIGURE_ICONS[symbols[1]];
    figureContent = `
      <g transform="translate(${(VB_W / 2) - 62}, ${(VB_H - 95) / 2}) scale(0.72)">
        ${fig1 ? fig1.svgPath : ''}
      </g>
      <g transform="translate(${(VB_W / 2) - 2}, ${(VB_H - 95) / 2}) scale(0.72)">
        ${fig2 ? fig2.svgPath : ''}
      </g>
    `;
  }

  // Ecken-Medaillons (Fanning index)
  const cornerMedallions = renderCornerMedallions(card, theme, VB_W, VB_H, uid, isMini);

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VB_W} ${VB_H}" width="${displayW}" height="${displayH}" class="analog-card-svg" style="border-radius:8px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
      <defs>
        <!-- Pergament / Marmor Hintergrund-Gradient -->
        <linearGradient id="parchment-${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fffef7"/>
          <stop offset="50%" stop-color="#f5eedc"/>
          <stop offset="100%" stop-color="#ebe0c7"/>
        </linearGradient>

        <!-- Juwelen-Gradient für den Rahmen -->
        <linearGradient id="suitGrad-${uid}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${theme.mainColor}"/>
          <stop offset="100%" stop-color="${theme.accentColor}"/>
        </linearGradient>

        <!-- Goldfolien-Gradient -->
        <linearGradient id="goldGrad-${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fae29c"/>
          <stop offset="50%" stop-color="#c89b3c"/>
          <stop offset="100%" stop-color="#8a671d"/>
        </linearGradient>

        <!-- Mogul-Spitzbogen ClipPath -->
        <clipPath id="archClip-${uid}">
          <path d="
            M ${archLeft} ${archTop + 35}
            Q ${archLeft} ${archTop + 10} ${archLeft + 15} ${archTop + 5}
            Q ${VB_W / 2 - 8} ${archTop} ${VB_W / 2} ${archTop - 12}
            Q ${VB_W / 2 + 8} ${archTop} ${archLeft + archW - 15} ${archTop + 5}
            Q ${archLeft + archW} ${archTop + 10} ${archLeft + archW} ${archTop + 35}
            L ${archLeft + archW} ${archTop + archH}
            L ${archLeft} ${archTop + archH}
            Z
          "/>
        </clipPath>
      </defs>

      <!-- 1. Pergament-Kartenbasis -->
      <rect x="1" y="1" width="${VB_W - 2}" height="${VB_H - 2}" rx="8" fill="url(#parchment-${uid})" stroke="#221e1a" stroke-width="1.5"/>

      <!-- 2. Doppelter Zierrahmen in Kartenfarbe & Gold -->
      <rect x="5" y="5" width="${VB_W - 10}" height="${VB_H - 10}" rx="6" fill="none" stroke="url(#suitGrad-${uid})" stroke-width="3"/>
      <rect x="8" y="8" width="${VB_W - 16}" height="${VB_H - 16}" rx="5" fill="none" stroke="url(#goldGrad-${uid})" stroke-width="1" stroke-dasharray="4,2"/>

      <!-- 3. Indische Paisley / Blüten-Eckornamente -->
      <circle cx="11" cy="11" r="2.5" fill="url(#goldGrad-${uid})"/>
      <circle cx="${VB_W - 11}" cy="11" r="2.5" fill="url(#goldGrad-${uid})"/>
      <circle cx="11" cy="${VB_H - 11}" r="2.5" fill="url(#goldGrad-${uid})"/>
      <circle cx="${VB_W - 11}" cy="${VB_H - 11}" r="2.5" fill="url(#goldGrad-${uid})"/>

      <!-- 4. Mogul-Spitzbogen (Mihrab) Hintergrund -->
      <path d="
        M ${archLeft} ${archTop + 35}
        Q ${archLeft} ${archTop + 10} ${archLeft + 15} ${archTop + 5}
        Q ${VB_W / 2 - 8} ${archTop} ${VB_W / 2} ${archTop - 12}
        Q ${VB_W / 2 + 8} ${archTop} ${archLeft + archW - 15} ${archTop + 5}
        Q ${archLeft + archW} ${archTop + 10} ${archLeft + archW} ${archTop + 35}
        L ${archLeft + archW} ${archTop + archH}
        L ${archLeft} ${archTop + archH}
        Z
      " fill="#1b1722" stroke="url(#goldGrad-${uid})" stroke-width="2.5"/>

      <!-- Bogen-Hintergrundmuster & feine Strahlen -->
      <g clip-path="url(#archClip-${uid})">
        <rect x="${archLeft}" y="${archTop - 15}" width="${archW}" height="${archH + 20}" fill="${theme.mainColor}" opacity="0.3"/>
        <!-- Hintergrund-Strahlen aus der Bogenmitte -->
        <circle cx="${VB_W / 2}" cy="${archTop + 30}" r="80" fill="none" stroke="url(#goldGrad-${uid})" stroke-width="0.8" opacity="0.25"/>
        <circle cx="${VB_W / 2}" cy="${archTop + 30}" r="60" fill="none" stroke="url(#goldGrad-${uid})" stroke-width="0.8" opacity="0.35"/>
        <circle cx="${VB_W / 2}" cy="${archTop + 30}" r="40" fill="none" stroke="url(#goldGrad-${uid})" stroke-width="0.8" opacity="0.45"/>

        <!-- 5. Die eigentliche Charakter-Figur -->
        ${figureContent}
      </g>

      <!-- 6. Zierspitze oben auf dem Bogen (Kalasha / Lotus-Finial) -->
      <path d="M ${VB_W / 2 - 5} ${archTop - 12} L ${VB_W / 2} ${archTop - 22} L ${VB_W / 2 + 5} ${archTop - 12} Z" fill="url(#goldGrad-${uid})"/>
      <circle cx="${VB_W / 2}" cy="${archTop - 22}" r="2" fill="#ffd700"/>

      <!-- 7. Text-Banner unten (Charakternamen) -->
      ${renderBottomBanner(card, theme, VB_W, VB_H, uid, isMini)}

      <!-- 8. Eck-Medaillons für schnelles Fächern in der Hand -->
      ${cornerMedallions}
    </svg>
  `;
}

function renderBottomBanner(card, theme, W, H, uid, isMini) {
  if (isMini) return '';
  const isSpecial = card.isSpecial;
  const label = isSpecial ? card.specialType : (card.symbols ? card.symbols.join(' + ') : '');

  return `
    <g transform="translate(14, ${H - 24})">
      <rect x="0" y="0" width="${W - 28}" height="16" rx="4" fill="#241d2d" stroke="url(#goldGrad-${uid})" stroke-width="1"/>
      <text x="${(W - 28) / 2}" y="11.5" text-anchor="middle" fill="#f6d177" font-family="Georgia, serif" font-size="9" font-weight="bold" letter-spacing="0.5">
        ${label}
      </text>
    </g>
  `;
}

function renderCornerMedallions(card, theme, W, H, uid, isMini) {
  const syms = card.symbols || [];
  const sym1 = syms[0] || (card.isSpecial ? '★' : '•');
  const fig1 = FIGURE_ICONS[sym1];
  const charInitial1 = fig1 ? fig1.name[0] : (card.isSpecial ? '★' : '');

  let rightMedallion = `
    <!-- Oben Rechts Farb-Siegel -->
    <g transform="translate(${W - 14}, 14)">
      <circle cx="0" cy="0" r="8" fill="${theme.mainColor}" stroke="url(#goldGrad-${uid})" stroke-width="1.2"/>
      <circle cx="0" cy="0" r="4" fill="url(#goldGrad-${uid})"/>
    </g>
  `;

  if (syms.length > 1) {
    const sym2 = syms[1];
    const fig2 = FIGURE_ICONS[sym2];
    const charInitial2 = fig2 ? fig2.name[0] : '';
    rightMedallion = `
      <!-- Oben Rechts zweites Symbol-Siegel -->
      <g transform="translate(${W - 14}, 14)">
        <circle cx="0" cy="0" r="8" fill="#241d2d" stroke="url(#goldGrad-${uid})" stroke-width="1.2"/>
        <text x="0" y="3.5" text-anchor="middle" fill="#ffd700" font-size="8" font-weight="bold" font-family="Georgia, serif">
          ${charInitial2}
        </text>
      </g>
    `;
  }

  return `
    <!-- Oben Links Siegel -->
    <g transform="translate(14, 14)">
      <circle cx="0" cy="0" r="8" fill="#241d2d" stroke="url(#goldGrad-${uid})" stroke-width="1.2"/>
      <text x="0" y="3.5" text-anchor="middle" fill="#ffd700" font-size="8" font-weight="bold" font-family="Georgia, serif">
        ${charInitial1}
      </text>
    </g>

    ${rightMedallion}
  `;
}

function renderSpecialCardFigure(card, W, H) {
  const type = card.specialType;

  if (type === 'Freie Farbwahl') {
    return `
      <g transform="translate(${(W - 80) / 2}, ${(H - 120) / 2})">
        <!-- Vierfarbiger Lotus der Toleranz -->
        <circle cx="40" cy="55" r="26" fill="#1b1722" stroke="#ffd700" stroke-width="2"/>
        <path d="M40 29 C40 45 40 45 20 55 C36 55 36 55 40 29" fill="#d32f2f"/>
        <path d="M40 29 C40 45 40 45 60 55 C44 55 44 55 40 29" fill="#fbc02d"/>
        <path d="M40 81 C40 65 40 65 20 55 C36 55 36 55 40 81" fill="#388e3c"/>
        <path d="M40 81 C40 65 40 65 60 55 C44 55 44 55 40 81" fill="#7b1fa2"/>
        <circle cx="40" cy="55" r="8" fill="#ffd700"/>
        <!-- 2 Wesir-Marken unten -->
        <circle cx="28" cy="98" r="8" fill="#1b5e20" stroke="#ffd700" stroke-width="1.5"/>
        <circle cx="52" cy="98" r="8" fill="#1b5e20" stroke="#ffd700" stroke-width="1.5"/>
      </g>
    `;
  } else if (type === '+2 Einflusspunkte') {
    return `
      <g transform="translate(${(W - 80) / 2}, ${(H - 120) / 2})">
        <text x="40" y="58" text-anchor="middle" fill="#ffd700" font-size="34" font-weight="bold" font-family="Georgia, serif">+2</text>
        <text x="40" y="74" text-anchor="middle" fill="#ffecb3" font-size="9" font-family="Georgia, serif">EINFLUSS</text>
        <!-- 2 General-Marken unten -->
        <circle cx="28" cy="98" r="8" fill="#b71c1c" stroke="#ffd700" stroke-width="1.5"/>
        <circle cx="52" cy="98" r="8" fill="#b71c1c" stroke="#ffd700" stroke-width="1.5"/>
      </g>
    `;
  } else if (type === '+1 Großmogul') {
    return `
      <g transform="translate(${(W - 80) / 2}, ${(H - 120) / 2})">
        ${FIGURE_ICONS['Großmogul'].svgPath}
        <!-- 2 Mönch-Marken unten -->
        <circle cx="28" cy="98" r="8" fill="#1565c0" stroke="#ffd700" stroke-width="1.5"/>
        <circle cx="52" cy="98" r="8" fill="#1565c0" stroke="#ffd700" stroke-width="1.5"/>
      </g>
    `;
  } else if (type === '+1 Elefant') {
    return `
      <g transform="translate(${(W - 80) / 2}, ${(H - 120) / 2})">
        ${FIGURE_ICONS['Elefant'].svgPath}
        <!-- 2 Prinzessin-Marken unten -->
        <circle cx="28" cy="98" r="8" fill="#f9a825" stroke="#ffd700" stroke-width="1.5"/>
        <circle cx="52" cy="98" r="8" fill="#f9a825" stroke="#ffd700" stroke-width="1.5"/>
      </g>
    `;
  }

  return '';
}
