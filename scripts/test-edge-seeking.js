import sharp from 'sharp';
import fs from 'fs';

async function testEdgeSeeking() {
  const meta = await sharp('raw_photos/PXL_20261016_113637198.MP.jpg').metadata();
  const W = meta.width; // 4032
  const H = meta.height; // 2268

  const { data } = await sharp('raw_photos/PXL_20261016_113637198.MP.jpg')
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  function getPixel(x, y) {
    if (x < 0 || x >= W || y < 0 || y >= H) return 0;
    return data[y * W + x];
  }

  // Rough center seeds for the 3x7 grid in 4032x2268
  // 7 cols: approx centers
  const colCenters = [580, 1050, 1530, 2010, 2480, 2950, 3420];
  // 3 rows: approx centers
  const rowCenters = [400, 1050, 1750];

  const boxes = [];
  const svgRects = [];

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 7; c++) {
      const cx = colCenters[c];
      const cy = rowCenters[r];

      // Scan left from cx until dark table
      let left = cx;
      while (left > cx - 350 && getPixel(left, cy) > 165) left--;

      // Scan right from cx until dark table
      let right = cx;
      while (right < cx + 350 && getPixel(right, cy) > 165) right++;

      // Scan up from cy until dark table
      let top = cy;
      while (top > cy - 450 && getPixel(cx, top) > 165) top--;

      // Scan down from cy until dark table
      let bottom = cy;
      while (bottom < cy + 450 && getPixel(cx, bottom) > 165) bottom++;

      const width = right - left;
      const height = bottom - top;

      boxes.push({ r, c, left, top, width, height });
      svgRects.push(`<rect x="${left}" y="${top}" width="${width}" height="${height}" fill="none" stroke="#00ff00" stroke-width="8" />`);
      svgRects.push(`<text x="${left + 30}" y="${top + 60}" fill="#00ff00" font-size="40" font-weight="bold">R${r}C${c}</text>`);
    }
  }

  console.log('Detected', boxes.length, 'boxes:');
  boxes.forEach(b => console.log(`R${b.r}C${b.c}: left=${b.left}, top=${b.top}, w=${b.width}, h=${b.height}`));

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    ${svgRects.join('\n')}
  </svg>`;

  await sharp('raw_photos/PXL_20261016_113637198.MP.jpg')
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .resize(1200)
    .toFile('scratch/edge_preview_p6.jpg');

  console.log('Saved scratch/edge_preview_p6.jpg');
}

testEdgeSeeking();
