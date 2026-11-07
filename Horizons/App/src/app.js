import {socialProfileMarkup,personCard} from './social-profile.js';
import {overtakingEvent,nextCompletionStage} from '../content/completion-flow.mjs';
import {leaderboardMarkup,dismissRank,overtakingMarkup} from './leaderboard.js';
import {audioKey} from './answer-audio.js';
import {applyClientContent} from '../content/admin-content.mjs';
import {STREAK_DURATION,shouldShowStreakCelebration,markStreakCelebrationSeen,streakCelebrationMarkup,mountStreakCelebration} from './streak-celebration.js?v=streakidle1';
import {presentQuestion} from './exercise-presentation.js?v=practiceretry1';
import {pathNodeComplete,pathNodeUnlocked,resolvePathCursor} from './path-progress.js?v=pathprogress1';
import {playFeedbackSound,stopFeedbackSound,feedbackSoundsEnabled,setFeedbackSoundsEnabled,prepareCompletionSound,playCompletionSound,playProgressionSound} from './feedback-sound.js?v=overtakesound1';
import {unitRoutes,adjacentUnit,updateBoundary} from './unit-navigation.js?v=areas1';
import {mountPropMotion} from './prop-motion.js?v=coffee2';
import {mountOverworld} from './overworld-motion.js?v=props1';
import {selectIslandQuestions,masteryTargets} from '../content/island-mastery.mjs';
import {enhanceShell,openPathBubble,closePathBubble,avatarFeedback} from './studio-ui.js?v=screenfit1';
import {captureUI,enhanceMotion,markControls,animateUI} from './ui-motion.js?v=tileflip1';
import {lessonArt} from './lesson-art.js?v=colors1';
import {api, APIError, getSessionToken, forgetSession} from './api-client.js';
import {loadArt, normalizeAvatar, artManifest, characterMarkup, avatarMarkup, avatarOptions, defaultAvatar, rasterMarkup, assetURL, refreshArtwork, disposeArtwork, sceneMarkup, wordArt} from './art.js?v=login1';
import {course, lessons, vocabulary, chunks, grammarSets, activities, games, wordById, chunkById, lessonById, pathNodes, pathNodeById} from '../content/unit1.mjs';
import {buildQuiz, getActivityQuestions, getAudioFallbackQuestion, isAlphabetQuestion, getWordsForChunks, getMatchingPairs, checkAnswer} from '../content/engine.mjs';

const app = document.getElementById('app');
const dialog = document.getElementById('app-dialog');
const toastBox = document.getElementById('toast');
const state = {session:null,route:'learn',bookId:null,active:null,selected:new Set(),selectedGrammar:new Set(),search:'',busy:false,avatarDraft:null,profileDraft:null,saveError:null,roundLength:8,profileEditing:false,social:null,socialError:null,socialTab:'friends',personTarget:null,personData:null,personError:null,leaderboard:null,boardError:null,boardBusy:false,audioManifest:{},answerAudio:{},pathCursorId:null,bankOpen:new Set()};
let toastTimer;
let wordPlayer;
let disposeOverworld;
let disposePropMotion;
let streakCelebrationController;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons = {
 lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
 crown:'<path d="m3 6 4 4 5-7 5 7 4-4-2 13H5Z"/><path d="M5 16h14"/>',
 home:'<path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/>',
 practice:'<path d="M5 3h14v18H5Z"/><path d="M8 7h8M8 11h6M8 15h4"/>',
 progress:'<path d="M4 19V9m8 10V3m8 16v-6M2 21h20"/>',
 profile:'<circle cx="12" cy="7" r="4"/><path d="M4 21v-3a8 8 0 0 1 16 0v3"/>',
 book:'<path d="M12 5c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1Z"/><path d="M12 5v15"/>',
 arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
 close:'<path d="m6 6 12 12M6 18 18 6"/>',
 check:'<path d="m5 12 4 4L20 5"/>',
 star:'<path d="m12 2 3 6.5 7 1-5 5 1 7-6-3.5L6 21l1-6.5-5-5 7-1Z"/>',
 headphones:'<path d="M4 14v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="12" width="5" height="9" rx="2"/><rect x="16" y="12" width="5" height="9" rx="2"/>',
 sound:'<path d="m3 9 4 0 5-5v16l-5-5H3Z"/><path d="M16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
 plus:'<path d="M12 4v16M4 12h16"/>',
 repeat:'<path d="M20 7H8a5 5 0 0 0 0 10h12M17 4l3 3-3 3m-10 4-3 3 3 3"/>',
 exit:'<path d="M10 4H4v16h6m5-12 5 4-5 4m-5-4h10"/>',
 chevron:'<path d="m8 10 4 4 4-4"/>',
 spark:'<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z"/>',
 search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
 calendar:'<path d="M4 5h16v16H4Zm3-3v6m10-6v6M4 10h16"/>'
};
const icon = name => {const mapping={practice:'games',progress:'trophy',spark:'flame',plus:'addBook',repeat:'compass'};const art=artManifest().icons?.[mapping[name] || name];return art?`<span class="generated-icon" aria-hidden="true">${rasterMarkup(art,'icon','')}</span>`:`<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.spark}</svg>`;};
const asArray = value => Array.isArray(value) ? value : Object.values(value || {});
const allLessons = asArray(lessons), allChunks = asArray(chunks), allActivities = asArray(activities), allGrammar = asArray(grammarSets);
const practiceTopics=pathNodes.filter(node=>node.kind==='topic');
const practiceChunkIds=[...new Set(practiceTopics.flatMap(topic=>topic.chunkIds||[]))];
const practiceGrammarIds=[...new Set(practiceTopics.flatMap(topic=>topic.grammarSetIds||[]))];
const allPracticeSelected=()=>practiceChunkIds.every(id=>state.selected.has(id))&&practiceGrammarIds.every(id=>state.selectedGrammar.has(id));
const topicSelected=topic=>topic.type==='grammar'?topic.grammarSetIds.every(id=>state.selectedGrammar.has(id)):topic.chunkIds.every(id=>state.selected.has(id));
const getWord = id => wordById instanceof Map ? wordById.get(id) : wordById[id];
const getChunk = id => chunkById instanceof Map ? chunkById.get(id) : chunkById[id];
const getLesson = id => lessonById instanceof Map ? lessonById.get(id) : lessonById[id];
const profile = () => state.session?.profile || {};
const progress = () => state.session?.progress || {};
const name = () => profile().displayName || profile().name || 'Learner';
const xp = () => Number(progress().xp ?? progress().totalXp ?? progress().totalXP ?? 0);
const streak = () => Number(progress().streak ?? progress().currentStreak ?? 0);
const bookList = () => asArray(state.session?.books);
const activeBook = () => bookList().find(book => String(book.id || book.bookId) === String(state.bookId)) || bookList()[0];
const completed = () => new Set((progress().completedActivityIds || progress().completedActivities || []).filter(id=>allActivities.some(activity=>activity.id===id)));
let contentRevision='base';
function setSession(value) {
  if (!value) return;
  const previousProfileId=profile().id;
  if(value.profile&&value.profile.id!==previousProfileId){state.leaderboard=null;state.boardError=null;state.social=null;state.personData=null;state.profileEditing=false;}
  if(value.contentSnapshot&&(!state.active||state.active.kind==='result')){applyClientContent(value.contentSnapshot.patches);contentRevision=value.contentSnapshot.revision;}
  if (value.profile || value.books || value.progress) state.session = {...(state.session || {}),...value};
  else if (value.session) state.session = value.session;
  if(previousProfileId!==profile().id)state.pathCursorId=null;
  if (!state.bookId) state.bookId = profile().defaultBookId || profile().lastBookId || bookList()[0]?.id || bookList()[0]?.bookId;
}
function notify(message, tone = '') {
  clearTimeout(toastTimer); toastBox.textContent = message; toastBox.className = `toast visible ${tone}`;
  toastTimer = setTimeout(() => {toastBox.className = 'toast';}, 4500);
}
function on(type, selector, handler, element = app) {
  element.addEventListener(type, event => {const target = event.target.closest(selector);if (target && element.contains(target)) handler(event,target);});
}
function route(target) {
  if(target==='progress')target='learn';
  stopAudio();
  if (state.active && target !== 'activity') state.active = null;
  state.route = target; location.hash = target; render(); window.scrollTo({top:0,behavior:'instant'});
}
function stopAudio(){stopFeedbackSound();wordPlayer?.pause();if('speechSynthesis'in window)speechSynthesis.cancel();}
function formatDate(value) {
  const date = new Date(value); return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en',{day:'numeric',month:'short',year:'numeric'});
}
function bookTitle(book) {return book?.title || book?.name || `Horizons ${book?.level || 'A1'}`;}
function isA1Book(book = activeBook()) {return !book || !book.level || String(book.level).toUpperCase() === 'A1';}
function hasBookAccess(book = activeBook()) {if(!book)return false;const status=String(book.status || 'active').toLowerCase();return status==='active'&&(!book.expiresAt||new Date(book.expiresAt).getTime()>Date.now());}
function accessPage(){const book=activeBook();return `<section class="coming-book"><span class="eyebrow">${esc(bookTitle(book))}</span><h1>Book access</h1>${characterMarkup('pico','coming-pico')}<p>${book?.status==='revoked'?'This book code is no longer active.':'Your access has expired.'} Add a new book code to keep practicing with your profile.</p><button class="primary-button" data-action="books">Add a book code ${icon('book')}</button><button class="text-button" data-route="profile">My profile ${icon('arrow')}</button></section>`;}
function requirePracticeAccess(){if(hasBookAccess()&&isA1Book())return true;state.active=null;state.route='learn';render();notify(hasBookAccess()?'Choose Horizons A1 for these activities.':'Add a new book code to keep practicing.');return false;}
function masteryCount() {return Object.values(progress().wordStats || {}).filter(stat => stat.mastered).length;}
function practisedCount() {return Object.keys(progress().wordStats || {}).length;}
function rewardItems(){return avatarOptions().find(group=>group.id==='badge')?.options.filter(option=>Number(option.unlockXp)>0) || [];}
function setupAvatarChoices(){const groups=avatarOptions();for(const button of app.querySelectorAll('[data-avatar-group]')){const group=groups.find(g=>g.id===button.dataset.avatarGroup),option=group?.options.find(o=>o.id===button.dataset.avatarValue);if(!option)continue;const locked=Number(option.unlockXp)>xp();button.disabled=locked;button.classList.toggle('reward-locked',locked);if(option.src||option.asset){button.classList.add('illustrated-avatar-option');button.innerHTML=`${['skin','body'].includes(group.id)?avatarMarkup({...defaultAvatar(),...(state.avatarDraft||profile().avatar),[group.id]:option.id},'avatar-option-art',group.id==='body'?'Avatar base preview':'Skin tone preview'):rasterMarkup(option.asset || option,'avatar-option-art','')}<span>${esc(option.label || option.id)}</span>${locked?`<small>${option.unlockXp} XP</small>`:''}`;}else if(locked){const note=document.createElement('small');note.textContent=option.unlockXp+' XP';button.append(note);}}}
function shell(body,current=state.route){
 return `<div class="app-shell"><aside class="sidebar"><a class="brand" href="#learn" data-route="learn"><span class="wordmark">HORIZONS</span></a><nav class="desktop-nav" aria-label="Main navigation">${navItems(current,true)}</nav><button class="sidebar-person" data-route="profile">${avatarMarkup(profile().avatar,'avatar-small',name())}<span><strong>${esc(name())}</strong><small>My profile</small></span></button></aside><div class="workspace"><header class="topbar"><button class="book-switch" data-action="books">${icon('book')}<span>${esc(bookTitle(activeBook()))}</span>${icon('chevron')}</button></header><main id="main-content" class="main-content">${body}</main></div><nav class="mobile-nav" aria-label="Main navigation">${navItems(current)}</nav></div>`;
}
function navItems(current,sidebar=false){return [['learn','home','Learn'],['practice','practice','Practice'],['leaderboard','star','Rank'],['profile','profile','Profile']].filter(([id])=>!sidebar||id!=='profile').map(([id,i,title])=>`<button data-route="${id}" class="nav-item ${id===current?'active':''}" ${id===current?'aria-current="page"':''}>${id==='profile'?avatarMarkup(profile().avatar,'nav-profile-avatar',name()):icon(i)}<span>${title}</span></button>`).join('');}
function welcome(){
 return `<main class="welcome"><div class="welcome-brand"><span class="wordmark">HORIZONS</span><span class="brighton-label">BY BRIGHTON</span></div><div class="welcome-layout"><section class="welcome-story">${sceneMarkup('town','welcome-town')}<div class="welcome-companions">${characterMarkup('pico','welcome-pico')}${characterMarkup('mina','welcome-mina')}${characterMarkup('alex','welcome-alex')}${characterMarkup('jo','welcome-jo')}</div></section><section class="redeem-panel"><h2>Open your book</h2><form id="redeem-form" class="code-form"><label for="book-code">Book code</label><input id="book-code" name="code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Book code" required maxlength="80"><p id="code-error" class="form-error" role="alert"></p><button class="primary-button full-width" type="submit">Open ${icon('arrow')}</button></form><div class="demo-codes"><button type="button" data-action="demo-codes">Example codes</button></div></section></div></main>`;
}
function nodeIsComplete(node){return pathNodeComplete(node,progress());}
function currentPathNode(){return resolvePathCursor(pathNodes,progress(),state.pathCursorId);}
function rememberPathCursor(id){
 const node=pathNodeById[id];if(!node||!pathNodeUnlocked(node,pathNodes,progress()))return;
 state.pathCursorId=id;
 for(const button of app.querySelectorAll('.path-stop[data-path-node]')){
  const current=button.dataset.pathNode===id;button.classList.toggle('current-path',current);
  if(current)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');
 }
}
function home(){
 if(!hasBookAccess())return accessPage();
 if(!isA1Book())return `<section class="coming-book"><h1>${esc(bookTitle(activeBook()))}</h1>${characterMarkup('pico','coming-pico')}<p>Activities for this book are not available yet.</p><button class="primary-button" data-action="books">Choose a book ${icon('book')}</button></section>`;
 return `<section class="learn-hero compact-hero"><div class="hero-copy"><span class="eyebrow">HORIZONS A1</span><h1>Unit 1<br>New friends</h1></div>${characterMarkup('pico','hero-pico unit1-banner-pico')}</section><section class="learning-path" aria-label="Unit 1 learning path"><div class="horizontal-path-scroll overworld-map" role="region" aria-label="New Friends Town overworld" tabindex="0"><div class="horizontal-path-track">${allLessons.map((lesson,index)=>lessonPath(lesson,index)).join('')}</div></div><div class="path-scroll-toolbar"><div class="path-scroll-buttons"><button class="round-button path-pan-prev" data-path-pan="-1" aria-label="Scroll path left">${icon('arrow')}</button><button class="round-button" data-path-pan="1" aria-label="Scroll path right">${icon('arrow')}</button></div></div></section>`;
}
function lessonPath(lesson,index){
 const nodes=pathNodes.filter(node=>node.lessonId===lesson.id);
 const place=['Café','Market','Travel pavilion','Town hall'][index];
 const currentId=currentPathNode()?.id;
 const stops=nodes.map((node,i)=>{
  const t=i/Math.max(1,nodes.length-1),y=50-Math.sin(t*2*Math.PI)*Math.sin(t*Math.PI)*18.75,mastered=!!progress().islands?.[node.id]?.mastered,done=nodeIsComplete(node),locked=!pathNodeUnlocked(node,pathNodes,progress()),current=currentId===node.id,landmark=i===nodes.length-1,symbol=node.type==='listening'?'headphones':node.type==='reading'?'book':'star';
  const stateIcon=locked?'lock':mastered?'crown':done?'check':symbol;
  const stateMarkup=stateIcon==='crown'?icon(stateIcon):`<svg class="icon" data-path-icon="${stateIcon}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[stateIcon]}</svg>`;
  return `<button class="path-stop path-cell path-symbol-${symbol} ${landmark?'landmark-stop':''} ${node.kind==='game'?'game-stop':''} ${done?'completed':''} ${mastered?'mastered':''} ${locked?'locked':''} ${current?'current-path':''}" data-path-node="${esc(node.id)}" data-step="${i+1}" style="--path-t:${t};--path-y:${y}%" aria-label="${esc(lesson.id+' · '+(landmark?place+' · ':'')+node.title+(locked?' · Locked':mastered?' · Mastered':done?' · Completed':''))}" ${locked?`disabled aria-disabled="true" title="Complete the earlier islands in ${esc(lesson.id)} first."`:'aria-haspopup="dialog"'} ${current?'aria-current="step"':''}><span class="stop-orb">${landmark?`<img class="landmark-art" src="./assets/art/overworld-unit1-v1/landmark-${index}.png" alt=""><span class="landmark-state">${stateMarkup}</span>`:stateMarkup}</span></button>`;
 }).join('');
 return `<section class="path-lesson lesson-${index+1}" aria-labelledby="lesson-${esc(lesson.id)}"><div class="lesson-landmark"><span class="lesson-marker">${esc(lesson.id)}</span><div class="world-zone-caption"><h2 id="lesson-${esc(lesson.id)}">${esc(lesson.title)}</h2></div>${progress().masteredLessons?.includes(lesson.id)?`<span class="lesson-crown" aria-label="Lesson mastered">${icon('crown')}</span>`:''}</div><div class="lesson-trail" style="--path-count:${nodes.length}" aria-label="${esc(lesson.id)} activities">${worldTiles(index)}<svg class="trail-line" aria-hidden="true"><path class="trail-bed"/><path class="trail-route"/><path class="trail-extension-bed"/><path class="trail-extension"/></svg>${stops}</div></section>`;
}
function worldTiles(index){
 const props=[['greetings','cafe-cups'],['jobs','work-bag'],['countries','globe'],['personal','postbox']][index];
 return props.map((name,i)=>`<span class="world-tile lesson-prop area-prop area-prop-${i}" data-area-prop="${name}" data-prop-rig="${({greetings:'notebook','cafe-cups':'cups',jobs:'chef','work-bag':'bag',countries:'map',globe:'globe',personal:'keys',postbox:'postbox'})[name]}" aria-hidden="true"><img class="prop-still" src="./assets/art/${i?'lesson-area-tiles-v1':'lesson-props-v1'}/${name}.png" alt="" draggable="false"></span>`).join('');
}
function pathDetails(id,anchor,event){
 const node=pathNodeById[id];if(!node||!requirePracticeAccess()||!pathNodeUnlocked(node,pathNodes,progress()))return;
 rememberPathCursor(id);
 const status=progress().islands?.[id],done=nodeIsComplete(node),mastered=!!status?.mastered;
 const count=selectIslandQuestions(node,progress(),{seed:0}).length;
 openPathBubble(`<div class="island-bubble-heading"><h2 id="dialog-title">${esc(node.title)}</h2><button class="round-button" data-dialog-close aria-label="Close">${icon('close')}</button></div><p class="island-bubble-progress" title="Master each item by answering it correctly once without a hint.">${mastered?'Mastered':`${status?.masteredCount||0}/${status?.total||masteryTargets[id]?.length||0} mastered`} · ${count} questions</p><button class="primary-button full-width" data-start-path="${esc(node.id)}">${mastered?'Practice again':done?'Continue':'Start'} ${icon('arrow')}</button>`,anchor,event);
}
function syncPathPan(){const region=app.querySelector('.horizontal-path-scroll');if(!region)return;for(const button of app.querySelectorAll('[data-path-pan]')){button.dataset.arrowMarkup||=button.innerHTML;const direction=Number(button.dataset.pathPan),edge=direction<0?region.scrollLeft<=1:region.scrollLeft+region.clientWidth>=region.scrollWidth-1;updateBoundary(button,edge,adjacentUnit(unitRoutes,course.unit,direction));}}

function layoutPaths(){
 for(const trail of app.querySelectorAll('.lesson-trail')){
  const rect=trail.getBoundingClientRect(),orbs=[...trail.querySelectorAll('.stop-orb')];if(!rect.width||orbs.length<2)continue;
  const center=orb=>{const r=orb.getBoundingClientRect();return{x:r.left-rect.left+r.width/2,y:r.top-rect.top+r.height/2};},first=center(orbs[0]),last=center(orbs.at(-1)),width=last.x-first.x,amp=rect.height*.1875;
  const svg=trail.querySelector('.trail-line');svg.setAttribute('viewBox',`0 0 ${rect.width} ${rect.height}`);
  const point=t=>({x:first.x+width*t,y:first.y-amp*Math.sin(2*Math.PI*t)*Math.sin(Math.PI*t),dy:-amp*(2*Math.PI*Math.cos(2*Math.PI*t)*Math.sin(Math.PI*t)+Math.PI*Math.sin(2*Math.PI*t)*Math.cos(Math.PI*t))});
  const segments=32,dt=1/segments;let a=point(0),d=`M${a.x},${a.y}`;
  for(let i=1;i<=segments;i++){const b=point(i*dt);d+=` C${a.x+width*dt/3},${a.y+a.dy*dt/3} ${b.x-width*dt/3},${b.y-b.dy*dt/3} ${b.x},${b.y}`;a=b;}
  // Flat extensions join neighbouring lesson trails without changing node endpoints.
  for(const path of svg.querySelectorAll('.trail-bed,.trail-route'))path.setAttribute('d',d);for(const path of svg.querySelectorAll('.trail-extension-bed,.trail-extension'))path.setAttribute('d',`M0,${first.y} L${first.x},${first.y} M${last.x},${last.y} L${rect.width},${last.y}`);svg.style.overflow='visible';
 }
 const region=app.querySelector('.overworld-map'),cursor=region?.querySelector('.current-path .stop-orb');
 if(region&&cursor&&region.clientWidth&&(!region.dataset.cursorRevealed||region.dataset.cursorViewport!==String(region.clientWidth))){const box=region.getBoundingClientRect(),orb=cursor.getBoundingClientRect();region.scrollLeft+=orb.left+orb.width/2-box.left-region.clientWidth/2;region.dataset.cursorRevealed='true';region.dataset.cursorViewport=String(region.clientWidth);}
 syncPathPan();
}
function practice(){
 const selectedWords=state.selected.size?getWordsForChunks([...state.selected]):[];
 const alphabetOnly=!state.selectedGrammar.size&&selectedWords.length>0&&selectedWords.every(word=>word.kind==='letter');
 return `<section class="page-heading practice-heading"><div><h1>Practice</h1></div>${characterMarkup('alex','page-character')}</section><div class="practice-toolbar"><div class="segmented"><button class="selected" data-action="practice-sets">Topics</button><button data-action="word-bank">Word bank</button></div><button class="text-button" data-action="select-all">${allPracticeSelected()?'Clear all':'Select all'}</button></div><section class="practice-topics" aria-label="Practice by lesson">${allLessons.map(lesson=>`<section class="practice-lesson" aria-labelledby="practice-${esc(lesson.id)}"><div class="pick-heading"><span class="mini-lesson">${esc(lesson.id)}</span><h2 id="practice-${esc(lesson.id)}">${esc(lesson.title)}</h2></div><div class="practice-topic-list">${practiceTopics.filter(topic=>topic.lessonId===lesson.id).map(topic=>`<label class="practice-topic ${topicSelected(topic)?'chosen':''}"><input type="checkbox" name="practice-topic" value="${esc(topic.id)}" ${topicSelected(topic)?'checked':''}><span>${esc(topic.title)}</span></label>`).join('')}</div></section>`).join('')}</section><section class="mix-launch"><div><h2>${state.selected.size?selectedWords.length+' words':''}${state.selected.size&&state.selectedGrammar.size?' · ':''}${state.selectedGrammar.size?state.selectedGrammar.size+' grammar topic'+(state.selectedGrammar.size===1?'':'s'):''}${state.selected.size||state.selectedGrammar.size?' selected':'0 topics selected'}</h2></div><label class="round-length">Round length<select id="round-length"><option value="8" ${state.roundLength===8?'selected':''}>8 questions</option><option value="16" ${state.roundLength===16?'selected':''}>16 questions</option><option value="all" ${state.roundLength==='all'?'selected':''}>All selected items</option></select></label><div class="mix-actions"><button class="primary-button" data-mix="recall" ${alphabetOnly?'hidden':''} ${state.selected.size||state.selectedGrammar.size?'':'disabled'}>${state.selectedGrammar.size?'Practice':'Type answers'} ${icon('practice')}</button><button class="${alphabetOnly?'primary-button':'secondary-button'}" data-mix="listening" ${state.selected.size?'':'disabled'}>Listening ${icon('sound')}</button><button class="secondary-button" data-mix="memory" ${selectedWords.filter(word=>word.kind!=='letter').length>=3?'':'disabled'}>Memory ${icon('spark')}</button><button class="secondary-button" data-mix="matching" ${selectedWords.filter(word=>word.kind!=='letter').length>=3?'':'disabled'}>Matching ${icon('repeat')}</button></div>${state.selectedGrammar.size?'<p class="quiet-note">Listening and games use selected vocabulary only.</p>':''}</section>`;
}
function wordBank(){
 const query=state.search.trim().toLowerCase(),words=vocabulary.filter(word=>!query||`${word.term} ${word.spanish||''}`.toLowerCase().includes(query));
 return `<section class="page-heading bank-heading"><div><h1>Word bank</h1></div>${characterMarkup('mina','page-character')}</section><div class="bank-toolbar"><label class="search-field">${icon('search')}<input id="word-search" type="search" value="${esc(state.search)}" placeholder="Find a word" aria-label="Find a word"></label><button class="text-button" data-route="practice">Practice ${icon('arrow')}</button></div><section class="word-bank-lessons" aria-label="Vocabulary word bank">${allLessons.map(lesson=>{const group=words.filter(word=>word.lessonIds?.includes(lesson.id));return group.length?`<details class="word-bank-lesson" data-bank-lesson="${esc(lesson.id)}" ${query||state.bankOpen.has(lesson.id)?'open':''}><summary><span class="mini-lesson">${esc(lesson.id)}</span><span>${esc(lesson.title)}</span>${icon('chevron')}</summary><div class="word-grid">${group.map(word=>`<button class="word-tile" data-word="${esc(word.id)}"><b>${esc(word.term)}</b><span lang="es">${esc(word.spanish||'')}</span></button>`).join('')}</div></details>`:'';}).join('')}${words.length?'':'<p class="empty-message">No words found.</p>'}</section>`;
}

function profileEditorPage() {
  const p = profile();
  const profileGroups=avatarOptions().filter(group=>group.id!=='body');
  const colorIndex=profileGroups.findIndex(group=>group.id==='hairColor');
  if(colorIndex>=0&&profileGroups.some(group=>group.id==='hair')){const [color]=profileGroups.splice(colorIndex,1);profileGroups.splice(profileGroups.findIndex(group=>group.id==='hair')+1,0,color);}

  if (!state.avatarDraft){state.avatarDraft=normalizeAvatar({...defaultAvatar(),...(p.avatar || {})});if(!['male','female'].includes(state.avatarDraft.body))state.avatarDraft.body='male';}
  return `<button class="text-button social-editor-back" data-action="close-profile-editor">← My profile</button><section class="profile-heading"><h1>Edit profile</h1></section><div class="profile-layout"><section class="avatar-studio"><div class="avatar-preview" id="avatar-preview">${avatarMarkup(state.avatarDraft,'avatar-large',name())}<span class="avatar-studio-spark" aria-hidden="true">✦</span></div><div class="avatar-options">${profileGroups.map(group=>`<fieldset><legend>${esc(group.label)}</legend><div class="avatar-option-row">${(group.options||[]).map(option=>`<button type="button" class="avatar-option ${state.avatarDraft[group.id]===option.id?'selected':''}" data-avatar-group="${esc(group.id)}" data-avatar-value="${esc(option.id)}" aria-pressed="${state.avatarDraft[group.id]===option.id}" aria-label="${esc(option.label || option.name || option.id)}">${option.swatch?`<span class="avatar-swatch" style="background:${esc(option.swatch)}"></span>`:option.thumbnail?rasterMarkup(option.thumbnail,'',''):esc(option.label || option.name || option.id)}</button>`).join('')}</div></fieldset>`).join('')}${avatarOptions().length?'':'<p>Your avatar will appear here when the character artwork finishes loading.</p>'}</div></section>
    <section class="profile-details"><form id="profile-form"><label for="display-name">Name</label><input id="display-name" name="displayName" value="${esc(p.displayName || p.name || '')}" maxlength="40" required autocomplete="nickname" placeholder="Your name"><label for="date-of-birth">Date of birth <span class="optional">Optional</span></label><input id="date-of-birth" name="dateOfBirth" type="date" value="${esc((p.dateOfBirth || '').slice(0,10))}" max="${new Date().toISOString().slice(0,10)}"><label for="daily-goal">Daily goal</label><select id="daily-goal" name="goal">${[5,10,15,20].map(goal=>`<option value="${goal}" ${Number(p.goal||5)===goal?'selected':''}>${goal} minutes</option>`).join('')}</select><p id="profile-error" class="form-error" role="alert"></p><button type="submit" class="primary-button">Save profile ${icon('check')}</button></form><section class="your-books"><span class="eyebrow">YOUR BOOKS</span>${bookList().map(book=>`<div class="profile-book"><span class="book-level">${esc(book.level || 'A1')}</span><span><b>${esc(bookTitle(book))}</b><small>${book.expiresAt?`Expires ${formatDate(book.expiresAt)}`:'Available'}</small></span></div>`).join('')}<button class="text-button" data-action="add-book">Add another book ${icon('plus')}</button></section><button class="sign-out" data-action="sign-out">Sign out ${icon('exit')}</button></section></div>`;
}
function profilePage(){if(state.profileEditing)return profileEditorPage();const p=profile(),g=progress();return socialProfileMarkup(state.social,{avatar:avatarMarkup,icon,own:true,tab:state.socialTab,error:state.socialError,loading:!state.social,fallback:{name:name(),avatar:p.avatar,stats:{xp:g.xp,streak:g.streak,bestStreak:g.bestStreak,wordsMastered:Object.values(g.wordStats||{}).filter(w=>w.mastered).length,lessonsCompleted:g.completedLessons?.length,activeDays:g.activeDays?.length}}});}
function personPage(){return socialProfileMarkup(state.personData,{avatar:avatarMarkup,icon,own:false,tab:state.socialTab,error:state.personError});}
function render() {
  const socialScroll=app.querySelector('.social-page[data-profile-scroll-key]'),socialScrollKey=socialScroll?.dataset.profileScrollKey,socialScrollTop=socialScroll?.querySelector('.social-scroll')?.scrollTop||0;
  const motionBefore=captureUI(app),previousQuestion=app.querySelector('.activity-page[data-question-id]')?.dataset.questionId,promptScroll=app.querySelector('.question-content')?.scrollTop||0;
  document.documentElement.classList.toggle('lesson-view',!!state.active&&['quiz','result'].includes(state.active.kind));
  disposeOverworld?.();disposeOverworld=null;
  disposePropMotion?.();disposePropMotion=null;
  streakCelebrationController?.dispose();streakCelebrationController=null;
  disposeArtwork(app);
  app.removeAttribute('aria-busy');
  if (!state.session) {app.innerHTML=welcome();refreshArtwork(app);enhanceMotion(app,motionBefore);return;}
  if (state.active) {
    if(state.active.kind==='result'&&state.active.saving)app.setAttribute('aria-busy','true');
    app.innerHTML=renderActivity();stabilizeSentence();
    if(previousQuestion&&previousQuestion===app.querySelector('.activity-page[data-question-type=order]')?.dataset.questionId){const content=app.querySelector('.question-content');if(content)content.scrollTop=promptScroll;}
    const streakPage=app.querySelector('.streak-celebration-page');
    if(streakPage){
      const result=state.active;
      // Background saves do not consume the visible daily celebration.
      const profileId=profile().id;
      markControls(app);
      streakCelebrationController=mountStreakCelebration(streakPage,{elapsed:result.streakElapsed||0,onTime:time=>{result.streakElapsed=time;},onPresented:()=>markStreakCelebrationSeen(profileId,result.streakEvent),onImpact:()=>{if(!result.streakSoundPlayed){result.streakSoundPlayed=true;playCompletionSound(result.newIslandMastery,true);}}});
      streakPage.focus({preventScroll:true});
    }else{refreshArtwork(app);enhanceMotion(app,motionBefore);app.querySelector('#typed-answer:not(:disabled)')?.focus({preventScroll:true});}
    return;
  }
  const pages={learn:home,practice,bank:wordBank,profile:profilePage,person:personPage,leaderboard:()=>leaderboardMarkup(state.leaderboard,avatarMarkup,state.boardError)};
  const learningRoute=['learn','practice','bank'].includes(state.route);
  app.innerHTML=shell(learningRoute&&!hasBookAccess()?accessPage():learningRoute&&!isA1Book()?home():(pages[state.route] || home)(),state.route==='bank'?'practice':state.route==='person'?'profile':state.route);
  const updatedSocial=app.querySelector('.social-page[data-profile-scroll-key]');if(socialScrollKey&&updatedSocial?.dataset.profileScrollKey===socialScrollKey)updatedSocial.querySelector('.social-scroll').scrollTop=socialScrollTop;
  setupAvatarChoices();enhanceShell(xp(),streak(),icon,state.avatarDraft||profile().avatar,artManifest());
  refreshArtwork(app);
  enhanceMotion(app,motionBefore);
  const region=app.querySelector('.overworld-map');if(region){disposeOverworld=mountOverworld(region);disposePropMotion=mountPropMotion(region);}
  requestAnimationFrame(layoutPaths);document.fonts.ready.then(layoutPaths);
}
function findChunkActivity(id) {return allActivities.find(a=>a.chunkIds?.includes(id)&&['quiz','vocabulary'].includes(a.type));}
function startChunk(id) {const activity=findChunkActivity(id),lessonId=getChunk(id)?.lessonId;startQuiz({chunkIds:[id],lessonId,lessonIds:lessonId?[lessonId]:[],mode:'vocabulary',count:8,activityId:activity?.id || `chunk:${id}`},getChunk(id)?.title || 'Vocabulary');}
function startActivity(id) {
  if(!requirePracticeAccess())return;
  const activity=pathNodeById[id]||allActivities.find(a=>a.id===id);
  if (!activity) {notify('Choose an activity.');return route('practice');}
  if(pathNodeById[id]){if(!pathNodeUnlocked(activity,pathNodes,progress())){notify('Complete the earlier islands in this lesson first.');return;}rememberPathCursor(id);}
  if (['memory','matching','countries','opposites'].includes(activity.type)) return startGame(activity.type==='memory'?'memory':'matching',activity);
  const seed=Date.now();let questions;
  try {questions=selectIslandQuestions(activity,progress(),{count:8,seed});} catch(error) {console.error(error);notify('Unable to open this activity. Please try again.');return;}
  const mode=activity.type==='grammar'?'grammar':activity.type==='review'?'mixed':'vocabulary';
  beginQuiz(questions,{...activity,mode,activityId:id,count:512,seed},activity.title || 'Practice');
}
function startQuiz(options,title='Vocabulary') {
  if(!requirePracticeAccess())return;
  const seed=Date.now();let questions;
  const factoryOptions={...options,seed};if(factoryOptions.activityId&&!allActivities.some(activity=>activity.id===factoryOptions.activityId))delete factoryOptions.activityId;
  try {questions=buildQuiz(factoryOptions);} catch(error) {notify('That mix needs a few more words. Try another set.');console.error(error);return;}
  beginQuiz(questions,{...options,seed,practiceUntilCorrect:true},title);
}
function beginQuiz(questions,options,title) {
  options={...options,contentRevision};
  if (!Array.isArray(questions)) questions=questions?.questions || [];
  if (!questions.length) {notify('No questions available for this selection.');return;}
  questions=questions.map(q=>presentQuestion(q,options.seed,{typedVocabulary:options.practiceUntilCorrect&&['recall','mixed'].includes(options.mode)}));
  stopAudio();
  state.active={kind:'quiz',title,questions,options,index:0,selected:null,order:[],checked:false,answers:[],answerChecks:0,correctChecks:0,requiredQuestionIds:[...new Set(questions.map(q=>q.id))],started:Date.now(),hintUsed:false,saving:false,previewVisible:Boolean(questions[0]?.preview)};
  render();schedulePreview();window.scrollTo({top:0,behavior:'instant'});
}
function schedulePreview(){const current=state.active;if(!current||current.kind!=='quiz'||!current.previewVisible)return;const index=current.index;setTimeout(()=>{if(state.active===current&&current.index===index){current.previewVisible=false;render();document.getElementById('typed-answer')?.focus();}},current.questions[index].previewMs||4500);}
function activityHeader(title,index,total) {return `<header class="activity-header"><button class="round-button" data-action="leave-activity" aria-label="Leave practice">${icon('close')}</button><div><span class="activity-track"><i style="width:${Math.max(0,index/total*100)}%"></i></span><span class="activity-title">${esc(title)}</span></div><span class="activity-count">${index}/${total}</span><button class="round-button feedback-sound-toggle ${feedbackSoundsEnabled()?'':'muted'}" data-action="toggle-feedback-sound" aria-label="${feedbackSoundsEnabled()?'Mute sound effects':'Enable sound effects'}" aria-pressed="${feedbackSoundsEnabled()}" title="${feedbackSoundsEnabled()?'Sound effects on':'Sound effects off'}">${icon('sound')}</button></header>`;}

function renderActivity(){
 const a=state.active;
 if(a.kind==='challenge-result')return challengeResult(a);
 if(a.kind==='result')return renderResult(a);
 if(a.kind==='memory'||a.kind==='matching')return renderGame(a);
 const q=a.questions[a.index],listening=Boolean(q.listening),pictured=listening?null:q.image||wordArt(q.word||getWord(q.wordIds?.[0]));
 const descriptor=pathNodeById[a.options.activityId||a.options.id]||allActivities.find(item=>item.id===(a.options.activityId||a.options.id))||a.options;
 const visual=lessonArt(q,descriptor,pictured),illustration=visual.kind==='cast'?characterMarkup(visual.character,'question-character','idle',visual.posture):rasterMarkup(visual.asset||wordArt({term:visual.term}),'question-image','Question illustration');
 const voiced=q.audioWordId||q.word?.id||q.wordIds?.[0];
 const expected=a.feedback?.expected??q.correctText??q.answer,expectedText=Array.isArray(expected)?expected.join(' '):expected;
 const explanation=typeof q.explanation==='string'&&q.explanation!==String(expectedText)?q.explanation:'';
 const playback=listening?(q.audio?`<div class="question-audio"><audio controls preload="metadata" src="${esc(assetURL(q.audio))}" aria-label="Audio question"></audio></div>`:q.audioWordId?`<button class="secondary-button question-listen" data-speak="${esc(q.audioWordId)}">${icon('sound')} Play audio</button>`:''):'';
 return `<main class="activity-page" data-answer-state="${a.checked?(a.feedback?.correct?'correct':'incorrect'):'unanswered'}" data-mina-answer="${a.checked?esc(a.started+':'+a.answerChecks):''}" data-question-id="${esc(q.id)}" data-question-type="${esc(q.type)}" data-listening="${listening}">${activityHeader(a.title,a.index,a.questions.length)}<section class="question-body"><div class="question-content"><h1>${esc(q.prompt.split('\n')[0])}</h1>${!listening&&q.prompt.includes('\n')?`<p class="question-cue" ${q.translation?'lang="es"':''}>${esc(q.prompt.split('\n').slice(1).join('\n'))}</p>`:''}${listening&&q.listenFor?`<p class="listening-task">${esc(q.listenFor)}</p>`:''}${playback}${listening?`<div class="pronunciation-slot listening-alternative-slot" aria-hidden="${a.checked}">${!a.checked?'<button class="text-button skip-audio" data-action="skip-audio">I can’t listen now</button>':''}</div>`:''}${!listening&&q.passage?`<div class="question-passage">${esc(q.passage)}</div>`:''}${a.previewVisible?`<div class="question-preview" role="status"><small>Remember the code.</small><b>${esc(Array.isArray(q.preview)?q.preview.join(' '):q.preview)}</b></div>`:''}<div class="question-scene ${visual.kind==='cast'?'':'topic-scene'}" data-lesson-visual="${visual.kind}">${illustration}</div></div>${q.type==='order'?renderOrder(q,a):q.type==='text'?`<form id="text-answer-form"><label class="sr-only" for="typed-answer">Your answer</label><input id="typed-answer" class="typed-answer" type="text" maxlength="200" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${a.previewVisible?'Wait…':'Your answer'}" value="${esc(a.selected||'')}" ${a.checked||a.previewVisible?'disabled':''}></form>`:`<div class="answer-options">${(q.choices||[]).map((choice,i)=>`<button class="answer-option ${String(a.selected)===String(choice.id)?'selected':''} ${a.checked&&String(choice.id)===String(q.answer)?'correct':''} ${a.checked&&String(a.selected)===String(choice.id)&&!a.feedback?.correct?'incorrect':''}" data-choice="${esc(choice.id)}" ${a.checked?'disabled':''}><span class="answer-number">${i+1}</span>${!listening&&choice.image?rasterMarkup(choice.image,'choice-image',choice.text):''}<span>${esc(choice.text)}</span>${a.checked&&String(choice.id)===String(q.answer)?icon('check'):''}</button>`).join('')}</div>`}${q.hint&&!listening?`<button class="hint-button" data-action="hint" ${a.checked?'disabled':''}>${a.hintUsed?esc(q.hint):'Hint'}</button>`:''}</section><div class="answer-dock"><footer class="answer-footer ${a.checked?(a.feedback?.correct?'feedback-correct':'feedback-gentle'):''}">${a.checked?`<div class="answer-feedback" role="status" aria-live="polite" aria-atomic="true"><span class="answer-feedback-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${icons[a.feedback.correct?'check':'close']}</svg></span><div class="answer-feedback-copy"><b>${a.feedback.correct?'Correct!':'Not quite'}</b>${a.feedback.correct?'':'<small>Correct answer</small>'}<p class="suggested-answer"><span>${q.type==='order'&&a.feedback.correct?'':esc(expectedText)}</span>${voiced&&state.audioManifest[voiced]?`<button class="word-pronunciation" data-speak="${esc(voiced)}" aria-label="Play audio: ${esc(expectedText)}">${icon('sound')} Play audio</button>`:state.answerAudio[audioKey(expectedText)]?`<button class="word-pronunciation" data-audio-text="${esc(expectedText)}">${icon('sound')} Play audio</button>`:''}</p>${q.transcript?`<div class="answer-transcript"><small>Transcript</small><p>${esc(q.transcript)}</p></div>`:''}${!a.feedback.correct&&explanation?`<p class="answer-explanation">${esc(explanation)}</p>`:''}</div></div><button class="primary-button" data-action="next-question">${a.index+1===a.questions.length?'Results':'Continue'} ${icon('arrow')}</button>`:`<button class="primary-button" data-action="check-answer" ${hasAnswer(a,q)?'':'disabled'}>Check ${icon('check')}</button>`}</footer></div></main>`;
}
function skipAudio(){
 const current=state.active;if(current?.kind==='quiz'&&isAlphabetQuestion(current.questions[current.index])){notify('Alphabet practice needs audio. Come back when you can listen.');state.active=null;return route('practice');}
 const a=state.active;if(!a||a.kind!=='quiz'||a.checked||!a.questions[a.index]?.listening)return;
 stopAudio();
 a.questions=a.questions.filter((q,index)=>index<a.index||!isAlphabetQuestion(q));
 if(!a.questions[a.index]){state.active=null;return route('practice');}
 if(a.requiredQuestionIds)a.requiredQuestionIds=a.requiredQuestionIds.filter(id=>a.questions.some(q=>q.id===id));
 const ids=a.questions.slice(a.index).filter(q=>q.listening).map(q=>q.id);
 a.options.audioFallbackQuestionIds=[...new Set([...(a.options.audioFallbackQuestionIds||[]),...ids])];
 a.questions=a.questions.map((q,index)=>index>=a.index&&q.listening?getAudioFallbackQuestion(q):q);
 a.audioDisabled=true;a.selected=null;a.order=[];a.hintUsed=false;a.previewVisible=false;
 render();window.scrollTo({top:0,behavior:'instant'});
}
function renderOrder(q,a) {
  const tokens=q.sentenceTokens || q.tokens || [];
  const value=token=>typeof token==='string'?token:token.text || token.label || token.value;
  return `<div class="sentence-builder"><div class="sentence-answer" aria-label="Your sentence">${a.order.length?a.order.map(index=>`<button data-remove-token="${index}" ${a.checked?'disabled':''}>${esc(value(tokens[index]))}</button>`).join(''):'<span>Drag words here, or tap them.</span>'}</div><div class="sentence-tokens" ${a.checked?'hidden':''}>${tokens.map((token,index)=>`<button data-token="${index}" ${a.order.includes(index)||a.checked?'disabled':''}>${esc(value(token))}</button>`).join('')}</div><button class="text-button sentence-reset" data-action="clear-sentence" ${!a.order.length||a.checked?'disabled aria-hidden="true"':''}>Start again</button></div>`;
}
function hasAnswer(a,q) {return q.type==='order'?a.order.length>0:typeof a.selected==='string'?a.selected.trim().length>0:a.selected!==null;}
// Reserve a full sentence's wrapped height, so adding words cannot squeeze the prompt.
function stabilizeSentence(){
 const builder=app.querySelector('.sentence-builder'),answer=builder?.querySelector('.sentence-answer');if(!answer)return;answer.style.minHeight='';
 const measure=answer.cloneNode(false);measure.removeAttribute('aria-label');measure.setAttribute('aria-hidden','true');
 measure.style.cssText=`position:fixed;left:-10000px;top:0;width:${answer.getBoundingClientRect().width}px;min-height:0;height:auto;visibility:hidden;pointer-events:none`;
 for(const tile of builder.querySelectorAll('.sentence-tokens>button')){const copy=tile.cloneNode(true);copy.disabled=false;copy.removeAttribute('data-token');measure.append(copy);}
 builder.append(measure);answer.style.minHeight=Math.max(parseFloat(getComputedStyle(answer).minHeight)||0,measure.getBoundingClientRect().height)+'px';measure.remove();
}
function speakSelection(text,{keepFeedback=false}={}){
 if(keepFeedback){wordPlayer?.pause();}else stopAudio();
 app.querySelectorAll('.question-audio audio').forEach(audio=>audio.pause());
 const model=state.answerAudio[audioKey(text)];
 if(!model){notify('This recording is not available yet.');return;}
 wordPlayer=new Audio(assetURL(model.src));wordPlayer.play().catch(()=>notify('Tap Play audio to hear the answer.'));
}
function speakOrderToken(index){const q=state.active.questions[state.active.index],token=(q.sentenceTokens||q.tokens||[])[index];speakSelection(typeof token==='string'?token:token.text||token.label||token.value);}
function updateSentence(){
 const a=state.active;if(!a||a.kind!=='quiz'||a.checked)return;
 const builder=app.querySelector('.sentence-builder');if(!builder)return;
 const before=captureUI(app),content=app.querySelector('.question-content'),scroll=content?.scrollTop||0,focused=document.activeElement,focusIndex=focused?.dataset.removeToken??focused?.dataset.token;
 builder.outerHTML=renderOrder(a.questions[a.index],a);stabilizeSentence();
 const check=app.querySelector('[data-action=check-answer]');if(check)check.disabled=!hasAnswer(a,a.questions[a.index]);
 if(focusIndex!==undefined)app.querySelector(`[data-remove-token="${focusIndex}"],[data-token="${focusIndex}"]:not(:disabled)`)?.focus({preventScroll:true});
 if(content)content.scrollTop=scroll;enhanceMotion(app,before);
}
window.addEventListener('resize',stabilizeSentence);
function gradeCurrent() {
  const a=state.active;if (!a||a.kind!=='quiz'||a.checked||a.previewVisible) return;const q=a.questions[a.index];
  if (!hasAnswer(a,q)) return;
  const tokens=q.sentenceTokens || q.tokens || [];
  const submitted=q.type==='order'?a.order.map(index=>typeof tokens[index]==='string'?tokens[index]:tokens[index].text || tokens[index].label || tokens[index].value):a.selected;
  let feedback;
  try {feedback=checkAnswer(q,submitted);} catch {feedback={correct:false,expected:q.answer,feedback:q.explanation,wordIds:q.wordIds || []};}
  const serverSubmitted=q.serverAnswerType==='text'&&Array.isArray(submitted)?submitted.join(' '):q.type==='choice'?(q.choices.find(choice=>String(choice.id)===String(submitted))?.text || submitted):submitted;
  stopAudio();playFeedbackSound(Boolean(feedback.correct));
  a.feedback=feedback;a.checked=true;
  if(feedback.correct&&q.type==='text')speakSelection(q.correctText??feedback.expected??q.answer,{keepFeedback:true});
  const answer={questionId:q.id,submitted:serverSubmitted,correct:Boolean(feedback.correct),wordIds:feedback.wordIds || [],hintUsed:a.hintUsed,masteryEligible:Boolean(feedback.masteryEligible)&&!a.hintUsed};
  a.answerChecks++;if(feedback.correct)a.correctChecks++;
  if(a.options.practiceUntilCorrect){
    const previous=a.answers.findIndex(item=>item.questionId===q.id);if(previous<0)a.answers.push(answer);else a.answers[previous]=answer;
    if(!feedback.correct)a.questions.push({...q});
  }else a.answers.push(answer);
  render();app.querySelector('[data-action=next-question]')?.focus({preventScroll:true});
}
function nextQuestion() {
  stopAudio();
  const a=state.active;if (!a||a.kind!=='quiz'||!a.checked) return;
  if (a.index+1>=a.questions.length) return finishActivity();
  a.index++;a.selected=null;a.order=[];a.checked=false;a.feedback=null;a.hintUsed=false;a.previewVisible=Boolean(a.questions[a.index]?.preview);render();schedulePreview();window.scrollTo({top:0,behavior:'instant'});
}
function startGame(kind,options) {
  if(!requirePracticeAccess())return;
  const seed=Date.now(),chunkIds=options.chunkIds || [...state.selected],lessonIds=options.lessonIds || (options.lessonId?[options.lessonId]:undefined);let pairs;
  try {pairs=getMatchingPairs({chunkIds,lessonIds,count:6,seed});} catch {notify('Choose a few more words for this game.');return;}
  if (!pairs?.length) {notify('Choose a word set first.');return;}
  stopAudio();
  const shuffle=values=>values.map(value=>({value,sort:Math.random()})).sort((a,b)=>a.sort-b.sort).map(x=>x.value);
  state.active={kind,title:options.title || (kind==='memory'?'Memory':'Matching'),options:{...options,contentRevision,chunkIds,lessonIds,seed,count:6,mode:kind,activityId:options.id || options.activityId || `mix-${kind}`},pairs,cards:shuffle(pairs.flatMap(pair=>[{id:pair.id+'-left',pairId:pair.id,text:pair.left,side:'left'},{id:pair.id+'-right',pairId:pair.id,text:pair.right,side:'right'}])),right:shuffle([...pairs]),matched:[],flipped:[],left:null,rightChoice:null,mistakes:0,moves:0,started:Date.now(),answers:[],locked:false};
  render();window.scrollTo({top:0,behavior:'instant'});
}
function renderGame(a) {
  const finished=a.matched.length===a.pairs.length;
  return `<main class="activity-page game-page">${activityHeader(a.title,a.matched.length,a.pairs.length)}<section class="game-intro"><span class="eyebrow">${a.kind==='memory'?'MEMORY':'MATCHING'}</span><h1>${a.kind==='memory'?'Match the pairs':'Match the translations'}</h1><p>${a.kind==='memory'?'Match English words with Spanish translations.':'Select an English word and its Spanish translation.'}</p>${characterMarkup(a.options.character||(a.kind==='memory'?'alex':'mina'),'game-character','idle',a.options.character==='jo'?'offer':undefined)}</section>
    ${a.kind==='memory'?`<section class="memory-grid" aria-label="Memory game">${a.cards.map(card=>{const matched=a.matched.includes(card.pairId),shown=matched||a.flipped.includes(card.id);return `<button class="memory-card ${shown?'flipped':''} ${matched?'matched':''}" data-memory="${esc(card.id)}" ${matched||a.locked?'disabled':''} aria-label="${shown?esc(card.text):'Turn over a card'}"><span class="memory-back">${icon('spark')}</span><span class="memory-front">${esc(card.text)}</span></button>`;}).join('')}</section>`:`<section class="matching-board"><div>${a.pairs.map(pair=>`<button class="matching-word ${a.left===pair.id?'selected':''} ${a.matched.includes(pair.id)?'matched':''}" data-match-left="${esc(pair.id)}" ${a.matched.includes(pair.id)?'disabled':''}>${esc(pair.left)}${a.matched.includes(pair.id)?icon('check'):''}</button>`).join('')}</div><div>${a.right.map(pair=>`<button class="matching-word ${a.rightChoice===pair.id?'selected':''} ${a.matched.includes(pair.id)?'matched':''}" data-match-right="${esc(pair.id)}" ${a.matched.includes(pair.id)?'disabled':''}>${esc(pair.right)}${a.matched.includes(pair.id)?icon('check'):''}</button>`).join('')}</div></section>`}
    <footer class="game-footer"><span>${a.matched.length} of ${a.pairs.length} pairs found</span>${finished?`<button class="primary-button" data-action="finish-game">Results ${icon('arrow')}</button>`:`<span class="quiet-note">${a.kind==='memory'?`${a.moves} turns`:''}</span>`}</footer></main>`;
}
function flipCard(id) {
  const a=state.active;if (!a||a.kind!=='memory'||a.locked||a.flipped.includes(id)) return;
  const card=a.cards.find(item=>item.id===id);if (!card||a.matched.includes(card.pairId)) return;
  a.flipped.push(id);
  if (a.flipped.length===2) {
    a.moves++;const other=a.cards.find(item=>item.id===a.flipped[0]);
    if (other.pairId===card.pairId) {a.matched.push(card.pairId);a.flipped=[];const pair=a.pairs.find(item=>item.id===card.pairId);a.answers.push({questionId:pair.id,itemId:pair.wordId || pair.id,wordId:pair.wordId,submitted:pair.right,correct:true,wordIds:pair.wordId?[pair.wordId]:[],masteryEligible:false});}
    else {a.mistakes++;a.locked=true;setTimeout(()=>{if(state.active===a){a.flipped=[];a.locked=false;render();}},1000);}
  }
  render();
}
function chooseMatch(side,id) {
  const a=state.active;if(!a||a.kind!=='matching'||a.matched.includes(id))return;
  if(side==='left')a.left=id;else a.rightChoice=id;
  if(a.left&&a.rightChoice){a.moves++;if(a.left===a.rightChoice){const pair=a.pairs.find(item=>item.id===id);a.matched.push(id);a.answers.push({questionId:pair.id,itemId:pair.wordId || pair.id,wordId:pair.wordId,submitted:pair.right,correct:true,wordIds:pair.wordId?[pair.wordId]:[],masteryEligible:false});notify('Matched.','success');}else{a.mistakes++;notify('Not a match.');}a.left=null;a.rightChoice=null;}
  render();
}
async function finishActivity() {
  const previous=state.active;if(!previous||previous.saving)return;if(previous.options.challengeId){state.active={kind:'challenge-result',challengeId:previous.options.challengeId,answers:previous.answers,saving:false};return saveChallenge(state.active);}if(previous.options.practiceUntilCorrect&&previous.kind==='quiz'&&previous.requiredQuestionIds.some(id=>!previous.answers.some(a=>a.questionId===id&&a.correct)))return;previous.saving=true;
  const correct=previous.options.practiceUntilCorrect&&previous.kind==='quiz'?previous.correctChecks:previous.answers.filter(answer=>answer.correct).length;
  const total=previous.options.practiceUntilCorrect&&previous.kind==='quiz'?previous.answerChecks:previous.answers.length;
  const quizOptions={contentRevision:previous.options.contentRevision||'base',seed:previous.options.seed,mode:previous.kind==='quiz'?(previous.options.mode||'mixed'):previous.kind,count:previous.options.count || previous.questions?.length || 6,chunkIds:previous.options.chunkIds || [],lessonIds:previous.options.lessonIds || (previous.options.lessonId?[previous.options.lessonId]:[]),grammarSetIds:previous.options.grammarSetIds || [],audioEnabled:previous.options.audioEnabled!==false,audioFallbackQuestionIds:previous.options.audioFallbackQuestionIds||[]};
  const inferredLesson=previous.options.lessonId || quizOptions.lessonIds[0] || getChunk(quizOptions.chunkIds[0])?.lessonId || allGrammar.find(g=>quizOptions.grammarSetIds.includes(g.id))?.lessonId || '1A';
  const attempt={id:crypto.randomUUID(),bookId:'horizons-a1',lessonId:inferredLesson,activityId:previous.options.activityId || previous.options.id || 'mixed-practice',mode:quizOptions.mode,quizOptions,...quizOptions,answers:previous.answers,durationMs:Date.now()-previous.started,mistakes:previous.mistakes || 0};
  state.active={kind:'result',title:previous.title,previous,attempt,correct,total,saving:false,saved:false,oldXp:xp(),masteredBefore:Object.entries(progress().islands||{}).filter(([,island])=>island.mastered).map(([id])=>id),error:null};
  return saveActivityResult(state.active);
}
async function saveActivityResult(result){
  if(!result||result.kind!=='result'||result.saving||result.saved)return;
  result.saving=true;result.error=null;prepareCompletionSound();render();window.scrollTo({top:0,behavior:'instant'});
  try{
    if(!result.boardBefore){try{result.boardBefore=await api.getLeaderboard();}catch{}}
    const response=await api.saveAttempt(result.attempt);setSession(response);
    result.saved=true;result.earnedXp=Math.max(0,xp()-result.oldXp);
    result.streakEvent=response.attempt?.dailyStreakCelebration||null;
    result.pendingStreak=shouldShowStreakCelebration(profile().id,result.streakEvent);result.showStreak=false;result.completionStage='results';
    try{const after=await api.getLeaderboard();result.overtake=overtakingEvent(result.boardBefore,after);state.leaderboard=after;}catch{/* A competition outage never blocks saved lesson results. */}
    if(state.active===result)rememberPathCursor(result.attempt.activityId);
    result.newIslandMastery=Object.entries(progress().islands||{}).some(([id,island])=>island.mastered&&!result.masteredBefore.includes(id));
  }catch(error){result.error=error.message;}
  result.saving=false;
  // A delayed save must not play a reward on a different route or activity.
  if(state.active!==result)return;
  if(result.saved)result.achievements=rewardItems().filter(item=>result.oldXp<item.unlockXp&&xp()>=item.unlockXp);
  render();window.scrollTo({top:0,behavior:'instant'});
  if(result.saved){
    if(!result.showStreak)playCompletionSound(result.newIslandMastery);

  }
}
function renderResult(a){
 if(a.saving)return `<div class="boot-screen" role="status" aria-live="polite"><span class="wordmark">HORIZONS</span><span class="boot-dot" aria-hidden="true"></span><span class="sr-only">Loading results</span></div>`;
 if(!a.saved)return `<main class="recovery-screen completion-error"><span class="wordmark">HORIZONS</span><h1>Your round couldn’t be saved</h1><div class="save-error" role="alert"><p>${esc(a.error||'Please try again.')}</p></div><button class="primary-button" data-action="retry-save">Retry save ${icon('repeat')}</button><button class="text-button" data-action="back-to-path">Back to lessons ${icon('arrow')}</button></main>`;
 if(a.completionStage==='streak')return streakCelebrationMarkup(a.streakEvent);
 if(a.completionStage==='achievement')return achievementMarkup(a);
 if(a.completionStage==='overtake')return overtakingMarkup(a.overtake,avatarMarkup);
 const percent=a.total?Math.round(a.correct/a.total*100):0,companion=a.previous.options.character||allActivities.find(item=>item.id===a.attempt.activityId)?.character||'alex';
 return `<main class="result-page" data-saved="true"><a class="result-brand wordmark" href="#learn" data-route="learn">HORIZONS</a><div class="result-character">${characterMarkup(companion,'result-pico','celebrate',({pico:'jump',mina:'skip',alex:'dance',jo:'clap'})[companion])}</div><h1>Results</h1><p>${a.correct} of ${a.total} correct</p><div class="result-stats"><div><b>${percent}%</b><span>Score</span></div><div><b>${Math.max(1,Math.round(a.attempt.durationMs/60000))}</b><span>min</span></div></div><div class="result-actions"><button class="primary-button" data-action="completion-continue" ${a.saving?'disabled':''}>${a.pendingStreak||a.overtake||a.achievements?.length?'Continue':'Back to lessons'} ${icon('arrow')}</button><button class="text-button" data-action="play-again" ${a.saving?'disabled':''}>Practice again ${icon('repeat')}</button></div></main>`;
}
function showDialog(content,kind='') {disposeArtwork(dialog);dialog.className=`app-dialog ${kind}`;dialog.innerHTML=content;dialog.showModal();refreshArtwork(dialog);markControls(dialog);animateUI(dialog,[{opacity:0,transform:'translateY(10px) scale(.98)'},{opacity:1,transform:'translateY(0) scale(1)'}]);}
function closeDialog(){disposeArtwork(dialog);dialog.close();}
// Native close/Escape also releases rigs and disconnects placeholders before a
// late module import can mount an animation into a hidden dialog.
dialog.addEventListener('close',()=>{if(!dialog.open){disposeArtwork(dialog);for(const slot of dialog.querySelectorAll('[data-avatar-static]'))slot.remove();}});
function booksDialog(add=false) {
  showDialog(`<div class="dialog-heading"><div><span class="eyebrow">YOUR BOOKS</span><h2 id="dialog-title">${add?'Add a book':'My books'}</h2></div><button class="round-button" data-dialog-close aria-label="Close">${icon('close')}</button></div>${add?'':`<div class="book-library">${bookList().map(book=>`<button data-select-book="${esc(book.id || book.bookId)}" class="library-book ${String(book.id || book.bookId)===String(state.bookId)?'selected':''}"><span class="book-cover-mini"><span class="wordmark">HORIZONS</span><b>${esc(book.level || 'A1')}</b></span><span><b>${esc(bookTitle(book))}</b><small>${book.expiresAt?`Practice until ${formatDate(book.expiresAt)}`:'Available'}</small></span>${String(book.id || book.bookId)===String(state.bookId)?icon('check'):icon('arrow')}</button>`).join('')}</div>`}<form id="link-book-form"><label for="extra-code">${add?'Your new book code':'Add another book'}</label><div class="inline-code"><input id="extra-code" name="code" placeholder="Book code" autocapitalize="characters" spellcheck="false" autocomplete="off" required maxlength="80"><button class="primary-button" type="submit" aria-label="Add this book">${icon('plus')}</button></div><p id="link-error" class="form-error" role="alert"></p></form>`,'books-dialog');
}
function wordDialog(id) {
  const word=getWord(id);if(!word)return;
  const pictured=wordArt(word);
  showDialog(`<div class="dialog-heading"><span class="eyebrow">WORD BANK</span><button class="round-button" data-dialog-close aria-label="Close">${icon('close')}</button></div><h2 id="dialog-title" class="word-detail-title">${esc(word.term)}</h2>${pictured?rasterMarkup(pictured,'word-detail-image',word.term):''}<p class="word-meaning">${esc(word.spanish||word.meaning)}</p><p class="word-example">${esc(word.example || '')}</p>${state.audioManifest[word.id]?`<button class="secondary-button" data-speak="${esc(word.id)}">Play audio ${icon('sound')}</button>`:''}`,'word-dialog');
}
function speak(id) {const word=getWord(id);if(word)speakSelection(word.term);}
async function redeem(form) {
  if(state.busy)return;const button=form.querySelector('button[type=submit]');const error=form.querySelector('.form-error');const input=form.elements.code;
  state.busy=true;button.disabled=true;button.innerHTML='Opening your book…';error.textContent='';
  try {const response=await api.redeem(input.value);input.value='';setSession(response);state.avatarDraft=null;state.route=(!profile().displayName||profile().displayName==='Brighton learner')?'profile':'learn';location.hash=state.route;render();if(state.route==='profile')loadSocial();handleInvite();notify('Book opened.','success');}
  catch(issue){error.textContent=issue.message;button.disabled=false;button.innerHTML=`Open ${icon('arrow')}`;}
  finally{state.busy=false;}
}
async function linkBook(form) {
  if(state.busy)return;const button=form.querySelector('button');const error=form.querySelector('.form-error');state.busy=true;button.disabled=true;error.textContent='';
  try {const response=await api.linkBook(form.elements.code.value);setSession(response);form.elements.code.value='';closeDialog();render();notify('Book added.','success');}
  catch(issue){error.textContent=issue.message;button.disabled=false;}
  finally{state.busy=false;}
}
async function saveProfile(form) {
  if(state.busy)return;state.busy=true;const button=form.querySelector('button[type=submit]');button.disabled=true;const error=form.querySelector('.form-error');error.textContent='';
  const patch={displayName:form.elements.displayName.value.trim(),dateOfBirth:form.elements.dateOfBirth.value || null,goal:Number(form.elements.goal.value),avatar:state.avatarDraft,timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone};
  if(!patch.displayName){error.textContent='Name';button.disabled=false;state.busy=false;return;}
  try {const response=await api.updateProfile(patch);setSession(response.profile?response:{profile:{...profile(),...patch}});notify('Profile saved.','success');state.profileEditing=false;state.social=null;render();loadSocial();}
  catch(issue){error.textContent=issue.message;button.disabled=false;}
  finally{state.busy=false;}
}
on('click','[data-route]',(event,target)=>{event.preventDefault();if(target.dataset.route==='profile')state.profileEditing=false;route(target.dataset.route);if(target.dataset.route==='profile')loadSocial();if(target.dataset.route==='leaderboard'){prepareCompletionSound();loadLeaderboard(true);}});
on('click','[data-jump]',(_,target)=>document.getElementById(`lesson-${target.dataset.jump}`)?.closest('.path-lesson').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'}));
on('click','[data-start-chunk]',(_,target)=>startChunk(target.dataset.startChunk));
app.addEventListener('scroll',event=>{if(event.target.matches?.('.horizontal-path-scroll')){closePathBubble();syncPathPan();}},{capture:true,passive:true});
on('click','[data-path-node]',(event,target)=>pathDetails(target.dataset.pathNode,target,event));
on('click','[data-start-activity]',(_,target)=>startActivity(target.dataset.startActivity));
on('click','[data-audio-text]',(_,target)=>speakSelection(target.dataset.audioText));
on('click','[data-choice]',(_,target)=>{if(state.active?.checked)return;state.active.selected=target.dataset.choice;const q=state.active.questions[state.active.index],choice=q.choices.find(c=>String(c.id)===target.dataset.choice);if(choice&&!q.listening) speakSelection(choice.text);render();});
on('input','#typed-answer',(_,target)=>{if(state.active?.kind!=='quiz')return;state.active.selected=target.value;const check=app.querySelector('[data-action=check-answer]');if(check)check.disabled=!target.value.trim();});
// Pointer-based tile dragging works with mouse, pen and touch; clicks remain available.
let tileDrag=null,suppressTileClick=false;
function clearTileDrag(){tileDrag?.ghost?.remove();tileDrag=null;}
app.addEventListener('pointerdown',event=>{
 const tile=event.target.closest('[data-token],[data-remove-token]');
 if(event.isPrimary===false||!tile||tile.disabled||event.button!==0||state.active?.checked)return;
 tileDrag={tile,id:event.pointerId,x:event.clientX,y:event.clientY,index:Number(tile.dataset.token??tile.dataset.removeToken),activity:state.active};
});
app.addEventListener('pointermove',event=>{
 const d=tileDrag;if(!d||event.pointerId!==d.id)return;
 if(!d.tile.isConnected||state.active!==d.activity){clearTileDrag();return;}
 if(!d.ghost&&Math.hypot(event.clientX-d.x,event.clientY-d.y)<8)return;
 event.preventDefault();
 if(!d.ghost){app.setPointerCapture(event.pointerId);const r=d.tile.getBoundingClientRect(),style=getComputedStyle(d.tile);d.ghost=d.tile.cloneNode(true);d.ghost.removeAttribute('data-token');d.ghost.removeAttribute('data-remove-token');d.ghost.style.cssText=`position:fixed;pointer-events:none;z-index:1000;width:${r.width}px;height:${r.height}px;background:#e9e6df;color:#173e5c;border:1px solid #cbc7bd;border-radius:14px;font:${style.font};opacity:1`;document.body.append(d.ghost);}
 d.ghost.style.left=(event.clientX-d.ghost.offsetWidth/2)+'px';d.ghost.style.top=(event.clientY-d.ghost.offsetHeight/2)+'px';
});
app.addEventListener('pointerup',event=>{
 const d=tileDrag;if(!d||event.pointerId!==d.id)return;
 if(d.ghost){suppressTileClick=true;setTimeout(()=>suppressTileClick=false,0);const target=document.elementFromPoint(event.clientX,event.clientY),answer=target?.closest('.sentence-answer'),bank=target?.closest('.sentence-tokens');
 if(state.active===d.activity&&!d.activity.checked&&(answer||bank)){const order=d.activity.order.filter(i=>i!==d.index);if(answer){const token=target.closest('[data-remove-token]');let pos=order.length;if(token&&Number(token.dataset.removeToken)!==d.index){const r=token.getBoundingClientRect();pos=order.indexOf(Number(token.dataset.removeToken))+(event.clientX>=r.left+r.width/2?1:0);}else if(token)pos=d.activity.order.indexOf(d.index);order.splice(pos,0,d.index);}d.activity.order=order;if(answer)speakOrderToken(d.index);clearTileDrag();updateSentence();}}
 clearTileDrag();
});
app.addEventListener('click',event=>{if(suppressTileClick){event.preventDefault();event.stopImmediatePropagation();}},true);
app.addEventListener('pointercancel',clearTileDrag);window.addEventListener('blur',clearTileDrag);
new MutationObserver(()=>{if(tileDrag&&!tileDrag.tile.isConnected)clearTileDrag();}).observe(app,{childList:true,subtree:true});
on('click','[data-token]',(_,target)=>{state.active.order.push(Number(target.dataset.token));speakOrderToken(Number(target.dataset.token));updateSentence();});
on('click','[data-remove-token]',(_,target)=>{state.active.order=state.active.order.filter(index=>index!==Number(target.dataset.removeToken));updateSentence();});
on('click','[data-memory]',(_,target)=>flipCard(target.dataset.memory));
on('click','[data-match-left]',(_,target)=>chooseMatch('left',target.dataset.matchLeft));
on('click','[data-match-right]',(_,target)=>chooseMatch('right',target.dataset.matchRight));
on('change','input[name=chunk]',(_,target)=>{target.checked?state.selected.add(target.value):state.selected.delete(target.value);render();});
on('change','input[name=practice-topic]',(_,target)=>{const topic=practiceTopics.find(t=>t.id===target.value);if(!topic)return;const selected=topic.type==='grammar'?state.selectedGrammar:state.selected;for(const id of topic.grammarSetIds||topic.chunkIds)target.checked?selected.add(id):selected.delete(id);render();});
app.addEventListener('toggle',event=>{const details=event.target;if(!details.isConnected||!details.matches?.('[data-bank-lesson]')||state.search.trim())return;details.open?state.bankOpen.add(details.dataset.bankLesson):state.bankOpen.delete(details.dataset.bankLesson);},true);
on('input','#word-search',(_,target)=>{state.search=target.value;const start=target.selectionStart;render();const next=document.getElementById('word-search');next.focus();next.setSelectionRange(start,start);});
on('click','[data-word]',(_,target)=>wordDialog(target.dataset.word));
on('click','[data-speak]',(_,target)=>speak(target.dataset.speak));
on('click','[data-grammar]',(_,target)=>{const set=allGrammar.find(g=>g.id===target.dataset.grammar);startQuiz({mode:'grammar',grammarSetIds:[target.dataset.grammar],count:8,activityId:`practice-${target.dataset.grammar}`},set?.title || 'Grammar');});
on('change','#round-length',(_,target)=>{state.roundLength=target.value==='all'?'all':Number(target.value);});
on('click','[data-mix]',(_,target)=>{const mode=target.dataset.mix,grammar=mode==='recall'&&state.selectedGrammar.size>0,words=state.selected.size>0;if(!words&&!grammar)return;const options={chunkIds:[...state.selected],...(grammar?{grammarSetIds:[...state.selectedGrammar]}:{}),mode:grammar?(words?'mixed':'grammar'):mode==='listening'?'listening':'recall',count:state.roundLength,activityId:`mix-${mode}`};['memory','matching'].includes(mode)?startGame(mode,options):startQuiz(options,grammar?(words?'Mixed practice':'Grammar practice'):'Vocabulary practice');});
on('click','[data-avatar-group]',(_,target)=>{state.avatarDraft[target.dataset.avatarGroup]=target.dataset.avatarValue;const form=app.querySelector('#profile-form');state.profileDraft=form?Object.fromEntries(new FormData(form)):state.profileDraft;const scroll=window.scrollY;render();if(state.profileDraft){for(const [key,value]of Object.entries(state.profileDraft)){const input=app.querySelector(`#profile-form [name="${key}"]`);if(input)input.value=value;}}window.scrollTo({top:scroll,behavior:'instant'});avatarFeedback();});
on('submit','#redeem-form',(event,form)=>{event.preventDefault();redeem(form);});
on('submit','#profile-form',(event,form)=>{event.preventDefault();saveProfile(form);});
on('submit','#text-answer-form',event=>{event.preventDefault();gradeCurrent();});
on('click','[data-action]',async(_,target)=>{
  switch(target.dataset.action){
    case'friend-challenges':return showChallenges();case'challenge-retry':return saveChallenge(state.active);case'challenge-close':state.active=null;return route('profile');
    case'edit-profile':state.profileEditing=true;state.avatarDraft=null;state.profileDraft=null;return render();case'close-profile-editor':state.profileEditing=false;state.avatarDraft=null;state.profileDraft=null;render();return loadSocial();case'find-friends':return findFriends();case'invite-friends':return inviteFriends();case'retry-social':return state.route==='person'?openPerson(state.personTarget):loadSocial();
    case'refresh-board':prepareCompletionSound();return loadLeaderboard(true);case'dismiss-rank':dismissRank(state.leaderboard);return render();
    case'books':return booksDialog();case'add-book':return booksDialog(true);
    case'word-bank':return route('bank');case'practice-sets':return route('practice');
    case'select-all':{const clear=allPracticeSelected();state.selected=clear?new Set():new Set(practiceChunkIds);state.selectedGrammar=clear?new Set():new Set(practiceGrammarIds);return render();}
    case'mix-unit':state.selected=new Set(allChunks.map(chunk=>chunk.id));return route('practice');
    case'toggle-feedback-sound':{const enabled=setFeedbackSoundsEnabled(!feedbackSoundsEnabled());target.setAttribute('aria-pressed',String(enabled));target.setAttribute('aria-label',enabled?'Mute sound effects':'Enable sound effects');target.title=enabled?'Sound effects on':'Sound effects off';target.classList.toggle('muted',!enabled);return;}case'skip-audio':return skipAudio();case'check-answer':return gradeCurrent();case'next-question':return nextQuestion();
    case'clear-sentence':state.active.order=[];return updateSentence();
    case'hint':state.active.hintUsed=true;return render();
    case'finish-game':return finishActivity();
    case'back-to-path':stopAudio();state.active=null;return route('learn');
    case'completion-continue':return advanceCompletion();
    case'play-again':return advanceCompletion('repeat');
    case'retry-save':return saveActivityResult(state.active);
    case'streak-results':{if(state.active?.kind!=='result'||!state.active.saved||Number(state.active.streakElapsed||0)<STREAK_DURATION)return;return advanceCompletion();}
    case'leave-activity':return showDialog(`<div class="dialog-heading"><h2 id="dialog-title">Leave practice?</h2><button class="round-button" data-dialog-close aria-label="Close">${icon('close')}</button></div><p>This round will not be saved.</p><div class="dialog-actions"><button class="primary-button" data-dialog-close>Continue</button><button class="text-button" data-leave-confirm>Back to lessons</button></div>`);
    case'sign-out':return showDialog(`<div class="dialog-heading"><h2 id="dialog-title">Sign out?</h2><button class="round-button" data-dialog-close aria-label="Close">${icon('close')}</button></div><p>You can sign in again with your book code.</p><div class="dialog-actions"><button class="primary-button" data-signout-confirm>Sign out</button><button class="text-button" data-dialog-close>Cancel</button></div>`);
    case'demo-codes':{let codes=window.HORIZONS_CONFIG?.demoCodes || [];if(!codes.length){try{const response=await fetch('./demo-codes.json');if(response.ok){const data=await response.json();codes=data.codes || data;}}catch{}}return showDialog(`<div class="dialog-heading"><h2 id="dialog-title">Example codes</h2><button class="round-button" data-dialog-close aria-label="Close">${icon('close')}</button></div><p>These example book codes open a shared demonstration profile. Use a made-up name and date.</p>${codes.length?`<div class="demo-code-list">${codes.map(item=>{const code=typeof item==='string'?item:item.code;return `<button data-use-demo="${esc(code)}"><b>${esc(code)}</b><small>${esc(typeof item==='string'?'Horizons A1':item.label || item.title || 'Horizons A1')}</small>${icon('arrow')}</button>`;}).join('')}</div>`:'<p>Example codes are being prepared. Your Brighton book code can be used in the main field.</p>'}`);}
  }
});
on('click','[data-start-path]',(_,target)=>{const id=target.dataset.startPath;closeDialog();startActivity(id);},dialog);
on('click','[data-dialog-close]',()=>closeDialog(),dialog);
on('submit','#link-book-form',(event,form)=>{event.preventDefault();linkBook(form);},dialog);
on('click','[data-select-book]',(_,target)=>{state.bookId=target.dataset.selectBook;closeDialog();state.active=null;route('learn');api.updateProfile({defaultBookId:state.bookId}).then(setSession).catch(()=>{});},dialog);
on('click','[data-use-demo]',(_,target)=>{closeDialog();const input=document.getElementById('book-code');if(input){input.value=target.dataset.useDemo;input.focus();}},dialog);
on('click','[data-speak]',(_,target)=>speak(target.dataset.speak),dialog);
on('click','[data-leave-confirm]',()=>{stopAudio();closeDialog();state.active=null;route('learn');},dialog);
on('click','[data-signout-confirm]',async()=>{closeDialog();try{await api.signOut();}catch{}state.session=null;state.leaderboard=null;state.boardError=null;state.social=null;state.personData=null;state.profileEditing=false;state.active=null;state.bookId=null;state.avatarDraft=null;location.hash='';render();},dialog);
dialog.addEventListener('click',event=>{if(event.target===dialog){const bounds=dialog.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)closeDialog();}});
window.addEventListener('hashchange',()=>{const hash=location.hash.slice(1);if(hash.startsWith('person/')){const id=decodeURIComponent(hash.slice(7));if(state.route!=='person'||state.personTarget!==id)openPerson(id);return;}if(hash==='progress'){route('learn');return;}if(['learn','practice','bank','profile','leaderboard'].includes(hash)&&hash!==state.route){stopAudio();state.route=hash;state.active=null;if(hash==='profile'){state.profileEditing=false;loadSocial();}render();window.scrollTo({top:0,behavior:'instant'});}});
window.addEventListener('resize',layoutPaths);
window.addEventListener('offline',()=>notify('You are offline.'));
window.addEventListener('online',()=>notify('Connected.','success'));
document.addEventListener('keydown',event=>{
 const active=state.active,target=event.target;
 if(active?.kind==='quiz'&&!active.checked&&!event.defaultPrevented&&!event.repeat&&!event.ctrlKey&&!event.altKey&&!event.metaKey&&!event.shiftKey&&/^[1-9]$/.test(event.key)&&!document.querySelector('dialog[open]')&&!target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"])')){
  const option=document.querySelectorAll('.activity-page .answer-options [data-choice]')[Number(event.key)-1];
  if(option&&!option.disabled){event.preventDefault();option.click();return;}
 }
 if(event.key==='Enter'&&active?.kind==='quiz'&&!['TEXTAREA','BUTTON'].includes(document.activeElement?.tagName)){event.preventDefault();active.checked?nextQuestion():gradeCurrent();}
});

async function boot() {
  await Promise.all([fetch('./assets/audio/answer-models-v1/lookup.json').then(r=>r.ok?r.json():{}).then(data=>{state.answerAudio=data;}).catch(()=>{}),loadArt(),fetch('./assets/audio/manifest.json').then(response=>response.ok?response.json():{}).then(data=>{state.audioManifest=data.files || {};}).catch(()=>{})]);
  state.route=['learn','practice','bank','profile','leaderboard'].includes(location.hash.slice(1))?location.hash.slice(1):'learn';if(location.hash==='#progress')history.replaceState(null,'','#learn');
  if(getSessionToken()) {
    try {setSession(await api.getSession());}catch(error){if(error.status===401)forgetSession();else notify(error.message);}
  }
  render();
  if('serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./service-worker.js',{updateViaCache:'none'}).catch(()=>{});
}
boot().then(()=>{if(state.route==='leaderboard')loadLeaderboard();if(state.route==='profile')loadSocial();if(state.session&&location.hash.startsWith('#person/'))openPerson(decodeURIComponent(location.hash.slice(8)));handleInvite();}).catch(error=>{console.error(error);app.removeAttribute('aria-busy');app.innerHTML=`<main class="recovery-screen"><span class="wordmark">HORIZONS</span><h1>Unable to open Horizons</h1><p>Check your connection and try again.</p><button class="primary-button" id="boot-retry">Try again</button></main>`;document.getElementById('boot-retry').addEventListener('click',()=>location.reload());});
window.HorizonsApp={getState:()=>{const a=state.active,q=a?.questions?.[a.index];return{signedIn:Boolean(state.session),route:state.route,bookId:state.bookId,activity:a?.kind||null,activityId:a?.options?.activityId||null,options:a?.options?Object.fromEntries(['seed','mode','count','chunkIds','lessonIds','grammarSetIds','audioEnabled','audioFallbackQuestionIds'].filter(k=>a.options[k]!==undefined).map(k=>[k,a.options[k]])):null,index:a?.index??null,checked:Boolean(a?.checked),saved:Boolean(a?.saved),question:q?Object.fromEntries(['id','type','prompt','listening','listenFor','wordIds','originListening'].filter(k=>q[k]!==undefined).map(k=>[k,q[k]])):null};},reload:()=>boot()};

// Track the visible area on browsers that overlay the keyboard on the layout viewport.
function syncExerciseKeyboardViewport(){
 const viewport=window.visualViewport;
 const typing=document.activeElement?.matches('#typed-answer:not(:disabled)');
 const keyboard=innerWidth<=760&&typing&&viewport&&innerHeight-viewport.height>100;
 document.documentElement.classList.toggle('exercise-keyboard-open',Boolean(keyboard));
 document.documentElement.style.setProperty('--exercise-visible-height',(viewport?.height||innerHeight)+'px');
}
window.visualViewport?.addEventListener('resize',syncExerciseKeyboardViewport);
window.addEventListener('resize',syncExerciseKeyboardViewport);
document.addEventListener('focusin',syncExerciseKeyboardViewport);
document.addEventListener('focusout',()=>requestAnimationFrame(syncExerciseKeyboardViewport));

async function loadLeaderboard(playEntrance=false){if(state.boardBusy||!state.session)return;state.boardBusy=true;state.boardError=null;const old=new Map([...app.querySelectorAll('[data-competitor]')].map(el=>[el.dataset.competitor,el.getBoundingClientRect().top])),scroll=app.querySelector('.board-list')?.scrollTop||0;const owner=profile().id;try{const response=await api.getLeaderboard();if(profile().id!==owner)return;state.leaderboard=response;}catch(error){state.boardError=error.message;}finally{state.boardBusy=false;}if(state.route!=='leaderboard'||state.active)return;render();const list=app.querySelector('.board-list');if(list)list.scrollTop=scroll;if(!matchMedia('(prefers-reduced-motion:reduce)').matches)for(const el of app.querySelectorAll('[data-competitor]')){const top=old.get(el.dataset.competitor);if(top!==undefined){const dy=top-el.getBoundingClientRect().top;if(Math.abs(dy)>1)el.animate([{transform:`translateY(${dy}px)`},{transform:'none'}],{duration:650,easing:'cubic-bezier(.2,.8,.3,1)'});}}app.querySelector('.rank-reveal')?.focus({preventScroll:true});const me=state.leaderboard?.rows.find(row=>row.self),soundKey=me?me.id+':'+state.leaderboard.week+':'+state.leaderboard.rank:null;if(feedbackSoundsEnabled()&&(playEntrance||app.querySelector('.rank-reveal'))&&soundKey&&state.rankSoundKey!==soundKey){state.rankSoundKey=soundKey;playProgressionSound(state.leaderboard.rankName.toLowerCase());}}
setInterval(()=>{if(state.route==='leaderboard'&&!state.active&&!document.hidden)loadLeaderboard();},45000);
window.addEventListener('hashchange',()=>{if(location.hash==='#leaderboard')loadLeaderboard();});

window.addEventListener('keydown',event=>{const reveal=app.querySelector('.rank-reveal');if(!reveal)return;if(event.key==='Tab'){event.preventDefault();reveal.querySelector('button')?.focus();}if(event.key==='Escape'){dismissRank(state.leaderboard);render();app.querySelector('[data-action=refresh-board]')?.focus();}});

function replayResult(){const previous=state.active.previous;state.active=null;if(previous.kind==='quiz'){const options={...previous.options,audioFallbackQuestionIds:[],audioEnabled:previous.audioDisabled?false:previous.options.audioEnabled};if(options.activityId&&allActivities.some(item=>item.id===options.activityId)){const seed=Date.now(),questions=pathNodeById[options.activityId]?selectIslandQuestions(pathNodeById[options.activityId],progress(),{...options,count:8,seed}):getActivityQuestions(options.activityId,{...options,seed});return beginQuiz(questions,{...options,seed},previous.title);}return startQuiz(options,previous.title);}return startGame(previous.kind,previous.options);}
function advanceCompletion(target){const result=state.active;if(result?.kind!=='result'||!result.saved)return;if(target)result.completionTarget=target;result.completionStage=nextCompletionStage(result);result.showStreak=result.completionStage==='streak';if(result.completionStage!=='done'){prepareCompletionSound();if(['achievement','overtake'].includes(result.completionStage)){playProgressionSound(result.completionStage);}clearTimeout(toastTimer);toastBox.className='toast';render();window.scrollTo({top:0,behavior:'instant'});app.querySelector('.overtake-page [data-action=completion-continue],.achievement-page [data-action=completion-continue]')?.focus({preventScroll:true});return;}if(result.completionTarget==='repeat')return replayResult();stopAudio();state.active=null;return route('learn');}

function achievementMarkup(result){const rewards=result.achievements||[];return `<main class="achievement-page"><span class="eyebrow">ACHIEVEMENT UNLOCKED</span><h1>${rewards.length===1?esc(rewards[0].label):'New achievements!'}</h1><div class="achievement-rewards ${rewards.length>1?'multiple':''}">${rewards.map((reward,i)=>`<section class="achievement-reward" style="--reward-index:${i}">${rasterMarkup(reward.asset||reward,'achievement-badge',reward.label)}${rewards.length>1?`<h2>${esc(reward.label)}</h2>`:''}<p>${reward.unlockXp} XP</p></section>`).join('')}</div><p>Ready to wear in your avatar’s pins.</p><button class="primary-button" data-action="completion-continue">Continue ${icon('arrow')}</button></main>`;}

let socialLoad=0,searchSequence=0;
async function loadSocial(){const request=++socialLoad,owner=profile().id;if(!state.session)return;try{const data=await api.getSocialHome();if(profile().id!==owner||request!==socialLoad)return;state.social=data;state.socialError=null;}catch(error){if(profile().id!==owner)return;state.socialError=error.message;}if(state.route==='profile'&&!state.profileEditing)render();}
async function openPerson(id){if(!/^(?:bot-(?:[0-9]|1[0-9])|[a-f0-9-]{36})$/.test(String(id)))return;closeDialog();if(id===state.social?.profile.id){state.profileEditing=false;route('profile');return loadSocial();}state.personTarget=id;state.personData=null;state.personError=null;state.socialTab='friends';state.active=null;state.route='person';location.hash='person/'+encodeURIComponent(id);render();window.scrollTo({top:0,behavior:'instant'});const owner=profile().id;try{const data=await api.getPublicProfile(id);if(profile().id!==owner||state.personTarget!==id)return;state.personData=data;}catch(error){if(state.personTarget!==id)return;state.personError=error.message;}if(state.route==='person')render();}
on('click','[data-person]',(_,target)=>openPerson(target.dataset.person));
on('click','[data-person]',(_,target)=>openPerson(target.dataset.person),dialog);
async function followPerson(button){if(button.disabled)return;const id=button.dataset.followPerson,owner=profile().id;button.disabled=true;try{const response=await api.setFollow(id,button.dataset.unfollow!=='true');if(profile().id!==owner)return;if(state.personTarget===id&&state.route==='person'){const updated=await api.getPublicProfile(id);if(profile().id===owner&&state.personTarget===id&&state.route==='person'){state.personData=updated;render();}}state.social=null;await loadSocial();if(dialog.open){button.textContent=response.profile.isFriend?'Friends ✓':response.profile.isFollowing?'Following ✓':'Follow';button.dataset.unfollow=String(response.profile.isFollowing);button.disabled=false;}}catch(error){notify(error.message);if(button.isConnected)button.disabled=false;}}
on('click','[data-follow-person]',(_,target)=>followPerson(target));on('click','[data-follow-person]',(_,target)=>followPerson(target),dialog);
on('click','[data-social-tab]',(_,target)=>{state.socialTab=target.dataset.socialTab;render();});
function findFriends(){showDialog(`<div class="dialog-heading"><h2 id="dialog-title">Find friends</h2><button class="round-button" data-dialog-close aria-label="Close">${icon('close')}</button></div><label for="friend-search">Name</label><input id="friend-search" class="invite-link" type="search" maxlength="60" autocomplete="off" placeholder="Search by name"><div class="friend-search-results" aria-live="polite"><p>Enter at least two letters.</p></div>`,'friends-dialog');dialog.querySelector('input').focus();}
let friendSearchTimer;
on('input','#friend-search',(_,input)=>{clearTimeout(friendSearchTimer);const query=input.value,sequence=++searchSequence;friendSearchTimer=setTimeout(async()=>{try{const data=await api.searchPeople(query);if(sequence!==searchSequence||!dialog.open||dialog.querySelector('#friend-search')?.value!==query)return;dialog.querySelector('.friend-search-results').innerHTML=data.people.length?data.people.map(p=>personCard(p,avatarMarkup,{follow:true})).join(''):`<p>${query.trim().length<2?'Enter at least two letters.':'No people found.'}</p>`;refreshArtwork(dialog);}catch(error){if(sequence===searchSequence&&dialog.open&&dialog.querySelector('.friend-search-results'))dialog.querySelector('.friend-search-results').textContent=error.message;}},250);},dialog);
async function inviteFriends(){const id=state.social?.profile.id;if(!id)return;const url=new URL(location.pathname,location.origin);url.searchParams.set('invite',id);url.hash='profile';const text='Join me on Horizons';if(navigator.share){try{await navigator.share({title:'Horizons',text,url:url.href});return;}catch(error){if(error.name==='AbortError')return;}}try{await navigator.clipboard.writeText(url.href);notify('Invite link copied.');}catch{showDialog(`<div class="dialog-heading"><h2 id="dialog-title">Invite friends</h2><button class="round-button" data-dialog-close aria-label="Close">${icon('close')}</button></div><p>Share this link with your friend.</p><input class="invite-link" readonly aria-label="Invite link" value="${esc(url.href)}">`);const field=dialog.querySelector('input');field.focus();field.select();}}
function handleInvite(){let id;try{const incoming=new URL(location.href).searchParams.get('invite');if(incoming)sessionStorage.setItem('hz-pending-invite',incoming);id=sessionStorage.getItem('hz-pending-invite');if(state.session&&id){sessionStorage.removeItem('hz-pending-invite');const url=new URL(location.href);url.searchParams.delete('invite');history.replaceState(null,'',url);openPerson(id);}}catch{}}

async function showChallenges(){try{const data=await api.listChallenges();showDialog(`<div class="dialog-heading"><h2 id="dialog-title">Friend challenges</h2><button class="round-button" data-dialog-close aria-label="Close">${icon('close')}</button></div><p>Eight questions. One attempt each. Highest score wins; equal scores are a draw.</p><p>Start a challenge from a friend's profile. Challenge rounds do not award XP.</p><div class="challenge-list">${data.challenges.length?data.challenges.map(c=>challengeCard(c)).join(''):'<p>No challenges yet.</p>'}</div>`,'friends-dialog');refreshArtwork(dialog)}catch(e){notify(e.message)}}
function challengeCard(c,actions=true){return `<section class="challenge-card">${avatarMarkup(c.opponent.avatar,'social-avatar-small',c.opponent.name)}<div><b>${esc(c.opponent.name)}</b><p>${c.status==='complete'?`${c.myScore}/8 · ${c.opponentScore}/8 — ${c.myScore===c.opponentScore?'Draw':c.myScore>c.opponentScore?'You won':'Your friend won'}`:c.status==='waiting'?`You scored ${c.myScore}/8. Waiting for your friend.`:c.status==='invited'?'Invited you':esc(c.status)}</p>${actions&&!['expired','declined'].includes(c.status)?`<button class="text-button" data-open-challenge="${esc(c.id)}">${c.myScore!==null?'View result':c.incoming?'Accept & play':'Play'}</button>`:''}${actions&&c.status==='invited'?`<button class="text-button" data-decline-challenge="${esc(c.id)}">Decline</button>`:''}</div></section>`}
async function playChallenge(id){try{const data=await api.openChallenge(id);closeDialog();if(!data.questions){state.active={kind:'challenge-result',challenge:data.challenge,saved:true};return render()}beginQuiz(data.questions,{...data.options,challengeId:id,practiceUntilCorrect:false},'Friend challenge')}catch(e){notify(e.message)}}
async function saveChallenge(result){if(result.saving)return;clearTimeout(toastTimer);toastBox.className='toast';result.saving=true;result.error='';render();try{const data=await api.submitChallenge(result.challengeId,result.answers);result.challenge=data.challenge;result.saved=true;playCompletionSound(false)}catch(e){result.error=e.message}result.saving=false;if(state.active===result)render()}
function challengeResult(a){if(a.saving)return renderResult({saving:true});return `<main class="challenge-result"><h1>Friend challenge</h1>${a.saved?`${challengeCard(a.challenge,false)}${a.challenge.status==='waiting'?'<p>Your friend can finish their round later. Check Challenges for the result.</p>':''}`:`<p role="alert">${esc(a.error||'Could not save your score.')}</p><button class="primary-button" data-action="challenge-retry">Retry save</button>`}<button class="primary-button" data-action="challenge-close">My profile</button></main>`}
on('click','[data-challenge-friend]',async(_,button)=>{button.disabled=true;try{const data=await api.createChallenge(button.dataset.challengeFriend,crypto.randomUUID());notify('Challenge sent.');await playChallenge(data.challenge.id)}catch(e){notify(e.message)}finally{button.disabled=false}});
on('click','[data-open-challenge]',(_,button)=>playChallenge(button.dataset.openChallenge),dialog);
on('click','[data-decline-challenge]',async(_,button)=>{try{await api.declineChallenge(button.dataset.declineChallenge);await showChallenges()}catch(e){notify(e.message)}},dialog);
