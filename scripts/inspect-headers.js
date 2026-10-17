import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Let's sample the top-left corner of each card to classify symbols
async function inspectCardSymbols() {
  const colors = ['red', 'yellow', 'green', 'violet'];
  const cardData = {};

  for (const col of colors) {
    cardData[col] = [];
    for (let i = 1; i <= 21; i++) {
      const filename = `${col}_${String(i).padStart(2, '0')}.jpg`;
      const filePath = path.join('public/assets/cards', filename);
      
      // Crop top area (y from 15 to 80, x from 20 to 320)
      const { data, info } = await sharp(filePath)
        .extract({ left: 20, top: 15, width: 300, height: 75 })
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Count pixels with specific colors or features
      // Elephants are dark grey/brown (R,G,B low and balanced)
      // Monk is orange (R high, G medium, B low)
      // General is green (G > R and G > B)
      // Vizier is blue (B > R and B > G)
      // Princess is purple/magenta (R high, B high, G low)
      // Mogul is yellow/gold (R high, G high, B low)
      
      // Let's save a thumbnail strip of top corners of all 21 cards for this color
      cardData[col].push(filename);
    }
  }

  // Let's create an inspection montage of the top headers of each color
  for (const col of colors) {
    const strips = [];
    for (let i = 1; i <= 21; i++) {
      const filename = `${col}_${String(i).padStart(2, '0')}.jpg`;
      const buf = await sharp(path.join('public/assets/cards', filename))
        .extract({ left: 10, top: 10, width: 327, height: 85 })
        .resize(160, 42)
        .toBuffer();
      strips.push({ input: buf, left: 10 + (Math.floor((i-1)/7)) * 170, top: 10 + ((i-1)%7) * 48 });
    }

    await sharp({
      create: {
        width: 530,
        height: 360,
        channels: 3,
        background: { r: 240, g: 240, b: 240 }
      }
    })
    .composite(strips)
    .jpeg()
    .toFile(`scratch/headers_${col}.jpg`);

    console.log(`Saved scratch/headers_${col}.jpg`);
  }
}

inspectCardSymbols();
