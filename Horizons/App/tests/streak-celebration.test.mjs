import test from 'node:test';
import assert from 'node:assert/strict';
import {shouldShowStreakCelebration,markStreakCelebrationSeen,streakTimeNote,streakCelebrationMarkup} from '../src/streak-celebration.js';

const event={attemptId:'fictional-first-round',dayKey:'2026-11-06',completedAt:'2026-11-06T14:18:00Z',timeZone:'America/Guayaquil',streak:3,activeDays:['2026-11-04','2026-11-05','2026-11-06'],localHour:9,localMinute:18,minutesUntilMidnight:882};
const memoryStorage=()=>{const rows=new Map();return {getItem:key=>rows.get(key)||null,setItem:(key,value)=>rows.set(key,value)};};
test('saved daily events are eligible until rendered; persisted guard belongs to profile and day',()=>{
 const storage=memoryStorage();
 assert.equal(shouldShowStreakCelebration('qa-streak-one',null,storage),false);
 assert.equal(shouldShowStreakCelebration('qa-streak-one',event,storage),true);
 assert.equal(shouldShowStreakCelebration('qa-streak-one',event,storage),true,'Checking eligibility must not claim a screen');
 markStreakCelebrationSeen('qa-streak-one',event,storage);
 assert.equal(shouldShowStreakCelebration('qa-streak-one',event,storage),false);
 assert.equal(shouldShowStreakCelebration('qa-streak-two',event,storage),true);
 assert.equal(shouldShowStreakCelebration('qa-streak-one',{...event,dayKey:'2026-11-07'},storage),true);
 const persisted=memoryStorage();persisted.setItem('hz_daily_streak_seen_v1:qa-persisted','["2026-11-06"]');
 assert.equal(shouldShowStreakCelebration('qa-persisted',event,persisted),false);
});
test('blocked and malformed storage retains a safe session guard',()=>{
 const broken={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}};
 assert.equal(shouldShowStreakCelebration('qa-blocked',event,broken),true);
 assert.doesNotThrow(()=>markStreakCelebrationSeen('qa-blocked',event,broken));
 assert.equal(shouldShowStreakCelebration('qa-blocked',event,broken),false);
 const malformed={getItem:()=>'{invalid',setItem:()=>{}};
 assert.equal(shouldShowStreakCelebration('qa-malformed',event,malformed),true);
 const old=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw Error('blocked getter')}});
 try{assert.equal(shouldShowStreakCelebration('qa-default-storage',event),true);assert.doesNotThrow(()=>markStreakCelebrationSeen('qa-default-storage',event));assert.equal(shouldShowStreakCelebration('qa-default-storage',event),false);}
 finally{if(old)Object.defineProperty(globalThis,'localStorage',old);else delete globalThis.localStorage;}
});
test('factual completion copy uses server profile timezone and remaining minutes',()=>{
 assert.match(streakTimeNote(event),/9:18 AM/);
 assert.match(streakTimeNote(event),/14h 42m before midnight/);
 assert.equal(streakTimeNote({...event,localHour:23,minutesUntilMidnight:18}),'Finished with 18m left today.');
 assert.equal(streakTimeNote({...event,localHour:23,minutesUntilMidnight:1}),'Finished with 1m left today.');
 assert.equal(streakTimeNote({...event,localHour:23,minutesUntilMidnight:0}),'Finished with less than a minute left today.');
});
test('calendar has seven short labels, active marks and no future missed-practice wording',()=>{
 const weekdays=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
 const weekDays=weekdays.map((weekday,i)=>({weekday,label:weekday.slice(0,3),dayKey:'2026-11-'+String(2+i).padStart(2,'0'),active:i>=2&&i<=4,today:i===4}));
 const html=streakCelebrationMarkup({...event,weekDays});
 assert.equal((html.match(/class="streak-week-day /g)||[]).length,7);
 assert.match(html,/>Mon<\/span>/);
 assert.doesNotMatch(html,/>Monday<\/span>/);
 assert.match(html,/Friday 2026-11-06, practiced, today/);
 assert.match(html,/Saturday 2026-11-07"/);
 assert.doesNotMatch(html,/Saturday 2026-11-07, no practice/);
 assert.match(html,/roast-reconstruction\.png/);
 assert.doesNotMatch(html,/reduced\.png/,'Normal first paint starts in the roast pose');
 assert.match(html,/data-action="streak-results"/);
 assert.doesNotMatch(html,/data-action="streak-results"[^>]*disabled/);
});
