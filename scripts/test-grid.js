import sharp from 'sharp';
import fs from 'fs';

fs.mkdirSync('scratch', { recursive: true });

async function testGrid() {
  const meta = await sharp('raw_photos/PXL_20261016_113637198.MP.jpg').metadata();
  const W = 1200;
  const H = Math.round(1200 * meta.height / meta.width);
  const s = W / meta.width;

  // Let's refine based on raw image coordinates:
  // In 4032 x 2268:
  // Card size is roughly 420 x 650
  const colStarts = [350, 850, 1350, 1850, 2350, 2850, 3350];
  const cardW = 420;
  const rowStarts = [100, 800, 1500];
  const cardH = 650;

  const svgRects = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 7; c++) {
      const rx = Math.round(colStarts[c] * s);
      const ry = Math.round(rowStarts[r] * s);
      const rw = Math.round(cardW * s);
      const rh = Math.round(cardH * s);
      svgRects.push(`<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="none" stroke="red" stroke-width="2" />`);
      svgRects.push(`<text x="${rx + 10}" y="${ry + 20}" fill="yellow" font-size="12">R${r}C${c}</text>`);
    }
  }

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    ${svgRects.join('\n')}
  </svg>`;

  await sharp('raw_photos/PXL_20261016_113637198.MP.jpg')
    .resize(W, H)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .toFile('scratch/grid_preview_p6.jpg');

  console.log('Preview created: scratch/grid_preview_p6.jpg');
}

testGrid();
