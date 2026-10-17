import sharp from 'sharp';
import fs from 'fs';

fs.mkdirSync('scratch/tiles', { recursive: true });

async function inspectTiles() {
  const meta = await sharp('raw_photos/PXL_20261016_112933852.MP.jpg').metadata();
  console.log('Photo 3 original:', meta.width, 'x', meta.height);

  // If we rotate 90 degrees CW
  await sharp('raw_photos/PXL_20261016_112933852.MP.jpg')
    .rotate(90)
    .resize(1200)
    .toFile('scratch/tiles_rot90.jpg');

  // And 270 degrees CW (90 CCW)
  await sharp('raw_photos/PXL_20261016_112933852.MP.jpg')
    .rotate(270)
    .resize(1200)
    .toFile('scratch/tiles_rot270.jpg');

  console.log('Created tiles_rot90.jpg and tiles_rot270.jpg');
}

inspectTiles();
