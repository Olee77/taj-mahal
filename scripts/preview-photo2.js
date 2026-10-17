import sharp from 'sharp';
import fs from 'fs';

fs.mkdirSync('public/assets/palaces', { recursive: true });

async function previewPhoto2() {
  const meta = await sharp('raw_photos/PXL_20261016_112814786.MP.jpg').metadata();
  const W = 1000;
  const H = Math.round(1000 * meta.height / meta.width); // ~1778
  const s = W / meta.width;

  // Let's estimate locations on 2268 x 4032:
  // Palaces are in the bottom half:
  // Around Y: 2200 to 2700
  // X: 50 to 2200
  const items = [
    // Top: Cylinder & Crown
    { name: 'cylinder', left: 1000, top: 1150, w: 250, h: 320 },
    { name: 'crown', left: 1320, top: 1280, w: 250, h: 250 },

    // Palaces: 5 colors
    { name: 'palace_blue', left: 40, top: 2260, w: 300, h: 300 },
    { name: 'palace_brown', left: 450, top: 2300, w: 300, h: 300 },
    { name: 'palace_red', left: 910, top: 2350, w: 300, h: 300 },
    { name: 'palace_grey', left: 1410, top: 2390, w: 300, h: 300 },
    { name: 'palace_beige', left: 1820, top: 2390, w: 300, h: 300 }
  ];

  const svgRects = [];
  for (const item of items) {
    const rx = Math.round(item.left * s);
    const ry = Math.round(item.top * s);
    const rw = Math.round(item.w * s);
    const rh = Math.round(item.h * s);
    svgRects.push(`<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="none" stroke="#00ff00" stroke-width="3" />`);
    svgRects.push(`<text x="${rx + 10}" y="${ry + 25}" fill="yellow" font-size="16" font-weight="bold">${item.name}</text>`);
  }

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    ${svgRects.join('\n')}
  </svg>`;

  await sharp('raw_photos/PXL_20261016_112814786.MP.jpg')
    .resize(W, H)
    .composite([{ input: Buffer.from(svg) }])
    .toFile('scratch/palaces_preview.jpg');

  console.log('Saved scratch/palaces_preview.jpg');
}

previewPhoto2();
