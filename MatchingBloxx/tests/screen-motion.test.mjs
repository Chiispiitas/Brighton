import test from 'node:test';
import assert from 'node:assert/strict';
import physics from '../physics.js';
import arcade from '../wix-backend/src/game/arcade.cjs';

const motion = {period:3300,amplitude:1.13,phase:.42};
const close = (a,b,tolerance=1e-5) => assert.ok(Math.abs(a-b)<tolerance, `${a} vs ${b}`);

test('the Quick Play crane follows the Java ellipse and roll at the four quarter turns', () => {
  const swing = {phase:0, physics:3, ...physics.quickSwing(0)};
  const samples = [0,1,2,3].map(part => physics.swing(swing,swing.period*part/4));
  close(samples[0].centerX,-215/256);
  close(samples[2].centerX,215/256);
  close(samples[1].centerX,0);
  close(samples[3].centerX,0);
  close(samples[3].centerY-samples[1].centerY,2*86/256);
  close(samples[0].angle,-215/16*Math.PI/180);
  assert.equal(swing.period,3002);
  assert.ok(physics.quickSwing(11).period<swing.period);
});

test('the new crane transfers both components of the elliptical motion into the drop', () => {
  const swing={phase:.8,physics:3,lowering:true,...physics.quickSwing(5)};
  const pose=physics.swing(swing,140), next=physics.swing(swing,140.001);
  close((next.centerX-pose.centerX)*1e6,pose.vx,2e-5);
  close((next.centerY-pose.centerY)*1e6,pose.vy,2e-5);
  const drop=physics.drop(pose).at(0);
  close(drop.centerX,pose.centerX);
  close(drop.centerY,pose.centerY);
  close(drop.angle,pose.angle);
});

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

test('the rope pays out and transfers both swing and payout velocity to the released block', () => {
  const lowering = {...motion,lowering:true};
  const start = physics.swing(lowering,100);
  const next = physics.swing(lowering,100.1);
  close((next.centerX-start.centerX)/.0001,start.vx,.002);
  close((next.centerY-start.centerY)/.0001,start.vy,.002);
  close(physics.swing(lowering,330).height,physics.swing(motion,330).height);
});

test('a block can clear the top and then strike a lower exposed ledge', () => {
  const air = physics.drop({centerX:1.13,centerY:1.2,angle:0,vx:0,vy:0,spin:0});
  const impact = physics.track(air,[0,-.36],()=>0,false);
  assert.equal(impact.hit,true);
  assert.equal(impact.tipped,true);
  assert.equal(impact.level,1);
  assert.ok(impact.path.duration>air.duration);
  close(impact.path.impact.height,-physics.floorHeight);
  assert.equal(physics.track(air,[0,0],()=>0,false).hit,false);
});

test('loose floors separate and spin in sequence before gravity carries them down', () => {
  close(physics.debris(.035,1,1).angle,0);
  assert.ok(physics.debris(.035,0,1).angle<0);
  const near = physics.debris(.2,0,1);
  const far = physics.debris(.4,0,1);
  assert.ok(far.x>near.x);
  assert.ok(far.y<2*near.y);
  assert.ok(far.angle<near.angle);
});

test('drawing interpolates Java sway without changing the collision sample', () => {
  const floors=[.12,.4,.73,1.06,1.42,1.82,2.12];
  const swing={physics:5};
  const rock={java:true,phase:0,landAge:800};
  const top=(time,smooth)=>arcade.towerPose(swing,floors,rock,time,smooth).at(-1).angle;
  function peakStep(smooth) {
    let peak=0;
    for(let time=16;time<=3600;time+=16)peak=Math.max(peak,Math.abs(top(time,smooth)-top(time-16,smooth)));
    return peak*180/Math.PI;
  }
  close(peakStep(false),3);
  assert.ok(peakStep(true)<1);
  close(top(3600,true),top(0,true));
});

test('a cascade detaches continuously and its survivors join the next tower pose', () => {
  const floors=[.10,.22,.47,.76,1.04,1.23];
  const kept=floors.slice(0,4);
  const rock={java:true,phase:600,landAge:800};
  const swing={physics:5};
  const path=physics.drop({centerX:.7,centerY:1.2,angle:0,vx:0,vy:0,spin:0});
  const elapsed=290, lag=95, duration=1260;
  const hit={kind:'miss',direction:1,bump:true,parts:[
    {delay:350,vx:400,vy:50,turn:-1},
    {delay:150,vx:400,vy:50,turn:-1}
  ]};
  const impact=elapsed+path.duration*1000;
  const frame=arcade.towerAnimation(swing,floors,rock,elapsed,path,hit,kept)(lag,duration);
  assert.deepEqual(frame(0).joints,arcade.towerPose(swing,floors,rock,impact+lag,true));
  const liftOff=frame(150).joints[5];
  close(liftOff.x,frame(149.999).joints[5].x);
  close(frame(220).joints[5].x-liftOff.x,physics.javaFall(.22,hit.parts[1]).x);
  close(frame(220).joints[5].angle-liftOff.angle,physics.javaFall(.22,hit.parts[1]).angle);
  assert.deepEqual(frame(duration).joints.slice(0,kept.length),
    arcade.towerPose(swing,kept,arcade.advanceTower(rock,impact,false),duration,true));
  close(frame(duration).height,-2);
});

test('the landed floor and crane finish at the next round position', () => {
  const swing={physics:5};
  const rock={java:true,phase:640,landAge:800};
  const path=physics.drop({centerX:.27,centerY:1.2,angle:.1,vx:0,vy:0,spin:0});
  const before=[.1,.22,.41], after=[...before,.68], elapsed=350, duration=220;
  const frame=arcade.towerAnimation(swing,before,rock,elapsed,path,{kind:'landed'},after)(0,duration);
  close(frame(0).incoming.x,before.at(-1)+path.impact.x);
  const next=arcade.towerPose(swing,after,arcade.advanceTower(rock,elapsed+path.duration*1000,true),duration,true).at(-1);
  close(frame(duration).incoming.x,next.x);
  close(frame(duration).incoming.y,after.length*physics.floorHeight+next.lift);
  close(frame(duration).incoming.angle,next.angle);
  close(frame(duration).height,1);
  close(frame(duration).center,after.at(-1));
});
