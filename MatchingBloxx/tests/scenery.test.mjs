import test from 'node:test';
import assert from 'node:assert/strict';
import scenery from '../scenery.js';

function recordPainter() {
  const fills = [];
  const gradient = () => ({addColorStop() {}});
  return {
    fills,
    createLinearGradient: gradient,
    createRadialGradient: gradient,
    clearRect() {},
    fillRect(x, y, width, height) {
      assert.ok([x, y, width, height].every(Number.isInteger), 'draw on whole pixels');
      assert.ok(width > 0 && height > 0, 'draw a nonempty span');
      fills.push({color: this.fillStyle, x, y, width, height});
    },
  };
}

function checkCurves(fills, colors) {
  for (const color of colors) {
    const rows = fills.filter(fill => fill.color === color);
    assert.ok(rows.length > 2, color);
    for (const row of rows) assert.equal(row.height, 1, color);
  }
}

for (const [width, height] of [[719, 451], [311, 657], [337, 211]]) {
  test('background layers use one pixel grid at '+width+' × '+height, () => {
    const day = recordPainter();
    scenery.paint(day, width, height, 0, false, 0, Math.floor(height*.83));
    checkCurves(day.fills, ['#e4f1df', '#b6d6d3', '#689272', '#96b387', '#ffe4a0']);
    assert.ok(day.fills.some(fill => fill.color === '#91b8ba'));
    assert.ok(day.fills.some(fill => fill.color === '#b5a488'));
    assert.ok(day.fills.some(fill => fill.color === '#707f80'));

    const dusk = recordPainter();
    scenery.paint(dusk, width, height, 17, true, 0);
    checkCurves(dusk.fills, ['#e7abb9', '#bb8aa9', '#ffe4a2', '#ffce87']);

    const driftingClouds = recordPainter();
    scenery.skyTraffic(driftingClouds, width, height, 2000);
    checkCurves(driftingClouds.fills, ['#ffddc4', '#c691ab']);
  });

  test('the moon is round and stars are square at '+width+' × '+height, () => {
    for (const ascent of [8, 15, 19]) {
      const sky = recordPainter();
      scenery.paint(sky, width, height, 0, false, ascent);
      const stars = sky.fills.filter(fill => fill.color === '#ffdc99' || fill.color === '#a8c5e6');
      assert.equal(stars.length, 58);
      for (const star of stars) {
        assert.equal(star.width, star.height);
        assert.ok(star.width === 1 || star.width === 2);
      }
      const disc = sky.fills.filter(fill => fill.color === '#ead7aa');
      if (ascent < 19) {
        assert.equal(disc.length, 0);
        continue;
      }
      checkCurves(sky.fills, ['#ead7aa', '#c9bb9f', '#d7c9aa']);
      assert.ok(Math.abs(Math.max(...disc.map(row => row.width)) - disc.length) <= 2);
      for (let i=1; i<disc.length; i++) assert.equal(disc[i].y-disc[i-1].y, 1);
    }
  });
}
