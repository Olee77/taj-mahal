import sharp from 'sharp';

const photos = [
  { name: 'Red', file: 'raw_photos/PXL_20261016_113524400.MP.jpg' },
  { name: 'Violet', file: 'raw_photos/PXL_20261016_113637198.MP.jpg' },
  { name: 'Green', file: 'raw_photos/PXL_20261016_113805861.MP.jpg' },
  { name: 'Yellow', file: 'raw_photos/PXL_20261016_113905103.MP.jpg' },
  { name: 'White', file: 'raw_photos/PXL_20261016_114010548.MP.jpg' },
  { name: 'Special', file: 'raw_photos/PXL_20261016_114014350.MP.jpg' }
];

async function check() {
  for (const p of photos) {
    const meta = await sharp(p.file).metadata();
    console.log(`${p.name}: ${meta.width}x${meta.height}, orientation: ${meta.orientation}`);
  }
}

check();
