(function (root, make) {
  if (typeof module === 'object' && module.exports) module.exports = make(require('./rules.cjs'));
  else root.BloxxArcade = make(root.MatchingBloxxRules);
}(typeof self !== 'undefined' ? self : this, function (rules) {
  'use strict';
  var matchRows = [
    ['a lecture','attend'], ['classes','attend'], ['a seminar','attend'],
    ['a degree','get'], ['practical experience','get'], ['a qualification','get'],
    ['progress','make'], ['a decision','make'], ['friends','make'],
    ['an application','submit'], ['an assignment','submit'], ['a final project','submit']
  ];
  var presets = {
    match: {name:'School and study', rows:matchRows, sameOptions:true, options:['attend','get','make','submit']},
    rightwrong: {name:'Past simple', instruction:'Build with past-simple verbs.',
      right:['went','wrote','found','took','bought','taught','made','saw','chose','had','ran','left'],
      wrong:['go','written','find','taken','buy','teach','makes','see','choose','have','running','leaving']}
  };
  var gravity = 12;
  function check(ok, message, status) {
    if (!ok) throw new rules.GameError(message, status);
  }
  function clean(value, max) {
    return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, max) : '';
  }
  function distinct(list) {
    var seen = Object.create(null);
    return list.filter(function (word) {
      var key = word.toLowerCase();
      if (!key || seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }
  function validate(mode, source) {
    check(mode === 'match' || mode === 'rightwrong', 'Choose a game mode.');
    var data = source || presets[mode];
    var name = clean(data.name, 40);
    check(name, 'Give the set a name.');
    if (mode === 'rightwrong') {
      check(Array.isArray(data.right) && Array.isArray(data.wrong), 'Enter right and wrong blocks.');
      var right = distinct(data.right.slice(0,48).map(function(word){return clean(word,48);}));
      var wrong = distinct(data.wrong.slice(0,48).map(function(word){return clean(word,48);}));
      check(right.length && wrong.length, 'Enter at least one right block and one wrong block.');
      var rightKeys = right.map(function (word) { return word.toLowerCase(); });
      check(wrong.every(function (word) { return rightKeys.indexOf(word.toLowerCase()) === -1; }),
        'A word can only be in one list.');
      return {name:name,instruction:clean(data.instruction,80) || 'Build with the right blocks.',right:right,wrong:wrong};
    }
    check(Array.isArray(data.rows) && data.rows.length > 0 && data.rows.length <= 48,
      'Enter between 1 and 48 matches.');
    var rows = data.rows.map(function (row) {
      check(Array.isArray(row) && row.length>=2 && row.length<=5, 'Enter a prompt, the correct answer, and up to three other options.');
      var fields = row.map(function(word,index){return clean(word,index===0?120:48);});
      check(fields.every(Boolean), 'Complete each field in a match.');
      check(distinct(fields.slice(1)).length===fields.length-1, 'Use different options within each match.');
      return fields;
    });
    check(distinct(rows.map(function(row){return row[0];})).length===rows.length, 'Use each prompt once.');
    var answers=distinct(rows.map(function(row){return row[1];}));
    if(data.sameOptions===true) {
      check(rows.every(function(row){return row.length===2;}), 'Shared options use one prompt and one correct answer per line.');
      var options=Array.isArray(data.options)?data.options.map(function(word){return clean(word,48);}):answers;
      check(options.length>=2 && options.length<=4 && distinct(options).length===options.length,
        'Enter two to four different shared options.');
      var keys=options.map(function(word){return word.toLowerCase();});
      check(answers.every(function(answer){return keys.indexOf(answer.toLowerCase())>=0;}),
        'Every correct answer must appear in the shared options.');
      return {name:name,rows:rows,sameOptions:true,options:options};
    }
    if(data.sameOptions===false){
      check(rows.every(function(row){return row.length>=3;}), 'Give every prompt at least one other option.');
      return {name:name,rows:rows,sameOptions:false};
    }
    check(answers.length>=4 || rows.every(function(row){return row.length===5;}),
      'Supply four different answers across the set or add three distractors to every row.');
    return {name:name, rows:rows};
  }
  function rng(seed) {
    var value = Math.floor(Math.abs(seed)) % 2147483646 + 1;
    return function () {
      value = value * 48271 % 2147483647;
      return value / 2147483647;
    };
  }
  function shuffle(list, random) {
    var result = list.slice();
    for (var i=result.length-1; i>0; i--) {
      var j=Math.floor(random()*(i+1));
      var item=result[i]; result[i]=result[j]; result[j]=item;
    }
    return result;
  }
  function card(config, round, seed) {
    var set=config.set;
    var pool=config.mode==='match' ? set.rows : set.right.map(function(word){return [word,true];})
      .concat(set.wrong.map(function(word){return [word,false];}));
    var count=pool.length;
    var cycle=Math.floor((round-1)/count);
    var order=shuffle(pool,rng(seed+cycle*14081));
    // Existing rooms retain the question order they started with.
    if(!config.shuffleAll && config.mode==='match' && cycle===0) {
      var first=order.indexOf(pool[0]);
      order.splice(first,1); order.unshift(pool[0]);
    }
    var row=order[(round-1)%count];
    if(config.mode==='rightwrong') return {label:row[0], correct:row[1]?0:-1};
    var random=rng(seed+round*18127);
    if(set.sameOptions) return {label:row[0],choices:set.options.slice(),correct:set.options.findIndex(function(word){
      return word.toLowerCase()===row[1].toLowerCase();
    })};
    var alternatives=row.length>2 ? row.slice(2) : shuffle(distinct(pool.map(function(entry){return entry[1];}))
      .filter(function(answer){return answer.toLowerCase()!==row[1].toLowerCase();}),random).slice(0,3);
    var choices=shuffle([row[1]].concat(alternatives),random);
    return {label:row[0], choices:choices, correct:choices.indexOf(row[1])};
  }
  function importPool(mode, text, filename) {
    var raw=text.replace(/^\uFEFF/,'').trim();
    check(raw && raw.length<=65536, 'Import a nonempty pool smaller than 64 KB.');
    var name=(filename||'Imported set').replace(/\.[^.]+$/,'');
    if(raw.charAt(0)==='{' || /\.json$/i.test(filename||'')) {
      var file;
      try {file=JSON.parse(raw);} catch (_) {check(false,'This JSON file could not be read.');}
      check(file && (!file.mode || file.mode===mode),'Choose the game mode that matches this file.');
      return validate(mode,Object.assign({name:name},file.set||file));
    }
    var first=raw.split(/\r?\n/,1)[0];
    var separator=/\.tsv$/i.test(filename||'') || first.indexOf('\t')>=0?'\t':
      /\.csv$/i.test(filename||'')?',':first.indexOf('|')>=0?'|':',';
    var rows=[], row=[], value='', quoted=false;
    function pushRow() {
      row.push(value.trim());
      while(row.length && !row[row.length-1])row.pop();
      if(row.length)rows.push(row);
      row=[];value='';
    }
    for(var i=0;i<raw.length;i++){
      var ch=raw[i];
      if(ch==='"' && (quoted || !value.trim())){
        if(quoted && raw[i+1]==='"'){value+='"';i++;}
        else quoted=!quoted;
      } else if(!quoted && ch===separator){row.push(value.trim());value='';}
      else if(!quoted && (ch==='\n' || ch==='\r'))pushRow();
      else value+=ch;
    }
    check(!quoted,'Close the quotation marks in the import.');
    pushRow();
    if(mode==='match'){
      if(rows[0] && /^prompt$/i.test(rows[0][0]) && /^answer$/i.test(rows[0][1]))rows.shift();
      var shared=rows.every(function(fields){return fields.length===2;});
      return validate(mode,{name:name,rows:rows,sameOptions:shared});
    }
    if(rows[0] && /^word$/i.test(rows[0][0]) && /^status$/i.test(rows[0][1]))rows.shift();
    var set={name:name,right:[],wrong:[]};
    rows.forEach(function(fields){
      var status=fields[1] && fields[1].toLowerCase();
      check(fields.length===2 && (status==='right'||status==='wrong'),'Use one word and its status (right or wrong) per line.');
      set[status].push(fields[0]);
    });
    return validate(mode,set);
  }
  function pose(motion, elapsed) {
    var rate=2*Math.PI/motion.period;
    var phase=motion.phase+elapsed*rate;
    var wave=Math.sin(phase);
    return {
      x:motion.amplitude*wave,
      height:.78+.36*wave*wave,
      angle:.29*wave,
      velocity:motion.amplitude*Math.cos(phase)*rate*1000*.79,
      rotation:.29*Math.cos(phase)*rate*1000
    };
  }
  function flight(motion, elapsed) {
    var start=pose(motion,elapsed);
    function frame(time) {
      return {x:start.x+start.velocity*time, height:start.height-gravity*time*time/2,
        angle:start.angle+start.rotation*time};
    }
    // Find when the lower corner reaches the landing plane, not the block origin.
    var before=0,after=Math.sqrt(2*start.height/gravity);
    for(var step=0;step<18;step++) {
      var time=(before+after)/2;
      var block=frame(time);
      if(block.height-.49*Math.abs(Math.sin(block.angle))>0) before=time;
      else after=time;
    }
    var duration=after;
    return {duration:duration, at:frame, impact:frame(duration)};
  }
  function arm(player, now) {
    var random=rng(player.seed+player.round*13499);
    var penalty=player.gustPending;
    var assistance=player.steadyArmed;
    // Vary each crane cycle while keeping later floors faster.
    var base=Math.max(1900,3270-57*(player.round-1))+Math.round(random()*380);
    player.motion={period:Math.round(base*(assistance?1.5:1)/(penalty?1.18:1)),phase:random()*2*Math.PI,
      amplitude:.92+random()*.26,gust:!!penalty,assisted:!!assistance,startedAt:now};
    if(assistance) player.steady=0;
    player.steadyArmed=false;
    player.gustPending=false;
    player.stage='drop';
  }
  function loss(floors, count, direction) {
    return {floors:floors.slice(0,Math.max(0,floors.length-count)),direction:direction,
      fallen:Math.min(floors.length,count)+1,bonus:0,kind:'wrong'};
  }
  function resolve(player, config, choice, elapsed) {
    var current=card(config,player.round,player.seed);
    var path=flight(player.motion,elapsed);
    var x=path.impact.x;
    var direction=x<0?-1:1;
    var landing=x;
    // A tilted floor hits with its lower corner first and carries that torque into the landing.
    if(Math.abs(path.impact.angle)>.24) landing+=Math.sin(path.impact.angle)*.18;
    var label=config.mode==='match'?current.choices[choice]:current.label;
    if(choice!==current.correct) {
      if(config.mode==='rightwrong') {
        var random=rng(player.seed+player.round*19763);
        var bad=loss(player.placements,2+Math.floor(random()*4),direction);
        bad.label=label;
        bad.offset=x;
        return bad;
      }
      return {floors:player.placements,kind:'wrong',fallen:0,bonus:0,offset:x,label:label,
        correction:/_{2,}/.test(current.label)?current.label.replace(/_{2,}/,function(){return current.choices[current.correct];}):
          current.choices[current.correct]+' '+current.label};
    }
    var next=rules.placeFloor(player.placements,landing);
    next.offset=x;
    next.label=label;
    return next;
  }
  function move(player, config, action, data, now, endless) {
    check(player.stage==='drop' && player.round===data.round,'This crane has moved on.',409);
    if(action==='steady') {
      check(!player.steadyArmed && player.steady,'Earn a crane charge first.',409);
      player.steadyArmed=true;
      return;
    }
    var next;
    if(action==='arcadePass') {
      check(config.mode==='rightwrong','Choose a matching block.');
      var current=card(config,player.round,player.seed);
      next={kind:current.correct<0?'passed':'passed-right',bonus:0,fallen:0,floors:player.placements,label:current.label};
    } else {
      check(action==='arcadeDrop','Unknown arcade action.');
      var choice=data.choice;
      var count=config.mode==='match'?card(config,player.round,player.seed).choices.length:1;
      check(choice===Math.floor(choice) && choice>=0 && choice<count,'Choose a block.');
      var elapsed=data.elapsedMs;
      check(typeof elapsed==='number' && isFinite(elapsed) && elapsed>=0 &&
        elapsed<=Math.max(0,now-player.motion.startedAt)+550,'This crane has moved on. Try again.',409);
      next=resolve(player,config,choice,elapsed);
    }
    player.placements=next.floors;
    if(next.kind==='perfect') {
      player.perfectStreak++;
      if(player.perfectStreak>=2) {player.steady=1;player.perfectStreak=0;}
    } else if(next.kind!=='passed') player.perfectStreak=0;
    var points=next.kind==='wrong' || next.kind.indexOf('passed')===0 ? 0 : 100+next.bonus;
    player.score+=points;
    player.last={kind:next.kind,phrase:next.label,points:points,offset:next.offset||0,fallen:next.fallen,direction:next.direction||0,
      lost:next.fallen?next.fallen-1:0,correction:next.correction||''};
    player.completed++;
    if(!endless && player.completed>=rules.total) {
      player.stage='done';
      player.motion=null;
    } else {player.round++;arm(player,now);}
  }
  function config(mode, set) { return {mode:mode,set:validate(mode,set),shuffleAll:true}; }
  function snapshot(game) {
    var set=game.set;
    return {mode:game.mode,name:set.name,instruction:set.instruction||''};
  }
  function playerView(player, game, phase) {
    var view=rules.playerView(player, phase);
    var question=card(game,player.round,player.seed);
    view.prompt=question.label;
    view.choices=question.choices || [question.label];
    view.last=player.last;
    if(view.motion) view.motion.assisted=!!player.motion.assisted;
    return view;
  }
  function practice(game, name) {
    var player=rules.newPlayer('p1',name||'You',Math.floor(Math.random()*1e9));
    var done=false;
    arm(player, Date.now());
    function view() {
      var phase=done?'finished':'playing';
      return {code:'',role:'player',phase:phase,total:0,capacity:1,arcade:snapshot(game),
        players:rules.standings([player]),me:playerView(player,game,phase)};
    }
    return {
      view:view,
      command:function (action, data) {
        check(!done,'This tower is finished.',409);
        if (action==='finish') done=true;
        else move(player,game,action,data,Date.now(),true);
        return view();
      }
    };
  }
  return {config:config, importPool:importPool, snapshot:snapshot, card:card, arm:arm, move:move, pose:pose, flight:flight,
    playerView:playerView, practice:practice};
}));
