import sharp from 'sharp';
import fs from 'fs';

fs.mkdirSync('public/assets/tiles', { recursive: true });

async function extractTiles() {
  const rotated = sharp('raw_photos/PXL_20261016_112933852.MP.jpg').rotate(270);
  const meta = await rotated.metadata(); // 2268 x 4032

  const scale = 0.25;
  const targetW = Math.round(meta.width * scale);
  const targetH = Math.round(meta.height * scale);

  const { data } = await rotated
    .clone()
    .resize(targetW, targetH)
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const thresh = 135;
  const binary = new Uint8Array(targetW * targetH);
  for (let i = 0; i < binary.length; i++) binary[i] = data[i] > thresh ? 1 : 0;

  // Connected components
  const visited = new Uint8Array(targetW * targetH);
  const boxes = [];
  for (let y = 0; y < targetH; y++) {
    for (let x = 0; x < targetW; x++) {
      const idx = y * targetW + x;
      if (binary[idx] === 1 && !visited[idx]) {
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
              if (binary[nidx]===1 && !visited[nidx]) {
                visited[nidx] = 1; stack.push(nx, ny);
              }
            }
          }
        }
        const bw = maxX - minX + 1;
        const bh = maxY - minY + 1;
        if (count > 800 && bw > 40 && bh > 40) {
          boxes.push({
            left: Math.round(minX / scale),
            top: Math.round(minY / scale),
            width: Math.round(bw / scale),
            height: Math.round(bh / scale),
            count
          });
        }
      }
    }
  }

  console.log('Found', boxes.length, 'tile components');
  boxes.sort((a,b) => a.top - b.top);
  // Row 0 (4), Row 1 (4), Row 2 (4)
  const r0 = boxes.slice(0, 4).sort((a,b) => a.left - b.left);
  const r1 = boxes.slice(4, 8).sort((a,b) => a.left - b.left);
  const r2 = boxes.slice(8, 12).sort((a,b) => a.left - b.left);
  const sorted = [...r0, ...r1, ...r2];

  for (let i = 0; i < sorted.length; i++) {
    const b = sorted[i];
    const num = i + 1;
    // Add small margin around box
    const margin = 10;
    const l = Math.max(0, b.left - margin);
    const t = Math.max(0, b.top - margin);
    const w = Math.min(meta.width - l, b.width + 2 * margin);
    const h = Math.min(meta.height - t, b.height + 2 * margin);

    await rotated
      .clone()
      .extract({ left: l, top: t, width: w, height: h })
      .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(`public/assets/tiles/tile_${String(num).padStart(2, '0')}.png`);
  }
  console.log('Saved 12 province tiles to public/assets/tiles/');
}

extractTiles();
