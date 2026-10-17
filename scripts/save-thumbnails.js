import sharp from 'sharp';

const photos = [
  { name: 'red', file: 'raw_photos/PXL_20261016_113524400.MP.jpg' },
  { name: 'violet', file: 'raw_photos/PXL_20261016_113637198.MP.jpg' },
  { name: 'green', file: 'raw_photos/PXL_20261016_113805861.MP.jpg' },
  { name: 'yellow', file: 'raw_photos/PXL_20261016_113905103.MP.jpg' },
  { name: 'white', file: 'raw_photos/PXL_20261016_114010548.MP.jpg' },
  { name: 'special', file: 'raw_photos/PXL_20261016_114014350.MP.jpg' }
];

async function run() {
  for (const p of photos) {
    await sharp(p.file)
      .resize(800, null)
      .toFile(`scratch/thumb_${p.name}.jpg`);
    console.log(`Saved scratch/thumb_${p.name}.jpg`);
  }
}

run();
