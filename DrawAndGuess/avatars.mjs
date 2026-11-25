import { inkFrames, inkPath, inkSprite } from './ink-art.mjs?v=4';

const CUSTOM_BASE = 1000;
const legacy = ['frog','fox','cat','panda','owl','octopus','turtle','bee','dinosaur','whale','butterfly','raccoon'];
const colors = [
  ['Lilac', '#bda6fa', '#9575df', '#eee5ff'],
  ['Peach', '#ffaf94', '#e57e72', '#ffe4db'],
  ['Mint', '#83dab8', '#51aa94', '#dcf8ef'],
  ['Sky', '#8cd2ff', '#5d9fdd', '#e0f2ff'],
  ['Lemon', '#ffdf78', '#e8ae4d', '#fff4cb'],
  ['Rose', '#f7aecf', '#d980ac', '#ffe6f1'],
  ['Aqua', '#8be0e7', '#50b2c4', '#dcf7f8'],
  ['Fern', '#bddb83', '#87af59', '#eef7dc']
];
const eyes = [
  ['Dots', ['M 45 59 h .1 M 75 59 h .1'], 7],
  ['Happy', ['M 39 60 q 6 -9 12 0 M 69 60 q 6 -9 12 0'], 3],
  ['Wink', ['M 45 59 h .1', 'M 68 60 q 6 -6 13 0'], 3],
  ['Wide', ['M 45 52 a 7 8 0 1 0 .1 0 Z M 75 52 a 7 8 0 1 0 .1 0 Z', 'M 47 60 h .1 M 77 60 h .1'], 2.5],
  ['Sleepy', ['M 38 57 q 7 8 14 0 M 68 57 q 7 8 14 0'], 3],
  ['Glasses', ['M 38 53 h 13 v 12 H 38 Z M 69 53 h 13 v 12 H 69 Z M 51 57 q 9 -4 18 0', 'M 45 59 h .1 M 76 59 h .1'], 2.5],
  ['Side-eye', ['M 37 57 h 15 M 68 57 h 15', 'M 49 60 v 3 M 80 60 v 3'], 3],
  ['Stars', ['M 45 51 l 2 5 6 3 -6 2 -2 6 -2 -6 -6 -2 6 -3 Z M 75 51 l 2 5 6 3 -6 2 -2 6 -2 -6 -6 -2 6 -3 Z'], 2]
];
const mouths = [
  ['Smile', 'M 50 74 q 10 11 20 0'],
  ['Grin', 'M 48 73 h 24 q -4 13 -12 13 q -8 0 -12 -13 Z', '#fff'],
  ['Surprised', 'M 60 72 a 5 6 0 1 0 .1 0 Z', '#261b46'],
  ['Smirk', 'M 54 78 q 9 3 16 -5'],
  ['Tongue out', 'M 51 73 q 9 7 18 0 l -4 10 q -4 5 -8 1 l -2 -6', '#fc9ab0'],
  ['Cat smile', 'M 48 75 q 6 9 12 1 q 6 8 12 -1'],
  ['Pout', 'M 53 80 q 7 -9 14 0'],
  ['Whistle', 'M 60 74 a 4 4 0 1 0 .1 0 Z M 71 72 l 4 -2 M 72 77 h 5', '#fff']
];
const features = [colors, eyes, mouths];
const sizes = features.map(options => options.length);
const count = sizes.reduce((total, size) => total * size, 1);
const portraits = new Map();

function encode([color, eye, mouth]) {
  return CUSTOM_BASE + (color * sizes[1] + eye) * sizes[2] + mouth;
}

export function customAvatar(id) {
  return Number.isInteger(id) && id >= CUSTOM_BASE && id < CUSTOM_BASE + count;
}

function parts(id) {
  const offset = id - CUSTOM_BASE;
  return [Math.floor(offset / (sizes[1] * sizes[2])), Math.floor(offset / sizes[2]) % sizes[1], offset % sizes[2]];
}

export const defaultAvatar = encode([0, 0, 0]);
export const sampleAvatars = [encode([1, 2, 4]), encode([6, 4, 5]), encode([4, 7, 1])];
export const avatarLabels = id => parts(id).map((index, feature) => features[feature][index][0]);

export function cycleAvatar(id, feature, direction) {
  const selection = parts(id);
  selection[feature] = (selection[feature] + direction + sizes[feature]) % sizes[feature];
  return encode(selection);
}

export function randomAvatar(previous) {
  const offset = Math.floor(Math.random() * (count - 1));
  return CUSTOM_BASE + offset + Number(offset >= previous - CUSTOM_BASE);
}

function drawPortrait(id) {
  const [color, eye, mouth] = parts(id);
  const [, skin, shadow, background] = colors[color];
  const [, eyePaths, eyeWidth] = eyes[eye];
  const [, mouthPath, mouthFill] = mouths[mouth];
  return inkFrames(120, 120, (ctx, weight) => {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, 120, 120);
    const path = (shape, fill, width, stroke) => inkPath(ctx, shape, fill, width, stroke);
    path('M 17 77 V 89 M 11 83 H 23 M 101 28 V 42 M 94 35 H 108 M 25 30 h .1 M 96 85 h .1',
      null, 3.4, shadow);
    path('M 31 113 Q 32 93 45 88 H 77 Q 91 93 92 113 Z', shadow, 4.6);
    path('M 22 60 C 23 34 41 27 55 27 Q 59 16 73 14 Q 70 21 73 26 Q 82 22 90 23 Q 84 28 84 32 C 99 41 102 51 101 65 C 100 86 84 99 61 99 C 38 99 21 85 22 60 Z',
      skin, 4.6 + weight);
    path('M 35 48 q 5 -8 13 -10', null, 3.2, '#fff9e8');
    eyePaths.forEach((shape, index) => {
      const width = eye === 2 && index === 0 ? 7 : eyeWidth;
      path(shape, eye === 3 && index === 0 ? '#fff' : eye === 7 ? '#fff3a7' : null, width + .45);
    });
    path(mouthPath, mouthFill, 3.5);
  }, [skin,shadow,background,'#261b46','#fff','#fff9e8','#fff3a7','#fc9ab0'], .48);
}

export function avatarImage(id) {
  if (customAvatar(id)) {
    if (portraits.size >= 96 && !portraits.has(id)) portraits.delete(portraits.keys().next().value);
    if (!portraits.has(id)) portraits.set(id, drawPortrait(id));
    return inkSprite(portraits.get(id), 'avatar-art', -(id % 7) * 80);
  }
  const name = Number.isInteger(id) ? legacy[id] : undefined;
  const src = 'assets/avatars/' + (name || legacy[0]) + '.webp';
  return '<img class="avatar-art" src="' + src + '" alt="" width="36" height="36" draggable="false">';
}
