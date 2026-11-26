(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BloxxScreenMotion = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var length = 3.02;
  var halfHeight = .41;
  var halfWidth = .49;
  var clearance = .70;
  var gravity = 11.5;
  var pivotHeight = length + clearance + halfHeight;

  function block(centerX, centerY, angle) {
    return {
      x:centerX + halfHeight * Math.sin(angle),
      height:centerY - halfHeight * Math.cos(angle),
      centerX:centerX,
      centerY:centerY,
      angle:angle
    };
  }

  function swing(motion, elapsedMs) {
    var time = elapsedMs / 1000;
    var speed = 2 * Math.PI * 1000 / motion.period;
    var phase = motion.phase + speed * time;
    var extent = Math.asin(Math.min(.49, motion.amplitude / length));
    var angle = extent * Math.sin(phase);
    var spin = extent * speed * Math.cos(phase);
    var sin = Math.sin(angle), cos = Math.cos(angle);
    var hook = length - halfHeight - .21;
    var sample = block(length * sin, pivotHeight - length * cos, angle);
    sample.pivotHeight = pivotHeight;
    sample.hookX = hook * sin;
    sample.hookHeight = pivotHeight - hook * cos;
    sample.vx = length * cos * spin;
    sample.vy = length * sin * spin;
    sample.spin = spin;
    return sample;
  }

  function drop(sample) {
    function at(seconds) {
      return block(sample.centerX + sample.vx * seconds,
        sample.centerY + sample.vy * seconds - gravity * seconds * seconds / 2,
        sample.angle + sample.spin * seconds);
    }

    function lowerEdge(time) {
      var pose = at(time);
      return pose.height - halfWidth * Math.abs(Math.sin(pose.angle));
    }

    var from = 0, to = 1/120;
    while (lowerEdge(to) > 0) { from = to; to += 1/120; }
    for(var i=0; i<14; i++) {
      var middle = (from + to) / 2;
      if (lowerEdge(middle)>0) from=middle;
      else to=middle;
    }
    var impact = at(to);
    var out = impact.centerX < 0 ? -1 : 1;
    var diverted = Math.abs(impact.centerX) < .82;

    function rejected(seconds, repel) {
      if (!repel || !diverted) return at(to + seconds);
      var drift = out * (Math.abs(sample.vx)*.28 + 1.32);
      return block(impact.centerX + drift*seconds,
        impact.centerY + .82*seconds - gravity*seconds*seconds/2,
        impact.angle + (sample.spin - out * 2.3)*seconds);
    }

    return {at:at, duration:to, impact:impact, rejected:rejected};
  }

  return {swing:swing, drop:drop};
}));
