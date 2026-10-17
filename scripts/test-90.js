import sharp from 'sharp';

async function test90() {
  await sharp('raw_photos/PXL_20261016_113905103.MP.jpg').rotate(90).resize(800, null).toFile('scratch/rot90_yellow.jpg');
  await sharp('raw_photos/PXL_20261016_114010548.MP.jpg').rotate(90).resize(800, null).toFile('scratch/rot90_white.jpg');
  await sharp('raw_photos/PXL_20261016_114014350.MP.jpg').rotate(90).resize(800, null).toFile('scratch/rot90_special.jpg');
  console.log('Rotated 90 saved');
}

test90();
