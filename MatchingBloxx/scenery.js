(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BloxxScenery = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function clamp(value, min, max) { return Math.max(min,Math.min(max,value)); }
  function random(seed) {
    var n=Math.sin(seed*127.1+311.7)*43758.5453;
    return n-Math.floor(n);
  }

  function pixels(ctx, scale) {
    function rect(x,y,width,height,color) {
      var left=Math.round(x*scale), top=Math.round(y*scale);
      var right=Math.round((x+width)*scale), bottom=Math.round((y+height)*scale);
      if(right<=left || bottom<=top) return;
      ctx.fillStyle=color;
      ctx.fillRect(left,top,right-left,bottom-top);
    }

    // Sample the curve at pixel centers, one native row at a time.
    function ellipse(x,y,rx,ry,color) {
      var cx=x*scale, cy=y*scale, radiusX=rx*scale, radiusY=ry*scale;
      var start=Math.ceil(cy-radiusY-.5), stop=Math.ceil(cy+radiusY-.5);
      for(var row=start;row<stop;row++){
        var offset=(row+.5-cy)/radiusY;
        var span=radiusX*Math.sqrt(1-offset*offset);
        var left=Math.ceil(cx-span-.5), right=Math.ceil(cx+span-.5);
        if(right<=left)continue;
        var fill=typeof color==='function'?color(offset):color;
        if(!fill)continue;
        ctx.fillStyle=fill;
        ctx.fillRect(left,row,right-left,1);
      }
    }

    function quad(points,color) {
      var top=Math.min(points[1],points[3],points[5],points[7])*scale;
      var bottom=Math.max(points[1],points[3],points[5],points[7])*scale;
      ctx.fillStyle=color;
      for(var row=Math.ceil(top-.5);row<Math.ceil(bottom-.5);row++){
        var y=(row+.5)/scale, left=Infinity, right=-Infinity;
        for(var i=0;i<8;i+=2){
          var next=(i+2)%8, a=points[i+1], b=points[next+1];
          if(y<Math.min(a,b) || y>=Math.max(a,b))continue;
          var x=points[i]+(points[next]-points[i])*(y-a)/(b-a);
          left=Math.min(left,x);
          right=Math.max(right,x);
        }
        var x0=Math.ceil(left*scale-.5), x1=Math.ceil(right*scale-.5);
        if(x1>x0)ctx.fillRect(x0,row,x1-x0,1);
      }
    }

    return {rect:rect,ellipse:ellipse,quad:quad};
  }

  function cloud(ellipse,x,y,size,light,shade) {
    ellipse(x+21*size,y+2*size,22*size,4.2*size,shade);
    ellipse(x+33*size,y-.8*size,12*size,4.6*size,light);
    ellipse(x+8*size,y-.9*size,9*size,3.5*size,light);
    ellipse(x+17*size,y-2.3*size,11*size,5.5*size,light);
    ellipse(x+24*size,y-4*size,9*size,6.4*size,light);
    ellipse(x+21*size,y,22*size,3.2*size,light);
  }

  function skyTraffic(ctx,w,h,elapsed) {
    ctx.clearRect(0,0,w,h);
    var ellipse=pixels(ctx,1).ellipse;
    for(var i=0;i<4;i++){
      var x=w-((elapsed*(.005+i*.0015)+w*(.13+i*.31))%(w+140));
      var y=h*(.22+i*.092);
      var size=clamp(w/460,.72,1.2)*(i%2?.8:1);
      cloud(ellipse,x,y,size,'#ffddc4','#c691ab');
    }
  }

  function paintTown(ctx,width,height,rise,attract,ascent,foundation,scale) {
    // Keep the original composition in design units. Draw directly to the
    // display grid so a single scale serves both axes, even at odd sizes.
    scale=scale || Math.max(1,width/430,height/330);
    var w=width/scale, h=height/scale;
    rise/=scale;
    if(foundation!==undefined)foundation/=scale;
    var art=pixels(ctx,scale), rect=art.rect, ellipse=art.ellipse;

    if(ascent>=8){
      var space=ctx.createLinearGradient(0,0,0,height);
      var twilight=ascent<15;
      space.addColorStop(0,twilight?'#162953':'#101631');
      space.addColorStop(1,twilight?'#667aaf':'#263354');
      ctx.fillStyle=space;ctx.fillRect(0,0,width,height);
      var cell=1/scale;
      for(var s=0;s<58;s++){
        var size=(s%8===0?2:1)*cell;
        rect(random(s+470)*w,random(s+721)*h,size,size,s%3===0?'#ffdc99':'#a8c5e6');
      }
      if(ascent>=19){
        var mx=w*.78,my=h*.27,radius=Math.max(8,h*.115);
        ellipse(mx,my,radius,radius,'#ead7aa');
        var craters=[[-.46,-.28,.16],[-.13,.22,.11],[.29,-.37,.10],[.35,.28,.19],[.04,-.52,.06],[-.32,.48,.08]];
        craters.forEach(function(shape) {
          var x=mx+shape[0]*radius,y=my+shape[1]*radius,r=shape[2]*radius;
          ellipse(x,y,r,r*.83,'#c9bb9f');
          ellipse(x+.12*r,y+.11*r,r*.71,r*.53,'#d7c9aa');
        });
      }
      return;
    }

    var sky=ctx.createLinearGradient(0,0,0,height);
    sky.addColorStop(0,attract?'#47447e':'#70b9d3');
    sky.addColorStop(.46,attract?'#9d71aa':'#b1dedb');
    sky.addColorStop(.74,attract?'#ffc093':'#f5d599');
    sky.addColorStop(1,attract?'#d48481':'#ebaa71');
    ctx.fillStyle=sky;ctx.fillRect(0,0,width,height);
    if(attract){
      var sunX=w*.82,sunY=h*.48,sunSize=Math.min(w*.16,h*.30);
      var glow=ctx.createRadialGradient(sunX*scale,sunY*scale,sunSize*scale*.4,sunX*scale,sunY*scale,sunSize*scale*1.75);
      glow.addColorStop(0,'rgba(255,209,135,.52)');glow.addColorStop(1,'rgba(255,167,132,0)');
      rect(sunX-sunSize*2,sunY-sunSize*2,sunSize*4,sunSize*4,glow);
      ellipse(sunX,sunY,sunSize,sunSize,function(offset) {
        if(offset>.30 && Math.floor((offset-.30)*sunSize/4)%2===1)return null;
        return offset<0?'#ffe4a2':'#ffce87';
      });
    }

    var cloudLight=attract?'#e7abb9':'#e4f1df', cloudShade=attract?'#bb8aa9':'#b6d6d3';
    for(var ci=-1;ci<Math.ceil(w/120)+1;ci++){
      cloud(ellipse,ci*129+11,h*.17+Math.sin(ci*4)*h*.045+rise*.011,1,cloudLight,cloudShade);
      cloud(ellipse,ci*113+67,h*.31+Math.cos(ci*3.4)*h*.054+rise*.014,.65,cloudLight,cloudShade);
    }
    for(var bi=0;bi<3;bi++){
      var bx=w*.78+bi*9,by=h*.22+Math.sin(bi*2)*4, feather=1/scale;
      rect(bx,by,2*feather,feather,'#769b9f');
      rect(bx+2*feather,by+feather,feather,feather,'#769b9f');
      rect(bx+3*feather,by,2*feather,feather,'#769b9f');
    }

    function skyline(far) {
      var x=-12, i=0, baseY=h*(far?.83:.92)+rise*(far?.07:.17),unit=clamp(h/235,.72,1.8);
      while(x<w+3){
        var seed=i+ (far?3:61),bw=(far?11+random(seed+7)*13:15+random(seed+7)*22)*unit;
        var high=(far?19+random(seed+88)*50:14+random(seed+88)*56)*unit;
        var y=baseY-high, col=attract?(far?'#a77e9b':['#74658b','#88758a','#7d6383','#8b7084'][i%4]):
          (far?'#91b8ba':['#799ca7','#89a3a4','#7eabb0','#84a3ac'][i%4]);
        rect(x,y,bw,high+2,col);
        if(i%3===0) {
          rect(x+bw*.17,y-5*unit,bw*.62,6*unit,col);
          if(i%2===0) rect(x+bw*.37,y-11*unit,bw*.2,8*unit,col);
        }
        if(!far){
          rect(x+bw*.74,y,bw*.25,high+2,attract?'#655877':'#74959d');
          if(i%3!==0){
            for(var wy=y+4*unit;wy<baseY-2;wy+=7*unit){
              for(var wx=x+3*unit;wx<x+bw*.71;wx+=6*unit) rect(wx,wy,2*unit,3*unit,attract?'#be94a6':i%2?'#a9c2bc':'#a0bfc2');
            }
          }else{
            for(var strip=2;strip<bw*.75;strip+=5*unit) rect(x+strip,y+3,1.5*unit,high-4,attract?'#9e809b':'#a1b9b4');
          }
        }
        x+=bw+unit*(far?-1:2);i++;
      }
    }
    skyline(true);skyline(false);
    var street=foundation===undefined?h*.875+rise*.85:foundation-18;
    var walls=[
      ['#b5a488','#959486'],
      ['#9aa6a0','#858f8c'],
      ['#b79a88','#9c9085'],
      ['#aba39b','#92908a']
    ];
    function tenement(x,bw,stories,i) {
      var ih=clamp(h/24,6,13), wall=walls[i%walls.length];
      var top=street-stories*ih, q=ih/10, front=bw*.81, face=x+front, far=x+bw;
      var lift=2.7*q, roof=top-1.9*q;
      rect(x,top,front,street-top,wall[0]);
      art.quad([face,top,far,top-lift,far,street-lift,face,street],wall[1]);
      rect(x-.7*q,roof,front+1.4*q,2*q,'#b1aa95');
      art.quad([face+.7*q,roof,far+.7*q,roof-lift,far+.7*q,top-lift,face+.7*q,top],'#999586');
      art.quad([x-.7*q,roof,face+.7*q,roof,far+.7*q,roof-lift,x+bw-front-.7*q,roof-lift],'#c6baa0');
      if(i%3===0){
        var chimney=x+front*.63;
        rect(chimney,roof-6.2*q,4*q,5.3*q,'#9a8f82');
        rect(chimney-.4*q,roof-7*q,4.8*q,1.4*q,'#a79a88');
      }
      for(var j=0;j<stories;j++){
        var floor=top+ih*j;
        if(j)rect(x,floor,front,.65*q,'#b6ad98');
        for(var k=0;k<3;k++){
          var xx=x+front*(k+1)/4, yy=floor+3.9*q;
          ellipse(xx,yy,2.4*q,2.2*q,'#bcb39d');
          rect(xx-2.4*q,yy,4.8*q,3.2*q,'#bcb39d');
          ellipse(xx,yy+.3*q,1.6*q,1.7*q,'#79898a');
          rect(xx-1.6*q,yy+.3*q,3.2*q,2.1*q,'#79898a');
        }
        art.quad([face+2*q,floor+3.5*q,far-1.4*q,floor+2*q,far-1.4*q,floor+5.2*q,face+2*q,floor+6.7*q],'#818d88');
      }
      rect(x,street-1.7*q,front,1.7*q,'#a19a89');
      art.quad([face,street-1.7*q,far,street-lift-1.7*q,far,street-lift,face,street],'#8c9186');
    }
    for(var si=-1,x=-30; x<w+45;si++) {
      var ww=clamp(h*.115,20,38)+random(si+51)*8;
      tenement(x,ww,2+(Math.floor(random(si+70)*3)),si+4);x+=ww+3;
    }
    function tree(x,y,size){
      rect(x-size*.04,y-size*.5,size*.08,size*.51,'#807259');
      ellipse(x,y-size*.58,size*.23,size*.39,'#689272');
      ellipse(x+size*.16,y-size*.52,size*.17,size*.25,'#689272');
      ellipse(x-size*.16,y-size*.53,size*.14,size*.21,'#789d79');
      ellipse(x-size*.10,y-size*.65,size*.14,size*.23,'#96b387');
      ellipse(x+size*.03,y-size*.81,size*.12,size*.14,'#96b387');
    }
    for(var ti=-1;ti<w/90+2;ti++) tree(ti*89+14,street+1,clamp(h*.14,15,40));
    rect(0,street,w,2,'#e2c69d');rect(0,street+2,w,4,'#9c9d91');
    rect(0,street+6,w,8,'#707f80');rect(0,street+13,w,3,'#bdb497');
    rect(0,street+16,w,Math.max(0,h-street),'#af9273');
    rect(0,street+18,w,2,'#cbb68c');
    for(var s=0;s<w;s+=29)rect(s,street+9,12,1,'#bdc1a5');
    for(var l=0;l<w;l+=100){
      var py=street-13,px=l+30;
      rect(px,py,1,14,'#667c79');
      rect(px-2,py-4,4,4,'#526b68');
      ellipse(px,py-2,1,1,'#ffe4a0');
    }
    var lot=foundation===undefined?h*.91+rise:foundation;
    if(lot<h+9){
      for(var t=7;t<w;t+=18){rect(t,lot,1,7,'#756f68');rect(t+1,lot,1,7,'#dfc591');}
      rect(0,lot+1,w,1,'#a9987b');rect(0,lot+5,w,1,'#a9987b');
      for(t=8;t<w;t+=31){rect(t,lot+11,8,1,'#957f69');rect(t+8,lot+10,2,1,'#957f69');}
    }
  }

  return {paint:paintTown, skyTraffic:skyTraffic};
}));
