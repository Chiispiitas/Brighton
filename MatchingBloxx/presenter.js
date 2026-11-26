(function (global) {
  'use strict';

  function mount(container) {
    var arcade=global.BloxxArcade, physics=global.BloxxPhysics, art=global.BloxxScene;
    var backdrop=document.createElement('canvas'), canvas=document.createElement('canvas');
    var labels=document.createElement('div'), bg=backdrop.getContext('2d'), ctx=canvas.getContext('2d');
    var lots=[], seats=Object.create(null), phase='lobby', matching=false, serverTime=0, received=0;
    var width=0,height=0,columns=0,rows=0,sky=0,rowHeight=0,lotWidth=0,raf=0,then=-Infinity,dirty=true;
    var reduced=global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var floorHeight=physics.floorHeight;
    backdrop.className='city-landscape';canvas.className='city-animation';labels.className='city-places';
    backdrop.setAttribute('aria-hidden','true');canvas.setAttribute('aria-hidden','true');
    container.appendChild(backdrop);container.appendChild(canvas);container.appendChild(labels);
    art.loadModels(function(){dirty=true;});

    function ground(row) { return Math.round(sky+(row+1)*rowHeight-32); }

    function layout() {
      var w=container.clientWidth;
      if(!w)return;
      var count=Math.max(1,lots.length), cols=Math.min(count,Math.min(9,Math.max(2,Math.floor(w/(w<560?116:110)))));
      var rowCount=Math.ceil(count/cols);
      var viewport=Math.round(global.innerHeight-container.getBoundingClientRect().top-global.pageYOffset-16);
      var h=Math.max(370,viewport,rowCount*101+76);
      if(w===width && h===height && cols===columns && rowCount===rows)return;
      width=w;height=h;columns=cols;rows=rowCount;
      sky=Math.round(Math.min(h*.30,rows===1?170:90));
      rowHeight=(h-sky)/rows;lotWidth=w/columns;
      container.style.height=h+'px';
      backdrop.width=canvas.width=w;backdrop.height=canvas.height=h;
      global.BloxxScenery.paint(bg,w,Math.ceil(sky*1.19),0,true,0,undefined,1);
      bg.fillStyle='#8e8978';bg.fillRect(0,sky,w,h-sky);
      for(var row=0;row<rows;row++){
        var base=ground(row), north=Math.round(sky+row*rowHeight);
        bg.fillStyle=row%2?'#b9ab86':'#c0b38e';bg.fillRect(0,north+2,w,base-north);
        bg.fillStyle='#a29a80';bg.fillRect(0,base,w,6);
        bg.fillStyle='#6e7c7e';bg.fillRect(0,base+6,w,26);
        bg.fillStyle='#8b9690';bg.fillRect(0,base+24,w,2);
        bg.fillStyle='#b5bca2';
        for(var dash=10;dash<w;dash+=27)bg.fillRect(dash,base+29,12,1);
        bg.fillStyle='#ded2ab';bg.fillRect(0,base+4,w,2);
        for(var c=0;c<columns;c++){
          var x=Math.round(c*lotWidth);
          bg.fillStyle='#a49e80';bg.fillRect(x,north+5,2,base-north-7);
          var island=Math.round(lotWidth*.26), left=Math.round(x+(lotWidth-island)/2);
          bg.fillStyle='#b1a588';bg.fillRect(left,base-10,island,9);
          bg.fillStyle='#d2c6a3';bg.fillRect(left,base-10,island,1);
          bg.fillStyle='#8a9674';bg.fillRect(x+4,base-15,10,9);
          bg.fillStyle='#aeb38c';bg.fillRect(x+6,base-17,6,6);
        }
      }
      dirty=true;
    }

    function positionLabels() {
      lots.forEach(function(seat,index) {
        var row=Math.floor(index/columns), col=index%columns;
        seat.label.style.left=Math.round(col*lotWidth+3)+'px';
        seat.label.style.top=(ground(row)+7)+'px';
        seat.label.style.width=Math.max(0,Math.round((col+1)*lotWidth)-Math.round(col*lotWidth)-6)+'px';
      });
    }

    function resize(){layout();positionLabels();}
    global.addEventListener('resize',resize);
    var observer=global.ResizeObserver && new global.ResizeObserver(resize);
    if(observer)observer.observe(container);

    function update(snapshot) {
      phase=snapshot.phase;
      matching=snapshot.arcade && snapshot.arcade.mode==='match';
      received=global.performance.now();
      serverTime=snapshot.city?snapshot.city.time:Date.now();
      var byId=Object.create(null), active=Object.create(null);
      (snapshot.city?snapshot.city.lots:[]).forEach(function(lot){byId[lot.id]=lot;});
      lots=snapshot.players.slice().sort(function(a,b){return Number(a.id.slice(1))-Number(b.id.slice(1));}).map(function(player) {
        var data=byId[player.id] || {floors:phase==='lobby'?[]:Array(player.floors).fill(0),drops:[]};
        var seat=seats[player.id];
        if(!seat){
          var label=document.createElement('div'), name=document.createElement('strong'), score=document.createElement('span');
          label.className='city-place';name.className='city-name';score.className='city-score';
          label.appendChild(name);label.appendChild(score);labels.appendChild(label);
          seat=seats[player.id]={label:label,name:name,score:score,seen:player.completed,queue:[],drop:null};
        }
        active[player.id]=true;
        if(!reduced) data.drops.forEach(function(drop){if(drop.turn>seat.seen)seat.queue.push(drop);});
        if(seat.queue.length>6)seat.queue.splice(0,seat.queue.length-6);
        seat.seen=Math.max(seat.seen,player.completed);
        seat.state=data;
        seat.name.textContent=player.name;
        seat.label.title=player.name;
        seat.score.textContent=phase==='lobby'?'':(phase==='finished'?'#'+player.rank+' · ':'')+player.score+' pts';
        return seat;
      });
      Object.keys(seats).forEach(function(id){if(!active[id]){seats[id].label.remove();delete seats[id];}});
      resize();dirty=true;
    }

    function startDrop(seat,time) {
      if(seat.drop || !seat.queue.length)return;
      var event=seat.queue.shift();
      seat.drop={event:event,start:time,path:arcade.flight(event.motion,event.elapsed,event.before,event.rock)};
    }

    function rope(x,y,toX,toY) {
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(toX,toY);ctx.stroke();
    }
    function crane(x,pivot,hookX,hookY,blockX,blockTop,attached,unit,left) {
      var beam=Math.max(3,Math.min(14,unit*.25)), start=Math.max(left,x-unit*1.68);
      var span=x-start+beam*.95, panels=Math.max(1,Math.round(span/(beam*1.35)));
      art.paintModel(ctx,start,pivot-beam*.18,span/panels,beam,panels,'boom',0);
      art.paintModel(ctx,x,pivot,beam,beam,0,'trolley',0);
      art.paintModel(ctx,hookX,hookY,beam,beam,0,'hook',0);
      ctx.strokeStyle='#42504b';ctx.lineWidth=Math.max(1,unit*.018);
      rope(x,pivot,hookX,hookY);
      if(attached){
        rope(hookX,hookY+beam*.16,blockX-unit*.41,blockTop);
        rope(hookX,hookY+beam*.16,blockX+unit*.41,blockTop);
      }
    }

    function drawLot(seat,index,time,unit) {
      startDrop(seat,time);
      var replay=seat.drop, elapsed=replay?(time-replay.start)/1000:0;
      if(replay && elapsed>replay.path.duration+(replay.event.fallen?(replay.event.parts?1.26:.78):.32)){
        seat.drop=null;
        startDrop(seat,time);
        replay=seat.drop;elapsed=0;
      }
      var event=replay && replay.event, data=seat.state;
      var afterContact=replay && elapsed>=replay.path.duration;
      var floors=event?event.before:data.floors;
      var row=Math.floor(index/columns), col=index%columns, left=col*lotWidth;
      var center=left+lotWidth/2, base=ground(row), top=(floors[floors.length-1]||0);
      var motion=event?event.motion:data.motion;
      var age=motion?Math.max(0,serverTime-(motion.startedAt||serverTime)+time-received):0;
      var layout=arcade.towerPose(motion,floors,event?event.rock:data.rock,event?event.elapsed+elapsed*1000:age);
      var joints=Array.isArray(layout)?layout:null;
      var angle=joints?0:layout;
      ctx.save();ctx.beginPath();ctx.rect(Math.floor(left)+2,Math.round(sky+row*rowHeight),Math.floor(lotWidth)-4,base-Math.round(sky+row*rowHeight)+4);ctx.clip();
      art.paintModel(ctx,center,base,unit,unit,0,true,0);
      if(phase!=='lobby'){
        art.paintModel(ctx,center,base,unit,unit,0,'entry',0);
        floors.forEach(function(offset,i) {
          var y=(i+1)*floorHeight+(joints?joints[i].lift:0), x=joints?joints[i].x:offset+physics.shift(y,angle), tilt=joints?joints[i].angle:-angle;
          if(afterContact && event.fallen && i>=event.after.length){
            var fallenIndex=i-event.after.length;
            var part=event.parts && event.parts[fallenIndex];
            var debris=part ? physics.javaFall(elapsed-replay.path.duration,part) :
              physics.debris(elapsed-replay.path.duration,fallenIndex,event.direction||1);
            x+=debris.x;y+=debris.y;tilt+=debris.angle;
          }
          art.paintModel(ctx,center+x*unit,base-y*unit,unit,unit,(i+1)%4,'cube',tilt);
        });
      }
      if(motion){
        var sway=arcade.pose(motion,event?event.elapsed:reduced?0:age);
        var table=(floors.length+1)*floorHeight;
        var part=sway;
        if(replay){
          part=replay.path.at(elapsed);
          if(afterContact){
            if(event.after.length>floors.length)part={x:event.after[event.after.length-1]-top,height:0,angle:0};
            else if(replay.path.rejected)part=replay.path.rejected(elapsed-replay.path.duration,event.bump);
          }
        }
        var blockX=center+(top+part.x)*unit, blockY=base-(table+part.height)*unit;
        var pivotY=base-(table+(sway.pivotHeight||3.35))*unit;
        var hookX=center+(top+(sway.hookX===undefined?sway.x:sway.hookX))*unit;
        var hookY=base-(table+(sway.hookHeight||sway.height+floorHeight+.2))*unit;
        crane(center+top*unit,pivotY,hookX,hookY,blockX,blockY-floorHeight*unit,!event && !matching,unit,left+3);
        var color=event?event.color%4:(floors.length+1)%4;
        if(event || !matching)art.paintModel(ctx,blockX,blockY,unit,unit,color,'cube',part.angle);
      }else if(phase==='finished' && floors.length) {
        art.paintModel(ctx,center+top*unit,base-(floors.length+1)*floorHeight*unit,unit,unit,0,'roof',0);
      }
      ctx.restore();
    }

    function frame(time) {
      raf=global.requestAnimationFrame(frame);
      if(document.hidden || !width || time-then<50)return;
      if(!dirty && (phase==='lobby' || reduced || (phase==='finished' && !lots.some(function(seat){return seat.drop || seat.queue.length;}))))return;
      dirty=false;then=time;
      ctx.clearRect(0,0,width,height);
      var highest=lots.reduce(function(max,seat){
        if(seat.drop)max=Math.max(max,seat.drop.event.before.length);
        return seat.queue.reduce(function(peak,event){return Math.max(peak,event.before.length);},Math.max(max,seat.state.floors.length));
      },1);
      var unit=Math.min(lotWidth*.25,(rowHeight-38)/(highest*floorHeight+5));
      for(var i=0;i<lots.length;i++)drawLot(lots[i],i,time,unit);
    }
    raf=global.requestAnimationFrame(frame);
    return {update:update,destroy:function(){
      global.cancelAnimationFrame(raf);
      global.removeEventListener('resize',resize);
      if(observer)observer.disconnect();
      container.textContent='';
    }};
  }
  global.BloxxPresenter={mount:mount};
}(window));
