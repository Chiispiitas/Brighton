// Local ElevenLabs cues only. No credentials, network generation, or learner data.
const preference='horizons-feedback-sounds';
let enabled=true;
try{enabled=localStorage.getItem(preference)!=='off';}catch{}
let cues;
let completionContext,completionBuffers,completionResume,completionSource,playbackGeneration=0;
function sounds(){
 return cues??=Object.fromEntries(['correct','wrong'].map(name=>{
  const audio=new Audio(new URL(`../assets/audio/feedback-v1/${name}.mp3`,import.meta.url).href);
  // Match perceived levels while keeping the native ElevenLabs files untouched.
  audio.preload='auto';audio.volume=name==='correct'?.45:.38;return[name,audio];
 }));
}
export function feedbackSoundsEnabled(){return enabled;}
export function stopFeedbackSound(){
 playbackGeneration++;
 for(const audio of Object.values(cues||{})){audio.pause();audio.currentTime=0;}
 if(completionSource){try{completionSource.stop();}catch{}completionSource=null;}
}
export function setFeedbackSoundsEnabled(value){enabled=Boolean(value);try{localStorage.setItem(preference,enabled?'on':'off');}catch{}if(!enabled)stopFeedbackSound();return enabled;}
export function playFeedbackSound(correct){
 stopFeedbackSound();if(!enabled||document.hidden)return;
 const audio=sounds()[correct?'correct':'wrong'];
 // Called directly by the answer-check gesture; failures never block feedback.
 audio.play().catch(()=>{});
}
// Resume from the Results/retry click, before awaiting the save. An unlocked
// context can then play the confirmed reward without another user gesture.
export function prepareCompletionSound(){
 if(!enabled||document.hidden)return;
 try{
  const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return;
  completionContext??=new Context();
  completionResume=completionContext.resume().catch(()=>{});
  completionBuffers??=Promise.all(['lesson-complete','island-mastered','fire-streak','achievement','wood','stone','iron','gold','diamond','obsidian','masters'].map(async name=>{
   const progression=['achievement','wood','stone','iron','gold','diamond','obsidian','masters'].includes(name);
   try{const response=await fetch(new URL(progression?`../assets/audio/progression-v1/${name}.mp3`:name==='fire-streak'?'../assets/audio/streak-v1/fire-streak.mp3':`../assets/audio/milestones-v1/${name}.mp3`,import.meta.url));
   if(!response.ok)return[name,null];
   return[name,await completionContext.decodeAudioData(await response.arrayBuffer())];}catch{return[name,null];}
  })).then(entries=>{const buffers=Object.fromEntries(entries);if(Object.values(buffers).some(value=>!value))completionBuffers=null;return buffers;}).catch(()=>{completionBuffers=null;return null;});
 }catch{/* Sound must never block saving or the results screen. */}
}
export function playCompletionSound(mastered=false,streak=false){return playNamedCompletion(streak?'fire-streak':mastered?'island-mastered':'lesson-complete',.45);}
export function playProgressionSound(name){if(!['achievement','wood','stone','iron','gold','diamond','obsidian','masters'].includes(name))return;return playNamedCompletion(name,({achievement:.8,wood:.5,stone:.9,iron:.6,gold:.9,diamond:.45,obsidian:.55,masters:.45})[name]);}
function playNamedCompletion(name,volume){
 stopFeedbackSound();if(!enabled||document.hidden)return;
 const generation=playbackGeneration;
 Promise.all([completionBuffers,completionResume]).then(([buffers])=>{
  if(!buffers||generation!==playbackGeneration||!enabled||document.hidden||completionContext?.state!=='running')return;
  const source=completionContext.createBufferSource(),gain=completionContext.createGain();
  source.buffer=buffers[name];if(!source.buffer)return;
  gain.gain.value=volume;source.connect(gain);gain.connect(completionContext.destination);
  source.onended=()=>{source.disconnect();gain.disconnect();if(completionSource===source)completionSource=null;};
  try{source.start();completionSource=source;}catch{source.disconnect();gain.disconnect();}
 }).catch(()=>{});
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopFeedbackSound();});
