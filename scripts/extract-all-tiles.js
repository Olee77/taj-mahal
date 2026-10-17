import sharp from 'sharp';
import fs from 'fs';

fs.mkdirSync('public/assets/tiles', { recursive: true });

async function extractAllTiles() {
  const rotatedBuf = await sharp('raw_photos/PXL_20261016_112933852.MP.jpg').rotate(270).toBuffer();

  const cols = [
    { left: 55, right: 515 },
    { left: 600, right: 1060 },
    { left: 1150, right: 1610 },
    { left: 1695, right: 2155 }
  ];

  const rows = [
    { top: 1135, bottom: 1605 },
    { top: 1815, bottom: 2345 },
    { top: 2555, bottom: 3085 }
  ];

  let num = 1;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      const left = cols[c].left;
      const top = rows[r].top;
      const width = cols[c].right - left;
      const height = rows[r].bottom - top;

      // Extract raw tile to 300x300
      const tileBuf = await sharp(rotatedBuf)
        .extract({ left, top, width, height })
        .resize(300, 300, { fit: 'fill' })
        .toBuffer();

      // Mask with exact octagon polygon
      const maskSvg = `<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
        <polygon points="75,10 225,10 290,75 290,225 225,290 75,290 10,225 10,75" fill="white" />
      </svg>`;

      await sharp(tileBuf)
        .composite([{ input: Buffer.from(maskSvg), blend: 'dest-in' }])
        .png()
        .toFile(`public/assets/tiles/tile_${String(num).padStart(2, '0')}.png`);

      num++;
    }
  }

  console.log('Successfully extracted all 12 masked province tiles!');
}

extractAllTiles();
