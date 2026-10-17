import sharp from 'sharp';

async function makeTilesMontage() {
  const composites = [];
  for (let i = 1; i <= 12; i++) {
    const filename = `public/assets/tiles/tile_${String(i).padStart(2, '0')}.png`;
    const buf = await sharp(filename).resize(120, 120).toBuffer();
    const c = (i - 1) % 4;
    const r = Math.floor((i - 1) / 4);
    composites.push({
      input: buf,
      left: 10 + c * 130,
      top: 10 + r * 130
    });
  }

  await sharp({
    create: {
      width: 540,
      height: 410,
      channels: 4,
      background: { r: 40, g: 35, b: 30, alpha: 1 }
    }
  })
  .composite(composites)
  .png()
  .toFile('scratch/all_tiles_montage.png');

  console.log('Saved scratch/all_tiles_montage.png');
}

makeTilesMontage();
