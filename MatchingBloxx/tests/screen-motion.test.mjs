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

test('larger off-center landings make the tower swing farther and reverse sooner', () => {
  const slight = physics.tower();
  const wide = physics.tower();
  slight.land(.15,1000);
  wide.land(.42,1000);
  assert.ok(wide.angle(1500) > 2 * slight.angle(1500));
  assert.ok(wide.angle(2400) < 0);
  assert.ok(slight.angle(2400) > 0);
  close(physics.shift(0,wide.angle(1500)),0);
  assert.ok(physics.shift(3,wide.angle(1500)) > physics.shift(1,wide.angle(1500)));
});

test('centered and counterbalancing landings settle gradually without a jump', () => {
  const towers = Array.from({length:4}, () => physics.tower());
  for (const tower of towers) tower.land(.35,1000);
  const atLanding = towers[0].angle(1200);
  towers[1].land(0,1200);
  towers[2].land(-.25,1200);
  towers[3].land(.25,1200);
  for (const tower of towers) close(tower.angle(1200),atLanding);
  assert.ok(towers[1].angle(1400) < towers[0].angle(1400));
  assert.ok(towers[2].angle(1400) < towers[1].angle(1400));
  assert.ok(towers[3].angle(1400) > towers[0].angle(1400));
  for (const tower of towers.slice(1,3)) close(tower.angle(9000),0,.001);
});
