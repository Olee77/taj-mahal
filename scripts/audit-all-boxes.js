import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Read all boxes that extract-all-cards uses and check their w and h
async function audit() {
  const CARD_SETS = [
    { name: 'violet', file: 'raw_photos/PXL_20261016_113637198.MP.jpg', rot: 0, thresh: 125, r: 3, rows: 3, cols: 7 },
    { name: 'green', file: 'raw_photos/PXL_20261016_113805861.MP.jpg', rot: 0, thresh: 130, r: 2, rows: 3, cols: 7 },
    { name: 'red', file: 'raw_photos/PXL_20261016_113524400.MP.jpg', rot: 270, thresh: 125, r: 2, rows: 3, cols: 7 },
    { name: 'yellow', file: 'raw_photos/PXL_20261016_113905103.MP.jpg', rot: 90, thresh: 125, r: 2, rows: 3, cols: 7 },
    { name: 'white', file: 'raw_photos/PXL_20261016_114010548.MP.jpg', rot: 90, thresh: 155, r: 3, rows: 3, cols: 4 },
    { name: 'special', file: 'raw_photos/PXL_20261016_114014350.MP.jpg', rot: 90, thresh: 110, r: 1, rows: 2, cols: 2 }
  ];

  for (const set of CARD_SETS) {
    let p = sharp(set.file);
    if (set.rot !== 0) p = p.rotate(set.rot);
    const rotBuffer = await p.toBuffer();
    const meta = await sharp(rotBuffer).metadata();

    const scale = 0.25;
    const tw = Math.round(meta.width * scale);
    const th = Math.round(meta.height * scale);
    const { data } = await sharp(rotBuffer).resize(tw, th).grayscale().raw().toBuffer({ resolveWithObject: true });

    const binary = new Uint8Array(tw * th);
    for (let i = 0; i < binary.length; i++) binary[i] = data[i] > set.thresh ? 1 : 0;

    const r = set.r;
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
          if (count > 2000 && bw > 40 && bh > 60 && bw < tw * 0.4 && bh < th * 0.4) {
            boxes.push({
              x: Math.round((minX - r) / scale),
              y: Math.round((minY - r) / scale),
              w: Math.round((bw + 2 * r) / scale),
              h: Math.round((bh + 2 * r) / scale)
            });
          }
        }
      }
    }

    // Check outliers in w or h
    const heights = boxes.map(b => b.h).sort((a,b) => a-b);
    const widths = boxes.map(b => b.w).sort((a,b) => a-b);
    const medH = heights[Math.floor(heights.length / 2)];
    const medW = widths[Math.floor(widths.length / 2)];

    console.log(`\n=== ${set.name.toUpperCase()} (count=${boxes.length}, medW=${medW}, medH=${medH}) ===`);
    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i];
      const diffH = Math.abs(b.h - medH);
      const diffW = Math.abs(b.w - medW);
      if (diffH > 40 || diffW > 40) {
        console.log(`  Outlier [${i+1}]: x=${b.x}, y=${b.y}, w=${b.w} (diff ${b.w - medW}), h=${b.h} (diff ${b.h - medH})`);
      }
    }
  }
}

audit();
