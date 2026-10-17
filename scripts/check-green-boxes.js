import sharp from 'sharp';

async function checkGreenBoxes() {
  const p = sharp('raw_photos/PXL_20261016_113805861.MP.jpg');
  const rotBuffer = await p.toBuffer();
  const meta = await sharp(rotBuffer).metadata();
  const scale = 0.25;
  const tw = Math.round(meta.width * scale);
  const th = Math.round(meta.height * scale);
  const { data } = await sharp(rotBuffer).resize(tw, th).grayscale().raw().toBuffer({ resolveWithObject: true });

  const thresh = 120, r = 2;
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
        if (count > 2000 && bw > 40 && bh > 60) {
          boxes.push({
            count,
            bw, bh,
            x: Math.round((minX - r) / scale),
            y: Math.round((minY - r) / scale),
            w: Math.round((bw + 2 * r) / scale),
            h: Math.round((bh + 2 * r) / scale),
            centerX: Math.round(((minX + maxX)/2) / scale),
            centerY: Math.round(((minY + maxY)/2) / scale)
          });
        }
      }
    }
  }

  console.log(`Green boxes found: ${boxes.length}`);
  boxes.sort((a, b) => a.centerY - b.centerY || a.centerX - b.centerX);
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i];
    console.log(`[${i+1}] count=${b.count}, x=${b.x}, y=${b.y}, w=${b.w}, h=${b.h}, cX=${b.centerX}, cY=${b.centerY}`);
  }
}

checkGreenBoxes();
