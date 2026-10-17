import sharp from 'sharp';
import fs from 'fs';

fs.mkdirSync('scratch/tokens', { recursive: true });

async function inspectPhoto4() {
  const meta = await sharp('raw_photos/PXL_20261016_113149332.MP.jpg').metadata();
  console.log('Photo 4 size:', meta.width, 'x', meta.height); // 2268 x 4032

  const scale = 0.25; // 567 x 1008
  const targetW = Math.round(meta.width * scale);
  const targetH = Math.round(meta.height * scale);

  const { data } = await sharp('raw_photos/PXL_20261016_113149332.MP.jpg')
    .resize(targetW, targetH)
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let thresh of [125, 135, 145]) {
    const binary = new Uint8Array(targetW * targetH);
    for (let i = 0; i < binary.length; i++) binary[i] = data[i] > thresh ? 1 : 0;

    // Erode slightly to disconnect touching tiles
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
          if (count > 200 && bw > 15 && bh > 15) {
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
    if (boxes.length >= 20) {
      console.log('Sample boxes:', boxes.slice(0, 5));
    }
  }
}

inspectPhoto4();
