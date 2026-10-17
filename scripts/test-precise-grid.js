import sharp from 'sharp';
import fs from 'fs';

async function testPreciseGrid() {
  const W = 1200;
  const H = 675;
  const scale = 4032 / 1200; // 3.36

  // In 4032 scale:
  const cols = [370, 850, 1330, 1805, 2280, 2760, 3235];
  const cardW = 410;
  const rows = [125, 805, 1480];
  const cardH = 615;

  const svgRects = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 7; c++) {
      const x = Math.round(cols[c] / scale);
      const y = Math.round(rows[r] / scale);
      const w = Math.round(cardW / scale);
      const h = Math.round(cardH / scale);

      svgRects.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" ry="6" fill="none" stroke="#00ff00" stroke-width="2" />`);
      svgRects.push(`<text x="${x + 6}" y="${y + 16}" fill="#ffff00" font-size="11" font-weight="bold">R${r}C${c}</text>`);
    }
  }

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    ${svgRects.join('\n')}
  </svg>`;

  await sharp('raw_photos/PXL_20261016_113637198.MP.jpg')
    .resize(W, H)
    .composite([{ input: Buffer.from(svg) }])
    .toFile('scratch/grid_precise_p6.jpg');

  console.log('Saved scratch/grid_precise_p6.jpg');
}

testPreciseGrid();
