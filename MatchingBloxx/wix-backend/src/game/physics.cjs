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
    if (motion.physics === 3) {
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

  function track(path, floors, angleAt, assisted) {
    var top = floors[floors.length-1] || 0;
    var catchWidth = assisted ? .83 : .67;
    var reach = assisted ? 1.04 : .98;
    // Scan the ledges the rotating lower corner passes, starting at the roofline.
    for (var level = 0; level <= Math.min(floors.length,4); level++) {
      var time = level ? path.crossing(-level*floorHeight) : path.duration;
      var pose = path.at(time);
      var height = (floors.length+1-level)*floorHeight;
      var support = (floors[floors.length-1-level] || 0) - top + shift(height,angleAt(time*1000));
      var gap = pose.centerX + Math.sin(pose.angle)*.13 - support;
      var direction = gap < 0 ? -1 : 1;
      if (Math.abs(gap) >= reach) continue;
      return {path:path.segment(time,direction), offset:gap*(assisted?.55:.8), direction:direction,
        hit:true, level:level, tipped:level>0 || Math.abs(gap)>catchWidth};
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
    rockAt:rockAt, kick:kick, track:track, debris:debris};
}));
