import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const OUT_DIR = 'public/assets/cards';
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// Detection configs for each photo
const CARD_SETS = [
  {
    name: 'violet',
    file: 'raw_photos/PXL_20261016_113637198.MP.jpg',
    rot: 0,
    expected: 21,
    thresh: 125,
    r: 3,
    rows: 3,
    cols: 7
  },
  {
    name: 'green',
    file: 'raw_photos/PXL_20261016_113805861.MP.jpg',
    rot: 0,
    expected: 21,
    thresh: 130,
    r: 2,
    rows: 3,
    cols: 7
  },
  {
    name: 'red',
    file: 'raw_photos/PXL_20261016_113524400.MP.jpg',
    rot: 270,
    expected: 21,
    thresh: 125,
    r: 2,
    rows: 3,
    cols: 7
  },
  {
    name: 'yellow',
    file: 'raw_photos/PXL_20261016_113905103.MP.jpg',
    rot: 90,
    expected: 21,
    thresh: 125,
    r: 2,
    rows: 3,
    cols: 7
  },
  {
    name: 'white',
    file: 'raw_photos/PXL_20261016_114010548.MP.jpg',
    rot: 90,
    expected: 12,
    thresh: 155,
    r: 3,
    rows: 3,
    cols: 4
  },
  {
    name: 'special',
    file: 'raw_photos/PXL_20261016_114014350.MP.jpg',
    rot: 90,
    expected: 4,
    thresh: 110,
    r: 1,
    rows: 2,
    cols: 2
  }
];

async function extractCards() {
  console.log('Starting extraction of all 100 game cards...');

  for (const set of CARD_SETS) {
    console.log(`\nProcessing ${set.name.toUpperCase()} (${set.file})...`);
    let p = sharp(set.file);
    if (set.rot !== 0) {
      p = p.rotate(set.rot);
    }
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
              h: Math.round((bh + 2 * r) / scale),
              centerY: Math.round(((minY + maxY) / 2) / scale),
              centerX: Math.round(((minX + maxX) / 2) / scale)
            });
          }
        }
      }
    }

    console.log(`Found ${boxes.length} raw components for ${set.name} (expected ${set.expected})`);

    // Calculate median width and height for this set to eliminate overlaps
    const sortedH = [...boxes].map(b => b.h).sort((a,b) => a-b);
    const sortedW = [...boxes].map(b => b.w).sort((a,b) => a-b);
    const medH = sortedH[Math.floor(sortedH.length / 2)];
    const medW = sortedW[Math.floor(sortedW.length / 2)];

    // Assign to rows based on centerY
    const rowHeight = meta.height / set.rows;
    for (const b of boxes) {
      b.row = Math.min(set.rows - 1, Math.floor(b.centerY / rowHeight));
      
      // If height is oversized, adjust y and h towards median
      if (b.h > medH * 1.05) {
        if (b.row > 0) {
          // Extra height is at the top (overlapping with previous row)
          b.y = b.y + (b.h - medH);
        }
        b.h = medH;
      }
      // If width is oversized, adjust x and w towards median
      if (b.w > medW * 1.05) {
        b.x = b.x + Math.round((b.w - medW) / 2);
        b.w = medW;
      }
    }

    // Sort: by row ascending, then by centerX ascending
    boxes.sort((a, b) => a.row - b.row || a.centerX - b.centerX);

    // Extract each card and save
    const cardH = 540;
    const cardW = Math.round(cardH * (56 / 87)); // Standard card ratio ~ 347px

    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i];
      // Inset slightly by 3% to cleanly remove the outer wooden table
      const insetX = Math.round(b.w * 0.035);
      const insetY = Math.round(b.h * 0.03);
      const cropLeft = Math.max(0, b.x + insetX);
      const cropTop = Math.max(0, b.y + insetY);
      const cropW = Math.min(meta.width - cropLeft, b.w - 2 * insetX);
      const cropH = Math.min(meta.height - cropTop, b.h - 2 * insetY);

      const filename = `${set.name}_${String(i + 1).padStart(2, '0')}.jpg`;
      const outPath = path.join(OUT_DIR, filename);

      await sharp(rotBuffer)
        .extract({ left: cropLeft, top: cropTop, width: cropW, height: cropH })
        .resize(cardW, cardH, { fit: 'fill' })
        .jpeg({ quality: 94 })
        .toFile(outPath);
      
      console.log(`  Saved [${i+1}/${boxes.length}] ${filename} (row ${b.row})`);
    }
  }

  // Also create a card back if needed
  // Using the backside pattern or creating an elegant card back
  console.log('\nAll cards successfully extracted to ' + OUT_DIR);
}

extractCards().catch(err => {
  console.error('Extraction failed:', err);
});
