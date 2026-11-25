export function createBoard(canvas, onChange, canDraw) {
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  const W=canvas.width,H=canvas.height;
  let pointer=null, previous=null, strokeId=null, lastBoard=[];
  const settings={tool:'brush',color:'#182630',size:7,pressure:false};
  const scale=(x,y)=>[Math.round(x*W/1000),Math.round(y*H/1000)];
  function fill(x,y,color) {
    x=Math.min(W-1,x);y=Math.min(H-1,y);
    const frame=ctx.getImageData(0,0,W,H), pixels=new Uint32Array(frame.data.buffer);
    const start=y*W+x, original=pixels[start];
    const rgb=parseInt(color.slice(1),16);
    const next=(0xff000000|((rgb&255)<<16)|(rgb&0xff00)|(rgb>>16))>>>0;
    if(original===next)return;
    const queue=new Int32Array(pixels.length);
    let read=0,write=0;
    function visit(index){if(pixels[index]===original){pixels[index]=next;queue[write++]=index;}}
    visit(start);
    while(read<write){
      const i=queue[read++];
      if(i%W)visit(i-1);
      if(i%W<W-1)visit(i+1);
      if(i>=W)visit(i-W);
      if(i+W<pixels.length)visit(i+W);
    }
    ctx.putImageData(frame,0,0);
  }
  function paint(op){
    const [x,y]=scale(op.points[0],op.points[1]);
    if(op.kind==='fill'){fill(x,y,op.color);return;}
    ctx.strokeStyle=ctx.fillStyle=op.color;
    ctx.lineWidth=op.width;ctx.lineCap='round';ctx.lineJoin='round';
    ctx.beginPath();ctx.moveTo(x,y);
    if(op.points.length===2){ctx.arc(x,y,op.width/2,0,Math.PI*2);ctx.fill();return;}
    for(let i=2;i<op.points.length;i+=2)ctx.lineTo(...scale(op.points[i],op.points[i+1]));
    ctx.stroke();
  }
  function reset(){
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,W,H);
  }
  function show(board,local=[]){
    const isAppend=local.length===0 && board.length>=lastBoard.length && lastBoard.every((op,i)=>op.id===board[i]?.id&&op.points.length===board[i]?.points.length);
    if(!isAppend)reset();
    board.slice(isAppend?lastBoard.length:0).forEach(paint);
    if(local.length){
      for(const op of local){
        if(op.kind==='clear'){reset();continue;}
        if(op.kind==='undo')continue;
        paint(op);
      }
      lastBoard=[];
    }else lastBoard=board;
  }
  function point(event) {
    const rect=canvas.getBoundingClientRect();
    const clamp=n=>Math.min(1000,Math.max(0,Math.round(n*1000)));
    return [clamp((event.clientX-rect.left)/rect.width),clamp((event.clientY-rect.top)/rect.height)];
  }
  function makeOp(points,event,kind='stroke'){
    const size=settings.pressure&&event.pointerType==='pen'?Math.round(settings.size*Math.max(.3,event.pressure)):settings.size;
    return {kind,id:strokeId,points,width:Math.max(2,size),color:settings.tool==='eraser'?'#ffffff':settings.color};
  }
  function emit(op){
    paint(op);onChange(op);
  }
  canvas.addEventListener('pointerdown',event=>{
    if(!canDraw()||event.button!==0||pointer!==null)return;
    event.preventDefault();
    const at=point(event);
    strokeId=crypto.randomUUID().replaceAll('-','');
    if(settings.tool==='fill'){emit(makeOp(at,event,'fill'));return;}
    pointer=event.pointerId;previous=at;
    canvas.setPointerCapture(pointer);
    emit(makeOp(at,event));
  });
  canvas.addEventListener('pointermove',event=>{
    if(pointer!==event.pointerId||!canDraw())return;
    const next=point(event);
    if(previous[0]===next[0]&&previous[1]===next[1])return;
    emit(makeOp([...previous,...next],event));
    previous=next;
  });
  function release(event){if(pointer===event.pointerId){pointer=null;previous=null;}}
  canvas.addEventListener('pointerup',release);
  canvas.addEventListener('pointercancel',release);
  canvas.addEventListener('lostpointercapture',release);
  reset();
  return {settings,show,clearPreview(){lastBoard=[];reset();}};
}
