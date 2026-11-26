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
    ['#d56e57','#ee9a74','#ffdfa0','#975850'],
    ['#7f67a3','#ac8cc4','#e3d0ef','#57467a']
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
  function meshData(style, kind) {
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
    if (kind===true) {
      box(0,-0.079,0,1.26,0.052,0.72,'#52606a','#9a9786','#384c5c');
      box(0,-0.029,0,1.14,0.029,0.62,'#879393','#e4dcb7','#667782');
      for(var stripe=-2;stripe<=2;stripe++) box(stripe*.21,-.058,.361,.07,.018,.001,'#efbf60');
      return faces;
    }
    if (kind==='roof') {
      box(0,.008,0,1.035,.055,.77,'#e7a750','#ffe29a','#aa663e');
      box(0,.063,0,.91,.10,.66,'#354e6c','#7794ad','#27394f');
      box(-.13,.163,0,.50,.145,.40,'#668199','#a2b8bd','#3b536d');
      box(-.13,.308,0,.55,.034,.44,'#f4bc66','#ffe7aa','#b78052');
      box(.28,.163,-.07,.045,.34,.045,'#485e74','#eff0d3','#2c4054');
      box(.28,.465,-.07,.10,.045,.09,'#ed875a','#ffd38d','#ad4b3d');
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
    function windowGlass(side, index) {
      var width = side ? .155 : .186;
      var center = side ? (index - .5) * .229 : (index - 1) * .308;
      function pane(profile, color) {
        var vertices = profile.map(function (point) {
          var across = center + point[0] * width;
          return side ? [.485, point[1], -across] : [across, point[1], halfDepth + .005];
        });
        polygon(vertices, side ? tone(color, .78) : color);
      }
      // Two tones meet edge to edge, with no trim or sill against the wall.
      pane([[-.5,.108],[0,.108],[0,.35],[-.2,.35],[-.38,.317],[-.5,.275]], '#8ec1cd');
      pane([[0,.108],[.5,.108],[.5,.275],[.38,.317],[.2,.35],[0,.35]], '#3f758e');
    }
    for(var wi=0;wi<3;wi++) windowGlass(false,wi);
    for(wi=0;wi<2;wi++) windowGlass(true,wi);
    for(var edge=-1;edge<=1;edge+=2) {
      box(edge*.447,.067,halfDepth+.003,.031,.331,.004,tone(p[1],1.05));
      for(var k=0;k<3;k++) box(edge*.44,.099+k*.104,halfDepth+.006,.058,.022,.004,p[2]);
    }
    if(kind==='entry') {
      box(0,.020,.263,.35,.296,.012,'#233e56','#fff0a9','#172635');
      box(0,.037,.273,.26,.236,.007,'#526e85','#a8d9d6','#273a4a');
      box(0,.039,.279,.016,.233,.003,'#d8ad6c','#e7c998','#5f503a');
      box(0,.005,.269,.39,.042,.071,'#d8a76a','#f6cc85','#9f6f4c');
    }
    if(kind==='cube'||kind==='entry') {
      faces.forEach(function(face){face.pts=face.pts.map(function(pt){return [pt[0],pt[1]*1.72,pt[2]*1.42];});});
    }
    return faces;
  }

  function asset(style, kind) {
    var key=(kind||'floor')+'-'+style+(global.BloxxFloorMesh?'m':'p');
    if (art[key]) return art[key];
    var faces=meshData(style,kind);
    var sprite=document.createElement('canvas'), scale=190, centerY=190;
    sprite.width=352; sprite.height=220;
    var ctx=sprite.getContext('2d');
    if(ctx) {
      // Bake the actual mesh to a tiny reusable sprite with a depth buffer.
      // Sorting entire triangles by depth would hide details on wide façades.
      var pixels=ctx.createImageData(sprite.width,sprite.height);
      var depth=new Float32Array(sprite.width*sprite.height);
      for(var k=0;k<depth.length;k++) depth[k]=-100;
      function raster(a,b,c,col){
        var ax=176+a[0]*scale,ay=centerY-a[1]*scale;
        var bx=176+b[0]*scale,by=centerY-b[1]*scale;
        var cx=176+c[0]*scale,cy=centerY-c[1]*scale;
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
    art[key]={key:key,faces:faces,sprite:sprite,scale:scale,centerY:centerY};
    return art[key];
  }

  function segment(canvas, style) {
    function paint() {
      var ctx=canvas.getContext('2d');
      var cube=asset(style===3?4:style,'cube').sprite;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(cube,57,14,238,183,0,0,canvas.width,canvas.height);
    }
    paint();
    if(!global.BloxxFloorMesh)script('assets/floor.js',paint);
  }

  // Orthographic painted city layers. Pixel art stays at its own resolution.
  function paintTown(ctx,w,h,rise,attract,ascent,foundation) {
    function rect(x,y,width,height,col) {
      ctx.fillStyle=col;ctx.fillRect(Math.round(x),Math.round(y),Math.round(width),Math.round(height));
    }
    function poly(pts,color) {
      ctx.beginPath();ctx.moveTo(Math.round(pts[0]),Math.round(pts[1]));
      for(var j=2;j<pts.length;j+=2) ctx.lineTo(Math.round(pts[j]),Math.round(pts[j+1]));
      ctx.closePath();ctx.fillStyle=color;ctx.fill();
    }
    function random(i) { var n=Math.sin(i*127.1+311.7)*43758.5453; return n-Math.floor(n); }
    if(ascent>=8){
      var space=ctx.createLinearGradient(0,0,0,h);
      var twilight=ascent<15;
      space.addColorStop(0,twilight?'#162953':'#101631');
      space.addColorStop(1,twilight?'#667aaf':'#263354');
      ctx.fillStyle=space;ctx.fillRect(0,0,w,h);
      for(var s=0;s<58;s++){
        var size=s%8===0?2:1;
        rect(random(s+470)*w,random(s+721)*h,size,size,s%3===0?'#ffdc99':'#a8c5e6');
      }
      if(ascent>=19){
        var mx=Math.round(w*.78),my=Math.round(h*.27),radius=Math.max(8,Math.round(h*.115));
        ctx.beginPath();ctx.arc(mx,my,radius,0,Math.PI*2);ctx.fillStyle='#ead7aa';ctx.fill();
        for(s=0;s<7;s++){
          ctx.beginPath();ctx.arc(mx+(random(s+4)-.5)*radius,my+(random(s+139)-.5)*radius,1+s%4,0,Math.PI*2);
          ctx.fillStyle='#c9bb9f';ctx.fill();
        }
      }
      return;
    }
    var sky=ctx.createLinearGradient(0,0,0,h);
    sky.addColorStop(0,attract?'#47447e':'#70b9d3');
    sky.addColorStop(.46,attract?'#9d71aa':'#b1dedb');
    sky.addColorStop(.74,attract?'#ffc093':'#f5d599');
    sky.addColorStop(1,attract?'#d48481':'#ebaa71');
    ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
    if(attract){
      var sunX=w*.82,sunY=h*.48,sunSize=Math.min(w*.16,h*.30);
      var glow=ctx.createRadialGradient(sunX,sunY,sunSize*.4,sunX,sunY,sunSize*1.75);
      glow.addColorStop(0,'rgba(255,209,135,.52)');glow.addColorStop(1,'rgba(255,167,132,0)');
      ctx.fillStyle=glow;ctx.fillRect(sunX-sunSize*2,sunY-sunSize*2,sunSize*4,sunSize*4);
      for(var line=-sunSize;line<sunSize;line+=2){
        if(line>sunSize*.28 && Math.floor(line/5)%2!==0)continue;
        var span=Math.sqrt(sunSize*sunSize-line*line);
        rect(sunX-span,sunY+line,span*2,2,line<0?'#ffe4a2':'#ffce87');
      }
    }
    function cloud(x,y,z) {
      ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(z,z);
      poly([0,1,5,1,5,-1,10,-1,10,-4,16,-4,16,-7,23,-7,23,-5,28,-5,28,-3,34,-3,34,0,41,0,41,2,47,2,47,4,0,4],attract?'#d69dad':'#daf0e3');
      rect(7,4,32,2,attract?'#b786a4':'#b8deda');rect(13,-3,7,1,attract?'#edb5bc':'#eff4dd');ctx.restore();
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
    var lot=foundation===undefined?h*.91+rise:foundation;
    if(lot<h+9){
      for(var t=7;t<w;t+=18){rect(t,lot,1,7,'#756f68');rect(t+1,lot,1,7,'#dfc591');}
      rect(0,lot+1,w,1,'#a9987b');rect(0,lot+5,w,1,'#a9987b');
      for(t=8;t<w;t+=31){rect(t,lot+11,8,1,'#957f69');rect(t+8,lot+10,2,1,'#957f69');}
    }
  }

  function mount(container, settings) {
    var labelFont = global.getComputedStyle ? global.getComputedStyle(container).fontFamily : 'Arial, sans-serif';
    if (!container) throw new Error('Tower scene needs a container.');
    var state={mode:'attract',floors:[],balance:0,getOffset:null,showCrane:true};
    var running=true, raf=global.requestAnimationFrame || function(fn){return setTimeout(function(){fn(Date.now());},16);};
    var cancel=global.cancelAnimationFrame || clearTimeout, frameId=0, then=0;
    var dropState=null, dropTimer=0, dirty=true, frozen=null, width=0,height=0, townKey='', backdrop=document.createElement('canvas');
    var paint=backdrop.getContext('2d'), T=null, renderer=null, world=null, camera=null, material=null, groups=[], geometry={};
    var resizeObserver=null, near=true, visibility=null, count=0, start=Date.now(), cameraX=0, cameraRise=0;
    var tour=null, tourPlayed=false, contactTimer=0, preview=null;
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
    function floor(x,y,style,kind,angle) {
      var a=asset(style,kind);
      if(renderer){
        var node=groups[count];
        if(!node){node=new T.Mesh(mesh(a),material);groups[count]=node;world.add(node);}
        else node.geometry=mesh(a);
        node.position.set(x,y,0);node.rotation.z=angle||0;node.visible=true;count++;
      }else{
        var px=sx+unit*x,py=syy-unit*y,size=unit/a.scale;
        fallback.save();fallback.translate(px,py);fallback.rotate(-(angle||0));
        fallback.imageSmoothingEnabled=true;
        fallback.drawImage(a.sprite,-176*size,-a.centerY*size,a.sprite.width*size,a.sprite.height*size);
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
    function crane(hookX,hookY,topY,xArm,slings,angle,pivotY,roofX) {
      var beamH=clamp(height*.045,8,23), y=clamp(height*.089,12,39), l=-8;
      var trolleyX=clamp(xArm,width*.25,width*.77), end=Math.min(width*.91,trolleyX+width*.12);
      rig.lineJoin='round';
      // Raised lattice boom exits the left edge as the tower climbs.
      var tilt=-.051;
      if(pivotY!==undefined)y=pivotY-beamH-4-(trolleyX-l)*tilt;
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
        var centerX=roofX===undefined?hookX:roofX;
        // Roof anchors rotate with the suspended unit.
        var riseL=wid*Math.sin(angle||0);
        line(rig,[hookX,hookY+2,centerX-wid,topY+riseL],'#505651',1.7);
        line(rig,[hookX+1,hookY+2,centerX+wid*.94,topY-riseL],'#454d4c',1.7);
        rig.fillStyle='#d39a45';
        rig.fillRect(centerX-wid-2,topY+riseL-1,4,3);rig.fillRect(centerX+wid*.94-2,topY-riseL-1,4,3);
      }
    }
    function floorLabel(text,cx,cy,angle) {
      if(!text) return;
      var max=Math.max(64,Math.min(width*.60,unit*1.22));
      var fontSize=clamp(unit*.108,11,17);
      rig.save();rig.translate(clamp(cx,max/2+3,width-max/2-3),cy);rig.rotate(-angle);
      rig.font='700 '+Math.round(fontSize)+'px '+labelFont;
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
    function perfectStars(x,y,progress) {
      var cx=sx+x*unit, cy=syy-y*unit;
      rig.save();
      rig.globalAlpha=Math.max(.06,1-progress*.9);
      for(var star=0;star<7;star++){
        var spread=(star-3)*(.10+progress*.24)*unit;
        var hover=(.08+Math.sin((star+1)*.43)*.34+progress*.45)*unit;
        var size=clamp(unit*.12,6,15)*(star===3?1:.68);
        var points=[];
        for(var vertex=0;vertex<10;vertex++){
          var theta=vertex*Math.PI/5-Math.PI/2+progress*(star-3)*.12;
          var radius=vertex%2 ? size*.46 : size;
          points.push(cx+spread+radius*Math.cos(theta),cy-hover+radius*Math.sin(theta));
        }
        poly(rig,points,star%2?'#fff4ad':'#ffd34e');
        line(rig,points.concat(points.slice(0,2)),'#a56431',1.2);
      }
      rig.restore();
    }
    function landingDust(x,y,progress) {
      if(reduced)return;
      var cx=sx+x*unit,cy=syy-y*unit;
      var pixel=clamp(Math.round(unit*.043),2,5);
      rig.save();
      rig.globalAlpha=(1-progress)*.85;
      for(var i=0;i<10;i++){
        var dir=i%2===0?-1:1;
        var dist=(.34+progress*(.28+i*.05))*unit;
        var lift=(.035+Math.sin(progress*Math.PI)*(.07+i*.022))*unit;
        rig.fillStyle=i%3?'#ffe0a2':'#fff5d4';
        rig.fillRect(Math.round(cx+dir*dist),Math.round(cy-lift),pixel,pixel);
      }
      rig.restore();
    }
    function skyTraffic(elapsed) {
      for(var i=0;i<4;i++){
        var x=Math.round(width-((elapsed*(.005+i*.0015)+width*(.13+i*.31))%(width+140)));
        var y=Math.round(height*(.22+i*.092));
        var cells=Math.max(2,Math.round(width/250));
        rig.fillStyle=i%2?'rgba(255,211,191,.52)':'rgba(255,222,201,.44)';
        rig.fillRect(x,y,18*cells,2*cells);
        rig.fillRect(x+3*cells,y-2*cells,9*cells,2*cells);
        rig.fillRect(x+6*cells,y-4*cells,4*cells,2*cells);
        rig.fillStyle='rgba(151,109,155,.32)';
        rig.fillRect(x+2*cells,y+2*cells,15*cells,cells);
      }
    }
    function loadPreviewBlock() {
      var arcade=global.BloxxArcade, tower=preview.tower;
      var crane=preview.crane, age=preview.time-preview.loadedAt;
      crane.placements=state.floors;
      arcade.arm(crane,preview.time,2,age);
      preview.loadedAt=preview.time;
      var loadedAt=preview.loadedAt;
      var words=['attend','get','make','submit'];
      state.choice=(crane.round-1)%words.length;
      state.label=words[state.choice];
      if(reduced)return;

      var count=state.floors.length;
      if(!count)preview.demolishing=false;
      if(count>=3)preview.demolishing=true;
      var target=[0,.22,-.16][Math.min(count,2)];
      var best=Infinity;
      var motion=crane.motion;
      // Find the next release that shows the intended landing using the live trajectory.
      for(var elapsed=1150;elapsed<1150+motion.period;elapsed+=34){
        var contact=arcade.trajectory(motion,elapsed,state.floors,function(ahead){
          return tower.angle(loadedAt+elapsed+ahead);
        },false);
        if(!contact.hit)continue;
        var score=preview.demolishing?(contact.tipped?elapsed:1e6+elapsed):
          (contact.tipped?1e6:0)+Math.abs(contact.offset-target)*10000+elapsed*.12;
        if(score>=best)continue;
        best=score;
        preview.releaseAt=loadedAt+elapsed;
        preview.contact=contact;
      }
    }
    function advancePreview(dt) {
      if(reduced)return;
      preview.time+=dt*1000;
      if(dropState || preview.time<preview.releaseAt || !preview.contact)return;
      var current=preview, contact=current.contact;
      current.contact=null;
      var result=global.BloxxArcade.land(state.floors,contact);
      result.bump=contact.hit;
      release(contact.path);
      impact(result,function(){
        state.floors=result.floors;
        current.crane.round++;
        frozen=null;
        loadPreviewBlock();
      },function(){
        if(result.kind==='landed')current.tower.land(result.offset,current.time,result.floors.length);
        else if(result.kind==='perfect' || result.fallen)current.tower.land(0,current.time,result.floors.length);
      });
    }
    function tick(stamp){
      if(!running) return;frameId=raf(tick);
      if(document.hidden||!near||stamp-then<(dropState||state.mode==='build'?15:32))return;
      var dt=clamp((stamp-then)/1000,0,.08);then=stamp; resize();
      if(!width||!height)return;
      if(preview)advancePreview(dt);
      var now=Date.now(),attract=state.mode==='attract', demo=!!preview;
      var sunset=attract || demo;
      var arcade=!!state.arcade && !attract;
      var screen=arcade && !!state.screen;
      var physical=arcade && !!state.physical;
      var floors=attract?[0,.035]:state.floors||[];
      if(arcade) floors=[0].concat(floors);
      var length=floors.length,top=length?Number(floors[length-1])||0:0;
      if(screen)unit=Math.min(width*.26,height*.14);
      else if(physical)unit=Math.min(width*.25,height*.142);
      else unit=Math.min(width*(attract?.36:.25),height*(arcade?.275:.39));
      var floorY=floorHeight*cp*(arcade?1.72:1);
      var ground=screen ? Math.min(height*.88,height-(width<124?157:117)) : height*.859;
      var headroom=physical ? Math.max(unit,ground-height*.12-unit*4.2) : height*(arcade?.32:attract?.46:.36);
      var rise=Math.max(0,length*floorY*unit-headroom);
      var targetCamera=attract?0:top;
      var touring=arcade && !!tour;
      if(touring){
        var review=clamp((now-tour.started)/(reduced?450:tour.duration),0,1);
        var glide=review*review*(3-2*review);
        rise=tour.rise*(1-glide);
        targetCamera=tour.x*(1-glide);
        if(review===1) tour=null;
      } else if(arcade && state.showRoof && tourPlayed){
        rise=0;targetCamera=0;
      }
      var swinging=attract ? !reduced : (!demo || !reduced) && state.showCrane!==false && !!(state.getOffset||state.getSwing) && frozen===null;
      var lean=attract ? 0 : clamp(state.balance || 0,-1,1);
      var wobble=Math.max(0,Math.abs(lean)-.28);
      var rocking=physical ? (!demo || !reduced) && !!state.getRock && (state.showCrane!==false || now<state.rockUntil) :
        !reduced && wobble>0 && state.showCrane!==false;
      if(!dirty && !dropState && !swinging && !rocking && !touring && Math.abs(targetCamera-cameraX)*unit<.2 && Math.abs(rise-cameraRise)<.2) return;
      dirty=false;
      cameraX+= (targetCamera-cameraX)*clamp(dt*9,0,1);
      cameraRise+=(rise-cameraRise)*clamp(dt*9,0,1);
      var center=sunset ? .64+.09*clamp((width-420)/190,0,1) : .5;
      sx=width*center-cameraX*unit;syy=ground+cameraRise;
      var townScale=Math.min(1,Math.min(430/width,330/height));
      var townW=Math.max(1,Math.round(width*townScale)),townH=Math.max(1,Math.round(height*townScale));
      var ascent=arcade?cameraRise/(unit*floorY):0;
      var foundation=physical?Math.round((syy+unit*.079)*townH/height):undefined;
      var key=townW+'/'+townH+'/'+Math.round(cameraRise*townScale/2)+'/'+(ascent>=19?3:ascent>=15?2:ascent>=8?1:0)+'/'+foundation+'/'+sunset;
      if(key!==townKey){
        backdrop.width=townW;backdrop.height=townH;paintTown(paint,townW,townH,cameraRise*townScale,sunset,ascent,foundation);
        city.imageSmoothingEnabled=false;city.drawImage(backdrop,0,0,width,height);townKey=key;
      }
      fallback.clearRect(0,0,width,height);rig.clearRect(0,0,width,height);count=0;
      if(sunset)skyTraffic(reduced?0:now-start);
      if(renderer){
        camera.left=-sx/unit;camera.right=(width-sx)/unit;camera.top=syy/unit;camera.bottom=(syy-height)/unit;camera.updateProjectionMatrix();
      }
      floor(0,0,0,true,0);
      var flight=dropState && dropState.path;
      var hit=flight && dropState.hit;
      var progress=dropState && dropState.duration ? clamp((now-(flight?dropState.contactAt:dropState.started))/dropState.duration,0,1) : 0;
      var collapse=dropState && (flight?(hit&&hit.fallen?hit:null):dropState.collapse);
      var firstFalling=collapse ? length+1-collapse.fallen : length+1;
      var tumble=collapse ? (flight?progress:clamp((progress-.25)/.75,0,1)) : 0;
      var flex=wobble*(lean<0?-1:1)*(.075+(rocking?.045*Math.sin(now/122)*(1-tumble):0));
      if(physical)flex=rocking?state.getRock():0;
      function displacement(y) {
        return physical ? global.BloxxPhysics.shift(y,flex) : flex*y;
      }
      var shattering=collapse && physical && !!flight;
      var pivotX=0,pivotY=0,tip=0,freeFall=0;
      if(collapse && !shattering) {
        var lower=floors[firstFalling-1] || 0;
        var upper=firstFalling<length ? floors[firstFalling] : top+(flight?flight.impact.x:dropState.offset);
        // Rotate around the outer edge of the shared support before the floors separate.
        var edge=collapse.direction>0 ? Math.min(lower,upper)+.5 : Math.max(lower,upper)-.5;
        pivotY=firstFalling*floorY;
        pivotX=edge+displacement(pivotY);
        tip=collapse.direction*.98*Math.pow(Math.min(tumble/.55,1),2);
        freeFall=Math.pow(clamp((tumble-.55)/.45,0,1),2);
      }
      function buildingFloor(index,x,y,angle) {
        if(shattering && index>=firstFalling && index<length && tumble>0) {
          var piece=global.BloxxPhysics.debris((now-dropState.contactAt)/1000,index-firstFalling,collapse.direction);
          x+=piece.x;y+=piece.y;angle+=piece.angle;
        } else if(!shattering && index>=firstFalling && tumble>0) {
          var level=index-firstFalling;
          var dx=x-pivotX,dy=y-pivotY;
          var rotation=tip+collapse.direction*.62*freeFall;
          var spin=collapse.direction*(.55+(level%3)*.38);
          x=pivotX+dx*Math.cos(rotation)+dy*Math.sin(rotation)+collapse.direction*freeFall*(.65+level*.27);
          y=pivotY-dx*Math.sin(rotation)+dy*Math.cos(rotation)-freeFall*(height/unit+1+level*.24);
          angle-=rotation+spin*freeFall;
        }
        var kind=arcade ? (index===0?'entry':'cube') : false;
        var color=arcade && index===length && state.choice>=0 ? state.choice : index;
        if(screen && index>0 && index<length && state.floorColors)color=state.floorColors[index-1];
        floor(x,y,screen && color===3?4:color%4,kind,angle);
      }
      for(var i=0;i<length;i++){
        var y=i*floorY;
        if(syy-y*unit>height+unit || syy-y*unit<-unit) continue;
        buildingFloor(i,(Number(floors[i])||0)+displacement(y),y,-flex);
      }
      var tableY=length*floorY,hangGap=Math.min(height*(attract?.125:.16),unit*.70)/unit;
      var sway=displacement(tableY);
      if(arcade && state.showRoof && syy-tableY*unit>-unit) floor(top+(physical?sway:0),tableY,0,'roof',physical?-flex:0);
      if(arcade && state.target && !tumble && !state.showRoof)
        floorLabel(state.target,sx+(top+sway)*unit,syy-(tableY-floorY*.47)*unit,-flex);
      var carryY=tableY+hangGap,offset=attract?(reduced?.36:Math.sin((now-start)/1270)*.54):0;
      var swing=arcade && state.getSwing ? state.getSwing() : null;
      if(swing){
        offset=swing.x;
        carryY=tableY+swing.height;
      }
      if(!attract && typeof state.getOffset==='function'){
        var value=state.getOffset();if(isFinite(value))offset=value;
      }
      if(dropState && !flight)offset=dropState.offset;else if(frozen!==null)offset=frozen;
      var hx=top+offset+(physical?0:sway),hy=carryY,angle=swing?swing.angle:attract?-.025*offset:0;
      var show=attract || state.showCrane!==false,slings=true,callback=null;
      if(flight){
        var airborne=flight.at(clamp((now-dropState.started)/1000,0,flight.duration));
        hx=top+airborne.x+(physical?0:sway);
        hy=tableY+airborne.height;
        angle=airborne.angle;
        slings=false;
        if(hit && (!collapse || shattering) && (hit.kind==='wrong'||hit.kind==='miss'||hit.kind.indexOf('passed')===0)){
          var travel=progress*dropState.duration/1000;
          if(flight.rejected && now>=dropState.contactAt){
            var falling=flight.rejected(travel,!!hit.bump);
            hx=top+falling.x;hy=tableY+falling.height;angle=falling.angle;
          }else{
            var direction=airborne.x<0?-1:1;
            hy-=7*travel*travel;
            hx+=direction*.88*travel;
            angle-=direction*2.9*travel;
          }
        } else if(hit && !collapse){
          var snap=hit.kind==='perfect'?0:hit.offset;
          hx=top+airborne.x+(snap+sway-airborne.x)*progress+(physical?0:sway*(1-progress));
          angle=angle*(1-progress)-(physical?flex*progress:0);
          hy=tableY+(airborne.height+Math.sin(progress*Math.PI*2)*.075)*(1-progress);
        }
        if(hit && progress===1)callback=finishDrop;
      }else if(dropState){
        var t=Math.min(1,progress/(collapse?.25:.79));
        hy=carryY-hangGap*(t*t);
        if(!dropState.landed){
          hy-=Math.pow(progress,2.2)*(height/unit+.8);
          angle=-(offset<0?-1:1)*progress*.66;
        }else if(!collapse && progress>.79){
          hy+=Math.sin((progress-.79)/.21*Math.PI)*.024*(1-progress);
        }
        slings=false;
        if(progress===1)callback=finishDrop;
      }
      if(show || dropState) {
        var roofY=syy-(hy+floorY)*unit,actorX=sx+hx*unit;
        var hookY=syy-(carryY+floorY)*unit - Math.min(unit*.23,height*.079);
        var armX=width*center;
        if(physical && swing){
          crane(sx+(top+swing.hookX)*unit,syy-(tableY+swing.hookHeight)*unit,
            syy-(hy+floorY*Math.cos(angle))*unit,sx+top*unit,
            slings&&!!state.label,angle,syy-(tableY+swing.pivotHeight)*unit,actorX-floorY*Math.sin(angle)*unit);
        }else{
          crane(flight?sx+(top+offset)*unit:actorX,hookY,roofY,armX,slings,angle);
        }
        if((frozen===null || dropState) && (!arcade || state.label || flight)){
          buildingFloor(length,hx,hy,angle);
          if(!tumble) {
            var labelLift=floorY*.42;
            floorLabel(state.label,actorX-(physical?labelLift*Math.sin(angle)*unit:0),
              syy-(hy+labelLift*(physical?Math.cos(angle):1))*unit,angle);
          }
        }
        if(hit && now>=dropState.contactAt && (hit.kind==='perfect' || hit.kind==='landed')){
          landingDust(hx,tableY,progress);
          if(hit.kind==='perfect')perfectStars(hx,tableY+floorY*.68,progress);
        } else if(!arcade)burst(hx,tableY,progress,!collapse && Math.abs(offset)<.85);
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
      dropState=null;frozen=active.path?0:active.offset;dirty=true;
      if(active.callback)active.callback();
    }
    function cancelDrop() {
      clearTimeout(dropTimer);dropTimer=0;
      clearTimeout(contactTimer);contactTimer=0;
      dropState=null;frozen=null;dirty=true;
    }
    function set(options) {
      dirty=true;
      options=options||{};
      if(preview && options.mode && options.mode!=='demo'){
        cancelDrop();
        preview=null;
        state.arcade=false;
        state.physical=false;
        state.getSwing=null;
        state.getRock=null;
        state.floors=[];
      }
      if(!options.showRoof) {tour=null;tourPlayed=false;}
      else if(!tourPlayed){
        tour={rise:cameraRise,x:cameraX,started:Date.now()+480,duration:Math.min(4800,1500+(options.floors||[]).length*140)};
        tourPlayed=true;
      }
      for(var k in options)if(Object.prototype.hasOwnProperty.call(options,k))state[k]=options[k];
      if(options.mode==='demo' && !preview){
        var physics=global.BloxxPhysics;
        preview={time:0,loadedAt:0,crane:{seed:31,round:1,placements:[]},tower:physics.tower()};
        state.arcade=true;
        state.physical=true;
        state.screen=false;
        state.showCrane=true;
        state.target='';
        state.floors=reduced?[0]:[];
        state.getOffset=null;
        state.getRock=function(){return preview.tower.angle(preview.time);};
        state.getSwing=function(){return physics.swing(preview.crane.motion,preview.time-preview.loadedAt);};
        loadPreviewBlock();
      }
      if(!dropState)frozen=null;
      if(!frameId)frameId=raf(tick);
    }
    function drop(offset,landed,callback,collapse) {
      if(!running) return;
      cancelDrop();
      dropState={offset:Number(offset)||0,landed:!!landed,callback:callback,collapse:collapse,
        started:Date.now(),duration:collapse?(reduced?360:1260):(reduced?210:480)};
      // A student may scroll the crane offscreen or switch tabs after tapping.
      // Network state and controls still settle when animation frames pause.
      dropTimer=setTimeout(finishDrop,dropState.duration);
    }
    function release(path) {
      cancelDrop();
      dropState={path:path,started:Date.now()};
    }
    function impact(hit,callback,onContact) {
      if(!dropState || !dropState.path) {callback();return;}
      dropState.hit=hit;
      dropState.callback=callback;
      dropState.contactAt=Math.max(Date.now(),dropState.started+dropState.path.duration*1000);
      dropState.duration=hit.fallen?(reduced?280:860):hit.kind==='perfect'?470:hit.kind==='landed'?220:440;
      if(!state.physical && dropState.path.rejected && !hit.fallen && (hit.kind==='miss'||hit.kind==='wrong')){
        var topY=((state.floors||[]).length+1)*floorHeight*cp*1.72;
        var bottom=Math.max(0,(syy-height)/unit)-.22;
        for(var time=.26; time<1.24; time+=.03){
          var falling=dropState.path.rejected(time,hit.kind==='wrong');
          if(topY+falling.height<bottom || Math.abs(falling.x)*unit>width*.5+unit*.7)break;
        }
        dropState.duration=Math.round(time*1000);
      }
      var untilContact=Math.max(0,dropState.contactAt-Date.now());
      contactTimer=setTimeout(onContact,untilContact);
      dropTimer=setTimeout(finishDrop,untilContact+dropState.duration);
    }
    function destroy(){
      if(!running)return;running=false;cancelDrop();cancel(frameId);frameId=0;
      global.removeEventListener('resize',resize);
      if(resizeObserver)resizeObserver.disconnect();if(visibility)visibility.disconnect();
      if(renderer)releaseThree();
      [scenic,graphics,foreground].forEach(function(el){if(el.parentNode===container)container.removeChild(el);});
    }
    if(!global.BloxxFloorMesh)script('assets/floor.js',function(){dirty=true;});
    if(document.fonts && document.fonts.load) {
      document.fonts.load('700 14px '+labelFont).then(function(){dirty=true;},function(){});
    }
    var canvasOnly=(settings && settings.canvasOnly) || /(?:[?&])renderer=canvas(?:[&#]|$)/.test(global.location.search) ||
      global.navigator.connection && global.navigator.connection.saveData;
    if(!canvasOnly && global.WebGLRenderingContext) {
      if(global.THREE)setupThree();else script('lib/three.r136.min.js',setupThree);
    }
    resize();frameId=raf(tick);
    return {set:set,drop:drop,release:release,impact:impact,cancelDrop:cancelDrop,destroy:destroy};
  }
  global.BloxxScene={mount:mount,segment:segment};
}(window));
