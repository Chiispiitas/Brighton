import assert from 'node:assert/strict';
import test from 'node:test';
import { paletteRaster, pixelFrame } from '../pixel-ink.mjs';

test('aliased edges use the adjacent ink colors instead of adding an intermediate color', () => {
  const black = 0xff000000, white = 0xffffffff, gray = 0xff888888;
  const input = Uint32Array.of(white, white, white, black, 0xff777777, white, black, black, white);
  const output = new Uint32Array(input.length);
  paletteRaster(['#000','#fff','#888888'],3)(input,output);
  assert.equal(output[4],black);
  assert.ok(!output.includes(gray));
});

test('animated frames move edge pixels by one cell and leave the shape core and thin strokes in place', () => {
  const width=24,height=24,white=0xffffffff,black=0xff000000;
  const base=new Uint32Array(width*height).fill(white);
  const output=new Uint32Array(base.length);
  const cell=(x,y)=>y*width+x;
  for(let y=5;y<15;y++)for(let x=5;x<17;x++)base[cell(x,y)]=black;
  for(let x=3;x<20;x++)base[cell(x,19)]=black;
  pixelFrame(base,output,width,height,1,white);
  assert.notDeepEqual(output,base);
  for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){
    const i=cell(x,y);
    if(output[i]!==base[i])assert.ok([base[i-1],base[i+1],base[i-width],base[i+width]].includes(output[i]));
    if((y>5&&y<14&&x>5&&x<16)||y===19)assert.equal(output[i],base[i]);
  }
  const first=output.slice();
  pixelFrame(base,output,width,height,2,white);
  assert.notDeepEqual(output,first);
  pixelFrame(base,output,width,height,0,white);
  assert.deepEqual(output,base);
});
