import sharp from 'sharp';
import fs from 'fs';

fs.mkdirSync('public/assets/palaces', { recursive: true });

async function extractPalaces() {
  const photo = sharp('raw_photos/PXL_20261016_112814786.MP.jpg');

  const items = [
    { name: 'cylinder', left: 990, top: 1140, w: 260, h: 320, isRound: true },
    { name: 'crown', left: 1310, top: 1260, w: 260, h: 260, isRound: true },

    { name: 'palace_blue', left: 35, top: 2260, w: 310, h: 310 },
    { name: 'palace_brown', left: 440, top: 2290, w: 310, h: 310 },
    { name: 'palace_red', left: 900, top: 2340, w: 310, h: 310 },
    { name: 'palace_grey', left: 1395, top: 2390, w: 310, h: 310 },
    { name: 'palace_beige', left: 1805, top: 2380, w: 310, h: 310 }
  ];

  for (const item of items) {
    const rawBuf = await photo
      .clone()
      .extract({ left: item.left, top: item.top, width: item.w, height: item.h })
      .toBuffer();

    // Mask with rounded shape / circle
    let maskSvg = '';
    if (item.isRound) {
      maskSvg = `<svg width="${item.w}" height="${item.h}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${item.w/2}" cy="${item.h/2}" r="${item.w/2 - 4}" fill="white" />
      </svg>`;
    } else {
      // Rounded palace base
      maskSvg = `<svg width="${item.w}" height="${item.h}" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="8" width="${item.w - 16}" height="${item.h - 16}" rx="45" ry="45" fill="white" />
      </svg>`;
    }

    const outDir = item.name.startsWith('palace') ? 'public/assets/palaces' : 'public/assets/tokens';
    await sharp(rawBuf)
      .composite([{ input: Buffer.from(maskSvg), blend: 'dest-in' }])
      .png()
      .toFile(`${outDir}/${item.name}.png`);
  }

  console.log('Successfully extracted 5 palaces, cylinder, and crown!');
}

extractPalaces();
