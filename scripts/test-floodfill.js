import sharp from 'sharp';

async function testFloodFill() {
  const { data, info } = await sharp('public/assets/tiles/tile_01.png')
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const W = info.width;
  const H = info.height;

  const isWood = (x, y) => {
    if (x < 0 || x >= W || y < 0 || y >= H) return false;
    const idx = (y * W + x) * 4;
    const b = (data[idx] + data[idx+1] + data[idx+2]) / 3;
    return b < 165;
  };

  const visited = new Uint8Array(W * H);
  const queue = [];

  // Seed corners and edges
  for (let x = 0; x < W; x++) {
    if (isWood(x, 0)) { queue.push(x, 0); visited[x] = 1; }
    if (isWood(x, H - 1)) { queue.push(x, H - 1); visited[(H - 1) * W + x] = 1; }
  }
  for (let y = 0; y < H; y++) {
    if (isWood(0, y)) { queue.push(0, y); visited[y * W] = 1; }
    if (isWood(W - 1, y)) { queue.push(W - 1, y); visited[y * W + (W - 1)] = 1; }
  }

  let head = 0;
  while (head < queue.length) {
    const cx = queue[head++];
    const cy = queue[head++];

    const idx = (cy * W + cx) * 4;
    data[idx + 3] = 0; // Transparent!

    const neighbors = [[cx+1, cy], [cx-1, cy], [cx, cy+1], [cx, cy-1]];
    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
        const nidx = ny * W + nx;
        if (!visited[nidx] && isWood(nx, ny)) {
          visited[nidx] = 1;
          queue.push(nx, ny);
        }
      }
    }
  }

  await sharp(data, { raw: { width: W, height: H, channels: 4 } })
    .trim()
    .toFile('scratch/tile_01_floodfill.png');

  console.log('Saved scratch/tile_01_floodfill.png');
}

testFloodFill();
