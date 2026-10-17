import sharp from 'sharp';

async function findCardsForPhoto(name, path, rot, expectedCount, minThresh = 110, maxThresh = 175) {
  const scale = 0.25;
  let p = sharp(path);
  if (rot) p = p.rotate(rot);
  const meta = await p.metadata();
  const tw = Math.round(meta.width * scale);
  const th = Math.round(meta.height * scale);
  const { data } = await p.resize(tw, th).grayscale().raw().toBuffer({ resolveWithObject: true });

  let bestBoxes = [];
  let bestThresh = 0;
  let bestDiff = 999;

  for (let thresh = minThresh; thresh <= maxThresh; thresh += 5) {
    for (let r of [1, 2, 3]) {
      const binary = new Uint8Array(tw * th);
      for (let i = 0; i < binary.length; i++) binary[i] = data[i] > thresh ? 1 : 0;
      const eroded = new Uint8Array(tw * th);
      for (let y = r; y < th - r; y++) {
        for (let x = r; x < tw - r; x++) {
          let ok = 1;
          for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
              if (!binary[(y + dy) * tw + (x + dx)]) { ok = 0; break; }
            }
            if (!ok) break;
          }
          eroded[y * tw + x] = ok;
        }
      }
      const visited = new Uint8Array(tw * th);
      const boxes = [];
      for (let y = 0; y < th; y++) {
        for (let x = 0; x < tw; x++) {
          const idx = y * tw + x;
          if (eroded[idx] && !visited[idx]) {
            let minX = x, maxX = x, minY = y, maxY = y, count = 0;
            const stack = [x, y];
            visited[idx] = 1;
            while (stack.length) {
              const cy = stack.pop(), cx = stack.pop();
              count++;
              if (cx < minX) minX = cx; if (cx > maxX) maxX = cx;
              if (cy < minY) minY = cy; if (cy > maxY) maxY = cy;
              for (const [nx, ny] of [[cx+1, cy], [cx-1, cy], [cx, cy+1], [cx, cy-1]]) {
                if (nx >= 0 && nx < tw && ny >= 0 && ny < th) {
                  const nidx = ny * tw + nx;
                  if (eroded[nidx] && !visited[nidx]) {
                    visited[nidx] = 1; stack.push(nx, ny);
                  }
                }
              }
            }
            const bw = maxX - minX + 1, bh = maxY - minY + 1;
            // Area and aspect ratio check for cards: card aspect is approx 1:1.5 - 1:1.8
            if (count > 600 && bw > 25 && bh > 40 && bw < tw * 0.4 && bh < th * 0.4) {
              boxes.push({
                minX: Math.round((minX - r) / scale),
                maxX: Math.round((maxX + r) / scale),
                minY: Math.round((minY - r) / scale),
                maxY: Math.round((maxY + r) / scale),
                count
              });
            }
          }
        }
      }

      if (boxes.length === expectedCount) {
        console.log(`[EXACT] ${name}: found ${expectedCount} at thresh=${thresh}, r=${r}`);
        return { boxes, rot, meta };
      }
      if (Math.abs(boxes.length - expectedCount) < bestDiff) {
        bestDiff = Math.abs(boxes.length - expectedCount);
        bestBoxes = boxes;
        bestThresh = thresh;
      }
    }
  }

  console.log(`[CLOSEST] ${name}: found ${bestBoxes.length} (expected ${expectedCount}) at thresh=${bestThresh}`);
  return { boxes: bestBoxes, rot, meta };
}

async function run() {
  await findCardsForPhoto('Violet', 'raw_photos/PXL_20261016_113637198.MP.jpg', 0, 21);
  await findCardsForPhoto('Green', 'raw_photos/PXL_20261016_113805861.MP.jpg', 0, 21);
  await findCardsForPhoto('Red', 'raw_photos/PXL_20261016_113524400.MP.jpg', 270, 21);
  await findCardsForPhoto('Yellow', 'raw_photos/PXL_20261016_113905103.MP.jpg', 90, 21, 90, 180);
  await findCardsForPhoto('White', 'raw_photos/PXL_20261016_114010548.MP.jpg', 90, 12);
  await findCardsForPhoto('Special', 'raw_photos/PXL_20261016_114014350.MP.jpg', 90, 4);
}

run();
