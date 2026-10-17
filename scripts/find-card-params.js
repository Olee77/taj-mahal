import sharp from 'sharp';

async function test(name, path, rot, expected) {
  console.log(`=== ${name} (${path}) ===`);
  const scale = 0.25;
  let p = sharp(path);
  if (rot) p = p.rotate(rot);
  const meta = await p.metadata();
  const tw = Math.round(meta.width * scale);
  const th = Math.round(meta.height * scale);
  const { data } = await p.resize(tw, th).grayscale().raw().toBuffer({ resolveWithObject: true });

  for (const thresh of [110, 120, 130, 135, 140, 145, 150, 155, 160]) {
    for (const r of [1, 2, 3]) {
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
            if (count > 400 && bw > 20 && bh > 30) {
              boxes.push({ count, bw, bh });
            }
          }
        }
      }
      if (boxes.length === expected) {
        console.log(`MATCH: thresh ${thresh}, r ${r} -> found ${boxes.length}`);
      } else if (Math.abs(boxes.length - expected) <= 2) {
        console.log(`NEAR: thresh ${thresh}, r ${r} -> found ${boxes.length}`);
      }
    }
  }
}

async function run() {
  await test('Yellow', 'raw_photos/PXL_20261016_113905103.MP.jpg', 90, 21);
  await test('Red', 'raw_photos/PXL_20261016_113524400.MP.jpg', 270, 21);
  await test('Special', 'raw_photos/PXL_20261016_114014350.MP.jpg', 90, 4);
}

run();
