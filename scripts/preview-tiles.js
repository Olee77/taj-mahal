import sharp from 'sharp';

async function previewTileGrid() {
  const W = 800;
  const H = Math.round(800 * 4032 / 2268); // 1422
  const s = W / 2268;

  const baseBuf = await sharp('raw_photos/PXL_20261016_112933852.MP.jpg')
    .rotate(270)
    .resize(W, H)
    .toBuffer();

  const cols = [
    { left: 50, right: 530 },
    { left: 590, right: 1070 },
    { left: 1140, right: 1620 },
    { left: 1680, right: 2160 }
  ];

  const rows = [
    { top: 1120, bottom: 1620 },
    { top: 1800, bottom: 2360 },
    { top: 2540, bottom: 3100 }
  ];

  const svgRects = [];
  let num = 1;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      const left = Math.round(cols[c].left * s);
      const top = Math.round(rows[r].top * s);
      const w = Math.round((cols[c].right - cols[c].left) * s);
      const h = Math.round((rows[r].bottom - rows[r].top) * s);
      svgRects.push(`<rect x="${left}" y="${top}" width="${w}" height="${h}" fill="none" stroke="#00ff00" stroke-width="4" />`);
      svgRects.push(`<text x="${left + 15}" y="${top + 30}" fill="yellow" font-size="24" font-weight="bold">${num++}</text>`);
    }
  }

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    ${svgRects.join('\n')}
  </svg>`;

  await sharp(baseBuf)
    .composite([{ input: Buffer.from(svg) }])
    .toFile('scratch/tiles_grid_preview.jpg');

  console.log('Saved scratch/tiles_grid_preview.jpg');
}

previewTileGrid();
