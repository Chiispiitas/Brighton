import { createRoom, command, view } from './server/engine.mjs';

export const TUTORIAL_ROLES = ['villager','werewolf','girl','fortune','witch','hunter'];
const YOU='demo-you', HOST='demo-host';
const step=(title,text,scene,focus,play=[])=>({title,text,scene,focus,play});
const pick=(id,delay=900)=>[delay,`[data-player="${id}"]`];
const click=(selector,delay=1900)=>[delay,selector];
const card=step('Check your card privately','Open the card, read your role, then press Ready. Everyone does this before the first night.','card','#reveal',[click('#reveal',900),click('#ready',5500)]);
const vote=step('Vote from day two','Choose a house and confirm your vote, or Abstain. A unique highest vote eliminates that player; a tie eliminates nobody.','vote','[data-player="p1"]',[pick('p1'),click('#confirm-target')]);
export const LESSONS={
  villager:[card,
    step('Sleep through the night','The villager has no night action. Close your eyes and wait while the host calls the other roles.','sleep','.sleep'),
    step('Discuss on the first day','Listen to the other players and discuss who could be a werewolf. There is no elimination vote on day one.','day','.phase-banner'),vote,
    step('Read the revealed card','This example shows Rowan voted out as a werewolf. Every eliminated player reveals their card and stops acting or voting. The village wins when no wolves remain.','eliminated','[data-player="p1"]')],
  werewolf:[card,
    step('Find your pack','Rowan is the other werewolf. His highlight is on Ivy. You can see the pack and their choices; the other players cannot. Select Ivy to agree.','pack','.pack-choices',[pick('p2')]),
    step('A split decision blocks the night','Your highlight is on Finn, but Rowan chose Ivy. Even a majority is not enough: every living wolf must choose the same person. Change your choice to Ivy.','split','#pack-continue',[pick('p2')]),
    step('Continue after agreement','Both wolves chose Ivy. The button is now available. Either a living wolf or the host can continue the night.','agreed','#pack-continue',[click('#pack-continue',1000)]),
    step('Keep your role hidden during the day','This example shows Ivy eliminated at dawn. Discuss and vote with everyone else. Wolves win when they equal or outnumber the other living players, after any hunter shot.','dawn','.map-legend'),
    step('Vote with everyone else','From day two, the host opens a vote after discussion. Your pack is still marked only for you. Try selecting Finn and confirming your vote. You can also Abstain.','wolf-vote','[data-player="p3"]',[pick('p3'),click('#confirm-target')])],
  fortune:[card,
    step('Check one living player','Select Rowan’s house, then Confirm choice. You learn the exact role of one living player each night. You can also pass.','fortune','[data-player="p1"]',[pick('p1'),click('#confirm-target')]),
    step('Your result stays private','Rowan is a werewolf. The result is also kept in Your notes. Other players still see Rowan’s house without his role. Keep quiet until morning.','notes','.notes',[click('.notes summary',1100)]),vote,
    step('Help the village find the wolves','Use what you learned during discussion. A role check does not eliminate anyone; the village must still vote. Eliminated players reveal their cards.','eliminated','[data-player="p1"]')],
  girl:[card,
    step('Spying: the heads example','Press Flip the coin. Spying identifies one living werewolf. In this demonstration the coin lands heads, so the wolf does not discover you.','heads','#spy',[click('#spy',1200)]),
    step('Spying: the tails example','Try the other outcome. You still identify Rowan, but that werewolf also learns that you are the Little Girl. Real games choose the coin result randomly.','tails','#spy',[click('#spy',1200)]),
    step('You can stay asleep','You do not have to risk being discovered. Stay asleep records a pass and reveals nobody to you that night.','girl','#pass',[click('#pass',1200)]),vote],
  witch:[card,
    step('Identify tonight’s victim','Ivy was attacked tonight and can be revived. Oscar was eliminated earlier and stays dead. The named revival panel and house labels show the difference.','victim','.witch-victim-card'),
    step('Use your healing potion','Check Revive Ivy and confirm. The potion saves tonight’s werewolf victim at dawn. You have only one healing potion for the whole game.','heal','#heal',[click('#heal',1000),click('#cast',2500)]),
    step('Use poison only if you choose','Check Use poison potion. The player list appears; choose Rowan, then confirm. You have one poison potion for the whole game. Leaving the box unchecked keeps it.','poison','#use-poison',[click('#use-poison',900),[1800,'#poison','p1'],click('#cast',3000)]),
    step('Each potion can be used once','Both potions have already been used in this example, so their controls are unavailable. You may use both in one night, including on yourself. A player who is both healed and poisoned still dies.','spent','.witch-choice'),
    step('The results appear at dawn','This example shows Ivy saved, Rowan poisoned and Oscar still eliminated. Only eliminated roles become public. Keep everyone else’s role private.','witch-dawn','.map-legend')],
  hunter:[card,
    step('Your final action happens after elimination','Your Hunter card is public because you were eliminated. You still get one final choice before the game checks who won. Select Rowan and confirm, or Pass.','hunter','[data-player="p1"]',[pick('p1'),click('#confirm-target')]),
    step('The chosen player is eliminated too','This example shows Rowan taken by the hunter. Both cards are public. After this final action you watch quietly and cannot vote.','hunter-result','[data-player="p1"]'),
    step('Passing is allowed','You can choose not to take anyone with you. Press Pass to finish the hunter’s action without another elimination.','hunter','#pass',[click('#pass',1200)]),
    step('A final shot can decide the winner','Here Rowan is the last surviving wolf. Select his house and confirm: your final shot removes the last wolf, so the village wins.','last-wolf','[data-player="p1"]',[pick('p1'),click('#confirm-target')])]
};

function fixture(role,scene,serial){
  const s=createRoom('DEMO',HOST,'Narrator');
  const remaining=['werewolf','werewolf','fortune','girl','witch','hunter','villager','villager'];
  const take=r=>{remaining.splice(remaining.indexOf(r),1);return r;};
  const roles=[take(role),take('werewolf'),take('villager'),...remaining];
  s.players=['Alex','Rowan','Ivy','Finn','Hazel','Jasper','Willow','Oscar'].map((name,i)=>({id:`p${i}`,key:i?`demo-${i}`:YOU,name,role:roles[i],alive:true}));
  s.phaseId=serial*100; s.day=1; s.phase='day'; s.night={victim:null,poison:null,heal:false};
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
  load(index){if(index<0||index>=this.steps.length)throw Error('Unknown tutorial slide.');this.index=index;this.raw=fixture(this.role,this.step.scene,++this.serial);this.completed=false;this.feedback='';return this.snapshot();}
  snapshot(){return view(this.raw,YOU);}
  act(body){
    if(!['ready','action','vote','advance'].includes(body.type))throw Error('This control is not part of the practice game.');
    const sequence=[0,this.step.scene==='tails'?.8:.2];
    this.raw=command(this.raw,YOU,{...body,phaseId:this.raw.phaseId,requestId:`tutorial-${++this.serial}`},()=>sequence.shift()??.2);
    this.completed=body.type==='advance'||body.type==='ready'||body.type==='vote'||body.type==='action'&&(this.raw.phase!=='werewolf'||this.snapshot().packDecision?.agreed);
    if(this.raw.phase==='finished')this.feedback='The last werewolf is gone. Villagers win after the hunter’s final shot.';
    else if(body.type==='ready')this.feedback='Ready. In a real game, the host puts the village to sleep after the cards are checked.';
    else if(body.type==='vote')this.feedback=body.target?'Vote recorded. The host counts everyone’s votes.':'You abstained. This records no vote against a player.';
    else if(body.type==='advance')this.feedback='The pack agreed and the night continued. The other night roles act before dawn.';
    else if(this.raw.phase==='werewolf')this.feedback=this.snapshot().packDecision.agreed?'Both highlights match. The night can continue.':'Your highlights differ. The continue button stays blocked.';
    else if(body.heal||body.poison)this.feedback='Potion choice recorded. Used potions are spent for the rest of the game.';
    else if(this.role==='hunter')this.feedback=body.target?'Your final target is eliminated and their card is revealed.':'You passed. No additional player was eliminated.';
    else this.feedback=body.target||body.spy?'Result recorded privately.':'You passed this night action.';
    return this.snapshot();
  }
}
