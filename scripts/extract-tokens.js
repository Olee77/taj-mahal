import sharp from 'sharp';
import fs from 'fs';

fs.mkdirSync('public/assets/tokens', { recursive: true });

async function extractTokens() {
  const photo = sharp('raw_photos/PXL_20261016_113149332.MP.jpg');

  const items = [
    // 4 Oval influence tokens (width: 260, height: 420)
    { name: 'influence_general', left: 100, top: 1450, w: 260, h: 420, isOval: true },
    { name: 'influence_princess', left: 410, top: 1450, w: 260, h: 420, isOval: true },
    { name: 'influence_monk', left: 30, top: 1950, w: 260, h: 430, isOval: true },
    { name: 'influence_vizier', left: 360, top: 1880, w: 260, h: 410, isOval: true },

    // Fortress tiles
    { name: 'fortress_card', left: 900, top: 1000, w: 220, h: 220, isSquare: true },
    { name: 'fortress_taj_mahal', left: 890, top: 1260, w: 320, h: 320, isTaj: true },
    { name: 'fortress_points', left: 890, top: 1610, w: 220, h: 220, isSquare: true },
    { name: 'fortress_spice', left: 880, top: 1870, w: 220, h: 220, isSquare: true },
    { name: 'fortress_tea', left: 860, top: 2130, w: 220, h: 220, isSquare: true },
    { name: 'fortress_jewel', left: 860, top: 2420, w: 220, h: 220, isSquare: true }
  ];

  for (const item of items) {
    const rawBuf = await photo
      .clone()
      .extract({ left: item.left, top: item.top, width: item.w, height: item.h })
      .toBuffer();

    let maskSvg = '';
    if (item.isOval) {
      maskSvg = `<svg width="${item.w}" height="${item.h}" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="${item.w/2}" cy="${item.h/2}" rx="${item.w/2 - 6}" ry="${item.h/2 - 6}" fill="white" />
      </svg>`;
    } else if (item.isSquare) {
      maskSvg = `<svg width="${item.w}" height="${item.h}" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="6" width="${item.w - 12}" height="${item.h - 12}" rx="20" ry="20" fill="white" />
      </svg>`;
    } else if (item.isTaj) {
      // Dome roof shape
      maskSvg = `<svg width="${item.w}" height="${item.h}" xmlns="http://www.w3.org/2000/svg">
        <polygon points="${item.w/2},10 ${item.w - 10},90 ${item.w - 10},${item.h - 10} 10,${item.h - 10} 10,90" fill="white" />
      </svg>`;
    }

    await sharp(rawBuf)
      .composite([{ input: Buffer.from(maskSvg), blend: 'dest-in' }])
      .png()
      .toFile(`public/assets/tokens/${item.name}.png`);
  }

  console.log('Successfully extracted 10 influence tokens and fortress tiles!');
}

extractTokens();
