(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BloxxPhysics = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var length = 3.02;
  var halfHeight = .41;
  var halfWidth = .49;
  var gravity = 11.5;
  var pivotHeight = length + .70 + halfHeight;
  var floorHeight = .48 * Math.cos(.15) * 1.72;

  function rockAt(rock, elapsed) {
    if (!rock) return {angle:0, velocity:0, rate:1.18, damping:.42};
    if (rock.java) {
      var age = Math.max(0,elapsed);
      return {java:true,phase:(rock.phase+age)%3600,landAge:rock.landAge+age};
    }
    var time = Math.max(0,elapsed) / 1000;
    var sin = Math.sin(rock.rate * time), cos = Math.cos(rock.rate * time);
    var decay = Math.exp(-rock.damping * time);
    var coefficient = (rock.velocity + rock.damping * rock.angle) / rock.rate;
    var angle = (rock.angle * cos + coefficient * sin) * decay;
    return {angle:angle, velocity:(coefficient * cos - rock.angle * sin) * rock.rate * decay - rock.damping * angle,
      rate:rock.rate, damping:rock.damping};
  }

  function kick(rock, offset, elapsed, floors) {
    var current = rockAt(rock,elapsed);
    var strength = Math.min(1, Math.abs(offset) / .48);
    var direction = Math.abs(current.velocity) > .05 ? current.velocity : current.angle;
    var counter = offset * direction < 0;
    if (counter || strength < .09) {
      current.velocity = current.velocity * .63 + (counter ? offset * .13 : 0);
      current.rate = Math.max(1.18, current.rate * .8);
      current.damping = .78;
    } else {
      current.velocity = Math.max(-.59,Math.min(.59,current.velocity + offset * (1.24 + Math.min(floors || 0,10) * .023)));
      current.rate = 1.18 + strength * 1.45;
      current.damping = .39;
    }
    return current;
  }

  function tower() {
    var started = 0, rock = null;
    return {
      angle:function(now){return rockAt(rock,now-started).angle;},
      land:function(offset,now,floors){
        rock = kick(rock,offset,now-started,floors);
        started = now;
      }
    };
  }

  function shift(height, angle) {
    return 4.6 * (1 - Math.exp(-height / 4.6)) * Math.sin(angle);
  }

  // Fixed-point sway and five active floor joints from OpenCityBloxx House.layoutTower.
  function towerLayout(floors, rock, continuous) {
    var count = floors.length, start = Math.max(0,count-5);
    var offsets = floors.map(function(x,i){
      return Math.round(x*256) - (i ? Math.round(floors[i-1]*256) : 0);
    });
    var angle = (continuous?rock.phase/10:Math.floor(rock.phase/10))*Math.PI/180;
    var wave = -Math.cos(angle)*65536;
    if(!continuous)wave=Math.round(wave);
    var sum = count ? Math.abs(Math.round(floors[count-1]*256)) : 0;
    var amplitude = Math.floor(count/2)+Math.floor(sum/20);
    amplitude = Math.min(amplitude,Math.floor(count*amplitude/6));
    var load = offsets.slice(start).reduce(function(n,x){return n+Math.abs(x);},0);
    var instability = Math.min(100,Math.floor(count*Math.floor(load/5)/20));
    var x = -wave*amplitude/10000, bend = 0, lift = 0;
    if(!continuous)x=Math.trunc(x);
    return floors.map(function(base,i){
      if(i<start)return {x:base,angle:0,lift:0};
      var offset = offsets[i];
      if(i===count-1 && i>0 && rock.landAge<800) {
        var t = rock.landAge;
        var bounce = t<100 ? t*offset/600 : t<500 ? (500-t)*offset/2400 : 0;
        var weight = t<500 ? 1 : (800-t)/300;
        bend = continuous ? bend*(1-weight)+weight*(bend/8+offset/6+bounce) :
          Math.trunc(bend*(1-weight)+weight*(Math.trunc(bend/8)+Math.trunc(offset/6)+Math.trunc(bounce)));
      }
      var leverage = wave*offset;
      var strain = instability*Math.abs(leverage)/(leverage<0?29491200:58982400);
      bend -= continuous?strain:Math.trunc(strain);
      x += bend*2;
      lift += continuous ? Math.max(-1,Math.min(1,wave/6000))*bend/2 : (wave>0?1:-1)*(bend>>1);
      return {x:base+x/256,angle:i ? -bend*Math.PI/180 : 0,lift:lift*floorHeight/256};
    });
  }

  function fallingFloors(layout, level, direction) {
    var parts = [];
    if(level>0) {
      var count = Math.min(4,level+1,layout.length-1);
      for(var i=0;i<count;i++)parts.unshift({delay:0,vx:-direction*400-(4-i)*30,vy:50+(4-i)*30,turn:direction});
    } else {
      var tolerance = 20;
      for(var j=layout.length-1;j>0 && parts.length<4;j--) {
        var gap = Math.round((layout[j].x-layout[j-1].x)*256);
        if(Math.abs(gap)<=tolerance)break;
        var side = gap<0?-1:1;
        parts.unshift({delay:[150,350,550,750][parts.length],vx:side*400,vy:50,turn:-side});
        tolerance*=2;
      }
    }
    return parts;
  }

  function javaFall(seconds, part) {
    var t = Math.max(0,seconds-part.delay/1000);
    var gravityScale = 1e6/(200*256);
    var up = part.vy*1000/(256*256);
    var limit = (40+up)/(2*gravityScale);
    var ballistic = Math.min(t,limit);
    return {x:part.vx*t*1000/(512*256),
      y:up*ballistic-gravityScale*ballistic*ballistic-40*(t-ballistic),
      angle:part.turn*Math.PI/4*(1-Math.exp(-2*t))};
  }

  function block(centerX, centerY, angle) {
    return {
      x:centerX + halfHeight * Math.sin(angle),
      height:centerY - halfHeight * Math.cos(angle),
      centerX:centerX,
      centerY:centerY,
      angle:angle
    };
  }

  // OpenCityBloxx's Quick Play ramps are measured in 256ths of a block.
  // Matching Bloxx starts with a foundation already placed.
  function quickSwing(placed) {
    var count = placed + 1;
    var speed = count < 100 ? 1670 - Math.floor(count * 220 / 100) :
      Math.max(500, 1500 - Math.floor((count - 100) * 2 / 3));
    return {
      period: Math.round(speed * 1.8),
      amplitude: (213 + Math.floor(Math.min(count, 60) * 171 / 60)) / 256,
      verticalAmplitude: (85 + Math.floor(Math.min(count, 60) * 85 / 60)) / 256
    };
  }

  function swing(motion, elapsedMs) {
    var time = elapsedMs / 1000;
    var speed = 2 * Math.PI * 1000 / motion.period;
    var phase = motion.phase + speed * time;
    var payout = Math.max(0,Math.min(1,elapsedMs / 330));
    var reel = motion.lowering ? .42 * (1 - payout) * (1 - payout) : 0;
    var reelSpeed = motion.lowering ? .84 * (1 - payout) / .33 : 0;
    if (motion.physics >= 3) {
      // The Java hook follows independent quarter-shifted axes. Sample the curve
      // continuously so animation and release velocity agree at any frame rate.
      var x = -motion.amplitude * Math.cos(phase);
      var y = .70 + halfHeight + reel - motion.verticalAmplitude * Math.sin(phase);
      var vx = motion.amplitude * speed * Math.sin(phase);
      var roll = 16 * Math.PI / 180, tilt = roll * x;
      var ellipse = block(x, y, tilt);
      ellipse.pivotHeight = pivotHeight;
      ellipse.hookX = x - (halfHeight + .21) * Math.sin(tilt);
      ellipse.hookHeight = y + (halfHeight + .21) * Math.cos(tilt);
      ellipse.vx = vx;
      ellipse.vy = -motion.verticalAmplitude * speed * Math.cos(phase) - reelSpeed;
      ellipse.spin = roll * vx;
      return ellipse;
    }
    var extent = Math.asin(Math.min(.49, motion.amplitude / length));
    var angle = extent * Math.sin(phase);
    var spin = extent * speed * Math.cos(phase);
    var sin = Math.sin(angle), cos = Math.cos(angle);
    var radius = length - reel;
    var hook = radius - halfHeight - .21;
    var sample = block(radius * sin, pivotHeight - radius * cos, angle);
    sample.pivotHeight = pivotHeight;
    sample.hookX = hook * sin;
    sample.hookHeight = pivotHeight - hook * cos;
    sample.vx = radius * cos * spin + reelSpeed * sin;
    sample.vy = radius * sin * spin - reelSpeed * cos;
    sample.spin = spin;
    return sample;
  }

  function drop(sample) {
    function at(seconds) {
      return block(sample.centerX + sample.vx * seconds,
        sample.centerY + sample.vy * seconds - gravity * seconds * seconds / 2,
        sample.angle + sample.spin * seconds);
    }

    function crossing(height) {
      function lowerEdge(time) {
        var pose = at(time);
        return pose.height - halfWidth * Math.abs(Math.sin(pose.angle)) - height;
      }
      var from = 0, to = 1/120;
      while (lowerEdge(to) > 0) { from = to; to += 1/120; }
      for(var i=0; i<14; i++) {
        var middle = (from + to) / 2;
        if (lowerEdge(middle)>0) from=middle;
        else to=middle;
      }
      return to;
    }

    function segment(time, direction) {
      var impact = at(time);
      var out = direction || (impact.centerX < 0 ? -1 : 1);
      function rejected(seconds, repel) {
        if (!repel) return at(time + seconds);
        var drift = out * (Math.abs(sample.vx)*.28 + 1.32);
        return block(impact.centerX + drift*seconds,
          impact.centerY + .82*seconds - gravity*seconds*seconds/2,
          impact.angle + (sample.spin - out * 2.3)*seconds);
      }
      return {at:at, duration:time, impact:impact, rejected:rejected};
    }

    var path = segment(crossing(0));
    path.crossing = crossing;
    path.segment = segment;
    return path;
  }

  function track(path, floors, angleAt, assisted, classicLanding, javaTower) {
    var top = floors[floors.length-1] || 0;
    var catchWidth = classicLanding ? 127/256 : assisted ? .83 : .67;
    var reach = classicLanding ? 1 : assisted ? 1.04 : .98;
    // Scan the ledges the rotating lower corner passes, starting at the roofline.
    for (var level = 0; level <= Math.min(javaTower?Math.max(0,floors.length-1):floors.length,4); level++) {
      var time = level ? path.crossing(-level*floorHeight) : path.duration;
      var pose = path.at(time);
      var height = (floors.length+1-level)*floorHeight;
      var sway = angleAt(time*1000);
      var joint = javaTower && sway[floors.length-1-level];
      var support = javaTower ? (joint ? joint.x-top : 0) :
        (floors[floors.length-1-level] || 0) - top + shift(height,sway);
      var gap = pose.centerX + (javaTower?0:Math.sin(pose.angle)*.13) - support;
      var direction = gap < 0 ? -1 : 1;
      if (Math.abs(javaTower?Math.round(gap*256)/256:gap) >= reach) continue;
      var offset = javaTower ? Math.round(gap*256)/256 : gap*(classicLanding?1:assisted?.55:.8);
      var tipped = level>0 || (javaTower && !floors.length ? false : Math.abs(javaTower?offset:gap)>catchWidth);
      var flight=path.segment(time,direction);
      if(javaTower && tipped) {
        flight.rejected=function(seconds) {
          var fall=javaFall(seconds,{delay:0,vx:direction*500,vy:50,turn:-direction});
          return block(pose.centerX+fall.x,pose.centerY+fall.y,pose.angle+fall.angle);
        };
      }
      return {path:flight, offset:offset, direction:direction, hit:true, level:level, tipped:tipped,
        javaTower:javaTower, parts:javaTower && tipped ? fallingFloors(sway,level,direction) : undefined};
    }
    return {path:path, hit:false, tipped:false, level:0, offset:0, direction:0};
  }

  function debris(seconds, level, direction) {
    var time = Math.max(0,seconds - level*.052);
    return {x:direction*(.58+level*.17)*time,
      y:(.52+level*.09)*time - gravity*time*time/2,
      angle:-direction*(1.9+level*.36)*time};
  }

  return {swing:swing, quickSwing:quickSwing, drop:drop, tower:tower, shift:shift, floorHeight:floorHeight,
    rockAt:rockAt, kick:kick, track:track, debris:debris,towerLayout:towerLayout,javaFall:javaFall};
}));
