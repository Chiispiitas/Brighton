import assert from 'node:assert/strict';
import test from 'node:test';
import { createBoard } from '../board.mjs';

test('remote brush strokes play in order and cannot return after undo or clear', t => {
  const motion = { matches: false };
  let callback;
  for (const [name,value] of Object.entries({
    matchMedia: () => motion,
    requestAnimationFrame: next => { callback=next;return 1; },
    cancelAnimationFrame: () => { callback=null; }
  })) {
    const original = Object.getOwnPropertyDescriptor(globalThis,name);
    Object.defineProperty(globalThis,name,{configurable:true,value});
    t.after(() => {
      if(original)Object.defineProperty(globalThis,name,original);
      else delete globalThis[name];
    });
  }
  const rendered = [];
  const ctx = {
    fillRect: () => rendered.length=0,
    beginPath() {}, moveTo() {}, arc() {},
    lineTo: x => rendered.push(x),
    stroke() {}, fill() {}
  };
  const canvas = {
    width:1000,height:1000,
    classList:{toggle(){},remove(){}},
    getContext:() => ctx,
    addEventListener() {}
  };
  const runFrame = timestamp => {
    const next = callback;
    assert.ok(next);
    callback = null;
    next(timestamp);
  };
  const stroke = { kind:'stroke',id:'one',width:4,color:'#182630',
    points:Array.from({length:20}, (_, i) => [i,100]).flat() };
  const second = { ...stroke,id:'two',points:[200,100,300,100] };
  const board = createBoard(canvas,() => {},() => false);

  board.show([stroke],[],true);
  assert.deepEqual(rendered,[]);
  runFrame(16);
  assert.ok(rendered.length>0&&rendered.length<19);
  runFrame(270);
  assert.deepEqual(rendered,Array.from({length:19},(_,i)=>i+1));

  board.show([stroke,second],[],true);
  assert.ok(callback);
  board.show([stroke],[],true);
  assert.equal(callback,null);
  assert.equal(rendered.at(-1),19);

  board.show([stroke,second],[],true);
  board.clearPreview();
  assert.equal(callback,null);
  assert.deepEqual(rendered,[]);

  motion.matches=true;
  board.show([second],[],true);
  assert.equal(callback,null);
  assert.deepEqual(rendered,[300]);
});
