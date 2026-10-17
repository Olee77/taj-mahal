import sharp from 'sharp';

async function makeCardBack() {
  const w = 347;
  const h = 540;

  const svg = `
  <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#141c2c"/>
        <stop offset="50%" stop-color="#0d131f"/>
        <stop offset="100%" stop-color="#080c14"/>
      </linearGradient>
      <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffe699"/>
        <stop offset="40%" stop-color="#d4af37"/>
        <stop offset="70%" stop-color="#aa8020"/>
        <stop offset="100%" stop-color="#e6c666"/>
      </linearGradient>
      <pattern id="lattice" width="24" height="24" patternUnits="userSpaceOnUse">
        <path d="M 0 12 L 12 0 L 24 12 L 12 24 Z" fill="none" stroke="rgba(212,175,55,0.12)" stroke-width="1.2"/>
        <circle cx="12" cy="12" r="2.5" fill="none" stroke="rgba(212,175,55,0.2)" stroke-width="1"/>
      </pattern>
    </defs>

    <!-- Outer card border -->
    <rect x="0" y="0" width="${w}" height="${h}" rx="18" fill="url(#bg)"/>
    <rect x="6" y="6" width="${w-12}" height="${h-12}" rx="14" fill="none" stroke="url(#gold)" stroke-width="2.5"/>
    <rect x="12" y="12" width="${w-24}" height="${h-24}" rx="10" fill="url(#bg)"/>

    <!-- Geometric background pattern -->
    <rect x="14" y="14" width="${w-28}" height="${h-28}" rx="8" fill="url(#lattice)"/>

    <!-- Central Ornate Frame -->
    <rect x="28" y="36" width="${w-56}" height="${h-72}" rx="8" fill="none" stroke="url(#gold)" stroke-width="1.5" stroke-dasharray="4 2"/>

    <!-- Mogul Arch Shape in Center -->
    <path d="M 45 460 L 45 230 C 45 135, ${w/2} 90, ${w/2} 60 C ${w/2} 90, ${w-45} 135, ${w-45} 230 L ${w-45} 460 Z"
          fill="rgba(10, 16, 26, 0.85)" stroke="url(#gold)" stroke-width="2.5"/>

    <!-- Inner Arch Outline -->
    <path d="M 55 450 L 55 235 C 55 145, ${w/2} 105, ${w/2} 80 C ${w/2} 105, ${w-55} 145, ${w-55} 235 L ${w-55} 450 Z"
          fill="none" stroke="url(#gold)" stroke-width="1"/>

    <!-- Taj Mahal Dome Silhouette -->
    <g transform="translate(${w/2}, 255) scale(0.95)">
      <!-- Main Dome -->
      <path d="M 0 -95 C 10 -85, 45 -65, 45 -25 C 45 -5, 30 15, 0 18 C -30 15, -45 -5, -45 -25 C -45 -65, -10 -85, 0 -95 Z"
            fill="url(#gold)"/>
      <!-- Finial on dome -->
      <line x1="0" y1="-95" x2="0" y2="-120" stroke="url(#gold)" stroke-width="2.5"/>
      <circle cx="0" cy="-122" r="3.5" fill="url(#gold)"/>
      <circle cx="0" cy="-114" r="2.5" fill="url(#gold)"/>

      <!-- Base building -->
      <rect x="-65" y="18" width="130" height="75" fill="url(#gold)" rx="2"/>
      <!-- Arch cutout in building -->
      <path d="M -22 93 L -22 45 C -22 28, 0 20, 0 16 C 0 20, 22 28, 22 45 L 22 93 Z" fill="#0c121d"/>

      <!-- Side Domes -->
      <path d="M -50 18 C -45 5, -55 -15, -50 -30 C -45 -15, -35 5, -40 18 Z" fill="url(#gold)"/>
      <path d="M 50 18 C 45 5, 55 -15, 50 -30 C 45 -15, 35 5, 40 18 Z" fill="url(#gold)"/>

      <!-- Left Minaret -->
      <rect x="-95" y="-30" width="10" height="123" fill="url(#gold)"/>
      <path d="M -97 -30 L -90 -45 L -83 -30 Z" fill="url(#gold)"/>
      <!-- Right Minaret -->
      <rect x="85" y="-30" width="10" height="123" fill="url(#gold)"/>
      <path d="M 83 -30 L 90 -45 L 97 -30 Z" fill="url(#gold)"/>
    </g>

    <!-- Title lettering -->
    <text x="${w/2}" y="390" text-anchor="middle" font-family="'Cinzel', 'Palatino', serif" font-size="24" font-weight="bold" fill="url(#gold)" letter-spacing="4">TADSCH MAHAL</text>
    <text x="${w/2}" y="415" text-anchor="middle" font-family="'Cinzel', 'Palatino', serif" font-size="11" fill="#ffe699" letter-spacing="2">REINER KNIZIA</text>

    <!-- Corner Ornaments -->
    <circle cx="28" cy="36" r="4" fill="url(#gold)"/>
    <circle cx="${w-28}" cy="36" r="4" fill="url(#gold)"/>
    <circle cx="28" cy="${h-36}" r="4" fill="url(#gold)"/>
    <circle cx="${w-28}" cy="${h-36}" r="4" fill="url(#gold)"/>
  </svg>
  `;

  await sharp(Buffer.from(svg))
    .jpeg({ quality: 95 })
    .toFile('public/assets/cards/card_back.jpg');

  console.log('Saved public/assets/cards/card_back.jpg');
}

makeCardBack();
