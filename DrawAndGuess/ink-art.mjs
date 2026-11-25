import { paletteRaster } from './pixel-ink.mjs?v=2';

export function inkFrames(width, height, draw, colors, resolution = .5) {
  const sheet = document.createElement('canvas');
  const frameWidth = Math.ceil(width * resolution);
  const frameHeight = Math.ceil(height * resolution);
  sheet.width = frameWidth * 3;
  sheet.height = frameHeight;
  const ctx = sheet.getContext('2d', { willReadFrequently:true });
  const raster = paletteRaster(colors, frameWidth);
  const frameImage = ctx.createImageData(frameWidth, frameHeight);
  const pixels = new Uint32Array(frameImage.data.buffer);
  // Keep the paths anchored. Only the outline weight varies between frames.
  [0, .5, -.35].forEach((weight, frame) => {
    const x = frame * frameWidth;
    ctx.save();
    ctx.translate(x, 0);
    ctx.beginPath();
    ctx.rect(0, 0, frameWidth, frameHeight);
    ctx.clip();
    ctx.scale(frameWidth / width, frameHeight / height);
    ctx.lineCap = ctx.lineJoin = 'round';
    draw(ctx, weight);
    ctx.restore();
    const input = new Uint32Array(ctx.getImageData(x, 0, frameWidth, frameHeight).data.buffer);
    raster(input, pixels);
    ctx.putImageData(frameImage, x, 0);
  });
  return sheet.toDataURL();
}

export function inkPath(ctx, shape, fill, width = 0, stroke = '#261b46') {
  const drawing = new Path2D(shape);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill(drawing);
  }
  if (width) {
    ctx.lineWidth = width;
    ctx.strokeStyle = stroke;
    ctx.stroke(drawing);
  }
}

export function inkSprite(sheet, className, delay = 0) {
  return '<span class="' + className + ' ink-sprite" aria-hidden="true" style="--ink-frames:url(' +
    sheet + ');--ink-delay:' + delay + 'ms"></span>';
}

const doodles = [
  'M 12 33 C 4 31 5 22 13 21 C 14 9 30 8 33 19 C 44 17 49 30 40 34 Q 26 38 12 33 Z',
  'M 27 6 Q 28 20 45 25 Q 30 25 26 42 Q 24 29 8 25 Q 22 23 27 6 Z',
  'M 26 41 V 32 M 23 35 C 8 38 6 22 16 19 C 12 7 29 3 32 16 C 44 12 50 29 37 33 Q 31 37 26 31',
  'M 26 15 A 10 10 0 1 0 26.1 15 Z M 26 5 V 10 M 26 40 V 46 M 6 25 H 11 M 41 25 H 46 M 12 11 L 16 15 M 37 36 L 41 40 M 12 39 L 16 35 M 38 15 L 42 10'
];

export function drawGameArt() {
  const ink = '#261b46';
  const logo = inkFrames(44, 44, (ctx, weight) => {
    inkPath(ctx, 'M 11 31 L 13 24 L 29 9 Q 31 7 33 9 L 36 12 Q 38 14 36 16 L 20 32 L 11 34 Z', '#fff5c2', 3.4 + weight);
    inkPath(ctx, 'M 14 24 L 20 31 M 25 13 L 32 20 M 11 34 L 16 32', null, 3);
    inkPath(ctx, 'M 23 35 Q 29 38 36 33', null, 3);
  }, [ink, '#fff5c2'], .65);
  document.querySelector('.mark').innerHTML = inkSprite(logo,'pencil-ink');
  const titleColors = ['#fff1b2', '#d7b9ff', '#92e3db', '#ffd595'];
  const title = inkFrames(440, 209, (ctx, weight) => {
    ctx.font = '900 99px system-ui, sans-serif';
    ctx.textBaseline = 'alphabetic';
    ctx.lineWidth = 8.5 + weight;
    ctx.strokeStyle = '#1b1334';
    ['Draw &', 'Guess'].forEach((line, row) => {
      let x = 15;
      [...line].forEach((letter, index) => {
        const tilt = (index % 3) - 1;
        ctx.save();
        ctx.translate(x, 83 + row * 90 + tilt * 2.5);
        ctx.rotate(tilt * .036);
        ctx.fillStyle = titleColors[(index + row * 2) % titleColors.length];
        ctx.strokeText(letter, 0, 0);
        ctx.fillText(letter, 0, 0);
        ctx.restore();
        x += ctx.measureText(letter).width - 2.5;
      });
    });
    inkPath(ctx, 'M 16 193 Q 101 176 248 188 Q 267 190 296 183', null, 5, '#d7b9ff');
  }, [...titleColors, '#1b1334'], .48);
  document.querySelector('.welcome h1').innerHTML = '<span class="sr-only">Draw &amp; Guess</span>' + inkSprite(title,'title-ink');
  document.querySelector('.doodles').innerHTML = doodles.map((shape, index) => {
    const tile = inkFrames(52, 52, (ctx, weight) => {
      inkPath(ctx, shape, index < 2 ? '#fff7d8' : null, 3.5 + weight);
    }, [ink, '#fff7d8'], .55);
    return '<span>' + inkSprite(tile,'doodle-ink',-index * 105) + '</span>';
  }).join('');

  const paper = document.createElement('canvas');
  paper.width = 144;
  paper.height = 112;
  const sketch = paper.getContext('2d');
  sketch.lineCap = sketch.lineJoin = 'round';
  const lines = '#e2d9f3';
  inkPath(sketch,'M 13 18 l 13 -8 5 16 -10 5 Z M 25 28 q 12 3 8 13 M 97 17 q 6 -9 13 1 q 9 -8 13 2 q 0 6 -13 14 q -12 -9 -13 -17',null,2,lines);
  inkPath(sketch,'M 53 73 q -6 -31 13 -32 q 19 4 5 15 q -4 5 -18 4 M 62 63 q 16 4 12 17 M 108 81 l 14 -11 10 9 -7 13 -12 -1 Z M 116 76 l 11 12',null,2,lines);
  inkPath(sketch,'M 18 76 v 14 M 11 83 h 14 M 85 98 v 7 M 81 101 h 8 M 136 43 h .1 M 82 25 h .1 M 34 58 h .1',null,2,lines);
  document.documentElement.style.setProperty('--paper-sketch', 'url(' + paper.toDataURL() + ')');
}
