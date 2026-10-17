import sharp from 'sharp';
import fs from 'fs';

async function inspectVioletCards() {
  // Let's crop each card of Photo 6 and save thumbnails in scratch/violet/
  fs.mkdirSync('scratch/violet', { recursive: true });

  const scale = 0.25;
  const meta = await sharp('raw_photos/PXL_20261016_113637198.MP.jpg').metadata();
  const targetW = Math.round(meta.width * scale);
  const targetH = Math.round(meta.height * scale);

  const { data } = await sharp('raw_photos/PXL_20261016_113637198.MP.jpg')
    .resize(targetW, targetH)
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const thresh = 135;
  const binary = new Uint8Array(targetW * targetH);
  for (let i = 0; i < binary.length; i++) binary[i] = data[i] > thresh ? 1 : 0;

  const r = 2;
  const eroded = new Uint8Array(targetW * targetH);
  for (let y = r; y < targetH - r; y++) {
    for (let x = r; x < targetW - r; x++) {
      let ok = 1;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (binary[(y+dy)*targetW + (x+dx)] === 0) { ok = 0; break; }
        }
        if (!ok) break;
      }
      eroded[y * targetW + x] = ok;
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
          for (let [nx, ny] of [[cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]]) {
            if (nx>=0 && nx<targetW && ny>=0 && ny<targetH) {
              const nidx = ny*targetW + nx;
              if (eroded[nidx]===1 && !visited[nidx]) {
                visited[nidx] = 1; stack.push(nx, ny);
              }
            }
          }
        }
        const bw = maxX - minX + 1;
        const bh = maxY - minY + 1;
        if (count > 800 && bw > 30 && bh > 40) {
          boxes.push({
            left: Math.max(0, Math.round((minX - r) / scale)),
            top: Math.max(0, Math.round((minY - r) / scale)),
            width: Math.min(meta.width - Math.round((minX - r) / scale), Math.round((bw + 2 * r) / scale)),
            height: Math.min(meta.height - Math.round((minY - r) / scale), Math.round((bh + 2 * r) / scale)),
            count
          });
        }
      }
    }
  }

  // Sort into rows and cols
  boxes.sort((a,b) => a.top - b.top);
  // Row 0: first 7, Row 1: next 7, Row 2: next 7
  const r0 = boxes.slice(0, 7).sort((a,b) => a.left - b.left);
  const r1 = boxes.slice(7, 14).sort((a,b) => a.left - b.left);
  const r2 = boxes.slice(14, 21).sort((a,b) => a.left - b.left);

  const sorted = [...r0, ...r1, ...r2];

  for (let i = 0; i < sorted.length; i++) {
    const b = sorted[i];
    await sharp('raw_photos/PXL_20261016_113637198.MP.jpg')
      .extract({ left: b.left, top: b.top, width: b.width, height: b.height })
      .resize(300)
      .toFile(`scratch/violet/card_${String(i).padStart(2, '0')}.jpg`);
  }

  console.log('Saved 21 violet cards to scratch/violet/');
}

inspectVioletCards();
