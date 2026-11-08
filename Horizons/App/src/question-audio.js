// One recording per question occurrence. Keep its player across selection renders.
export function createQuestionAudio({createAudio=src=>new Audio(src),beforePlay=()=>{},isHidden=()=>document.hidden}={}){
 let owner,index,source,player,attempted=false;
 function stop(){player?.pause();}
 function reset(){stop();owner=null;index=null;source=null;player=null;attempted=false;}
 function play(){
  if(!player||isHidden())return;
  beforePlay();
  // A denied autoplay leaves the ordinary replay control available, without a toast loop.
  try{return Promise.resolve(player.play()).catch(()=>{});}catch{return Promise.resolve();}
 }
 function sync({round,questionIndex,src,element,checked=false,preview=false}){
  if(!round||!src){reset();return;}
  if(owner!==round||index!==questionIndex||source!==src){
   reset();owner=round;index=questionIndex;source=src;
   player=element||createAudio(src);
   player.addEventListener?.('play',beforePlay);
  }else if(element&&element!==player){
   element.replaceWith(player);
  }
  if(checked){stop();return;}
  if(!attempted&&!preview&&!isHidden()){attempted=true;play();}
 }
 function replay(){if(player){player.currentTime=0;return play();}}
 return {sync,stop,reset,replay};
}
