import sharp from 'sharp';

async function testGridTrimming(name, photoPath, rot, rows, cols) {
  let p = sharp(photoPath);
  if (rot) p = p.rotate(rot);
  const meta = await p.metadata();
  const W = meta.width;
  const H = meta.height;

  // Let's inspect the cards in this grid
  console.log(`\n=== Testing Grid for ${name} (${W}x${H}, ${rows}x${cols}) ===`);

  // We can load a downscaled buffer (scale = 0.5) to find precise bounds per cell
  const scale = 0.5;
  const sW = Math.round(W * scale);
  const sH = Math.round(H * scale);
  const { data } = await p.clone().resize(sW, sH).grayscale().raw().toBuffer({ resolveWithObject: true });

  const cellW = sW / cols;
  const cellH = sH / rows;

  const cardBoxes = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Cell bounds in downscaled coords
      const cellLeft = Math.round(c * cellW);
      const cellRight = Math.round((c + 1) * cellW);
      const cellTop = Math.round(r * cellH);
      const cellBottom = Math.round((r + 1) * cellH);

      // In each cell, find Otsu threshold or median brightness
      // Wood table is darker than the white/light card
      let minVal = 255, maxVal = 0;
      for (let y = cellTop; y < cellBottom; y++) {
        for (let x = cellLeft; x < cellRight; x++) {
          const v = data[y * sW + x];
          if (v < minVal) minVal = v;
          if (v > maxVal) maxVal = v;
        }
      }
      // Threshold for this cell
      const cellThresh = minVal + (maxVal - minVal) * 0.45;

      // Project horizontally and vertically inside the cell
      const colCounts = new Array(cellRight - cellLeft).fill(0);
      const rowCounts = new Array(cellBottom - cellTop).fill(0);

      for (let y = cellTop; y < cellBottom; y++) {
        for (let x = cellLeft; x < cellRight; x++) {
          if (data[y * sW + x] > cellThresh) {
            colCounts[x - cellLeft]++;
            rowCounts[y - cellTop]++;
          }
        }
      }

      // Find start and end of card (where white count exceeds 20% of cell height/width)
      const hThreshold = (cellBottom - cellTop) * 0.25;
      const wThreshold = (cellRight - cellLeft) * 0.25;

      let cardLeft = 0;
      while (cardLeft < colCounts.length && colCounts[cardLeft] < hThreshold) cardLeft++;
      let cardRight = colCounts.length - 1;
      while (cardRight > 0 && colCounts[cardRight] < hThreshold) cardRight--;

      let cardTop = 0;
      while (cardTop < rowCounts.length && rowCounts[cardTop] < wThreshold) cardTop++;
      let cardBottom = rowCounts.length - 1;
      while (cardBottom > 0 && rowCounts[cardBottom] < wThreshold) cardBottom--;

      const finalLeft = Math.round((cellLeft + cardLeft) / scale);
      const finalRight = Math.round((cellLeft + cardRight) / scale);
      const finalTop = Math.round((cellTop + cardTop) / scale);
      const finalBottom = Math.round((cellTop + cardBottom) / scale);

      const cardW = finalRight - finalLeft;
      const cardH = finalBottom - finalTop;

      cardBoxes.push({
        row: r, col: c,
        left: finalLeft, top: finalTop, width: cardW, height: cardH
      });
    }
  }

  console.log(`${name}: extracted ${cardBoxes.length} boxes.`);
  console.log(`Sample Row 0, Col 0:`, cardBoxes[0]);
  console.log(`Sample Row 1, Col 3:`, cardBoxes[cols + 3]);
  console.log(`Sample Row ${rows-1}, Col ${cols-1}:`, cardBoxes[cardBoxes.length - 1]);

  return cardBoxes;
}

async function run() {
  await testGridTrimming('Red', 'raw_photos/PXL_20261016_113524400.MP.jpg', 270, 3, 7);
  await testGridTrimming('Yellow', 'raw_photos/PXL_20261016_113905103.MP.jpg', 90, 3, 7);
  await testGridTrimming('Violet', 'raw_photos/PXL_20261016_113637198.MP.jpg', 0, 3, 7);
  await testGridTrimming('Green', 'raw_photos/PXL_20261016_113805861.MP.jpg', 0, 3, 7);
  await testGridTrimming('White', 'raw_photos/PXL_20261016_114010548.MP.jpg', 90, 3, 4);
  await testGridTrimming('Special', 'raw_photos/PXL_20261016_114014350.MP.jpg', 90, 2, 2);
}

run();
