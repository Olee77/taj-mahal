import sharp from 'sharp';

async function diagnose(name, path, rot) {
  let p = sharp(path);
  if (rot) p = p.rotate(rot);
  const { data } = await p.resize(500, null).grayscale().raw().toBuffer({ resolveWithObject: true });
  
  // Calculate histogram
  const hist = new Array(256).fill(0);
  for (let i = 0; i < data.length; i++) hist[data[i]]++;
  
  // Find min, max, average
  let sum = 0, min = 255, max = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
    if (data[i] < min) min = data[i];
    if (data[i] > max) max = data[i];
  }
  const avg = Math.round(sum / data.length);
  console.log(`${name}: min=${min}, max=${max}, avg=${avg}`);
  
  // Test range of thresholds from min+20 to max-20
  for (let t = Math.max(min + 10, 60); t <= Math.min(max - 10, 200); t += 10) {
    // Check fraction of pixels > t
    let whiteCount = 0;
    for (let i = 0; i < data.length; i++) if (data[i] > t) whiteCount++;
    const pct = ((whiteCount / data.length) * 100).toFixed(1);
    console.log(`  thresh ${t}: ${pct}% white`);
  }
}

async function run() {
  await diagnose('Violet', 'raw_photos/PXL_20261016_113637198.MP.jpg', 0);
  await diagnose('Red', 'raw_photos/PXL_20261016_113524400.MP.jpg', 270);
  await diagnose('Yellow', 'raw_photos/PXL_20261016_113905103.MP.jpg', 90);
}

run();
