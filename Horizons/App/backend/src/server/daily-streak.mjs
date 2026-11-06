const MINUTE=60_000,DAY=86_400_000;
const weekdays=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

export function localDayKey(value,timeZone='America/Guayaquil'){
 const parts=new Intl.DateTimeFormat('en',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value));
 const part=name=>parts.find(p=>p.type===name).value;
 return `${part('year')}-${part('month')}-${part('day')}`;
}
function shiftDay(day,offset){return new Date(Date.parse(day+'T12:00:00Z')+offset*DAY).toISOString().slice(0,10);}

// Search for the next local-date boundary instead of assuming a 24-hour day.
// This also covers daylight-saving days and zones with half-hour offsets.
function minutesLeft(completedAt,timeZone){
 const at=Date.parse(completedAt),format=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}),today=format.format(new Date(at));
 let low=at,high=at+2*DAY;
 while(high-low>1){const middle=Math.floor((low+high)/2);if(format.format(new Date(middle))===today)low=middle;else high=middle;}
 return Math.floor((high-at)/MINUTE);
}

export function dailyStreakDetails({attemptId,completedAt,timeZone,activeDays}){
 const dayKey=localDayKey(completedAt,timeZone),active=[...new Set([...activeDays,dayKey])].sort(),days=new Set(active);
 let streak=0,walk=dayKey;while(days.has(walk)){streak++;walk=shiftDay(walk,-1);}
 const dayOfWeek=new Date(dayKey+'T12:00:00Z').getUTCDay(),monday=shiftDay(dayKey,-((dayOfWeek+6)%7));
 const timeParts=new Intl.DateTimeFormat('en',{timeZone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(completedAt));
 const time=name=>Number(timeParts.find(p=>p.type===name).value);
 return {attemptId,dayKey,completedAt,timeZone,firstCompletionToday:true,streak,activeDays:active,
  weekDays:weekdays.map((weekday,index)=>{const day=shiftDay(monday,index);return{dayKey:day,weekday,label:weekday.slice(0,3),active:days.has(day),today:day===dayKey};}),
  localHour:time('hour'),localMinute:time('minute'),minutesUntilMidnight:minutesLeft(completedAt,timeZone)};
}
