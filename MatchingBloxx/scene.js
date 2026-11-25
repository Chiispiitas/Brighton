/* Tower scene shared by the lobby and the individual crane. The canvas painter
   also renders the same Meshy triangles when WebGL is unavailable. */
(function (global) {
  'use strict';
  var floorHeight = 0.48;
  var halfDepth = 0.249;
  var yaw = -0.33, pitch = 0.15;
  var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  var palettes = [
    ['#cd503c','#ef7452','#f6bc74','#893f3b'],
    ['#e49c42','#f8bd65','#fff0a3','#ab663b'],
    ['#418f99','#68b9b4','#ffda8e','#386675'],
    ['#d56e57','#ee9a74','#ffdfa0','#975850']
  ];
  var art = {}, pending = {};
  var tag = document.currentScript;
  var base = tag && tag.src ? tag.src.split('?')[0].replace(/[^/]+$/, '') : './';
  function script(path, complete) {
    if (pending[path]) { pending[path].push(complete); return; }
    pending[path] = [complete];
    var el = document.createElement('script');
    el.async = true;
    el.onload = el.onerror = function () {
      var queue = pending[path]; delete pending[path];
      for (var i = 0; i < queue.length; i++) queue[i]();
    };
    el.src = base + path;
    document.head.appendChild(el);
  }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function project(p) {
    var x = cy * p[0] + sy * p[2], z = -sy * p[0] + cy * p[2];
    return [x, cp*p[1] - sp*z, sp*p[1] + cp*z];
  }
  function tone(hex, n) {
    var val = parseInt(hex.slice(1), 16);
    var r = clamp(Math.round((val >> 16)*n),0,255), g=clamp(Math.round(((val >> 8)&255)*n),0,255);
    var b=clamp(Math.round((val&255)*n),0,255);
    return '#' + (16777216 + r*65536 + g*256 + b).toString(16).slice(1);
  }
  function meshData(style, isBase) {
    var faces = [], p = palettes[style];
    function polygon(pts, color) { faces.push({pts:pts,c:color}); }
    function box(x,y,z,w,h,d,front,top,right) {
      var a=x-w/2,b=x+w/2,c=y+h,e=z-d/2,f=z+d/2;
      polygon([[a,y,f],[b,y,f],[b,c,f],[a,c,f]],front);
      polygon([[b,y,f],[b,y,e],[b,c,e],[b,c,f]],right || tone(front,0.76));
      polygon([[a,c,f],[b,c,f],[b,c,e],[a,c,e]],top || tone(front,1.13));
      polygon([[a,y,e],[a,y,f],[a,c,f],[a,c,e]],tone(front,0.78));
      polygon([[a,y,e],[b,y,e],[b,y,f],[a,y,f]],tone(front,0.6));
    }
    if (isBase) {
      box(0,-0.079,0,1.26,0.052,0.72,'#52606a','#9a9786','#384c5c');
      box(0,-0.029,0,1.14,0.029,0.62,'#879393','#e4dcb7','#667782');
      for(var stripe=-2;stripe<=2;stripe++) box(stripe*.21,-.058,.361,.07,.018,.001,'#efbf60');
      return faces;
    }
    var generated=global.BloxxFloorMesh;
    if (generated) {
      var points=generated.points, ids=generated.triangles, converted=[];
      for(var i=0;i<points.length;i+=3) converted.push([
        (points[i]/1000-.5)*.958,points[i+1]/1000*floorHeight,(points[i+2]/1000-.5)*halfDepth*2]);
      for(i=0;i<ids.length;i+=3) {
        var a=converted[ids[i]],b=converted[ids[i+1]],c=converted[ids[i+2]];
        var ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
        var nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx, norm=Math.sqrt(nx*nx+ny*ny+nz*nz)||1;
        var light = ny/norm>.60?1.14:(Math.abs(nx/norm)>.65?.82:1);
        polygon([a,b,c],tone(p[0],light));
      }
    } else {
      box(0,0,0,.958,floorHeight,halfDepth*2,p[0]);
    }
    box(0,.005,0,1,.031,.516,p[3],p[2]);
    box(0,.036,0,.983,.013,.509,p[1],p[2]);
    box(0,.418,0,.99,.025,.514,p[3],p[1]);
    box(0,.442,0,1,.038,.523,p[2],tone(p[2],1.12),tone(p[2],.79));
    function panels(side,index) {
      var span=side?.155:.205;
      var midpoint=side?(index-.5)*.229:(index-1)*.308;
      function face(parts,z,color) {
        var vertices=[];
        for(var j=0;j<parts.length;j++) {
          var u=midpoint + parts[j][0]*span;
          vertices.push(side ? [.48+z,parts[j][1],-u] : [u,parts[j][1],halfDepth+z]);
        }
        polygon(vertices,color);
      }
      function band(x1,y1,x2,y2,z,color) { face([[x1,y1],[x2,y1],[x2,y2],[x1,y2]],z,color); }
      var shade=side?.76:1;
      function ink(col) {return side?tone(col,shade):col;}
      band(-.48,.084,.50,.114,.001,ink(p[3]));
      face([[-.51,.117],[.51,.117],[.51,.297],[.40,.340],[.19,.373],[-.19,.373],[-.40,.34],[-.51,.297]],.002,ink(p[2]));
      face([[-.39,.120],[.39,.120],[.39,.289],[.28,.32],[.12,.338],[-.12,.338],[-.28,.32],[-.39,.289]],.004,ink('#30495c'));
      band(-.296,.15,-.048,.277,.006,ink(index%2?'#95cdd0':'#76b0c1'));
      band(.058,.15,.296,.277,.006,ink(index%2?'#50899d':'#a7d9d7'));
      face([[-.294,.287],[.29,.287],[.192,.306],[.09,.317],[-.09,.317],[-.192,.306]],.007,ink('#e7c680'));
      band(-.55,.093,.55,.118,.007,ink(p[2]));
      if(!side && (style+index)%3===1) {
        band(-.32,.110,.32,.133,.008,'#9b5242');
        for(var v=-1;v<=1;v++) band(v*.18-.048,.133,v*.18+.060,.149+(v===0?.014:0),.009, v===0?'#b3c263':'#518867');
      }
    }
    for(var wi=0;wi<3;wi++) panels(false,wi);
    for(wi=0;wi<2;wi++) panels(true,wi);
    for(var edge=-1;edge<=1;edge+=2) {
      box(edge*.447,.067,halfDepth+.003,.031,.331,.004,tone(p[1],1.05));
      for(var k=0;k<3;k++) box(edge*.44,.099+k*.104,halfDepth+.006,.058,.022,.004,p[2]);
    }
    return faces;
  }

  function asset(style, isBase) {
    var key=(isBase?'b':'f')+style+(global.BloxxFloorMesh?'m':'p');
    if (art[key]) return art[key];
    var faces=meshData(style,isBase);
    var sprite=document.createElement('canvas'), scale=235;
    sprite.width=352; sprite.height=165;
    var ctx=sprite.getContext('2d');
    if(ctx) {
      // Bake the actual mesh to a tiny reusable sprite with a depth buffer.
      // Sorting entire triangles by depth would hide details on wide façades.
      var pixels=ctx.createImageData(sprite.width,sprite.height);
      var depth=new Float32Array(sprite.width*sprite.height);
      for(var k=0;k<depth.length;k++) depth[k]=-100;
      function raster(a,b,c,col){
        var ax=176+a[0]*scale,ay=136-a[1]*scale;
        var bx=176+b[0]*scale,by=136-b[1]*scale;
        var cx=176+c[0]*scale,cy=136-c[1]*scale;
        var area=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);
        if(area>=-0.00001)return;
        var minX=Math.max(0,Math.floor(Math.min(ax,bx,cx)));
        var maxX=Math.min(sprite.width-1,Math.ceil(Math.max(ax,bx,cx)));
        var minY=Math.max(0,Math.floor(Math.min(ay,by,cy)));
        var maxY=Math.min(sprite.height-1,Math.ceil(Math.max(ay,by,cy)));
        for(var yy=minY;yy<=maxY;yy++){
          for(var xx=minX;xx<=maxX;xx++){
            var wa=((by-cy)*(xx+.5-cx)+(cx-bx)*(yy+.5-cy))/area;
            var wb=((cy-ay)*(xx+.5-cx)+(ax-cx)*(yy+.5-cy))/area;
            var wc=1-wa-wb;
            if(wa<0||wb<0||wc<0)continue;
            var z=wa*a[2]+wb*b[2]+wc*c[2],at=yy*sprite.width+xx;
            if(z<depth[at])continue;
            depth[at]=z;var p=at*4;
            pixels.data[p]=col>>16;pixels.data[p+1]=(col>>8)&255;pixels.data[p+2]=col&255;pixels.data[p+3]=255;
          }
        }
      }
      for(var i=0;i<faces.length;i++){
        var pts=faces[i].pts.map(project),color=parseInt(faces[i].c.slice(1),16);
        for(var j=1;j<pts.length-1;j++)raster(pts[0],pts[j],pts[j+1],color);
      }
      ctx.putImageData(pixels,0,0);
    }
    art[key]={key:key,faces:faces,sprite:sprite,scale:scale};
    return art[key];
  }

  // Orthographic painted city layers. Pixel art stays at its own resolution.
  function paintTown(ctx,w,h,rise,attract) {
    function rect(x,y,width,height,col) {
      ctx.fillStyle=col;ctx.fillRect(Math.round(x),Math.round(y),Math.round(width),Math.round(height));
    }
    function poly(pts,color) {
      ctx.beginPath();ctx.moveTo(Math.round(pts[0]),Math.round(pts[1]));
      for(var j=2;j<pts.length;j+=2) ctx.lineTo(Math.round(pts[j]),Math.round(pts[j+1]));
      ctx.closePath();ctx.fillStyle=color;ctx.fill();
    }
    function random(i) { var n=Math.sin(i*127.1+311.7)*43758.5453; return n-Math.floor(n); }
    var sky=ctx.createLinearGradient(0,0,0,h);
    sky.addColorStop(0,'#70b9d3');sky.addColorStop(.46,'#b1dedb');sky.addColorStop(.74,'#f5d599');sky.addColorStop(1,'#ebaa71');
    ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
    function cloud(x,y,z) {
      ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(z,z);
      poly([0,1,5,1,5,-1,10,-1,10,-4,16,-4,16,-7,23,-7,23,-5,28,-5,28,-3,34,-3,34,0,41,0,41,2,47,2,47,4,0,4],'#daf0e3');
      rect(7,4,32,2,'#b8deda');rect(13,-3,7,1,'#eff4dd');ctx.restore();
    }
    for(var ci=-1;ci<Math.ceil(w/120)+1;ci++){
      cloud(ci*129+11,h*.17+Math.sin(ci*4)*h*.045+rise*.011,1.0);
      cloud(ci*113+67,h*.31+Math.cos(ci*3.4)*h*.054+rise*.014,.65);
    }
    // Small distant birds use single stepped wings.
    for(var bi=0;bi<3;bi++){
      var bx=w*.78+bi*9,by=h*.22+Math.sin(bi*2)*4;
      rect(bx,by,2,1,'#769b9f');rect(bx+2,by+1,1,1,'#769b9f');rect(bx+3,by,2,1,'#769b9f');
    }
    function skyline(far) {
      var x=-12, i=0, baseY=h*(far?.83:.92)+rise*(far?.07:.17),unit=clamp(h/235,.72,1.8);
      while(x<w+3){
        var seed=i+ (far?3:61),bw=(far?11+random(seed+7)*13:15+random(seed+7)*22)*unit;
        var high=(far?19+random(seed+88)*50:14+random(seed+88)*56)*unit;
        var y=baseY-high, col=far?'#91b8ba':['#799ca7','#89a3a4','#7eabb0','#84a3ac'][i%4];
        rect(x,y,bw,high+2,col);
        if(i%3===0) {
          rect(x+bw*.17,y-5*unit,bw*.62,6*unit,col);
          if(i%2===0) rect(x+bw*.37,y-11*unit,bw*.2,8*unit,col);
        }
        if(!far){
          rect(x+bw*.74,y,bw*.25,high+2,'#74959d');
          if(i%3!==0){
            for(var wy=y+4*unit;wy<baseY-2;wy+=7*unit){
              for(var wx=x+3*unit;wx<x+bw*.71;wx+=6*unit) rect(wx,wy,2*unit,3*unit,i%2?'#a9c2bc':'#a0bfc2');
            }
          }else{
            for(var strip=2;strip<bw*.75;strip+=5*unit) rect(x+strip,y+3,1.5*unit,high-4,'#a1b9b4');
          }
        }
        x+=bw+unit*(far?-1:2);i++;
      }
    }
    skyline(true);skyline(false);
    var street=h*.875+rise*.85;
    function tenement(x,bw,stories,i) {
      var ih=clamp(h/24,6,13),wall=['#b5a488','#9aa6a0','#bc927b','#a6a591'][i%4];
      var top=street-stories*ih, q=ih/10;
      rect(x,top,bw,street-top,wall);rect(x+bw*.84,top,bw*.16,street-top,'#8f9185');
      rect(x-1,top,bw+2,2*q,'#777e79');rect(x,top-2*q,bw,2*q,'#c3b996');
      rect(x+2*q,top-5*q,4*q,4*q,'#98978b');
      if(i%3===0){
        rect(x+bw*.6,top-10*q,6*q,7*q,'#887e72');rect(x+bw*.6-q,top-11*q,8*q,2*q,'#786f66');
        rect(x+bw*.6,top-3*q,q,3*q,'#766f67');rect(x+bw*.6+5*q,top-3*q,q,3*q,'#766f67');
      }
      for(var j=0;j<stories;j++) for(var k=0;k<3;k++){
        var xx=x+(k+.6)*bw*.25, yy=top+ih*(j+.25);
        rect(xx,yy,3.4*q,4.3*q,'#697e80');rect(xx,yy,1.2*q,2*q,'#c3c4a3');
        rect(xx-q,yy+4.3*q,5.3*q,q,'#d0b996');
      }
      rect(x,street-ih*.78,bw*.78,ih*.78,'#877f6e');
      rect(x,street-ih,bw*.79,ih*.24,i%2?'#b3a175':'#ba8f72');
    }
    // Street runs behind the construction lot.
    for(var si=-1,x=-30; x<w+45;si++) {
      var ww=clamp(h*.115,20,38)+random(si+51)*8;
      tenement(x,ww,2+(Math.floor(random(si+70)*3)),si+4);x+=ww+3;
    }
    function tree(x,y,size){
      rect(x-1,y-size*.52,3,size*.54,'#807259');
      poly([x-size*.25,y-size*.37,x-size*.3,y-size*.56,x-size*.15,y-size*.75,x-size*.13,y-size*.9,x+size*.03,y-size,x+size*.22,y-size*.86,x+size*.25,y-size*.68,x+size*.34,y-size*.54,x+size*.21,y-size*.36],'#689272');
      poly([x-size*.24,y-size*.54,x-size*.17,y-size*.69,x-size*.11,y-size*.83,x+size*.02,y-size*.93,x+size*.13,y-size*.85,x+size*.07,y-size*.74,x-size*.08,y-size*.68,x-size*.08,y-size*.53],'#96b387');
    }
    for(var ti=-1;ti<w/90+2;ti++) tree(ti*89+14,street+1,clamp(h*.14,15,40));
    rect(0,street,w,2,'#e2c69d');rect(0,street+2,w,4,'#9c9d91');
    rect(0,street+6,w,8,'#707f80');rect(0,street+13,w,3,'#bdb497');
    rect(0,street+16,w,Math.max(0,h-street),'#af9273');
    rect(0,street+18,w,2,'#cbb68c');
    for(var s=0;s<w;s+=29)rect(s,street+9,12,1,'#bdc1a5');
    for(var l=0;l<w;l+=100){
      var py=street-13,px=l+30;rect(px,py,1,14,'#667c79');rect(px-2,py-4,4,4,'#526b68');rect(px-1,py-3,2,2,'#ffe4a0');
    }
    var lot=h*.91+rise;
    if(lot<h+9){
      for(var t=7;t<w;t+=18){rect(t,lot,1,7,'#756f68');rect(t+1,lot,1,7,'#dfc591');}
      rect(0,lot+1,w,1,'#a9987b');rect(0,lot+5,w,1,'#a9987b');
      for(t=8;t<w;t+=31){rect(t,lot+11,8,1,'#957f69');rect(t+8,lot+10,2,1,'#957f69');}
    }
  }

  function mount(container) {
    if (!container) throw new Error('Tower scene needs a container.');
    var state={mode:'attract',floors:[],getOffset:null,showCrane:true};
    var running=true, raf=global.requestAnimationFrame || function(fn){return setTimeout(function(){fn(Date.now());},16);};
    var cancel=global.cancelAnimationFrame || clearTimeout, frameId=0, then=0;
    var dropState=null, dropTimer=0, dirty=true, frozen=null, width=0,height=0, townKey='', backdrop=document.createElement('canvas');
    var paint=backdrop.getContext('2d'), T=null, renderer=null, world=null, camera=null, material=null, groups=[], geometry={};
    var resizeObserver=null, near=true, visibility=null, count=0, start=Date.now(), cameraX=0, cameraRise=0;
    var reduced=global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var ratio=1, sx=0, syy=0, unit=1;
    function layer(label) {
      var c=document.createElement('canvas');
      c.style.cssText='display:block;position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;image-rendering:pixelated';
      c.setAttribute('aria-hidden','true'); c.setAttribute('data-layer',label);
      container.appendChild(c);return c;
    }
    if (global.getComputedStyle && global.getComputedStyle(container).position==='static') container.style.position='relative';
    var scenic=layer('city'), graphics=layer('buildings'), foreground=layer('rig');
    var city=scenic.getContext('2d'), fallback=graphics.getContext('2d'), rig=foreground.getContext('2d');
    container.setAttribute('data-renderer','canvas');
    function resize() {
      var w=container.clientWidth,h=container.clientHeight;
      if(!w||!h || (w===width&&h===height)) return;
      width=w;height=h;ratio=clamp(global.devicePixelRatio||1,1,1.4);
      [scenic,graphics,foreground].forEach(function(c){c.width=Math.round(w*ratio);c.height=Math.round(h*ratio);});
      city.setTransform(ratio,0,0,ratio,0,0);fallback.setTransform(ratio,0,0,ratio,0,0);
      rig.setTransform(ratio,0,0,ratio,0,0);
      if(renderer) renderer.setSize(w,h,false);
      townKey='';dirty=true;
    }
    if(global.ResizeObserver){resizeObserver=new global.ResizeObserver(resize);resizeObserver.observe(container);}
    global.addEventListener('resize',resize);
    if(global.IntersectionObserver){
      visibility=new global.IntersectionObserver(function(entries){near=entries[0].isIntersecting;});
      visibility.observe(container);
    }
    function setupThree() {
      if(!running || !global.THREE || renderer) return;
      var c=document.createElement('canvas');
      c.style.cssText=graphics.style.cssText;c.setAttribute('aria-hidden','true');c.setAttribute('data-layer','three');
      try{
        T=global.THREE;
        var gl=c.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:true,depth:true}) ||
          c.getContext('experimental-webgl',{alpha:true,antialias:false,depth:true});
        if(!gl) return;
        renderer=new T.WebGLRenderer({canvas:c,context:gl,alpha:true,antialias:false});
        renderer.setClearColor(0,0);renderer.setPixelRatio(clamp(global.devicePixelRatio||1,1,1.4));
        renderer.setSize(Math.max(1,width),Math.max(1,height),false);
        world=new T.Scene();
        camera=new T.OrthographicCamera(-1,1,1,-1,.1,100);
        camera.position.z=20;
        material=new T.MeshBasicMaterial({vertexColors:true});
        container.insertBefore(c,foreground);graphics.style.visibility='hidden';
        container.setAttribute('data-renderer','three');dirty=true;
        c.addEventListener('webglcontextlost',function(e){e.preventDefault();releaseThree();},false);
      }catch(e){releaseThree();}
    }
    function releaseThree() {
      var old=renderer;renderer=null;
      if(old){
        var c=old.domElement;if(c.parentNode)c.parentNode.removeChild(c);
        for(var k in geometry) if(Object.prototype.hasOwnProperty.call(geometry,k)) geometry[k].dispose();
        if(material)material.dispose();
        old.dispose();
        if(old.forceContextLoss) old.forceContextLoss();
      }
      geometry={};groups=[];
      graphics.style.visibility='visible';container.setAttribute('data-renderer','canvas');
    }
    function mesh(assetData) {
      if(geometry[assetData.key]) return geometry[assetData.key];
      var vertices=[],colors=[],faces=assetData.faces;
      for(var i=0;i<faces.length;i++){
        var pts=faces[i].pts,col=new T.Color(faces[i].c);
        for(var j=1;j<pts.length-1;j++){
          var tri=[pts[0],pts[j],pts[j+1]];
          for(var k=0;k<3;k++){
            var pt=project(tri[k]);vertices.push(pt[0],pt[1],pt[2]);colors.push(col.r,col.g,col.b);
          }
        }
      }
      var g=new T.BufferGeometry();
      g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
      g.setAttribute('color',new T.Float32BufferAttribute(colors,3));
      geometry[assetData.key]=g; return g;
    }
    function floor(x,y,style,isBase,angle) {
      var a=asset(style,isBase);
      if(renderer){
        var node=groups[count];
        if(!node){node=new T.Mesh(mesh(a),material);groups[count]=node;world.add(node);}
        else node.geometry=mesh(a);
        node.position.set(x,y,0);node.rotation.z=angle||0;node.visible=true;count++;
      }else{
        var px=sx+unit*x,py=syy-unit*y,size=unit/a.scale;
        fallback.save();fallback.translate(px,py);fallback.rotate(-(angle||0));
        fallback.imageSmoothingEnabled=true;
        fallback.drawImage(a.sprite,-176*size,-136*size,a.sprite.width*size,a.sprite.height*size);
        fallback.restore();
      }
    }
    function line(ctx,pts,color,weight){
      ctx.beginPath();ctx.moveTo(pts[0],pts[1]);for(var j=2;j<pts.length;j+=2)ctx.lineTo(pts[j],pts[j+1]);
      ctx.strokeStyle=color;ctx.lineWidth=weight;ctx.stroke();
    }
    function poly(ctx,pts,col){
      ctx.beginPath();ctx.moveTo(pts[0],pts[1]);for(var j=2;j<pts.length;j+=2)ctx.lineTo(pts[j],pts[j+1]);
      ctx.closePath();ctx.fillStyle=col;ctx.fill();
    }
    function crane(hookX,hookY,topY,xArm,slings,angle) {
      var beamH=clamp(height*.045,8,23), y=clamp(height*.089,12,39), l=-8;
      var trolleyX=clamp(xArm,width*.25,width*.77), end=Math.min(width*.91,trolleyX+width*.12);
      rig.lineJoin='round';
      // Raised lattice boom exits the left edge as the tower climbs.
      var tilt=-.051;
      function by(x){return y+(x-l)*tilt;}
      poly(rig,[l,by(l),end,by(end),end,by(end)+beamH,l,by(l)+beamH],'#c18744');
      poly(rig,[l,by(l)+3,end,by(end)+3,end,by(end)+beamH-3,l,by(l)+beamH-3],'#86bec6');
      for(var i=l;i<end-2;i+=beamH*1.1){
        var right=Math.min(end,i+beamH*1.1),mid=(i+right)/2;
        line(rig,[i,by(i)+beamH-2,mid,by(mid)+2,right,by(right)+beamH-2],'#a9743e',Math.max(2,beamH*.19));
        line(rig,[i,by(i)+beamH-3,mid,by(mid)+2],'#efb353',Math.max(1,beamH*.10));
      }
      line(rig,[l,by(l),end,by(end)],'#6e654c',2);line(rig,[l,by(l)+1,end,by(end)+1],'#ffcf70',2.3);
      line(rig,[l,by(l)+beamH,end,by(end)+beamH],'#815d42',2.5);
      var baseY=by(trolleyX)+beamH;
      rig.fillStyle='#515650';rig.fillRect(trolleyX-8,baseY-3,16,7);
      rig.fillStyle='#f0b44f';rig.fillRect(trolleyX-6,baseY-2,12,4);
      line(rig,[trolleyX,baseY+4,hookX,hookY-2],'#434d4a',Math.max(1.6,unit*.013));
      rig.fillStyle='#354b51';rig.fillRect(hookX-3,hookY-5,6,5);
      line(rig,[hookX,hookY-1,hookX+2,hookY+3,hookX+5,hookY+1],'#55534d',2);
      if(slings){
        var wid=unit*.42;
        // Roof anchors rotate with the suspended unit.
        var riseL=wid*Math.sin(angle||0);
        line(rig,[hookX,hookY+2,hookX-wid,topY+riseL],'#505651',1.7);
        line(rig,[hookX+1,hookY+2,hookX+wid*.94,topY-riseL],'#454d4c',1.7);
        rig.fillStyle='#d39a45';
        rig.fillRect(hookX-wid-2,topY+riseL-1,4,3);rig.fillRect(hookX+wid*.94-2,topY-riseL-1,4,3);
      }
    }
    function floorLabel(text,cx,cy,angle) {
      if(!text) return;
      var max=Math.max(64,Math.min(width*.60,unit*1.22));
      var fontSize=clamp(unit*.108,11,17);
      rig.save();rig.translate(clamp(cx,max/2+3,width-max/2-3),cy);rig.rotate(-angle);
      rig.font='bold '+Math.round(fontSize)+'px Trebuchet MS, Arial, sans-serif';
      var words=String(text).slice(0,64).split(/\s+/),lines=[''];
      for(var i=0;i<words.length;i++){
        var j=lines.length-1, line=lines[j] ? lines[j]+' '+words[i] : words[i];
        if(lines[j] && rig.measureText(line).width>max-12)lines.push(words[i]);else lines[j]=line;
      }
      var span=0;
      for(i=0;i<lines.length;i++)span=Math.max(span,rig.measureText(lines[i]).width);
      var labelWidth=Math.min(max,span+14),lineH=Math.ceil(fontSize)+1,labelH=lineH*lines.length+6;
      rig.fillStyle='#324957';rig.fillRect(-labelWidth/2,-labelH/2,labelWidth,labelH);
      rig.fillStyle='#ffdf98';rig.fillRect(-labelWidth/2+1,-labelH/2+1,labelWidth-2,1);
      rig.textAlign='center';rig.textBaseline='middle';rig.fillStyle='#fff6d5';
      for(i=0;i<lines.length;i++)rig.fillText(lines[i],0,(i-(lines.length-1)/2)*lineH+1,labelWidth-8);
      rig.restore();
    }
    function burst(x,y,progress,landed) {
      if(!landed||progress<.78||reduced)return;
      var t=(progress-.78)/.22,cx=sx+unit*x,yy=syy-unit*y;
      for(var j=0;j<6;j++){
        var dir=j%2?1:-1,dist=(.29+j*.038+t*.26)*unit;
        rig.fillStyle=j%3?'#ffe2a7':'#fff2ba';
        var ss=Math.max(1,(1-t)*unit*.028);
        rig.fillRect(cx+dir*dist,yy-(.01+Math.sin(t*Math.PI)*.06)*unit,ss,ss);
      }
    }
    function tick(stamp){
      if(!running) return;frameId=raf(tick);
      if(document.hidden||!near||stamp-then<(dropState||state.mode==='build'?15:32))return;
      var dt=clamp((stamp-then)/1000,0,.08);then=stamp; resize();
      if(!width||!height)return;
      var now=Date.now(),attract=state.mode==='attract';
      var floors=attract?[0,.035]:state.floors||[];
      var length=floors.length,top=length?Number(floors[length-1])||0:0;
      unit=Math.min(width*(attract?.36:.267),height*(attract?.39:.39));
      var floorY=floorHeight*cp;
      var rise=Math.max(0,(length*floorY*unit)-height*(attract?.46:.36));
      var targetCamera=attract?0:top;
      var swinging=attract ? !reduced : state.showCrane!==false && !!state.getOffset && frozen===null;
      if(!dirty && !dropState && !swinging && Math.abs(targetCamera-cameraX)*unit<.2 && Math.abs(rise-cameraRise)<.2) return;
      dirty=false;
      cameraX+= (targetCamera-cameraX)*clamp(dt*9,0,1);
      cameraRise+=(rise-cameraRise)*clamp(dt*9,0,1);
      var center=attract ? .525+.145*clamp((width-480)/140,0,1) : .5;
      sx=width*center-cameraX*unit;syy=height*.859+cameraRise;
      var townScale=Math.min(1,Math.min(430/width,330/height));
      var townW=Math.max(1,Math.round(width*townScale)),townH=Math.max(1,Math.round(height*townScale));
      var key=townW+'/'+townH+'/'+Math.round(cameraRise*townScale/2);
      if(key!==townKey){
        backdrop.width=townW;backdrop.height=townH;paintTown(paint,townW,townH,cameraRise*townScale,attract);
        city.imageSmoothingEnabled=false;city.drawImage(backdrop,0,0,width,height);townKey=key;
      }
      fallback.clearRect(0,0,width,height);rig.clearRect(0,0,width,height);count=0;
      if(renderer){
        camera.left=-sx/unit;camera.right=(width-sx)/unit;camera.top=syy/unit;camera.bottom=(syy-height)/unit;camera.updateProjectionMatrix();
      }
      floor(0,0,0,true,0);
      for(var i=0;i<length;i++){
        var y=i*floorY;
        if(syy-y*unit>height+unit) continue;
        floor(Number(floors[i])||0,y,i%palettes.length,false,0);
      }
      var tableY=length*floorY,hangGap=Math.min(height*(attract?.125:.16),unit*.70)/unit;
      var carryY=tableY+hangGap,offset=attract?(reduced?.36:Math.sin((now-start)/1270)*.54):0;
      if(!attract && typeof state.getOffset==='function'){
        var value=state.getOffset();if(isFinite(value))offset=value;
      }
      if(dropState)offset=dropState.offset;else if(frozen!==null)offset=frozen;
      var hx=top+offset,hy=carryY,angle=attract?-.025*offset:0,progress=0;
      var show=attract || state.showCrane!==false,slings=true,callback=null;
      if(dropState){
        progress=clamp((now-dropState.started)/dropState.duration,0,1);
        var t=Math.min(1,progress/.79);
        hy=carryY-hangGap*(t*t);
        if(!dropState.landed){
          hy-=Math.pow(progress,2.2)*(height/unit+.8);
          angle=-(offset<0?-1:1)*progress*.66;
        }else if(progress>.79){
          hy+=Math.sin((progress-.79)/.21*Math.PI)*.024*(1-progress);
        }
        slings=false;
        if(progress===1)callback=finishDrop;
      }
      if(show || progress>0) {
        var roofY=syy-(hy+floorY)*unit,actorX=sx+hx*unit;
        var hookY=syy-(carryY+floorY)*unit - Math.min(unit*.23,height*.079);
        var armX=width*center;
        // Keep the unloaded hook over the tower between turns.
        crane(actorX,hookY,roofY,armX,slings,angle);
        if(frozen===null || progress>0){
          floor(hx,hy,length%palettes.length,false,angle);
          floorLabel(state.label,actorX,syy-(hy+floorY*.42)*unit,angle);
        }
        burst(hx,tableY,progress,Math.abs(offset)<.85);
      }
      if(renderer){
        for(var m=count;m<groups.length;m++)groups[m].visible=false;
        renderer.render(world,camera);
      }
      if(callback)callback();
    }
    function finishDrop() {
      if(!dropState) return;
      var active=dropState;
      clearTimeout(dropTimer);dropTimer=0;
      dropState=null;frozen=active.offset;dirty=true;
      if(active.callback)active.callback();
    }
    function cancelDrop() {
      clearTimeout(dropTimer);dropTimer=0;
      dropState=null;frozen=null;dirty=true;
    }
    function set(options) {
      dirty=true;
      options=options||{};
      for(var k in options)if(Object.prototype.hasOwnProperty.call(options,k))state[k]=options[k];
      if(!dropState)frozen=null;
      if(!frameId)frameId=raf(tick);
    }
    function drop(offset,landed,callback) {
      if(!running) return;
      cancelDrop();
      dropState={offset:Number(offset)||0,landed:!!landed,callback:callback,started:Date.now(),duration:reduced?210:480};
      // A student may scroll the crane offscreen or switch tabs after tapping.
      // Network state and controls still settle when animation frames pause.
      dropTimer=setTimeout(finishDrop,dropState.duration);
    }
    function destroy(){
      if(!running)return;running=false;cancelDrop();cancel(frameId);frameId=0;
      global.removeEventListener('resize',resize);
      if(resizeObserver)resizeObserver.disconnect();if(visibility)visibility.disconnect();
      if(renderer)releaseThree();
      [scenic,graphics,foreground].forEach(function(el){if(el.parentNode===container)container.removeChild(el);});
    }
    if(!global.BloxxFloorMesh)script('assets/floor.js',function(){dirty=true;});
    var canvasOnly=/(?:[?&])renderer=canvas(?:[&#]|$)/.test(global.location.search) ||
      global.navigator.connection && global.navigator.connection.saveData;
    if(!canvasOnly && global.WebGLRenderingContext) {
      if(global.THREE)setupThree();else script('lib/three.r136.min.js',setupThree);
    }
    resize();frameId=raf(tick);
    return {set:set,drop:drop,cancelDrop:cancelDrop,destroy:destroy};
  }
  global.BloxxScene={mount:mount};
}(window));
