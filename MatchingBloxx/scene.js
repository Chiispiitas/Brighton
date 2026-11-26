/* One native sprite grid serves Canvas and Three.js. Physics coordinates stay in CSS pixels. */
(function (global) {
  'use strict';
  var floorHeight = .48, cp = Math.cos(.15);
  var tag = document.currentScript;
  var base = tag && tag.src ? tag.src.split('?')[0].replace(/[^/]+$/, '') : './';
  var atlas = new Image(), compact = new Image(), sprites = {}, pending = [];
  atlas.src = base+'assets/pixel/town.png';
  compact.src = base+'assets/pixel/compact.png';

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function loadThree(complete) {
    if (pending.push(complete)>1) return;
    var el = document.createElement('script');
    el.async = true;
    el.onload = el.onerror = function () {
      var queue=pending;pending=[];
      queue.forEach(function(done){done();});
    };
    el.src = base+'lib/three.r136.min.js';
    document.head.appendChild(el);
  }
  function sprite(style, kind, small) {
    var foundation=kind===true;
    var index=kind==='roof'?5:kind==='entry'?4:style%4;
    var key=(small?'compact-':'full-')+(foundation?'base':index);
    if(sprites[key])return sprites[key];
    var image=small?compact:atlas;
    if(!image.naturalWidth)return null;
    var cell=small?36:48;
    var canvas=document.createElement('canvas');
    canvas.width=cell;canvas.height=foundation?(small?14:18):cell;
    canvas.getContext('2d').drawImage(image,foundation?0:index*cell,foundation?cell:0,canvas.width,canvas.height,0,0,canvas.width,canvas.height);
    var result={key:key,image:canvas,x:cell/2,y:foundation?(small?6:8):(small?30:40),unit:small?24:32};
    sprites[key]=result;
    return result;
  }
  function segment(canvas, style) {
    canvas.width=38;canvas.height=32;
    function paint() {
      var image=sprite(style,'cube',false);
      if(image)canvas.getContext('2d').drawImage(image.image,-5,-10);
    }
    if(atlas.naturalWidth)paint();
    else atlas.addEventListener('load',paint,{once:true});
  }

  function paintTown(ctx,w,h,rise,attract,ascent,foundation,horizontal) {
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
    var street=foundation===undefined?h*.875+rise*.85:foundation-12;
    if(atlas.naturalWidth){
      var streetRow=attract?164:96, farRow=attract?300:232;
      function district(row, baseline, offset, depth, phase, alpha) {
        var widths=[23,28,24,37];
        var cycle=[2,1,3,0,1,2,0,3,1,0,2,3,0,1,2];
        var stride=cycle.reduce(function(sum,index){return sum+widths[index]+depth;},0);
        var x=Math.round(offset)%stride-stride;
        ctx.globalAlpha=alpha;
        for(var i=0;x<w+40;i++){
          var index=cycle[((i+phase)%cycle.length+cycle.length)%cycle.length];
          var spriteWidth=widths[index];
          ctx.drawImage(atlas,index*48,row,48,68,x-24,Math.round(baseline)-67,48,68);
          x+=spriteWidth+depth;
        }
        ctx.globalAlpha=1;
      }
      district(farRow,street-12-rise*.59,13-horizontal*.19,6,1,.46);
      district(farRow,street-4-rise*.33,-45-horizontal*.35,2,6,.75);
      district(streetRow,street,22-horizontal*.62,4,3,1);
      for(var t=17;t<w;t+=74){
        ctx.drawImage(atlas,111,67,18,20,t-9,Math.round(street)-20,18,20);
      }
    }
    rect(0,street,w,2,attract?'#c49875':'#d6bd8a');
    rect(0,street+2,w,6,attract?'#665c68':'#707d78');
    rect(0,street+8,w,2,attract?'#837071':'#adb39a');
    rect(0,street+10,w,h,attract?'#9b7968':'#ad9271');
    for(var mark=4;mark<w;mark+=24)rect(mark,street+4,8,1,attract?'#ba9980':'#b8b7a1');
    var lot=foundation===undefined?street+11:foundation;
    if(lot<h && atlas.naturalWidth){
      var spots=w<133?[.13,.86]:[.13,.76,.91];
      spots.forEach(function(point,index){
        var cell=index===0?3:(spots.length===2||index===2?5:4);
        var x=Math.round(w*point)-24;
        ctx.drawImage(atlas,cell*48,48,48,48,x,Math.round(lot)+4-39,48,48);
      });
    }
  }

  function mount(container, settings) {
    var labelFont = global.getComputedStyle ? global.getComputedStyle(container).fontFamily : 'Arial, sans-serif';
    if (!container) throw new Error('Tower scene needs a container.');
    var state={mode:'attract',floors:[],balance:0,getOffset:null,showCrane:true};
    var running=true, raf=global.requestAnimationFrame || function(fn){return setTimeout(function(){fn(Date.now());},16);};
    var cancel=global.cancelAnimationFrame || clearTimeout, frameId=0, then=0;
    var dropState=null, dropTimer=0, dirty=true, frozen=null, width=0,height=0, townKey='';
    var T=null, renderer=null, world=null, camera=null, groups=[], geometry={};
    var resizeObserver=null, near=true, visibility=null, count=0, start=Date.now(), cameraX=0, cameraRise=0;
    var tour=null, tourPlayed=false, contactTimer=0, preview=null;
    var reduced=global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var sx=0, syy=0, unit=1, cityReady='';
    function layer(label) {
      var c=document.createElement('canvas');
      c.style.cssText='display:block;position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;image-rendering:pixelated';
      c.setAttribute('aria-hidden','true'); c.setAttribute('data-layer',label);
      container.appendChild(c);return c;
    }
    if (global.getComputedStyle && global.getComputedStyle(container).position==='static') container.style.position='relative';
    var scenic=layer('city'), graphics=layer('buildings'), foreground=layer('rig'), captions=layer('labels');
    var city=scenic.getContext('2d'), fallback=graphics.getContext('2d'), rig=foreground.getContext('2d');
    var letters=captions.getContext('2d'), pixel=1, compactBlocks=false, blockScale=1;
    captions.style.imageRendering='auto';
    container.setAttribute('data-renderer','canvas');
    function resize() {
      var w=container.clientWidth,h=container.clientHeight;
      if(!w||!h || (w===width&&h===height)) return;
      width=w;height=h;pixel=w>=200 && h>=330?2:1;
      [scenic,graphics,foreground].forEach(function(c){
        c.width=Math.ceil(w/pixel);c.height=Math.ceil(h/pixel);
        c.style.width=(c.width*pixel)+'px';c.style.height=(c.height*pixel)+'px';
      });
      fallback.setTransform(1/pixel,0,0,1/pixel,0,0);
      fallback.imageSmoothingEnabled=false;
      rig.setTransform(1/pixel,0,0,1/pixel,0,0);
      rig.imageSmoothingEnabled=false;
      var labelRatio=clamp(global.devicePixelRatio||1,1,2);
      captions.width=Math.round(w*labelRatio);captions.height=Math.round(h*labelRatio);
      letters.setTransform(labelRatio,0,0,labelRatio,0,0);
      resizeThree();
      townKey='';dirty=true;
    }
    function resizeThree(){
      if(!renderer||!width)return;
      renderer.setSize(scenic.width,scenic.height,false);
      renderer.domElement.style.width=scenic.style.width;
      renderer.domElement.style.height=scenic.style.height;
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
        renderer.setClearColor(0,0);
        renderer.setPixelRatio(1);
        renderer.outputEncoding=T.sRGBEncoding;
        resizeThree();
        world=new T.Scene();
        camera=new T.OrthographicCamera(-1,1,1,-1,.1,100);
        camera.position.z=20;
        container.insertBefore(c,foreground);graphics.style.visibility='hidden';
        container.setAttribute('data-renderer','three');dirty=true;
        c.addEventListener('webglcontextlost',function(e){e.preventDefault();releaseThree();},false);
      }catch(e){releaseThree();}
    }
    function releaseThree() {
      var old=renderer;renderer=null;
      if(old){
        var c=old.domElement;if(c.parentNode)c.parentNode.removeChild(c);
        Object.keys(geometry).forEach(function(key){
          var item=geometry[key];
          item.plane.dispose();item.texture.dispose();item.material.dispose();
        });
        old.dispose();
        if(old.forceContextLoss) old.forceContextLoss();
      }
      geometry={};groups=[];
      graphics.style.visibility='visible';container.setAttribute('data-renderer','canvas');
    }
    function materialFor(art) {
      if(geometry[art.key])return geometry[art.key];
      var w=art.image.width/art.unit,h=art.image.height/art.unit;
      var plane=new T.PlaneGeometry(w,h);
      plane.translate(w/2-art.x/art.unit,art.y/art.unit-h/2,0);
      var texture=new T.CanvasTexture(art.image);
      texture.magFilter=T.NearestFilter;
      texture.minFilter=T.NearestFilter;
      texture.generateMipmaps=false;
      texture.encoding=T.sRGBEncoding;
      var material=new T.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.5,depthTest:false,depthWrite:false,toneMapped:false});
      var visual={plane:plane,material:material,texture:texture};
      geometry[art.key]=visual;
      return visual;
    }
    function floor(x,y,style,kind,angle) {
      var a=sprite(style,kind,compactBlocks);
      if(!a)return;
      var px=Math.round((sx+unit*x)/pixel)*pixel;
      var py=Math.round((syy-unit*y)/pixel)*pixel;
      if(renderer){
        var visual=materialFor(a);
        var node=groups[count];
        if(!node){node=new T.Mesh(visual.plane,visual.material);groups[count]=node;world.add(node);}
        else {node.geometry=visual.plane;node.material=visual.material;}
        node.position.set((px-sx)/unit,(syy-py)/unit,0);
        node.rotation.z=angle||0;
        node.renderOrder=count++;
        node.visible=true;
      }else{
        var size=pixel*blockScale;
        fallback.save();fallback.translate(px,py);fallback.rotate(-(angle||0));
        fallback.drawImage(a.image,-a.x*size,-a.y*size,a.image.width*size,a.image.height*size);
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
    function cable(x0,y0,x1,y1,color) {
      x0=Math.round(x0/pixel);y0=Math.round(y0/pixel);
      x1=Math.round(x1/pixel);y1=Math.round(y1/pixel);
      if(!isFinite(x0+y0+x1+y1))return;
      var dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0);
      var stepX=x0<x1?1:-1,stepY=y0<y1?1:-1,error=dx+dy;
      rig.fillStyle=color;
      for(;;){
        rig.fillRect(x0*pixel,y0*pixel,pixel,pixel);
        if(x0===x1 && y0===y1)return;
        var change=error*2;
        if(change>=dy){error+=dy;x0+=stepX;}
        if(change<=dx){error+=dx;y0+=stepY;}
      }
    }
    function crane(hookX,hookY,topY,xArm,slings,angle,pivotY,roofX) {
      var trolleyX=Math.round(clamp(xArm,width*.25,width*.77)/pixel)*pixel;
      var baseY=Math.round((pivotY===undefined?height*.13:pivotY)/pixel)*pixel;
      var end=Math.min(width*.93,trolleyX+width*.12);
      if(atlas.naturalWidth){
        var boomWidth=42*pixel;
        for(var x=0;x<end;x+=boomWidth){
          var visible=Math.min(42,Math.ceil((end-x)/pixel));
          rig.drawImage(atlas,3,79,visible,8,x,baseY-8*pixel,visible*pixel,8*pixel);
        }
        rig.drawImage(atlas,67,77,10,10,trolleyX-5*pixel,baseY-2*pixel,10*pixel,10*pixel);
      }
      cable(trolleyX,baseY+5*pixel,hookX,hookY,'#314a49');
      rig.fillStyle='#253b40';
      var hx=Math.round(hookX/pixel)*pixel, hy=Math.round(hookY/pixel)*pixel;
      rig.fillRect(hx-pixel,hy-pixel,2*pixel,2*pixel);
      rig.fillRect(hx,hy+pixel,2*pixel,pixel);
      if(slings){
        var wid=unit*.42, centerX=roofX===undefined?hookX:roofX;
        var riseL=wid*Math.sin(angle||0);
        cable(hookX,hookY+pixel,centerX-wid,topY+riseL,'#455e60');
        cable(hookX,hookY+pixel,centerX+wid*.94,topY-riseL,'#455e60');
      }
    }
    function floorLabel(text,cx,cy,angle) {
      if(!text) return;
      var max=Math.max(64,Math.min(width*.60,unit*1.22));
      var fontSize=clamp(unit*.108,11,17);
      letters.save();letters.translate(clamp(cx,max/2+3,width-max/2-3),cy);letters.rotate(-angle);
      letters.font='700 '+Math.round(fontSize)+'px '+labelFont;
      var words=String(text).slice(0,64).split(/\s+/),lines=[''];
      for(var i=0;i<words.length;i++){
        var j=lines.length-1, line=lines[j] ? lines[j]+' '+words[i] : words[i];
        if(lines[j] && letters.measureText(line).width>max-12)lines.push(words[i]);else lines[j]=line;
      }
      var span=0;
      for(i=0;i<lines.length;i++)span=Math.max(span,letters.measureText(lines[i]).width);
      var labelWidth=Math.min(max,span+14),lineH=Math.ceil(fontSize)+1,labelH=lineH*lines.length+6;
      letters.fillStyle='#324957';letters.fillRect(-labelWidth/2,-labelH/2,labelWidth,labelH);
      letters.fillStyle='#ffdf98';letters.fillRect(-labelWidth/2+1,-labelH/2+1,labelWidth-2,1);
      letters.textAlign='center';letters.textBaseline='middle';letters.fillStyle='#fff6d5';
      for(i=0;i<lines.length;i++)letters.fillText(lines[i],0,(i-(lines.length-1)/2)*lineH+1,labelWidth-8);
      letters.restore();
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
      var targetUnit=screen ? Math.min(width*.26,height*.14) :
        physical ? Math.min(width*.25,height*.142) : Math.min(width*.25,height*.27);
      compactBlocks=targetUnit<32*pixel;
      var nativeUnit=(compactBlocks?24:32)*pixel;
      blockScale=Math.max(1,Math.floor(targetUnit/nativeUnit));
      unit=nativeUnit*blockScale;
      var floorY=floorHeight*cp*1.72;
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
      var loaded=atlas.naturalWidth+'/'+compact.naturalWidth;
      if(loaded!==cityReady){cityReady=loaded;dirty=true;townKey='';}
      if(!dirty && !dropState && !swinging && !rocking && !touring && Math.abs(targetCamera-cameraX)*unit<.2 && Math.abs(rise-cameraRise)<.2) return;
      dirty=false;
      cameraX+= (targetCamera-cameraX)*clamp(dt*9,0,1);
      cameraRise+=(rise-cameraRise)*clamp(dt*9,0,1);
      var center=sunset ? .64+.09*clamp((width-420)/190,0,1) : .5;
      sx=width*center-cameraX*unit;syy=ground+cameraRise;
      var townW=scenic.width,townH=scenic.height;
      var ascent=arcade?cameraRise/(unit*floorY):0;
      var foundation=physical?Math.round(syy/pixel):undefined;
      var horizontal=Math.round(cameraX*unit/pixel);
      var risePixels=Math.round(cameraRise/pixel);
      var key=townW+'/'+townH+'/'+risePixels+'/'+(ascent>=19?3:ascent>=15?2:ascent>=8?1:0)+'/'+foundation+'/'+sunset+'/'+horizontal;
      if(key!==townKey){
        paintTown(city,townW,townH,risePixels,sunset,ascent,foundation,horizontal);
        townKey=key;
      }
      fallback.clearRect(0,0,scenic.width*pixel,scenic.height*pixel);
      rig.clearRect(0,0,scenic.width*pixel,scenic.height*pixel);
      letters.clearRect(0,0,width,height);
      count=0;
      if(sunset)skyTraffic(reduced?0:now-start);
      if(renderer){
        camera.left=-sx/unit;camera.right=(townW*pixel-sx)/unit;
        camera.top=syy/unit;camera.bottom=(syy-townH*pixel)/unit;
        camera.updateProjectionMatrix();
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
        floor(x,y,color%4,kind,angle);
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
      [scenic,graphics,foreground,captions].forEach(function(el){if(el.parentNode===container)container.removeChild(el);});
    }
    if(document.fonts && document.fonts.load) {
      document.fonts.load('700 14px '+labelFont).then(function(){dirty=true;},function(){});
    }
    var canvasOnly=(settings && settings.canvasOnly) || /(?:[?&])renderer=canvas(?:[&#]|$)/.test(global.location.search) ||
      global.navigator.connection && global.navigator.connection.saveData;
    if(!canvasOnly && global.WebGLRenderingContext) {
      if(global.THREE)setupThree();else loadThree(setupThree);
    }
    resize();frameId=raf(tick);
    return {set:set,drop:drop,release:release,impact:impact,cancelDrop:cancelDrop,destroy:destroy};
  }
  global.BloxxScene={mount:mount,segment:segment};
}(window));
