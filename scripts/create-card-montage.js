import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function makeMontage() {
  const cardW = 100;
  const cardH = 150;
  const gap = 8;
  const cols = 10;
  const rows = 10;
  const montageW = cols * cardW + (cols + 1) * gap;
  const montageH = rows * cardH + (rows + 1) * gap;

  const files = [
    ...Array.from({length: 21}, (_, i) => `red_${String(i+1).padStart(2, '0')}.jpg`),
    ...Array.from({length: 21}, (_, i) => `yellow_${String(i+1).padStart(2, '0')}.jpg`),
    ...Array.from({length: 21}, (_, i) => `green_${String(i+1).padStart(2, '0')}.jpg`),
    ...Array.from({length: 21}, (_, i) => `violet_${String(i+1).padStart(2, '0')}.jpg`),
    ...Array.from({length: 12}, (_, i) => `white_${String(i+1).padStart(2, '0')}.jpg`),
    ...Array.from({length: 4}, (_, i) => `special_${String(i+1).padStart(2, '0')}.jpg`)
  ];

  const composites = [];
  for (let idx = 0; idx < files.length; idx++) {
    const file = files[idx];
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    const x = gap + c * (cardW + gap);
    const y = gap + r * (cardH + gap);

    const buf = await sharp(path.join('public/assets/cards', file))
      .resize(cardW, cardH)
      .toBuffer();

    composites.push({
      input: buf,
      left: x,
      top: y
    });
  }

  await sharp({
    create: {
      width: montageW,
      height: montageH,
      channels: 4,
      background: { r: 35, g: 30, b: 25, alpha: 1 }
    }
  })
  .composite(composites)
  .jpeg({ quality: 90 })
  .toFile('scratch/all_cards_montage.jpg');

  console.log(`Montage saved to scratch/all_cards_montage.jpg (${montageW}x${montageH})`);
}

makeMontage();
