(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BloxxModels = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var walls = [
    ['#c67862','#a76052','#e09c7b'],
    ['#d1a45e','#aa804c','#e9c480'],
    ['#6e9a8d','#4f796f','#9cba9f'],
    ['#9b87ae','#79638e','#bda7c1']
  ];
  var cache = {};
  var floorHeight = .48 * Math.cos(.15) * 1.72;
  var plinth = ['#4b676b','#3b515b','#899e96'];
  var stone = ['#dbbc85','#aa804c','#efd6a0'];
  var glass = ['#36515a','#36515a','#68858a'];
  var gold = ['#d1a45e','#956e49','#efd6a0'];
  var flag = ['#c67862','#a76052','#e09c7b'];

  function build(kind, style) {
    var key = kind+'-'+style;
    if (cache[key]) return cache[key];
    var faces = [];

    function face(a,b,c,d,color) { faces.push({points:[a,b,c,d],color:color}); }

    function box(x,y,z,w,h,d,palette) {
      var l=x-w/2, r=x+w/2, bottom=y, top=y+h, back=z-d/2, front=z+d/2;
      var a=[l,bottom,front], b=[r,bottom,front], c=[r,top,front], d0=[l,top,front];
      var e=[l,bottom,back], f=[r,bottom,back], g=[r,top,back], j=[l,top,back];
      face(a,b,c,d0,palette[0]); face(b,f,g,c,palette[1]); face(d0,c,g,j,palette[2]);
      face(f,e,j,g,palette[0]); face(e,a,d0,j,palette[1]); face(e,f,b,a,palette[1]);
    }

    function brace(x1,y1,x2,y2,r,z) {
      var length=Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
      var dx=(y2-y1)*r/length,dy=(x1-x2)*r/length;
      var a=[x1+dx,y1+dy,z],b=[x2+dx,y2+dy,z],c=[x2-dx,y2-dy,z],d=[x1-dx,y1-dy,z];
      var e=[a[0],a[1],z-.033],f=[b[0],b[1],z-.033],g=[c[0],c[1],z-.033],j=[d[0],d[1],z-.033];
      face(a,b,c,d,'#d1a45e');face(e,f,g,j,'#956e49');
      face(a,b,f,e,'#efd6a0');face(c,d,j,g,'#aa804c');
      face(a,d,j,e,'#aa804c');face(b,c,g,f,'#aa804c');
    }

    if (kind==='base') {
      box(0,-.096,0,1.20,.096,.73,plinth);
    } else if (kind==='roof') {
      box(0,0,0,1.04,.25,.67,plinth);
      box(0,.25,0,.59,.13,.48,stone);
      box(.20,.33,-.06,.035,.17,.035,plinth);
      box(.25,.472,-.06,.15,.032,.025,flag);
    } else if (kind==='boom') {
      for(var end=-1;end<=1;end+=2) {
        var z=end*.105;
        var rails=end>0?gold:['#aa804c','#805d42','#d1a45e'];
        box(0,0,z,1,.046,.070,rails);
        box(0,.25,z,1,.047,.070,rails);
        box(-.48,.035,z,.035,.23,.070,gold);
        box(.48,.035,z,.035,.23,.070,gold);
      }
      for(var i=0;i<3;i++){
        var x=-.48+i*.32;
        brace(x,i%2?.25:.05,x+.32,i%2?.05:.25,.019,.123);
      }
      box(-.48,.237,0,.06,.058,.27,gold);
      box(.48,.237,0,.06,.058,.27,gold);
    } else if (kind==='trolley') {
      box(0,-.125,0,.27,.16,.24,gold);
      box(-.080,.010,0,.067,.052,.26,plinth);
      box(.080,.010,0,.067,.052,.26,plinth);
      box(0,-.173,0,.08,.065,.12,plinth);
    } else if (kind==='hook') {
      box(0,-.032,0,.086,.11,.060,plinth);
      box(.036,-.086,0,.115,.055,.060,plinth);
      box(.085,-.060,0,.041,.075,.060,plinth);
    } else {
      var wall=kind==='entry'?stone:walls[style%4];
      box(0,0,0,.96,floorHeight-.077,.57,wall);
      box(0,floorHeight-.078,0,1.02,.078,.63,[wall[2],wall[1],wall[2]]);
      for(var slot=-1;slot<=1;slot++){
        var cx=slot*.265;
        var door=kind==='entry' && slot===0;
        box(cx,door?.024:.30,.288,door?.23:.15,door?.46:.235,.012,glass);
        if(door)box(cx,0,.309,.31,.025,.060,plinth);
      }
      for(var side=-1;side<=1;side+=2){
        for(var two=-1;two<=1;two+=2){
          box(side*.482,.30,two*.128,.012,.235,.109,glass);
        }
      }
    }

    cache[key]=faces;
    return faces;
  }

  return {build:build,floorHeight:floorHeight};
}));
