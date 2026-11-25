import assert from 'node:assert/strict';
import test from 'node:test';
import { paletteRaster } from '../pixel-ink.mjs';

test('aliased edges use the adjacent ink colors instead of adding an intermediate color', () => {
  const black = 0xff000000, white = 0xffffffff, gray = 0xff888888;
  const input = Uint32Array.of(white, white, white, black, 0xff777777, white, black, black, white);
  const output = new Uint32Array(input.length);
  paletteRaster(['#000','#fff','#888888'],3)(input,output);
  assert.equal(output[4],black);
  assert.ok(!output.includes(gray));
});

test('a rasterized stroke keeps the same edge on repeated renders', () => {
  const width=24,height=24,white=0xffffffff,black=0xff000000;
  const base=new Uint32Array(width*height).fill(white);
  const output=new Uint32Array(base.length);
  const cell=(x,y)=>y*width+x;
  for(let y=5;y<15;y++)for(let x=5;x<17;x++)base[cell(x,y)]=black;
  for(let x=3;x<20;x++)base[cell(x,19)]=black;
  const raster=paletteRaster(['#000','#fff'],width);
  for(let i=0;i<3;i++){
    raster(base,output);
    assert.deepEqual(output,base);
  }
});
