import sharp from 'sharp';

async function testAutoAlpha() {
  const { data, info } = await sharp('public/assets/tiles/tile_01.png')
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i+1];
    const b = data[i+2];
    const brightness = (r + g + b) / 3;

    // Wood is dark (< 150) or greyish brown
    // Cardboard tile is light cream (brightness > 170)
    if (brightness < 160) {
      data[i+3] = 0; // Transparent
    }
  }

  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim()
    .toFile('scratch/tile_01_autoalpha.png');

  console.log('Saved scratch/tile_01_autoalpha.png');
}

testAutoAlpha();
