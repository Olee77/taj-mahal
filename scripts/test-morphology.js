import sharp from 'sharp';
import fs from 'fs';

async function testMorphologicalDetection(photoPath) {
  const scale = 0.25; // 1008 x 567
  const meta = await sharp(photoPath).metadata();
  const targetW = Math.round(meta.width * scale);
  const targetH = Math.round(meta.height * scale);

  const { data } = await sharp(photoPath)
    .resize(targetW, targetH)
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Threshold: find Otsu or test multiple thresholds
  for (let thresh = 145; thresh <= 175; thresh += 5) {
    const binary = new Uint8Array(targetW * targetH);
    for (let i = 0; i < binary.length; i++) binary[i] = data[i] > thresh ? 1 : 0;

    // Morphological Erosion (radius 2)
    const eroded = new Uint8Array(targetW * targetH);
    const r = 2;
    for (let y = r; y < targetH - r; y++) {
      for (let x = r; x < targetW - r; x++) {
        let allWhite = 1;
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            if (binary[(y + dy) * targetW + (x + dx)] === 0) {
              allWhite = 0;
              break;
            }
          }
          if (!allWhite) break;
        }
        eroded[y * targetW + x] = allWhite;
      }
    }

    // Connected components on eroded
    const visited = new Uint8Array(targetW * targetH);
    const boxes = [];
    for (let y = 0; y < targetH; y++) {
      for (let x = 0; x < targetW; x++) {
        const idx = y * targetW + x;
        if (eroded[idx] === 1 && !visited[idx]) {
          let minX = x, maxX = x, minY = y, maxY = y;
          let count = 0;
          const stack = [x, y];
          visited[idx] = 1;
          while (stack.length > 0) {
            const cy = stack.pop();
            const cx = stack.pop();
            count++;
            if (cx < minX) minX = cx;
            if (cx > maxX) maxX = cx;
            if (cy < minY) minY = cy;
            if (cy > maxY) maxY = cy;
            const neighbors = [[cx+1, cy], [cx-1, cy], [cx, cy+1], [cx, cy-1]];
            for (const [nx, ny] of neighbors) {
              if (nx >= 0 && nx < targetW && ny >= 0 && ny < targetH) {
                const nidx = ny * targetW + nx;
                if (eroded[nidx] === 1 && !visited[nidx]) {
                  visited[nidx] = 1;
                  stack.push(nx, ny);
                }
              }
            }
          }
          const bw = maxX - minX + 1;
          const bh = maxY - minY + 1;
          if (count > 800 && bw > 30 && bh > 40) {
            // Expand back by erosion radius r
            boxes.push({
              left: Math.round((minX - r) / scale),
              top: Math.round((minY - r) / scale),
              width: Math.round((bw + 2 * r) / scale),
              height: Math.round((bh + 2 * r) / scale),
              count
            });
          }
        }
      }
    }

    console.log(`Thresh ${thresh}: found ${boxes.length} components`);
    if (boxes.length === 21) {
      console.log('SUCCESS! Found exactly 21 cards at threshold', thresh);
      return boxes;
    }
  }
}

async function run() {
  console.log('--- Violet ---');
  await testMorphologicalDetection('raw_photos/PXL_20261016_113637198.MP.jpg');
  console.log('--- Green ---');
  await testMorphologicalDetection('raw_photos/PXL_20261016_113805861.MP.jpg');
}
run();
