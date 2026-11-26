(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BloxxCraneModel = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var gold=['#d99948','#9d693a','#ffcf70'];
  var braceGold=['#e6ad56','#ae7941','#ffd889'];
  var shadow=['#8f6b46','#705540','#b58550'];
  var steel=['#586864','#354b51','#83908a'];

  function project(point) {
    var z=point[2];
    return [point[0]-.32*z,point[1]-.24*z,z];
  }

  function build(kind,panels) {
    var faces=[];
    function face(pts,color) { faces.push({pts:pts,c:color}); }
    function box(x,y,z,w,h,d,palette) {
      var r=x+w,t=y+h,f=z+d;
      var a=[x,y,f], b=[r,y,f], c=[r,t,f], leftTop=[x,t,f];
      var e=[x,y,z], g=[r,y,z], j=[r,t,z], k=[x,t,z];
      face([a,b,c,leftTop],palette[0]);
      face([b,g,j,c],palette[1]);
      face([leftTop,c,j,k],palette[2]);
      face([g,e,k,j],palette[1]);
      face([e,a,leftTop,k],palette[1]);
      face([e,g,b,a],palette[1]);
    }
    function diagonal(x,y,dx,dy,z,palette) {
      var length=Math.sqrt(dx*dx+dy*dy), sin=dy/length, cos=dx/length;
      var first=faces.length;
      box(0,-.036,z,length,.072,.072,palette);
      for(var i=first;i<faces.length;i++){
        faces[i].pts=faces[i].pts.map(function(p) { return [x+p[0]*cos-p[1]*sin,y+p[0]*sin+p[1]*cos,p[2]]; });
      }
    }

    if(kind==='boom'){
      for(var side=0;side<2;side++){
        var z=side?.13:-.21, paint=side?gold:shadow;
        box(0,0,z,panels,.104,.082,paint);
        box(0,.86,z,panels,.10,.082,paint);
        for(var i=0;i<panels;i++){
          box(i,.10,z,.058,.77,.082,paint);
          diagonal(i+.04,.12,.46,.73,z,side?braceGold:shadow);
          diagonal(i+.50,.85,.46,-.73,z,side?gold:shadow);
        }
        box(panels-.06,.10,z,.06,.77,.082,paint);
      }
      for(var end=0;end<2;end++){
        var x=end?panels-.07:0;
        box(x,.86,-.21,.07,.098,.422,gold);
        box(x,0,-.21,.07,.098,.422,shadow);
      }
    }else if(kind==='trolley'){
      box(-.39,.10,-.14,.78,.23,.28,steel);
      box(-.33,.16,.13,.66,.12,.05,braceGold);
      box(-.14,0,-.075,.28,.13,.15,steel);
      box(-.31,.31,-.13,.15,.15,.26,steel);
      box(.16,.31,-.13,.15,.15,.26,steel);
    }else{
      box(-.12,-.195,-.09,.24,.195,.18,steel);
      box(-.09,-.115,.086,.18,.062,.027,shadow);
      box(-.031,-.32,-.057,.115,.14,.115,steel);
      box(.04,-.32,-.057,.17,.062,.115,steel);
      box(.166,-.28,-.057,.061,.12,.115,steel);
    }
    return faces;
  }

  return {build:build,project:project};
}));
