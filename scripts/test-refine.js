import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Let's test refining a single card crop by finding the exact white border
async function refineCardCrop(photoBuffer, initialBox) {
  // initialBox: { left, top, width, height }
  // Extract a slightly padded region around initialBox
  const pad = 20;
  const meta = await sharp(photoBuffer).metadata();
  const extractLeft = Math.max(0, initialBox.x - pad);
  const extractTop = Math.max(0, initialBox.y - pad);
  const extractW = Math.min(meta.width - extractLeft, initialBox.w + 2 * pad);
  const extractH = Math.min(meta.height - extractTop, initialBox.h + 2 * pad);

  const { data, info } = await sharp(photoBuffer)
    .extract({ left: extractLeft, top: extractTop, width: extractW, height: extractH })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const W = info.width;
  const H = info.height;

  // We want to find the 4 card edges (top, bottom, left, right)
  // Inside the card, the border is bright white/cream (brightness > 160)
  // Outside, the wood table is darker (brightness < 130)
  
  // Horizontal projection: for each y, count how many pixels across the central 60% of width are bright (> 150)
  const xStart = Math.round(W * 0.2);
  const xEnd = Math.round(W * 0.8);
  const yStart = Math.round(H * 0.2);
  const yEnd = Math.round(H * 0.8);

  // Scan from top downwards
  let bestTop = 0;
  for (let y = 0; y < H / 2; y++) {
    let brightCount = 0;
    for (let x = xStart; x < xEnd; x++) {
      if (data[y * W + x] > 155) brightCount++;
    }
    if (brightCount > (xEnd - xStart) * 0.7) {
      bestTop = y;
      break;
    }
  }

  // Scan from bottom upwards
  let bestBottom = H - 1;
  for (let y = H - 1; y > H / 2; y--) {
    let brightCount = 0;
    for (let x = xStart; x < xEnd; x++) {
      if (data[y * W + x] > 155) brightCount++;
    }
    if (brightCount > (xEnd - xStart) * 0.7) {
      bestBottom = y;
      break;
    }
  }

  // Scan from left inwards
  let bestLeft = 0;
  for (let x = 0; x < W / 2; x++) {
    let brightCount = 0;
    for (let y = yStart; y < yEnd; y++) {
      if (data[y * W + x] > 155) brightCount++;
    }
    if (brightCount > (yEnd - yStart) * 0.7) {
      bestLeft = x;
      break;
    }
  }

  // Scan from right inwards
  let bestRight = W - 1;
  for (let x = W - 1; x > W / 2; x--) {
    let brightCount = 0;
    for (let y = yStart; y < yEnd; y++) {
      if (data[y * W + x] > 155) brightCount++;
    }
    if (brightCount > (yEnd - yStart) * 0.7) {
      bestRight = x;
      break;
    }
  }

  return {
    left: extractLeft + bestLeft,
    top: extractTop + bestTop,
    width: bestRight - bestLeft + 1,
    height: bestBottom - bestTop + 1
  };
}

async function testViolet11() {
  const p = sharp('raw_photos/PXL_20261016_113637198.MP.jpg');
  const rotBuffer = await p.toBuffer();

  // Violet card 8 (which was causing violet_11 to be offset or had y=672)
  const rawBox = { x: 1696, y: 672, w: 404, h: 732 };
  const refined = await refineCardCrop(rotBuffer, rawBox);
  console.log('Raw Box:', rawBox);
  console.log('Refined Box:', refined);

  // Save refined crop
  await sharp(rotBuffer)
    .extract(refined)
    .resize(347, 540)
    .jpeg({ quality: 95 })
    .toFile('scratch/test_refined_violet.jpg');
  console.log('Saved scratch/test_refined_violet.jpg');
}

testViolet11();
