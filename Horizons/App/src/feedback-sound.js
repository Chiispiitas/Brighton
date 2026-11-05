// Local ElevenLabs cues only. No credentials, network generation, or learner data.
const preference='horizons-feedback-sounds';
let enabled=true;
try{enabled=localStorage.getItem(preference)!=='off';}catch{}
let cues;
function sounds(){
 return cues??=Object.fromEntries(['correct','wrong'].map(name=>{
  const audio=new Audio(new URL(`../assets/audio/feedback-v1/${name}.mp3`,import.meta.url).href);
  // Match perceived levels while keeping the native ElevenLabs files untouched.
  audio.preload='auto';audio.volume=name==='correct'?.45:.38;return[name,audio];
 }));
}
export function feedbackSoundsEnabled(){return enabled;}
export function stopFeedbackSound(){for(const audio of Object.values(cues||{})){audio.pause();audio.currentTime=0;}}
export function setFeedbackSoundsEnabled(value){enabled=Boolean(value);try{localStorage.setItem(preference,enabled?'on':'off');}catch{}if(!enabled)stopFeedbackSound();return enabled;}
export function playFeedbackSound(correct){
 stopFeedbackSound();if(!enabled||document.hidden)return;
 const audio=sounds()[correct?'correct':'wrong'];
 // Called directly by the answer-check gesture; failures never block feedback.
 audio.play().catch(()=>{});
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopFeedbackSound();});
