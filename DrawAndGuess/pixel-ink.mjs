// Canvas ImageData stores pixels as RGBA bytes. These views pack them as AABBGGRR.
function packedColor(hex) {
  if (hex.length === 3) hex = [...hex].map(c => c + c).join('');
  const color = parseInt(hex, 16);
  return (0xff000000 | ((color & 255) << 16) | (color & 0xff00) | (color >> 16)) >>> 0;
}

function colorDistance(pixel, color) {
  const dr = (pixel & 255) - (color & 255);
  const dg = ((pixel >>> 8) & 255) - ((color >>> 8) & 255);
  const db = ((pixel >>> 16) & 255) - ((color >>> 16) & 255);
  return 2 * dr * dr + 3 * dg * dg + db * db;
}

export function paletteRaster(colors, width) {
  const palette = colors.map(color => packedColor(color.slice(1)));
  const exact = new Set(palette);
  const cached = new Uint32Array(32 * 32 * 32);
  function nearest(red, green, blue) {
    const key = (red << 10) | (green << 5) | blue;
    if (cached[key]) return cached[key];
    let best = palette[0], distance = Infinity;
    const center = (red * 8 + 4) | ((green * 8 + 4) << 8) | ((blue * 8 + 4) << 16);
    for (const color of palette) {
      const score = colorDistance(center, color);
      if (score < distance) { best = color; distance = score; }
    }
    cached[key] = best;
    return best;
  }
  const neighbors = [-1, 1, -width, width];
  return (input, output) => {
    for (let i = 0; i < input.length; i++) {
      const pixel = input[i];
      if (pixel < 0x80000000) output[i] = 0;
      else if (exact.has(pixel)) output[i] = pixel;
      else {
        let local = 0, distance = Infinity;
        for (const offset of neighbors) {
          if ((offset === -1 && i % width === 0) || (offset === 1 && i % width === width - 1)) continue;
          const neighbor = input[i + offset];
          if (!exact.has(neighbor)) continue;
          const score = colorDistance(pixel, neighbor);
          if (score < distance) { local = neighbor; distance = score; }
        }
        output[i] = local || nearest((pixel >>> 3) & 31, (pixel >>> 11) & 31, (pixel >>> 19) & 31);
      }
    }
  };
}

// Sample from the same base image each time. Interior pixels never move, and
// narrow marks remain intact while a few neighboring edge cells change.
export function pixelFrame(base, output, width, height, phase, paper = 0) {
  output.set(base);
  if (!phase) return;
  for (let y = 1; y < height - 1; y++) {
    const row = y * width;
    for (let x = 1; x < width - 1; x++) {
      const i = row + x, color = base[i];
      const left = base[i - 1], right = base[i + 1], up = base[i - width], down = base[i + width];
      if (color === left && color === right && color === up && color === down) continue;
      let hash = Math.imul(x + 19 * phase, 0x27d4eb2d) ^ Math.imul(y, 0x165667b1);
      hash = Math.imul(hash ^ (hash >>> 15), 0x85ebca6b);
      if ((hash & 7) > 2) continue;
      const direction = (hash >>> 3) & 3;
      const neighbor = direction === 0 ? left : direction === 1 ? right : direction === 2 ? up : down;
      const same = Number(left === color) + Number(right === color) + Number(up === color) + Number(down === color);
      if (same < 2 && color !== paper) continue;
      if (neighbor === paper && color !== paper && same < 3) continue;
      output[i] = neighbor;
    }
  }
}

export function createInkView(source, display, colors) {
  const { width, height } = display;
  const sampler = document.createElement('canvas');
  sampler.width = width;
  sampler.height = height;
  const sample = sampler.getContext('2d', { willReadFrequently: true, alpha: false });
  sample.imageSmoothingEnabled = false;
  const context = display.getContext('2d', { alpha: false });
  const raster = paletteRaster(colors, width);
  const base = new Uint32Array(width * height);
  const frame = context.createImageData(width, height);
  const pixels = new Uint32Array(frame.data.buffer);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let pending = 0, timer = 0, phase = 0, dirty = true;

  function render() {
    pending = 0;
    if (dirty) {
      sample.drawImage(source, 0, 0, width, height);
      raster(new Uint32Array(sample.getImageData(0, 0, width, height).data.buffer), base);
      dirty = false;
    }
    pixelFrame(base, pixels, width, height, reducedMotion.matches ? 0 : phase, 0xffffffff);
    context.putImageData(frame, 0, 0);
  }

  function schedule() {
    if (!pending) pending = requestAnimationFrame(render);
  }

  function setActive(active) {
    if (active && !timer) {
      timer = setInterval(() => {
        if (reducedMotion.matches || document.hidden) return;
        phase = (phase + 1) % 3;
        schedule();
      }, 200);
    } else if (!active && timer) {
      clearInterval(timer);
      timer = 0;
      phase = 0;
      schedule();
    }
  }
  reducedMotion.addEventListener('change', schedule);
  source.classList.add('pixel-source');
  return { setActive, update() { dirty = true; schedule(); } };
}
