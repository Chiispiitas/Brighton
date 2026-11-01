import { createRoom, command, view } from './server/engine.mjs';

export const TUTORIAL_ROLES = ['villager','werewolf','girl','fortune','witch','hunter'];
const YOU='demo-you', HOST='demo-host';
const step=(title,text,scene,focus,play=[])=>({title,text,scene,focus,play});
const pick=(id,delay=900)=>[delay,`[data-player="${id}"]`];
const click=(selector,delay=1900)=>[delay,selector];
const card=step('Check your card','Open your card, then press Ready. Keep your role private.','card','#reveal',[click('#reveal',900),click('#ready',5500)]);
const vote=step('Vote from day two','Choose a player and confirm, or Abstain. Whoever gets the most votes is eliminated; ties eliminate nobody.','vote','[data-player="p1"]',[pick('p1'),click('#confirm-target')]);
export const LESSONS={
  villager:[card,
    step('Sleep at night','You have no night action. Close your eyes until morning.','sleep','.sleep'),
    step('Discuss on day one','Discuss who might be a werewolf. Nobody is voted out on the first day.','day','.phase-banner'),vote,
    step('Read the revealed card','Eliminated players reveal their cards and cannot act or vote. The village wins when no werewolves remain.','eliminated','[data-player="p1"]')],
  werewolf:[card,
    step('Agree with your pack','Rowan, your packmate, chose Ivy. Choose Ivy too; pack choices stay private.','pack','.pack-choices',[pick('p2')]),
    step('Match the choices','You chose Finn; Rowan chose Ivy. Change your choice to Ivy—every living wolf must agree.','split','#pack-continue',[pick('p2')]),
    step('Continue the night','Both wolves chose Ivy. You or the host can now press Continue the night.','agreed','#pack-continue',[click('#pack-continue',1000)]),
    step('Keep your role secret','Keep your role secret during the day. Wolves win when they equal or outnumber everyone else alive, after any hunter shot.','dawn','.map-legend'),
    step('Join the daytime vote','From day two, select Finn and confirm when the host opens voting. Your pack stays visible only to you.','wolf-vote','[data-player="p3"]',[pick('p3'),click('#confirm-target')])],
  fortune:[card,
    step('Check one living player','Each night, you may check one living player. Select Rowan and confirm to see his role.','fortune','[data-player="p1"]',[pick('p1'),click('#confirm-target')]),
    step('Keep the result private','Your notes keep Rowan’s role. Only you see the result; keep quiet until morning.','notes','.notes',[click('.notes summary',1100)]),vote,
    step('Use your information','A role check does not eliminate anyone. Discuss what you learned, then help the village vote.','eliminated','[data-player="p1"]')],
  girl:[card,
    step('Heads: stay hidden','Press Flip the coin to try the heads example. You identify Rowan without being discovered.','heads','#spy',[click('#spy',1200)]),
    step('Tails: you are seen','Press Flip the coin to try tails. You identify Rowan, but he learns you are the Little Girl.','tails','#spy',[click('#spy',1200)]),
    step('Or stay asleep','Press Stay asleep to pass without spying. You learn no role that night.','girl','#pass',[click('#pass',1200)]),vote],
  witch:[card,
    step('Find who can be saved','Ivy was attacked tonight and can be revived. Oscar died earlier and cannot be revived.','victim','.witch-victim-card'),
    step('Save Ivy','Check Revive Ivy, then confirm. Your healing potion can be used once per game.','heal','#heal',[click('#heal',1000),click('#cast',2500)]),
    step('Choose whether to poison','Check Use poison potion, choose Rowan, then confirm. Leave it unchecked to keep the potion.','poison','#use-poison',[click('#use-poison',900),[1800,'#poison','p1'],click('#cast',3000)]),
    step('Potions are single-use','Each potion works once per game. You may use both together, but poison still kills a healed player.','spent','.witch-choice'),
    step('See the morning result','Ivy was saved, Rowan was poisoned, and Oscar stays dead. Only eliminated players reveal their roles.','witch-dawn','.map-legend')],
  hunter:[card,
    step('After elimination','Select Rowan and confirm, or Pass. The game checks for a winner after your final action.','hunter','[data-player="p1"]',[pick('p1'),click('#confirm-target')]),
    step('Your target leaves too','Rowan is eliminated and both cards are public. You now watch without acting or voting.','hunter-result','[data-player="p1"]'),
    step('You may pass','Press Pass to take nobody with you.','hunter','#pass',[click('#pass',1200)]),
    step('Decide the result','Rowan is the last living werewolf. Select him and confirm to win for the village.','last-wolf','[data-player="p1"]',[pick('p1'),click('#confirm-target')])]
};

// A new frame must reset the shared UI, including a previously revealed card.
let frameId=0;
function fixture(role,scene){
  const s=createRoom('DEMO',HOST,'Narrator');
  const remaining=['werewolf','werewolf','fortune','girl','witch','hunter','villager','villager'];
  const take=r=>{remaining.splice(remaining.indexOf(r),1);return r;};
  const roles=[take(role),take('werewolf'),take('villager'),...remaining];
  s.players=['Alex','Rowan','Ivy','Finn','Hazel','Jasper','Willow','Oscar'].map((name,i)=>({id:`p${i}`,key:i?`demo-${i}`:YOU,name,role:roles[i],alive:true}));
  s.phaseId=++frameId*100; s.day=1; s.phase='day'; s.night={victim:null,poison:null,heal:false};
  const phase=p=>s.phase=p;
  if(scene==='card')phase('reveal');
  if(scene==='sleep')phase('werewolf');
  if(scene==='vote'){phase('vote');s.day=2;}
  if(scene==='wolf-vote'){phase('vote');s.day=2;s.players[2].alive=false;}
  if(['pack','split','agreed'].includes(scene)){
    phase('werewolf');s.actions.p1={target:'p2'};
    if(scene!=='pack')s.actions.p0={target:scene==='split'?'p3':'p2'};
  }
  if(['fortune','notes'].includes(scene))phase('fortune');
  if(scene==='notes'){s.notes.p0=[{day:1,text:'Rowan is werewolf.'}];s.actions.p0={target:'p1'};}
  if(['heads','tails','girl'].includes(scene))phase('girl');
  if(['victim','heal','poison','spent'].includes(scene)){
    phase('witch');s.night.victim='p2';s.players[7].alive=false;s.players[7].role='villager';
    if(scene==='poison')s.potions.heal=false;
    if(scene==='spent')s.potions={heal:false,poison:false};
  }
  if(scene==='dawn'){s.players[2].alive=false;s.players[2].role='villager';}
  if(scene==='eliminated'){phase('dusk');s.day=2;s.players[1].alive=false;s.votes={p0:'p1',p2:'p1',p3:'p1'};}
  if(scene==='witch-dawn'){s.players[1].alive=false;s.players[7].alive=false;s.players[7].role='villager';s.potions={heal:false,poison:false};}
  if(['hunter','last-wolf'].includes(scene)){
    phase('hunter');s.players[0].alive=false;s.pendingHunter='p0';s.resumePhase='day';
    if(scene==='last-wolf')s.players.filter(p=>p.role==='werewolf'&&p.id!=='p1').forEach(p=>p.alive=false);
  }
  if(scene==='hunter-result'){s.players[0].alive=false;s.players[1].alive=false;s.hunterUsed=true;}
  s.log=[{day:1,text:scene==='card'?'Game started.':'Practice game. No real room is connected.'}];
  return s;
}

export class TutorialGame{
  constructor(role='villager'){this.serial=0;this.select(role);}
  select(role){if(!TUTORIAL_ROLES.includes(role))throw Error('Choose a tutorial role.');this.role=role;this.index=0;this.load(0);}
  get steps(){return LESSONS[this.role];}
  get step(){return this.steps[this.index];}
  load(index){if(index<0||index>=this.steps.length)throw Error('Unknown tutorial slide.');this.index=index;this.serial++;this.raw=fixture(this.role,this.step.scene);this.completed=false;this.feedback='';return this.snapshot();}
  snapshot(){return view(this.raw,YOU);}
  act(body){
    if(!['ready','action','vote','advance'].includes(body.type))throw Error('This control is not part of the practice game.');
    const sequence=[0,this.step.scene==='tails'?.8:.2];
    this.raw=command(this.raw,YOU,{...body,phaseId:this.raw.phaseId,requestId:`tutorial-${++this.serial}`},()=>sequence.shift()??.2);
    this.completed=body.type==='advance'||body.type==='ready'||body.type==='vote'||body.type==='action'&&(this.raw.phase!=='werewolf'||this.snapshot().packDecision?.agreed);
    if(this.raw.phase==='finished')this.feedback='The last wolf is gone. Villagers win.';
    else if(body.type==='ready')this.feedback='Card checked. You’re ready.';
    else if(body.type==='vote')this.feedback=body.target?'Your vote is saved.':'You abstained.';
    else if(body.type==='advance')this.feedback='The pack agreed. The night continues.';
    else if(this.raw.phase==='werewolf')this.feedback=this.snapshot().packDecision.agreed?'Your choices match.':'Your choices differ. Choose Ivy to match Rowan.';
    else if(body.heal||body.poison)this.feedback='Your potion choice is saved.';
    else if(this.role==='hunter')this.feedback=body.target?'Your target is eliminated too.':'No extra player was eliminated.';
    else this.feedback=body.target||body.spy?'Your result is private.':'You passed.';
    return this.snapshot();
  }
}
