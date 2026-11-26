(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BloxxModels = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var walls = [
    ['#c27559','#a75542','#e39a75'],
    ['#d5a256','#a87742','#f3ce72'],
    ['#608e85','#426866','#a1ae86'],
    ['#9582a2','#654f73','#ae9bb9']
  ];
  var cache = {};
  var floorHeight = .48 * Math.cos(.15) * 1.72;
  var plinth = ['#455e60','#253b40','#82918a'];
  var stone = ['#debd83','#ae7851','#fff0c3'];
  var glass = ['#344c50','#253b40','#617976'];

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
      face(a,b,c,d,'#cf9a62');face(e,f,g,j,'#835b43');
      face(a,b,f,e,'#eed59b');face(c,d,j,g,'#ae7851');
      face(a,d,j,e,'#ae7851');face(b,c,g,f,'#ae7851');
    }

    if (kind==='base') {
      box(0,-.096,0,1.20,.061,.73,plinth);
      box(0,-.035,0,1.11,.035,.66,stone);
    } else if (kind==='roof') {
      box(0,0,0,1.04,.065,.67,stone);
      box(0,.065,0,.91,.18,.54,plinth);
      box(0,.245,0,.64,.085,.40,stone);
      box(.20,.33,-.06,.035,.17,.035,plinth);
      box(.20,.472,-.06,.15,.022,.025,plinth);
      for(var wi=-1;wi<=1;wi++)box(wi*.23,.105,.272,.115,.095,.022,glass);
    } else if (kind==='boom') {
      var gold=['#cf9a62','#835b43','#f3ce72'];
      for(var end=-1;end<=1;end+=2) {
        var z=end*.105;
        var rails=end>0?gold:['#835b43','#593f38','#ae7851'];
        box(0,0,z,1,.046,.070,rails);
        box(0,.25,z,1,.047,.070,rails);
        box(-.48,.035,z,.035,.23,.070,gold);
        box(.48,.035,z,.035,.23,.070,gold);
      }
      for(var i=0;i<3;i++){
        var x=-.48+i*.32;
        brace(x,.05,x+.32,.25,.016,.123);
        brace(x,.25,x+.32,.05,.016,.123);
      }
      box(-.48,.237,0,.06,.058,.27,gold);
      box(.48,.237,0,.06,.058,.27,gold);
    } else if (kind==='trolley') {
      box(0,-.125,0,.27,.16,.24,['#e4b457','#a4724c','#fff0c3']);
      box(-.080,.010,0,.067,.052,.26,plinth);
      box(.080,.010,0,.067,.052,.26,plinth);
      box(0,-.173,0,.08,.065,.12,plinth);
    } else if (kind==='hook') {
      box(0,-.032,0,.086,.11,.060,plinth);
      box(.036,-.086,0,.115,.055,.060,plinth);
      box(.085,-.060,0,.041,.075,.060,plinth);
    } else {
      var wall=walls[kind==='entry'?0:style%4];
      box(0,.048,0,.91,floorHeight-.126,.55,wall);
      box(0,0,0,1.02,.057,.65,stone);
      box(0,floorHeight-.087,0,1.02,.087,.65,stone);
      for(var slot=-1;slot<=1;slot++){
        var cx=slot*.265;
        var door=kind==='entry' && slot===0;
        var bottom=door?.048:.272, height=door?.54:.28;
        box(cx,bottom,.286,door?.29:.20,height,.036,stone);
        box(cx,bottom+.031,.308,door?.237:.151,height-.066,.027,glass);
        box(cx,bottom+.038,.326,.019,height-.081,.012,door?stone:plinth);
        if(!door)box(cx-.043,bottom+height-.089,.326,.041,.043,.011,stone);
        if(door)box(cx,.014,.336,.37,.045,.13,plinth);
      }
      for(var side=-1;side<=1;side+=2){
        for(var two=-1;two<=1;two+=2){
          box(side*.459,.27,two*.128,.027,.27,.149,stone);
          box(side*.475,.303,two*.128,.022,.208,.109,glass);
        }
      }
    }

    cache[key]=faces;
    return faces;
  }

  return {build:build,floorHeight:floorHeight};
}));
