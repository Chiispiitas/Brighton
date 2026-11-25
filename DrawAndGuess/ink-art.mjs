export function inkFrames(width, height, draw, resolution = 1.5) {
  const sheet = document.createElement('canvas');
  const frameWidth = Math.ceil(width * resolution);
  const frameHeight = Math.ceil(height * resolution);
  sheet.width = frameWidth * 3;
  sheet.height = frameHeight;
  const ctx = sheet.getContext('2d');
  for (let frame = 0; frame < 3; frame++) {
    ctx.save();
    ctx.translate(frame * frameWidth, 0);
    ctx.beginPath();
    ctx.rect(0, 0, frameWidth, frameHeight);
    ctx.clip();
    ctx.scale(frameWidth / width, frameHeight / height);
    ctx.lineCap = ctx.lineJoin = 'round';
    draw(ctx, frame);
    ctx.restore();
  }
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

const phases = [0, 1, -1];

export function wiggleInk(ctx, frame, index = 0, amount = 1) {
  const offset = phases[(frame + index) % phases.length] * amount;
  ctx.transform(1 + offset * .008, offset * .011, offset * .009, 1 - offset * .009, offset * -.7, offset * .55);
}

const doodles = [
  'M 12 33 C 4 31 5 22 13 21 C 14 9 30 8 33 19 C 44 17 49 30 40 34 Q 26 38 12 33 Z',
  'M 27 6 Q 28 20 45 25 Q 30 25 26 42 Q 24 29 8 25 Q 22 23 27 6 Z',
  'M 26 41 V 32 M 23 35 C 8 38 6 22 16 19 C 12 7 29 3 32 16 C 44 12 50 29 37 33 Q 31 37 26 31',
  'M 26 15 A 10 10 0 1 0 26.1 15 Z M 26 5 V 10 M 26 40 V 46 M 6 25 H 11 M 41 25 H 46 M 12 11 L 16 15 M 37 36 L 41 40 M 12 39 L 16 35 M 38 15 L 42 10'
];

export function drawGameArt() {
  const logo = inkFrames(44, 44, (ctx, frame) => {
    wiggleInk(ctx, frame, 0, 1.25);
    inkPath(ctx, 'M 11 31 L 13 24 L 29 9 Q 31 7 33 9 L 36 12 Q 38 14 36 16 L 20 32 L 11 34 Z', '#fff5c2', 2.4);
    inkPath(ctx, 'M 14 24 L 20 31 M 25 13 L 32 20 M 11 34 L 16 32', null, 2);
    inkPath(ctx, 'M 23 35 Q 29 38 36 33', null, 2);
  });
  document.querySelector('.mark').innerHTML = inkSprite(logo,'pencil-ink');
  const title = inkFrames(440, 209, (ctx, frame) => {
    ctx.font = '900 96px system-ui, sans-serif';
    ctx.textBaseline = 'alphabetic';
    ['Draw &', 'Guess'].forEach((line, row) => {
      let x = 10;
      [...line].forEach((letter, index) => {
        const wobble = phases[(frame + index + row) % 3];
        ctx.save();
        ctx.translate(x + wobble * 1.3, 83 + row * 90 + wobble * 1.7);
        ctx.rotate(wobble * .018);
        ctx.fillStyle = row === 0 ? '#fff7d8' : '#ffe084';
        ctx.fillText(letter, 0, 0);
        ctx.restore();
        x += ctx.measureText(letter).width - 4;
      });
    });
    wiggleInk(ctx, frame, 1);
    inkPath(ctx, 'M 13 193 Q 101 176 247 188 Q 265 188 285 185', null, 4, '#e7c3ff');
  });
  document.querySelector('.welcome h1').innerHTML = '<span class="sr-only">Draw &amp; Guess</span>' + inkSprite(title,'title-ink');
  document.querySelector('.doodles').innerHTML = doodles.map((shape, index) => {
    const tile = inkFrames(52, 52, (ctx, frame) => {
      wiggleInk(ctx, frame, index, 1.2);
      inkPath(ctx, shape, index < 2 ? '#fff7d8' : null, 2.7);
    });
    return '<span>' + inkSprite(tile,'doodle-ink',-index * 105) + '</span>';
  }).join('');
}
