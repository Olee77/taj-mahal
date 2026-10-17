import sharp from 'sharp';

async function previewPhoto4() {
  const meta = await sharp('raw_photos/PXL_20261016_113149332.MP.jpg').metadata();
  const W = 1000;
  const H = Math.round(1000 * meta.height / meta.width); // ~1778
  const s = W / meta.width;

  // Let's draw bounding boxes for each token
  // On Photo 4 (2268 x 4032):
  // The items are located roughly in:
  // X: 100 to 2200, Y: 1000 to 3000
  const items = [
    // 4 Oval influence tokens (left side)
    { name: 'general', left: 100, top: 1450, w: 260, h: 420 },
    { name: 'princess', left: 410, top: 1450, w: 260, h: 420 },
    { name: 'monk', left: 30, top: 1950, w: 260, h: 430 },
    { name: 'vizier', left: 360, top: 1880, w: 260, h: 410 },

    // Fortress tiles (right side)
    // +1 Card (first of 5)
    { name: 'tile_card', left: 900, top: 1000, w: 220, h: 220 },
    // Taj Mahal (+4)
    { name: 'tile_taj', left: 890, top: 1260, w: 320, h: 320 },
    // +2 Points
    { name: 'tile_points', left: 890, top: 1610, w: 220, h: 220 },
    // Gewürz (Spice)
    { name: 'tile_spice', left: 880, top: 1870, w: 220, h: 220 },
    // Tee (Tea)
    { name: 'tile_tea', left: 860, top: 2130, w: 220, h: 220 },
    // Schmuck (Jewel)
    { name: 'tile_jewel', left: 860, top: 2420, w: 220, h: 220 }
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

  await sharp('raw_photos/PXL_20261016_113149332.MP.jpg')
    .resize(W, H)
    .composite([{ input: Buffer.from(svg) }])
    .toFile('scratch/tokens_preview.jpg');

  console.log('Saved scratch/tokens_preview.jpg');
}

previewPhoto4();
