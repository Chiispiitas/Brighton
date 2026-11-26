import test from 'node:test';
import assert from 'node:assert/strict';
import physics from '../screen-motion.js';

const motion = {period:3300,amplitude:1.13,phase:.42};
const close = (a,b,tolerance=1e-5) => assert.ok(Math.abs(a-b)<tolerance, `${a} vs ${b}`);

test('the hook and suspended block swing around one fixed pivot', () => {
  const start = physics.swing(motion,0);
  for (const elapsed of [100,430,810,1200,2200]) {
    const pose = physics.swing(motion,elapsed);
    close(pose.pivotHeight,start.pivotHeight);
    close(Math.hypot(pose.hookX,pose.pivotHeight-pose.hookHeight),
      Math.hypot(start.hookX,start.pivotHeight-start.hookHeight));
  }
});

test('release preserves position, linear velocity and angular velocity until first corner contact', () => {
  const pose = physics.swing(motion,900);
  const drop = physics.drop(pose);
  const after = drop.at(.0001);
  close(drop.at(0).height,pose.height);
  close((after.centerX-pose.centerX)/.0001,pose.vx);
  close((after.centerY-pose.centerY)/.0001,pose.vy,.001);
  close((after.angle-pose.angle)/.0001,pose.spin);
  close(drop.impact.height-.49*Math.abs(Math.sin(drop.impact.angle)),0);
});

test('a miss continues its free fall and a wrong block that touches recoils', () => {
  const pose = physics.swing({...motion,phase:0},1300);
  const drop = physics.drop(pose);
  assert.deepEqual(drop.rejected(.2,false),drop.at(drop.duration+.2));
  const recoil = drop.rejected(.2,true);
  assert.ok(Math.abs(drop.impact.centerX)<.82);
  assert.notEqual(recoil.angle,drop.at(drop.duration+.2).angle);
});
