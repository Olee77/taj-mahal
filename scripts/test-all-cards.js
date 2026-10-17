import sharp from 'sharp';

async function testAll() {
  async function detect(photoPath, rotateDeg, expectedCount) {
    const scale = 0.25;
    let pipeline = sharp(photoPath);
    if (rotateDeg !== 0) pipeline = pipeline.rotate(rotateDeg);
    const meta = await pipeline.metadata();
    const targetW = Math.round(meta.width * scale);
    const targetH = Math.round(meta.height * scale);

    const { data } = await pipeline
      .resize(targetW, targetH)
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    for (let thresh = 135; thresh <= 175; thresh += 5) {
      const binary = new Uint8Array(targetW * targetH);
      for (let i = 0; i < binary.length; i++) binary[i] = data[i] > thresh ? 1 : 0;

      const r = 2;
      const eroded = new Uint8Array(targetW * targetH);
      for (let y = r; y < targetH - r; y++) {
        for (let x = r; x < targetW - r; x++) {
          let allWhite = 1;
          for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
              if (binary[(y + dy) * targetW + (x + dx)] === 0) {
                allWhite = 0; break;
              }
            }
            if (!allWhite) break;
          }
          eroded[y * targetW + x] = allWhite;
        }
      }

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

      if (boxes.length === expectedCount) {
        console.log(`[SUCCESS] ${photoPath} (rot ${rotateDeg}): found exact ${expectedCount} components at thresh ${thresh}`);
        return boxes;
      }
    }
    console.log(`[PARTIAL] ${photoPath} (rot ${rotateDeg}): did not hit exact ${expectedCount}`);
  }

  await detect('raw_photos/PXL_20261016_113637198.MP.jpg', 0, 21);   // Violet
  await detect('raw_photos/PXL_20261016_113805861.MP.jpg', 0, 21);   // Green
  await detect('raw_photos/PXL_20261016_113905103.MP.jpg', 90, 21);  // Yellow
  await detect('raw_photos/PXL_20261016_113524400.MP.jpg', 270, 21); // Red
  await detect('raw_photos/PXL_20261016_114010548.MP.jpg', 90, 12);  // White
  await detect('raw_photos/PXL_20261016_114014350.MP.jpg', 90, 4);   // Special
}

testAll();
