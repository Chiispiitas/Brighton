import {api, APIError, getSessionToken, forgetSession} from './api-client.js';
import {loadArt, artManifest, characterMarkup, avatarMarkup, avatarOptions, defaultAvatar, rasterMarkup, assetURL, refreshCharacterMotion, disposeCharacters, sceneMarkup, wordArt} from './art.js';
import {course, lessons, vocabulary, chunks, grammarSets, activities, games, wordById, chunkById, lessonById} from '../content/unit1.mjs';
import {buildQuiz, getActivityQuestions, getWordsForChunks, getMatchingPairs, checkAnswer} from '../content/engine.mjs';

const app = document.getElementById('app');
const dialog = document.getElementById('app-dialog');
const toastBox = document.getElementById('toast');
const state = {session:null,route:'learn',bookId:null,active:null,selected:new Set(),search:'',busy:false,avatarDraft:null,profileDraft:null,saveError:null,roundLength:8,audioManifest:{}};
let toastTimer;
let wordPlayer;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons = {
 home:'<path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/>',
 practice:'<path d="M5 3h14v18H5Z"/><path d="M8 7h8M8 11h6M8 15h4"/>',
 progress:'<path d="M4 19V9m8 10V3m8 16v-6M2 21h20"/>',
 profile:'<circle cx="12" cy="7" r="4"/><path d="M4 21v-3a8 8 0 0 1 16 0v3"/>',
 book:'<path d="M12 5c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1Z"/><path d="M12 5v15"/>',
 arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
 close:'<path d="m6 6 12 12M6 18 18 6"/>',
 check:'<path d="m5 12 4 4L20 5"/>',
 star:'<path d="m12 2 3 6.5 7 1-5 5 1 7-6-3.5L6 21l1-6.5-5-5 7-1Z"/>',
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
const getWord = id => wordById instanceof Map ? wordById.get(id) : wordById[id];
const getChunk = id => chunkById instanceof Map ? chunkById.get(id) : chunkById[id];
const getLesson = id => lessonById instanceof Map ? lessonById.get(id) : lessonById[id];
const profile = () => state.session?.profile || {};
const progress = () => state.session?.progress || {};
const name = () => profile().displayName || profile().name || 'Explorer';
const xp = () => Number(progress().xp ?? progress().totalXp ?? progress().totalXP ?? 0);
const streak = () => Number(progress().streak ?? progress().currentStreak ?? 0);
const bookList = () => asArray(state.session?.books);
const activeBook = () => bookList().find(book => String(book.id || book.bookId) === String(state.bookId)) || bookList()[0];
const completed = () => new Set((progress().completedActivityIds || progress().completedActivities || []).filter(id=>allActivities.some(activity=>activity.id===id)));
function setSession(value) {
  if (!value) return;
  if (value.profile || value.books || value.progress) state.session = {...(state.session || {}),...value};
  else if (value.session) state.session = value.session;
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
  if (state.active && target !== 'activity') state.active = null;
  state.route = target; location.hash = target; render(); window.scrollTo({top:0,behavior:'instant'});
}
function formatDate(value) {
  const date = new Date(value); return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en',{day:'numeric',month:'short',year:'numeric'});
}
function bookTitle(book) {return book?.title || book?.name || `Horizons ${book?.level || 'A1'}`;}
function isA1Book(book = activeBook()) {return !book || !book.level || String(book.level).toUpperCase() === 'A1';}
function hasBookAccess(book = activeBook()) {if(!book)return false;const status=String(book.status || 'active').toLowerCase();return status==='active'&&(!book.expiresAt||new Date(book.expiresAt).getTime()>Date.now());}
function accessPage(){const book=activeBook();return `<section class="coming-book"><span class="eyebrow">${esc(bookTitle(book))}</span><h1>A fresh chapter is waiting.</h1>${characterMarkup('pico','coming-pico')}<p>${book?.status==='revoked'?'This book code is no longer active.':'Your book’s twelve months of practice have come to an end.'} Add a new book code to keep practising with your profile.</p><button class="primary-button" data-action="books">Add a book code ${icon('book')}</button><button class="text-button" data-route="profile">Visit your profile ${icon('arrow')}</button></section>`;}
function requirePracticeAccess(){if(hasBookAccess()&&isA1Book())return true;state.active=null;state.route='learn';render();notify(hasBookAccess()?'Choose Horizons A1 for these activities.':'Add a new book code to keep practising.');return false;}
function masteryCount() {return Object.values(progress().wordStats || {}).filter(stat => stat.mastered || stat.mastery >= 3).length;}
function practisedCount() {return Object.keys(progress().wordStats || {}).length;}
function rewardItems(){return avatarOptions().find(group=>group.id==='badge')?.options.filter(option=>Number(option.unlockXp)>0) || [];}
function rewardMilestones(){const items=rewardItems();if(!items.length)return '';return `<section class="reward-milestones"><span class="eyebrow">LITTLE MILESTONES</span><h2>Something to make your own.</h2><p>Keep practising to collect pins for your avatar.</p><div>${items.map(item=>`<div class="reward-milestone ${xp()>=item.unlockXp?'earned':''}">${rasterMarkup(item,'reward-pin',item.label)}<b>${esc(item.label)}</b><span>${xp()>=item.unlockXp?'Ready to wear':`${item.unlockXp} XP`}</span></div>`).join('')}</div><button class="text-button" data-route="profile">Visit your avatar ${icon('arrow')}</button></section>`;}
function setupAvatarChoices(){const groups=avatarOptions();for(const button of app.querySelectorAll('[data-avatar-group]')){const group=groups.find(g=>g.id===button.dataset.avatarGroup),option=group?.options.find(o=>o.id===button.dataset.avatarValue);if(!option)continue;const locked=Number(option.unlockXp)>xp();button.disabled=locked;button.classList.toggle('reward-locked',locked);if(option.src||option.asset){button.classList.add('illustrated-avatar-option');button.innerHTML=`${rasterMarkup(option.asset || option,'avatar-option-art','')}<span>${esc(option.label || option.id)}</span>${locked?`<small>${option.unlockXp} XP</small>`:''}`;}else if(locked){const note=document.createElement('small');note.textContent=option.unlockXp+' XP';button.append(note);}}}
function shell(body, current = state.route) {
  return `<div class="app-shell">
    <aside class="sidebar"><a class="brand" href="#learn" data-route="learn"><span class="wordmark">HORIZONS</span><small>Little practice. A wider world.</small></a>
      <nav class="desktop-nav" aria-label="Main navigation">${navItems(current)}</nav>
      <button class="sidebar-person" data-route="profile">${avatarMarkup(profile().avatar,'avatar-small',name())}<span><strong>${esc(name())}</strong><small>Your little corner</small></span></button>
    </aside>
    <div class="workspace"><header class="topbar"><button class="book-switch" data-action="books">${icon('book')}<span>${esc(bookTitle(activeBook()))}</span>${icon('chevron')}</button><div class="topbar-metrics"><span class="metric metric-streak" title="Your current practice streak">${icon('spark')}<b>${streak()}</b><span>day${streak()===1?'':'s'}</span></span><span class="metric metric-xp">${icon('star')}<b>${xp()}</b><span>XP</span></span><button class="top-avatar" data-route="profile" aria-label="Open your profile">${avatarMarkup(profile().avatar,'avatar-tiny',name())}</button></div></header><main id="main-content" class="main-content">${body}</main></div>
    <nav class="mobile-nav" aria-label="Main navigation">${navItems(current)}</nav>
  </div>`;
}
function navItems(current) {return [['learn','home','Learn'],['practice','practice','Practise'],['progress','progress','Progress'],['profile','profile','You']].map(([id,i,title])=>`<button data-route="${id}" class="nav-item ${id===current?'active':''}" ${id===current?'aria-current="page"':''}>${icon(i)}<span>${title}</span></button>`).join('');}
function welcome() {
  return `<main class="welcome"><div class="welcome-brand"><span class="wordmark">HORIZONS</span><span class="brighton-label">BY BRIGHTON</span></div>
    <div class="welcome-layout"><section class="welcome-story"><span class="eyebrow">YOUR BOOK. A NEW ADVENTURE.</span><h1>A little practice.<br>A wider <span>world.</span></h1><p>Useful words. Playful little challenges.<br>Make the English in your book your own.</p>${sceneMarkup('town','welcome-town')}<div class="welcome-companions">${characterMarkup('pico','welcome-pico')}${characterMarkup('mina','welcome-mina')}${characterMarkup('alex','welcome-alex')}${characterMarkup('jo','welcome-jo')}</div><div class="welcome-trail" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div></section>
    <section class="redeem-panel"><div class="welcome-sun" aria-hidden="true">${icon('spark')}</div><h2>Your adventure <br>starts here.</h2><p>Enter the code from your Horizons book.</p><form id="redeem-form" class="code-form"><label for="book-code">Book code</label><input id="book-code" name="code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Your book code" required maxlength="80"><p id="code-error" class="form-error" role="alert"></p><button class="primary-button full-width" type="submit">Let’s go ${icon('arrow')}</button></form><p class="quiet-note">This device will remember you. Use the same code on another device to pick up where you left off.</p><div class="demo-codes"><span>Just looking around?</span><button type="button" data-action="demo-codes">Try an example book code</button></div><p class="welcome-footnote">Twelve months of practice from your first visit.</p></section></div>
  </main>`;
}
function home() {
  if (!hasBookAccess()) return accessPage();
  if (!isA1Book()) return `<section class="coming-book"><span class="eyebrow">${esc(bookTitle(activeBook()))}</span><h1>A new horizon is waiting.</h1>${characterMarkup('pico','coming-pico')}<p>Your book is linked to your profile. Its practice activities will appear here when they are available.</p><button class="primary-button" data-action="books">Choose a book ${icon('book')}</button></section>`;
  const next = allActivities.find(activity => !completed().has(activity.id)) || allActivities[0];
  const done = allActivities.filter(activity=>completed().has(activity.id)).length;
  return `<section class="learn-hero"><div class="hero-copy"><span class="eyebrow">A1 · UNIT 1 · NEW FRIENDS</span><h1>Your world<br>gets <span>bigger.</span></h1><p>Hi, ${esc(name().split(' ')[0])}. Ready to meet someone new?</p><button class="hero-continue" data-start-activity="${esc(next?.id || '')}">${done?'Continue':'Let’s start'} ${icon('arrow')}</button><div class="hero-progress" aria-label="${done} of ${allActivities.length} activities completed"><span class="hero-progress-track"><i style="width:${allActivities.length?done/allActivities.length*100:0}%"></i></span><small>${done} of ${allActivities.length} adventures</small></div></div>${characterMarkup('pico','hero-pico')}<span class="hero-spark spark-one" aria-hidden="true">✦</span><span class="hero-spark spark-two" aria-hidden="true">✦</span></section>
    <div class="learn-layout"><section class="learning-path" aria-label="Unit 1 learning path"><div class="path-intro"><span class="eyebrow">YOUR PATH</span><h2>Small steps. Real English.</h2><p>Follow the path, or jump into any lesson.</p><nav class="lesson-jumps" aria-label="Jump to a lesson">${allLessons.map(lesson=>`<button data-jump="${esc(lesson.id)}">${esc(lesson.id)}</button>`).join('')}</nav></div>
      ${allLessons.map((lesson,index)=>lessonPath(lesson,index)).join('')}
      <div class="path-finish"><span>${icon('star')}</span><h3>Look how far you’ve come.</h3><p>Mix the whole unit and make it stick.</p><button class="primary-button" data-action="mix-unit">Mix Unit 1 ${icon('repeat')}</button></div>
    </section><aside class="learn-aside"><div class="daily-invitation"><span class="eyebrow">A MOMENT FOR YOU</span><h3>Five minutes<br>go a long way.</h3><p>Keep your words fresh with a little mixed practice.</p><button class="text-button" data-route="practice">Make a mix ${icon('arrow')}</button></div><div class="town-peek">${characterMarkup('jo','aside-jo')}<p>“Try a little.<br>Try again.<br>That’s how it grows.”</p></div><div class="word-collection"><span>${icon('book')}</span><b>${practisedCount()}</b><p>words you’ve practised</p><button class="text-button" data-action="word-bank">Explore your word bank ${icon('arrow')}</button></div></aside></div>`;
}
function lessonPath(lesson,index) {
  const lessonChunks = allChunks.filter(chunk=>chunk.lessonId===lesson.id);
  const lessonActivities = allActivities.filter(activity=>(activity.lessonId || activity.lessonIds?.[0])===lesson.id);
  const extras = lessonActivities.filter(activity=>!['quiz','vocabulary'].includes(activity.type));
  const character = lesson.character || ['mina','alex','jo','mina'][index];
  const stops=lessonChunks.map((chunk,i)=>{const activity=allActivities.find(a=>a.chunkIds?.includes(chunk.id)&&['quiz','vocabulary'].includes(a.type));const id=activity?.id || `chunk:${chunk.id}`;return `<button class="path-stop stop-${i%3} ${completed().has(id)?'completed':''}" data-start-chunk="${esc(chunk.id)}"><span class="stop-orb">${icon(completed().has(id)?'check':i%2?'sound':'star')}</span><span class="stop-label"><b>${esc(chunk.title)}</b><small>${chunk.wordIds?.length || 0} words · ${chunk.estimatedMinutes || 3} min</small></span></button>`;});
  stops.push(...extras.map((activity,i)=>`<button class="path-stop game-stop stop-${(i+lessonChunks.length)%3} ${completed().has(activity.id)?'completed':''}" data-start-activity="${esc(activity.id)}"><span class="stop-orb">${icon(completed().has(activity.id)?'check':activity.type==='grammar'?'practice':'spark')}</span><span class="stop-label"><b>${esc(activity.title || 'Play and practise')}</b><small>${activity.type==='grammar'?'Grammar':activity.type==='memory'?'Memory game':activity.type==='matching'?'Matching game':activity.type==='listening'?'Listen and try':activity.type==='reading'?'Read and discover':'Build and play'} · ${activity.estimatedMinutes || 3} min</small></span></button>`));
  const moments=['Hello, new friend!','Look at all your new words.','You can try. You can try again.'];
  return `<section class="path-lesson lesson-${index+1}" aria-labelledby="lesson-${esc(lesson.id)}"><div class="lesson-landmark"><span class="lesson-marker">${esc(lesson.id)}</span><div><span class="eyebrow">LESSON ${esc(lesson.id)}</span><h2 id="lesson-${esc(lesson.id)}">${esc(lesson.title)}</h2><p>${esc(lesson.subtitle || '')}</p></div>${characterMarkup(character,'lesson-guide',index%2?'wave':'idle')}</div>
    <div class="lesson-trail"><svg class="trail-line" aria-hidden="true"><path/></svg>${stops.map((stop,i)=>stop+((i+1)%5===0&&i<stops.length-1?`<div class="trail-moment"><p>${moments[Math.floor(i/5)%moments.length]}</p>${characterMarkup(character,'trail-friend',Math.floor(i/5)%2?'celebrate':'wave')}</div>`:'')).join('')}</div></section>`;
}
function layoutPaths(){for(const trail of app.querySelectorAll('.lesson-trail')){const rect=trail.getBoundingClientRect(),svg=trail.querySelector('.trail-line'),points=[...trail.querySelectorAll('.stop-orb')].map(orb=>{const box=orb.getBoundingClientRect();return{x:box.left-rect.left+box.width/2,y:box.top-rect.top+box.height/2};});if(!points.length||!rect.width)continue;svg.setAttribute('viewBox',`0 0 ${rect.width} ${rect.height}`);let d=`M${points[0].x},${points[0].y}`;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dy=(b.y-a.y)*.6;d+=` C${a.x},${a.y+dy} ${b.x},${b.y-dy} ${b.x},${b.y}`;}svg.querySelector('path').setAttribute('d',d);}}
function practice() {
  const selectedWords = state.selected.size ? getWordsForChunks([...state.selected]) : [];
  return `<section class="page-heading practice-heading"><div><span class="eyebrow">MAKE IT YOURS</span><h1>A little mix.<br>A lot to remember.</h1><p>Choose a few word sets. Bring them together.</p></div>${characterMarkup('alex','page-character')}</section>
    <div class="practice-toolbar"><div class="segmented"><button class="selected" data-action="practice-sets">Word sets</button><button data-action="word-bank">Word bank</button></div><button class="text-button" data-action="select-all">${state.selected.size===allChunks.length?'Clear all':'Choose all'}</button></div>
    <section class="chunk-picker" aria-label="Choose vocabulary sets">${allLessons.map(lesson=>`<div class="pick-lesson"><div class="pick-heading"><span class="mini-lesson">${esc(lesson.id)}</span><h2>${esc(lesson.title)}</h2></div><div class="chunk-options">${allChunks.filter(chunk=>chunk.lessonId===lesson.id).map(chunk=>`<label class="chunk-option ${state.selected.has(chunk.id)?'chosen':''}"><input type="checkbox" name="chunk" value="${esc(chunk.id)}" ${state.selected.has(chunk.id)?'checked':''}><span class="chunk-check">${icon('check')}</span><span><b>${esc(chunk.title)}</b><small>${chunk.wordIds?.length || 0} words</small></span></label>`).join('')}</div></div>`).join('')}</section>
    <section class="mix-launch"><div><span class="eyebrow">YOUR MIX</span><h2>${selectedWords.length || 'A few'} ${selectedWords.length===1?'word':'words'}, endless possibilities.</h2><p>${state.selected.size?`${state.selected.size} set${state.selected.size===1?'':'s'} selected. Choose your way to practise.`:'Choose at least one set above to start.'}</p></div><label class="round-length">How much shall we try?<select id="round-length"><option value="8" ${state.roundLength===8?'selected':''}>8 little challenges</option><option value="16" ${state.roundLength===16?'selected':''}>16 little challenges</option><option value="all" ${state.roundLength==='all'?'selected':''}>Every selected word</option></select></label><div class="mix-actions"><button class="primary-button" data-mix="quiz" ${state.selected.size?'':'disabled'}>Quick quiz ${icon('arrow')}</button><button class="secondary-button" data-mix="recall" ${state.selected.size?'':'disabled'}>Type it ${icon('practice')}</button><button class="secondary-button" data-mix="memory" ${selectedWords.length>=3?'':'disabled'}>Memory ${icon('spark')}</button><button class="secondary-button" data-mix="matching" ${selectedWords.length>=3?'':'disabled'}>Make a match ${icon('repeat')}</button></div></section>
    <section class="grammar-shelf"><span class="eyebrow">PUT THE WORDS TO WORK</span><h2>A little grammar, too.</h2><div class="grammar-options">${allGrammar.map(set=>`<button data-grammar="${esc(set.id)}"><span class="mini-lesson">${esc(set.lessonId || set.lessonIds?.[0] || '1')}</span><span><b>${esc(set.title || set.name || 'Grammar practice')}</b><small>Try it in a sentence</small></span>${icon('arrow')}</button>`).join('')}</div></section>`;
}
function wordBank() {
  const query = state.search.trim().toLowerCase();
  const words = asArray(vocabulary).filter(word=>!query||`${word.term} ${word.meaning}`.toLowerCase().includes(query));
  return `<section class="page-heading"><div><span class="eyebrow">YOUR WORD COLLECTION</span><h1>Words for<br>a wider world.</h1><p>The full Unit 1 word bank, ready whenever you are.</p></div>${characterMarkup('mina','page-character')}</section><div class="bank-toolbar"><label class="search-field">${icon('search')}<input id="word-search" type="search" value="${esc(state.search)}" placeholder="Find a word" aria-label="Find a word"></label><button class="text-button" data-route="practice">Make a practice mix ${icon('arrow')}</button></div><section class="word-grid" aria-label="Vocabulary word bank">${words.map(word=>`<button class="word-tile" data-word="${esc(word.id)}"><b>${esc(word.term)}</b><span>${esc(word.meaning)}</span>${progress().wordStats?.[word.id]?.mastered?`<small>${icon('check')} Remembered</small>`:''}</button>`).join('')}${words.length?'':'<p class="empty-message">No words found. Try another spelling.</p>'}</section>`;
}
function progressPage() {
  const done=completed().size, total=allActivities.length;
  const dates = progress().activeDays || progress().activityDays || progress().days || [];
  const today = new Date();
  const week = Array.from({length:7},(_,i)=>{const d=new Date(today);d.setDate(d.getDate()-6+i);const iso=d.toISOString().slice(0,10);return {label:d.toLocaleDateString('en',{weekday:'narrow'}),date:iso,active:Array.isArray(dates)?dates.some(day=>(typeof day==='string'?day:day.date)===iso):Boolean(dates[iso])};});
  return `<section class="progress-hero"><div><span class="eyebrow">YOUR PROGRESS</span><h1>Look at you<br><span>growing.</span></h1><p>Every little try takes you somewhere new.</p><div class="progress-big-stats"><div><b>${xp()}</b><span>total XP</span></div><div><b>${streak()}</b><span>day streak</span></div></div></div>${characterMarkup('pico','progress-pico','celebrate')}<div class="week-days" aria-label="Your last seven practice days">${week.map(day=>`<span class="week-day ${day.active?'active':''}"><small>${day.label}</small><i>${day.active?icon('check'):''}</i></span>`).join('')}</div></section>
    <section class="progress-stat-row"><div><span>${icon('book')}</span><b>${practisedCount()}</b><h3>Words practised</h3><p>Every word has a first adventure.</p></div><div><span>${icon('star')}</span><b>${masteryCount()}</b><h3>Words remembered</h3><p>Correct recall makes words stick.</p></div><div><span>${icon('check')}</span><b>${done}</b><h3>Activities completed</h3><p>Out of ${total} Unit 1 challenges.</p></div></section>
    <section class="lesson-progress"><span class="eyebrow">YOUR BOOK JOURNEY</span><h2>One lesson at a time.</h2>${allLessons.map(lesson=>{const ids=allActivities.filter(a=>(a.lessonId||a.lessonIds?.[0])===lesson.id).map(a=>a.id);const count=ids.filter(id=>completed().has(id)).length;return `<div class="lesson-progress-row"><span class="mini-lesson">${lesson.id}</span><div><b>${esc(lesson.title)}</b><span class="plain-track"><i style="width:${ids.length?count/ids.length*100:0}%"></i></span></div><span>${count}/${ids.length}</span></div>`;}).join('')}</section>${rewardMilestones()}<section class="gentle-goal"><div>${characterMarkup('jo','goal-jo')}</div><div><span class="eyebrow">YOUR OWN PACE</span><h2>Small habits.<br>Big horizons.</h2><p>Your goal is ${esc(String(profile().goal || '5'))} minutes of practice. A fresh start is always welcome.</p><button class="text-button" data-route="learn">Take the next little step ${icon('arrow')}</button></div></section>`;
}
function profilePage() {
  const p = profile();
  if (!state.avatarDraft) state.avatarDraft={...defaultAvatar(),...(p.avatar || {})};
  return `<section class="profile-heading"><span class="eyebrow">YOUR LITTLE CORNER</span><h1>Hello, ${esc(name().split(' ')[0])}.</h1><p>Make yourself at home.</p></section><div class="profile-layout"><section class="avatar-studio"><div class="avatar-preview" id="avatar-preview">${avatarMarkup(state.avatarDraft,'avatar-large',name())}<span class="avatar-studio-spark" aria-hidden="true">✦</span></div><div class="avatar-options">${avatarOptions().map(group=>`<fieldset><legend>${esc(group.label)}</legend><div class="avatar-option-row">${(group.options||[]).map(option=>`<button type="button" class="avatar-option ${state.avatarDraft[group.id]===option.id?'selected':''}" data-avatar-group="${esc(group.id)}" data-avatar-value="${esc(option.id)}" aria-pressed="${state.avatarDraft[group.id]===option.id}" aria-label="${esc(option.label || option.name || option.id)}">${option.swatch?`<span class="avatar-swatch" style="background:${esc(option.swatch)}"></span>`:option.thumbnail?rasterMarkup(option.thumbnail,'',''):esc(option.label || option.name || option.id)}</button>`).join('')}</div></fieldset>`).join('')}${avatarOptions().length?'':'<p>Your avatar will appear here when the character artwork finishes loading.</p>'}</div></section>
    <section class="profile-details">${state.session.demo?'<p class="example-profile-note">Example profile — use made-up details.</p>':''}<form id="profile-form"><label for="display-name">What should we call you?</label><input id="display-name" name="displayName" value="${esc(p.displayName || p.name || '')}" maxlength="40" required autocomplete="nickname" placeholder="Your name"><label for="date-of-birth">Date of birth <span class="optional">${state.session.demo?'Example details · optional':'Private · optional'}</span></label><input id="date-of-birth" name="dateOfBirth" type="date" value="${esc((p.dateOfBirth || '').slice(0,10))}" max="${new Date().toISOString().slice(0,10)}"><label for="daily-goal">Your little daily goal</label><select id="daily-goal" name="goal">${[5,10,15,20].map(goal=>`<option value="${goal}" ${Number(p.goal||5)===goal?'selected':''}>${goal} minutes</option>`).join('')}</select><p class="quiet-note">Your profile follows your book codes, so your avatar and progress come with you.</p><p id="profile-error" class="form-error" role="alert"></p><button type="submit" class="primary-button">Save my profile ${icon('check')}</button></form><section class="your-books"><span class="eyebrow">YOUR BOOKS</span>${bookList().map(book=>`<div class="profile-book"><span class="book-level">${esc(book.level || 'A1')}</span><span><b>${esc(bookTitle(book))}</b><small>${book.expiresAt?`Your practice continues until ${formatDate(book.expiresAt)}`:'Ready for your next adventure'}</small></span></div>`).join('')}<button class="text-button" data-action="add-book">Add another book ${icon('plus')}</button></section><button class="sign-out" data-action="sign-out">Leave this device ${icon('exit')}</button></section></div>`;
}
function render() {
  disposeCharacters(app);
  app.removeAttribute('aria-busy');
  if (!state.session) {app.innerHTML=welcome();refreshCharacterMotion(app);return;}
  if (state.active) {app.innerHTML=renderActivity();refreshCharacterMotion(app);return;}
  const pages={learn:home,practice,bank:wordBank,progress:progressPage,profile:profilePage};
  const learningRoute=['learn','practice','bank'].includes(state.route);
  app.innerHTML=shell(learningRoute&&!hasBookAccess()?accessPage():learningRoute&&!isA1Book()?home():(pages[state.route] || home)(),state.route==='bank'?'practice':state.route);
  setupAvatarChoices();
  refreshCharacterMotion(app);
  requestAnimationFrame(layoutPaths);document.fonts.ready.then(layoutPaths);
}
function findChunkActivity(id) {return allActivities.find(a=>a.chunkIds?.includes(id)&&['quiz','vocabulary'].includes(a.type));}
function startChunk(id) {const activity=findChunkActivity(id),lessonId=getChunk(id)?.lessonId;startQuiz({chunkIds:[id],lessonId,lessonIds:lessonId?[lessonId]:[],mode:'vocabulary',count:8,activityId:activity?.id || `chunk:${id}`},getChunk(id)?.title || 'A little word adventure');}
function startActivity(id) {
  if(!requirePracticeAccess())return;
  const activity=allActivities.find(a=>a.id===id);
  if (!activity) {notify('Choose a word set to start your adventure.');return route('practice');}
  if (['memory','matching','countries','opposites'].includes(activity.type)) return startGame(activity.type==='memory'?'memory':'matching',activity);
  const seed=Date.now();let questions;
  try {questions=getActivityQuestions(id,{count:8,seed});} catch {questions=buildQuiz({...activity,count:8,seed});}
  const mode=activity.type==='grammar'?'grammar':activity.type==='review'?'mixed':'vocabulary';
  beginQuiz(questions,{...activity,mode,activityId:id,count:8,seed},activity.title || 'A little practice');
}
function startQuiz(options,title='Your word mix') {
  if(!requirePracticeAccess())return;
  const seed=Date.now();let questions;
  const factoryOptions={...options,seed};if(factoryOptions.activityId&&!allActivities.some(activity=>activity.id===factoryOptions.activityId))delete factoryOptions.activityId;
  try {questions=buildQuiz(factoryOptions);} catch(error) {notify('That mix needs a few more words. Try another set.');console.error(error);return;}
  beginQuiz(questions,{...options,seed},title);
}
function beginQuiz(questions,options,title) {
  if (!Array.isArray(questions)) questions=questions?.questions || [];
  if (!questions.length) {notify('Choose another set and we’ll make a fresh challenge.');return;}
  state.active={kind:'quiz',title,questions,options,index:0,selected:null,order:[],checked:false,answers:[],started:Date.now(),hintUsed:false,saving:false,previewVisible:Boolean(questions[0]?.preview)};
  render();schedulePreview();window.scrollTo({top:0,behavior:'instant'});
}
function schedulePreview(){const current=state.active;if(!current||current.kind!=='quiz'||!current.previewVisible)return;const index=current.index;setTimeout(()=>{if(state.active===current&&current.index===index){current.previewVisible=false;render();document.getElementById('typed-answer')?.focus();}},current.questions[index].previewMs||4500);}
function activityHeader(title,index,total) {return `<header class="activity-header"><button class="round-button" data-action="leave-activity" aria-label="Leave practice">${icon('close')}</button><div><span class="activity-track"><i style="width:${Math.max(0,index/total*100)}%"></i></span><span class="activity-title">${esc(title)}</span></div><span class="activity-count">${index}/${total}</span></header>`;}
function renderActivity() {
  const a=state.active;
  if (a.kind==='result') return renderResult(a);
  if (a.kind==='memory'||a.kind==='matching') return renderGame(a);
  const q=a.questions[a.index];
  const pictured=q.image || wordArt(q.word || getWord(q.wordIds?.[0]));
  const voiced=q.word?.id || q.wordIds?.[0];
  const progressText=a.answers.filter(answer=>answer.correct).length;
  return `<main class="activity-page">${activityHeader(a.title,a.index,a.questions.length)}<section class="question-body"><span class="eyebrow">${q.type==='order'?'BUILD IT':q.audio?'LISTEN CLOSELY':q.type==='text'?'BRING IT BACK':'A LITTLE CHALLENGE'}</span><h1>${esc(q.prompt)}</h1>${voiced&&state.audioManifest[voiced]&&(q.type==='choice'||a.checked)?`<button class="word-pronunciation" data-speak="${esc(voiced)}">${icon('sound')} Hear the word</button>`:''}${q.passage?`<div class="question-passage">${esc(q.passage)}</div>`:''}${a.previewVisible?`<div class="question-preview" role="status"><small>Remember it. It will disappear.</small><b>${esc(Array.isArray(q.preview)?q.preview.join(' '):q.preview)}</b></div>`:''}${q.audio?`<div class="question-audio">${icon('sound')}<audio controls preload="none" src="${esc(assetURL(q.audio))}" aria-label="${esc(q.audioLabel || 'Listen to the conversation')}"></audio></div>`:''}<div class="question-scene">${characterMarkup(a.checked?(a.feedback?.correct?'pico':'mina'):'pico','question-character',a.checked&&a.feedback?.correct?'celebrate':'idle')}${pictured?rasterMarkup(pictured,'question-image','Question picture'):''}</div>
      ${q.type==='order'?renderOrder(q,a):q.type==='text'?`<form id="text-answer-form"><label class="sr-only" for="typed-answer">Your answer</label><input id="typed-answer" class="typed-answer" type="text" autocomplete="off" autocapitalize="sentences" spellcheck="false" placeholder="${a.previewVisible?'Look closely first…':'Write your answer here'}" value="${esc(a.selected || '')}" ${a.checked||a.previewVisible?'disabled':''}></form>`:`<div class="answer-options">${(q.choices || []).map((choice,i)=>`<button class="answer-option ${String(a.selected)===String(choice.id)?'selected':''} ${a.checked&&String(choice.id)===String(q.answer)?'correct':''} ${a.checked&&String(a.selected)===String(choice.id)&&!a.feedback?.correct?'incorrect':''}" data-choice="${esc(choice.id)}" ${a.checked?'disabled':''}><span class="answer-number">${i+1}</span>${choice.image?rasterMarkup(choice.image,'choice-image',choice.text):''}<span>${esc(choice.text)}</span>${a.checked&&String(choice.id)===String(q.answer)?icon('check'):''}</button>`).join('')}</div>`}
      ${q.hint?`<button class="hint-button" data-action="hint" ${a.checked?'disabled':''}>${a.hintUsed?esc(q.hint):'A little help?'}</button>`:''}
    </section><footer class="answer-footer ${a.checked?(a.feedback?.correct?'feedback-correct':'feedback-gentle'):''}">${a.checked?`<div class="answer-feedback" aria-live="polite"><b>${a.feedback.correct?'You’ve got it!':'A little reminder'}</b><p>${esc(a.feedback.correct?(q.explanation || 'That’s another little step forward.'):(a.feedback.feedback || q.explanation || `Try: ${a.feedback.expected}`))}</p></div><button class="primary-button" data-action="next-question">${a.index+1===a.questions.length?'See how you did':'Continue'} ${icon('arrow')}</button>`:`<span class="footer-encouragement">Take your time. You can do this.</span><button class="primary-button" data-action="check-answer" ${hasAnswer(a,q)?'':'disabled'}>Check ${icon('check')}</button>`}</footer></main>`;
}
function renderOrder(q,a) {
  const tokens=q.sentenceTokens || q.tokens || [];
  const value=token=>typeof token==='string'?token:token.text || token.label || token.value;
  return `<div class="sentence-builder"><div class="sentence-answer" aria-label="Your sentence">${a.order.length?a.order.map(index=>`<button data-remove-token="${index}" ${a.checked?'disabled':''}>${esc(value(tokens[index]))}</button>`).join(''):'<span>Bring the words together.</span>'}</div><div class="sentence-tokens">${tokens.map((token,index)=>`<button data-token="${index}" ${a.order.includes(index)||a.checked?'disabled':''}>${esc(value(token))}</button>`).join('')}</div>${a.order.length&&!a.checked?'<button class="text-button" data-action="clear-sentence">Start again</button>':''}</div>`;
}
function hasAnswer(a,q) {return q.type==='order'?a.order.length>0:typeof a.selected==='string'?a.selected.trim().length>0:a.selected!==null;}
function gradeCurrent() {
  const a=state.active;if (!a||a.kind!=='quiz'||a.checked||a.previewVisible) return;const q=a.questions[a.index];
  if (!hasAnswer(a,q)) return;
  const tokens=q.sentenceTokens || q.tokens || [];
  const submitted=q.type==='order'?a.order.map(index=>typeof tokens[index]==='string'?tokens[index]:tokens[index].text || tokens[index].label || tokens[index].value):a.selected;
  let feedback;
  try {feedback=checkAnswer(q,submitted);} catch {feedback={correct:false,expected:q.answer,feedback:q.explanation,wordIds:q.wordIds || []};}
  const serverSubmitted=q.type==='choice'?(q.choices.find(choice=>String(choice.id)===String(submitted))?.text || submitted):submitted;
  a.feedback=feedback;a.checked=true;a.answers.push({questionId:q.id,submitted:serverSubmitted,correct:Boolean(feedback.correct),wordIds:feedback.wordIds || [],hintUsed:a.hintUsed,masteryEligible:Boolean(feedback.masteryEligible)&&!a.hintUsed});
  render();
}
function nextQuestion() {
  const a=state.active;if (!a||a.kind!=='quiz'||!a.checked) return;
  if (a.index+1>=a.questions.length) return finishActivity();
  a.index++;a.selected=null;a.order=[];a.checked=false;a.feedback=null;a.hintUsed=false;a.previewVisible=Boolean(a.questions[a.index]?.preview);render();schedulePreview();window.scrollTo({top:0,behavior:'instant'});
}
function startGame(kind,options) {
  if(!requirePracticeAccess())return;
  const seed=Date.now(),chunkIds=options.chunkIds || [...state.selected],lessonIds=options.lessonIds || (options.lessonId?[options.lessonId]:undefined);let pairs;
  try {pairs=getMatchingPairs({chunkIds,lessonIds,count:6,seed});} catch {notify('Choose a few more words for this game.');return;}
  if (!pairs?.length) {notify('Choose a word set first.');return;}
  const shuffle=values=>values.map(value=>({value,sort:Math.random()})).sort((a,b)=>a.sort-b.sort).map(x=>x.value);
  state.active={kind,title:options.title || (kind==='memory'?'A little memory adventure':'Make a match'),options:{...options,chunkIds,lessonIds,seed,count:6,mode:kind,activityId:options.id || options.activityId || `mix-${kind}`},pairs,cards:shuffle(pairs.flatMap(pair=>[{id:pair.id+'-left',pairId:pair.id,text:pair.left,side:'left'},{id:pair.id+'-right',pairId:pair.id,text:pair.right,side:'right'}])),right:shuffle([...pairs]),matched:[],flipped:[],left:null,rightChoice:null,mistakes:0,moves:0,started:Date.now(),answers:[],locked:false};
  render();window.scrollTo({top:0,behavior:'instant'});
}
function renderGame(a) {
  const finished=a.matched.length===a.pairs.length;
  return `<main class="activity-page game-page">${activityHeader(a.title,a.matched.length,a.pairs.length)}<section class="game-intro"><span class="eyebrow">${a.kind==='memory'?'TURN. REMEMBER. CONNECT.':'FIND THE CONNECTION'}</span><h1>${a.kind==='memory'?'Two little cards.<br>One useful word.':'Words belong together.'}</h1><p>${a.kind==='memory'?'Match each word with its meaning.':'Choose a word, then choose its meaning.'}</p>${characterMarkup(a.kind==='memory'?'alex':'mina','game-character')}</section>
    ${a.kind==='memory'?`<section class="memory-grid" aria-label="Memory game">${a.cards.map(card=>{const matched=a.matched.includes(card.pairId),shown=matched||a.flipped.includes(card.id);return `<button class="memory-card ${shown?'flipped':''} ${matched?'matched':''}" data-memory="${esc(card.id)}" ${matched||a.locked?'disabled':''} aria-label="${shown?esc(card.text):'Turn over a card'}"><span class="memory-back">${icon('spark')}</span><span class="memory-front">${esc(card.text)}</span></button>`;}).join('')}</section>`:`<section class="matching-board"><div>${a.pairs.map(pair=>`<button class="matching-word ${a.left===pair.id?'selected':''} ${a.matched.includes(pair.id)?'matched':''}" data-match-left="${esc(pair.id)}" ${a.matched.includes(pair.id)?'disabled':''}>${esc(pair.left)}${a.matched.includes(pair.id)?icon('check'):''}</button>`).join('')}</div><div>${a.right.map(pair=>`<button class="matching-word ${a.rightChoice===pair.id?'selected':''} ${a.matched.includes(pair.id)?'matched':''}" data-match-right="${esc(pair.id)}" ${a.matched.includes(pair.id)?'disabled':''}>${esc(pair.right)}${a.matched.includes(pair.id)?icon('check'):''}</button>`).join('')}</div></section>`}
    <footer class="game-footer"><span>${a.matched.length} of ${a.pairs.length} pairs found</span>${finished?`<button class="primary-button" data-action="finish-game">Lovely work ${icon('arrow')}</button>`:`<span class="quiet-note">${a.kind==='memory'?`${a.moves} turns · no rush`:'Take your time. Try another connection.'}</span>`}</footer></main>`;
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
  if(a.left&&a.rightChoice){a.moves++;if(a.left===a.rightChoice){const pair=a.pairs.find(item=>item.id===id);a.matched.push(id);a.answers.push({questionId:pair.id,itemId:pair.wordId || pair.id,wordId:pair.wordId,submitted:pair.right,correct:true,wordIds:pair.wordId?[pair.wordId]:[],masteryEligible:false});notify('A lovely little connection.','success');}else{a.mistakes++;notify('Not quite. Try another connection.');}a.left=null;a.rightChoice=null;}
  render();
}
async function finishActivity() {
  const previous=state.active;if(!previous||previous.saving)return;previous.saving=true;
  const correct=previous.answers.filter(answer=>answer.correct).length;
  const total=previous.answers.length;
  const quizOptions={seed:previous.options.seed,mode:previous.kind==='quiz'?(previous.options.mode||'mixed'):previous.kind,count:previous.options.count || previous.questions?.length || 6,chunkIds:previous.options.chunkIds || [],lessonIds:previous.options.lessonIds || (previous.options.lessonId?[previous.options.lessonId]:[]),grammarSetIds:previous.options.grammarSetIds || []};
  const inferredLesson=previous.options.lessonId || quizOptions.lessonIds[0] || getChunk(quizOptions.chunkIds[0])?.lessonId || allGrammar.find(g=>quizOptions.grammarSetIds.includes(g.id))?.lessonId || '1A';
  const attempt={id:crypto.randomUUID(),bookId:'horizons-a1',lessonId:inferredLesson,activityId:previous.options.activityId || previous.options.id || 'mixed-practice',mode:quizOptions.mode,quizOptions,...quizOptions,answers:previous.answers,durationMs:Date.now()-previous.started,mistakes:previous.mistakes || 0};
  state.active={kind:'result',title:previous.title,previous,attempt,correct,total,saving:true,saved:false,oldXp:xp(),error:null};render();
  try {const result=await api.saveAttempt(attempt);setSession(result);state.active.saving=false;state.active.saved=true;state.active.earnedXp=Math.max(0,xp()-state.active.oldXp);const rewards=rewardItems().filter(item=>state.active.oldXp<item.unlockXp&&xp()>=item.unlockXp);render();if(rewards.length)notify(`You earned ${rewards[0].label}. Find it in your avatar’s pins.`,'success');}
  catch(error){state.active.saving=false;state.active.error=error.message;render();}
}
function renderResult(a) {
  const percent=a.total?Math.round(a.correct/a.total*100):0;
  return `<main class="result-page"><a class="result-brand wordmark" href="#learn" data-route="learn">HORIZONS</a><div class="result-character">${characterMarkup('pico','result-pico','celebrate')}</div><span class="eyebrow">A LITTLE FURTHER</span><h1>${percent===100?'Look at you go!':percent>=60?'That’s real progress.':'Every try helps you grow.'}</h1><p>${a.correct} of ${a.total} little challenges remembered.</p><div class="result-stats"><div><b>${percent}%</b><span>this practice</span></div><div><b>${a.saved?`+${a.earnedXp || 0}`:'…'}</b><span>XP ${a.saved?'earned':'saving'}</span></div><div><b>${Math.max(1,Math.round(a.attempt.durationMs/60000))}</b><span>minute${Math.round(a.attempt.durationMs/60000)===1?'':'s'} for you</span></div></div>
    ${a.saving?'<p class="save-note" role="status">Keeping your progress safe…</p>':a.error?`<div class="save-error" role="alert"><p>${esc(a.error)} Your answers are still here.</p><button class="text-button" data-action="retry-save">Save my progress ${icon('repeat')}</button></div>`:'<p class="save-note">Saved. Your progress comes with you.</p>'}
    <div class="result-actions"><button class="primary-button" data-action="back-to-path" ${a.saving?'disabled':''}>Back to my path ${icon('arrow')}</button><button class="text-button" data-action="play-again" ${a.saving?'disabled':''}>A fresh little round ${icon('repeat')}</button></div>${a.correct<a.total?'<p class="quiet-note">The words you missed will be ready for another try.</p>':''}</main>`;
}
function showDialog(content,kind='') {dialog.className=`app-dialog ${kind}`;dialog.innerHTML=content;dialog.showModal();}
function closeDialog(){dialog.close();}
function booksDialog(add=false) {
  showDialog(`<div class="dialog-heading"><div><span class="eyebrow">YOUR BOOKS</span><h2 id="dialog-title">${add?'Another book.<br>The same adventure.':'Where shall we go?'}</h2></div><button class="round-button" data-dialog-close aria-label="Close">${icon('close')}</button></div>${add?'':`<div class="book-library">${bookList().map(book=>`<button data-select-book="${esc(book.id || book.bookId)}" class="library-book ${String(book.id || book.bookId)===String(state.bookId)?'selected':''}"><span class="book-cover-mini"><span class="wordmark">HORIZONS</span><b>${esc(book.level || 'A1')}</b></span><span><b>${esc(bookTitle(book))}</b><small>${book.expiresAt?`Practice until ${formatDate(book.expiresAt)}`:'Ready to explore'}</small></span>${String(book.id || book.bookId)===String(state.bookId)?icon('check'):icon('arrow')}</button>`).join('')}</div>`}<form id="link-book-form"><label for="extra-code">${add?'Your new book code':'Add another book'}</label><div class="inline-code"><input id="extra-code" name="code" placeholder="Book code" autocapitalize="characters" spellcheck="false" autocomplete="off" required maxlength="80"><button class="primary-button" type="submit" aria-label="Add this book">${icon('plus')}</button></div><p class="quiet-note">Your avatar and progress stay together. Any linked valid code can open this profile.</p><p id="link-error" class="form-error" role="alert"></p></form>`,'books-dialog');
}
function wordDialog(id) {
  const word=getWord(id);if(!word)return;
  const pictured=wordArt(word);
  showDialog(`<div class="dialog-heading"><span class="eyebrow">A WORD FOR YOUR WORLD</span><button class="round-button" data-dialog-close aria-label="Close">${icon('close')}</button></div><h2 id="dialog-title" class="word-detail-title">${esc(word.term)}</h2>${pictured?rasterMarkup(pictured,'word-detail-image',word.term):''}<p class="word-meaning">${esc(word.meaning)}</p><p class="word-example">${esc(word.example || '')}</p>${state.audioManifest[word.id]||'speechSynthesis'in window?`<button class="secondary-button" data-speak="${esc(word.id)}">Hear the word ${icon('sound')}</button>${state.audioManifest[word.id]?'':'<p class="quiet-note">Pronunciation uses this device’s English voice.</p>'}`:''}`,'word-dialog');
}
function speak(id) {const word=getWord(id);if(!word)return;if(state.audioManifest[id]){wordPlayer?.pause();wordPlayer=new Audio(assetURL(state.audioManifest[id].src));wordPlayer.play().catch(()=>notify('Tap again to hear the word.'));return;}if(!('speechSynthesis'in window))return;const utterance=new SpeechSynthesisUtterance(word.spoken || word.term);utterance.lang='en-US';utterance.rate=.85;const voice=speechSynthesis.getVoices().find(v=>v.lang==='en-US')||speechSynthesis.getVoices().find(v=>v.lang.startsWith('en'));if(voice)utterance.voice=voice;speechSynthesis.cancel();speechSynthesis.speak(utterance);}
async function redeem(form) {
  if(state.busy)return;const button=form.querySelector('button[type=submit]');const error=form.querySelector('.form-error');const input=form.elements.code;
  state.busy=true;button.disabled=true;button.innerHTML='Opening your book…';error.textContent='';
  try {const response=await api.redeem(input.value);input.value='';setSession(response);state.avatarDraft=null;state.route=(!profile().displayName||profile().displayName==='Brighton learner')?'profile':'learn';location.hash=state.route;render();notify('Welcome to your next little adventure.','success');}
  catch(issue){error.textContent=issue.message;button.disabled=false;button.innerHTML=`Let’s go ${icon('arrow')}`;}
  finally{state.busy=false;}
}
async function linkBook(form) {
  if(state.busy)return;const button=form.querySelector('button');const error=form.querySelector('.form-error');state.busy=true;button.disabled=true;error.textContent='';
  try {const response=await api.linkBook(form.elements.code.value);setSession(response);form.elements.code.value='';closeDialog();render();notify('Another book, one happy little home.','success');}
  catch(issue){error.textContent=issue.message;button.disabled=false;}
  finally{state.busy=false;}
}
async function saveProfile(form) {
  if(state.busy)return;state.busy=true;const button=form.querySelector('button[type=submit]');button.disabled=true;const error=form.querySelector('.form-error');error.textContent='';
  const patch={displayName:form.elements.displayName.value.trim(),dateOfBirth:form.elements.dateOfBirth.value || null,goal:Number(form.elements.goal.value),avatar:state.avatarDraft,timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone};
  if(!patch.displayName){error.textContent='What should we call you?';button.disabled=false;state.busy=false;return;}
  try {const response=await api.updateProfile(patch);setSession(response.profile?response:{profile:{...profile(),...patch}});notify('Looking good. Your profile is saved.','success');render();}
  catch(issue){error.textContent=issue.message;button.disabled=false;}
  finally{state.busy=false;}
}
on('click','[data-route]',(event,target)=>{event.preventDefault();route(target.dataset.route);});
on('click','[data-jump]',(_,target)=>document.getElementById(`lesson-${target.dataset.jump}`)?.closest('.path-lesson').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'}));
on('click','[data-start-chunk]',(_,target)=>startChunk(target.dataset.startChunk));
on('click','[data-start-activity]',(_,target)=>startActivity(target.dataset.startActivity));
on('click','[data-choice]',(_,target)=>{if(state.active?.checked)return;state.active.selected=target.dataset.choice;render();});
on('input','#typed-answer',(_,target)=>{if(state.active?.kind!=='quiz')return;state.active.selected=target.value;const check=app.querySelector('[data-action=check-answer]');if(check)check.disabled=!target.value.trim();});
on('click','[data-token]',(_,target)=>{state.active.order.push(Number(target.dataset.token));render();});
on('click','[data-remove-token]',(_,target)=>{state.active.order=state.active.order.filter(index=>index!==Number(target.dataset.removeToken));render();});
on('click','[data-memory]',(_,target)=>flipCard(target.dataset.memory));
on('click','[data-match-left]',(_,target)=>chooseMatch('left',target.dataset.matchLeft));
on('click','[data-match-right]',(_,target)=>chooseMatch('right',target.dataset.matchRight));
on('change','input[name=chunk]',(_,target)=>{target.checked?state.selected.add(target.value):state.selected.delete(target.value);render();});
on('input','#word-search',(_,target)=>{state.search=target.value;const start=target.selectionStart;render();const next=document.getElementById('word-search');next.focus();next.setSelectionRange(start,start);});
on('click','[data-word]',(_,target)=>wordDialog(target.dataset.word));
on('click','[data-speak]',(_,target)=>speak(target.dataset.speak));
on('click','[data-grammar]',(_,target)=>{const set=allGrammar.find(g=>g.id===target.dataset.grammar);startQuiz({mode:'grammar',grammarSetIds:[target.dataset.grammar],count:8,activityId:`practice-${target.dataset.grammar}`},set?.title || 'A little grammar');});
on('change','#round-length',(_,target)=>{state.roundLength=target.value==='all'?'all':Number(target.value);});
on('click','[data-mix]',(_,target)=>{const mode=target.dataset.mix;const options={chunkIds:[...state.selected],mode:mode==='recall'?'recall':'vocabulary',count:state.roundLength==='all'?getWordsForChunks([...state.selected]).length:state.roundLength,activityId:`mix-${mode}`};['memory','matching'].includes(mode)?startGame(mode,options):startQuiz(options,'Your little word mix');});
on('click','[data-avatar-group]',(_,target)=>{state.avatarDraft[target.dataset.avatarGroup]=target.dataset.avatarValue;const form=app.querySelector('#profile-form');state.profileDraft=form?Object.fromEntries(new FormData(form)):state.profileDraft;const scroll=window.scrollY;render();if(state.profileDraft){for(const [key,value]of Object.entries(state.profileDraft)){const input=app.querySelector(`#profile-form [name="${key}"]`);if(input)input.value=value;}}window.scrollTo({top:scroll,behavior:'instant'});});
on('submit','#redeem-form',(event,form)=>{event.preventDefault();redeem(form);});
on('submit','#profile-form',(event,form)=>{event.preventDefault();saveProfile(form);});
on('submit','#text-answer-form',event=>{event.preventDefault();gradeCurrent();});
on('click','[data-action]',async(_,target)=>{
  switch(target.dataset.action){
    case'books':return booksDialog();case'add-book':return booksDialog(true);
    case'word-bank':return route('bank');case'practice-sets':return route('practice');
    case'select-all':state.selected=state.selected.size===allChunks.length?new Set():new Set(allChunks.map(chunk=>chunk.id));return render();
    case'mix-unit':state.selected=new Set(allChunks.map(chunk=>chunk.id));return route('practice');
    case'check-answer':return gradeCurrent();case'next-question':return nextQuestion();
    case'clear-sentence':state.active.order=[];return render();
    case'hint':state.active.hintUsed=true;return render();
    case'finish-game':return finishActivity();
    case'back-to-path':state.active=null;return route('learn');
    case'play-again':{const previous=state.active.previous;state.active=null;if(previous.kind==='quiz')return startQuiz(previous.options,previous.title);return startGame(previous.kind,previous.options);}
    case'retry-save':{const result=state.active;if(result.saving)return;result.saving=true;result.error=null;render();try{const response=await api.saveAttempt(result.attempt);setSession(response);result.saved=true;result.earnedXp=Math.max(0,xp()-result.oldXp);}catch(issue){result.error=issue.message;}result.saving=false;return render();}
    case'leave-activity':return showDialog(`<div class="dialog-heading"><h2 id="dialog-title">A little pause?</h2><button class="round-button" data-dialog-close aria-label="Close">${icon('close')}</button></div><p>You can come back to this practice whenever you like. This round will start fresh.</p><div class="dialog-actions"><button class="primary-button" data-dialog-close>Keep going</button><button class="text-button" data-leave-confirm>Back to my path</button></div>`);
    case'sign-out':return showDialog(`<div class="dialog-heading"><h2 id="dialog-title">Leave this device?</h2><button class="round-button" data-dialog-close aria-label="Close">${icon('close')}</button></div><p>Your profile and progress stay safe. Enter a linked book code to come back.</p><div class="dialog-actions"><button class="primary-button" data-signout-confirm>Leave this device</button><button class="text-button" data-dialog-close>Stay here</button></div>`);
    case'demo-codes':{let codes=window.HORIZONS_CONFIG?.demoCodes || [];if(!codes.length){try{const response=await fetch('./demo-codes.json');if(response.ok){const data=await response.json();codes=data.codes || data;}}catch{}}return showDialog(`<div class="dialog-heading"><h2 id="dialog-title">Take a little look.</h2><button class="round-button" data-dialog-close aria-label="Close">${icon('close')}</button></div><p>These example book codes open a shared demonstration profile. Use a made-up name and date.</p>${codes.length?`<div class="demo-code-list">${codes.map(item=>{const code=typeof item==='string'?item:item.code;return `<button data-use-demo="${esc(code)}"><b>${esc(code)}</b><small>${esc(typeof item==='string'?'Horizons A1':item.label || item.title || 'Horizons A1')}</small>${icon('arrow')}</button>`;}).join('')}</div>`:'<p>Example codes are being prepared. Your Brighton book code can be used in the main field.</p>'}`);}
  }
});
on('click','[data-dialog-close]',()=>closeDialog(),dialog);
on('submit','#link-book-form',(event,form)=>{event.preventDefault();linkBook(form);},dialog);
on('click','[data-select-book]',(_,target)=>{state.bookId=target.dataset.selectBook;closeDialog();state.active=null;route('learn');api.updateProfile({defaultBookId:state.bookId}).then(setSession).catch(()=>{});},dialog);
on('click','[data-use-demo]',(_,target)=>{closeDialog();const input=document.getElementById('book-code');if(input){input.value=target.dataset.useDemo;input.focus();}},dialog);
on('click','[data-speak]',(_,target)=>speak(target.dataset.speak),dialog);
on('click','[data-leave-confirm]',()=>{closeDialog();state.active=null;route('learn');},dialog);
on('click','[data-signout-confirm]',async()=>{closeDialog();try{await api.signOut();}catch{}state.session=null;state.active=null;state.bookId=null;state.avatarDraft=null;location.hash='';render();},dialog);
dialog.addEventListener('click',event=>{if(event.target===dialog){const bounds=dialog.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)closeDialog();}});
window.addEventListener('hashchange',()=>{const hash=location.hash.slice(1);if(['learn','practice','bank','progress','profile'].includes(hash)&&hash!==state.route){state.route=hash;state.active=null;render();window.scrollTo({top:0,behavior:'instant'});}});
window.addEventListener('resize',layoutPaths);
window.addEventListener('offline',()=>notify('You’re offline. Your current round stays here while you reconnect.'));
window.addEventListener('online',()=>notify('You’re back. Let’s keep going.','success'));
document.addEventListener('keydown',event=>{if(event.key==='Enter'&&state.active?.kind==='quiz'&&!['TEXTAREA','BUTTON'].includes(document.activeElement?.tagName)){event.preventDefault();state.active.checked?nextQuestion():gradeCurrent();}});

async function boot() {
  await Promise.all([loadArt(),fetch('./assets/audio/manifest.json').then(response=>response.ok?response.json():{}).then(data=>{state.audioManifest=data.files || {};}).catch(()=>{})]);
  state.route=['learn','practice','bank','progress','profile'].includes(location.hash.slice(1))?location.hash.slice(1):'learn';
  if(getSessionToken()) {
    try {setSession(await api.getSession());}catch(error){if(error.status===401)forgetSession();else notify(error.message);}
  }
  render();
  if('serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
}
boot().catch(error=>{console.error(error);app.removeAttribute('aria-busy');app.innerHTML=`<main class="recovery-screen"><span class="wordmark">HORIZONS</span><h1>Let’s try that again.</h1><p>We couldn’t open this adventure just yet.</p><button class="primary-button" id="boot-retry">Try again</button></main>`;document.getElementById('boot-retry').addEventListener('click',()=>location.reload());});
window.HorizonsApp={getState:()=>({signedIn:Boolean(state.session),route:state.route,bookId:state.bookId,activity:state.active?.kind || null}),reload:()=>boot()};
