const DMGPalette = [
  [233, 242, 228],
  [181, 214, 156],
  [91, 144, 116],
  [36, 50, 66],
];

const indexColour = (g) => {
  if (g < 65) {
    return 3;
  }
  if (g < 130) {
    return 2;
  }
  if (g < 205) {
    return 1;
  }
  return 0;
};

const cache = {};

onmessage = async (evt) => {
  const id = evt.data.id;
  const src = evt.data.src;
  const tiles = evt.data.tiles;
  const palettes = evt.data.palettes;
  const width = evt.data.width;
  const height = evt.data.height;

  let canvas;
  let ctx;
  let img;

  const tileWidth = Math.floor(width / 8);
  const tileHeight = Math.floor(width / 8);
  const tilesLength = tileWidth * tileHeight;

  if (cache[src]) {
    // Using Cached Data
    canvas = cache[src].canvas;
    ctx = cache[src].ctx;
    img = cache[src].img;
  } else {
    // Fetch New Data
    canvas = new OffscreenCanvas(width, height);
    ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const imgblob = await fetch(src).then((r) => r.blob());
    img = await createImageBitmap(imgblob, {
      resizeQuality: "pixelated",
    });

    cache[src] = {
      canvas,
      ctx,
      img,
    };
  }

  ctx.drawImage(img, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let t = 0; t < tilesLength; t++) {
    const tX = t % tileWidth;
    const tY = Math.floor(t / tileWidth);
    const palette = palettes[tiles[t]] || DMGPalette;
    const p1X = tX * 8;
    const p2X = p1X + 8;
    const p1Y = tY * 8;
    const p2Y = p1Y + 8;
    for (let pX = p1X; pX < p2X; pX++) {
      for (let pY = p1Y; pY < p2Y; pY++) {
        const index = (pX + pY * width) * 4;
        const colorIndex = indexColour(data[index + 1]);
        const color = palette[colorIndex];
        data[index] = color[0];
        data[index + 1] = color[1];
        data[index + 2] = color[2];
        data[index + 3] = 255;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const canvasImage = canvas.transferToImageBitmap();
  postMessage({ id, canvasImage }, [canvasImage]);
};