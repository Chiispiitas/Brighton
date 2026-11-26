(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var game = $('game'), panel = $('panel'), feedback = $('feedback');
  var state, session, practice, scene, timer, pollGeneration = 0, busy = false;
  var visualKey = '', panelKey = '', motionKey = '', motionStart = 0, lastFocus;
  var previousPhase, muted = read('mb-audio') === 'off', audioContext, buffers = {}, clips = {};
  var sounds = ['match', 'land', 'perfect', 'miss', 'finish'];
  var storageKey = 'matching-bloxx-room-v1';
  var codeFromLink = ((location.search.match(/[?&]room=(\d{6})(?:&|$)/) || [])[1]) || '';
  var screenKey = ((location.hash.match(/^#screen=([0-9a-f]{64})$/) || [])[1]) || '';
  var invite = null, retryPayload = null, retrySession = null;
  var arcadeChoice=-1, arcadeRound='', activePractice=null, roomSetup=null;
  var poolKey='mb-word-sets-v1';
  function read(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
  function save(key, value) { try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch (_) {} }
  function savedRoom(key) {
    try { return JSON.parse(read(key)); } catch (_) { return null; }
  }
  function tabRoom(value) {
    try {
      if (!arguments.length) return JSON.parse(sessionStorage.getItem(storageKey));
      if (value) sessionStorage.setItem(storageKey, JSON.stringify(value));
      else sessionStorage.removeItem(storageKey);
    } catch (_) {}
  }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return {'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c];
    });
  }
  function now() { return window.performance && performance.now ? performance.now() : Date.now(); }
  function status(message) { feedback.hidden = !message; feedback.textContent = message || ''; }
  function token() {
    var cryptoLib = window.crypto || window.msCrypto;
    if (!cryptoLib || !cryptoLib.getRandomValues) throw Error('This browser can play solo. Open the game in a newer browser to join a class.');
    var bytes = new Uint8Array(32), out = '';
    cryptoLib.getRandomValues(bytes);
    for (var i = 0; i < bytes.length; i++) out += ('0' + bytes[i].toString(16)).slice(-2);
    return out;
  }
  function newCode() { return String(100000 + (parseInt(token().slice(0,8),16) % 900000)); }
  function joinLink() { return location.protocol + '//' + location.host + location.pathname + '?room=' + state.code; }
  function urlForScreen() { return joinLink() + '#screen=' + session.presenterToken; }

  function syncSound() {
    $('audio-label').textContent = muted ? 'Sound off' : 'Sound on';
    $('audio').setAttribute('aria-pressed', muted ? 'false' : 'true');
  }
  function prepareAudio() {
    if (muted) return;
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx && !audioContext) {
      try {
        audioContext = new Ctx();
        sounds.forEach(function (name) {
          var xhr = new XMLHttpRequest();
          xhr.open('GET','assets/sounds/' + name + '.mp3');
          xhr.responseType = 'arraybuffer';
          xhr.onload = function () {
            if (xhr.status === 200) audioContext.decodeAudioData(xhr.response, function (b) { buffers[name] = b; }, function () {});
          };
          xhr.send();
        });
      } catch (_) {}
    }
    if (audioContext && audioContext.state === 'suspended' && audioContext.resume) {
      var resumed = audioContext.resume();
      if (resumed && resumed.catch) resumed.catch(function () {});
    }
  }
  function cue(name) {
    if (muted) return;
    try {
      if (audioContext && buffers[name] && audioContext.state === 'running') {
        var src = audioContext.createBufferSource(), gain = audioContext.createGain();
        src.buffer = buffers[name]; gain.gain.value = .5; src.connect(gain); gain.connect(audioContext.destination);
        src.start(0);
      } else {
        var clip = clips[name] || (clips[name] = new Audio('assets/sounds/' + name + '.mp3'));
        clip.volume = .5; clip.currentTime = 0;
        var play = clip.play(); if (play && play.catch) play.catch(function () {});
      }
    } catch (_) {}
  }
  document.addEventListener('click',prepareAudio,true);
  document.addEventListener('keydown',prepareAudio,true);
  $('audio').onclick = function () {
    muted = !muted; save('mb-audio', muted ? 'off' : 'on'); syncSound();
    if (!muted) { prepareAudio(); cue('match'); }
  };
  function modal(html, closer) {
    lastFocus = document.activeElement; $('dialog-body').innerHTML = html;
    $('close-dialog').textContent = closer || 'Back to game'; $('overlay').hidden = false;
    $('close-dialog').onclick=closeModal;
    $('close-dialog').focus();
  }
  function closeModal() { $('overlay').hidden = true; if (lastFocus && lastFocus.focus && document.body.contains(lastFocus)) lastFocus.focus(); }
  $('close-dialog').onclick = closeModal;
  $('overlay').onclick = function (e) { if (e.target === $('overlay')) closeModal(); };
  $('help').onclick = function () {
    modal('<h2 id="dialog-title">How to play</h2><ol class="steps">' +
      '<li><b>1</b><span><strong>Matching</strong> starts you with a free floor. Load one of four answers onto the crane. Use the block labels or keys 1–4.</span></li>' +
      '<li><b>2</b><span><strong>Right / Wrong</strong> sends words to the crane one at a time. Skip the wrong ones. Dropping a wrong block takes down up to five floors.</span></li>' +
      '<li><b>3</b><span>Tap <strong>Drop floor</strong> or press Space. The block keeps moving sideways after release. Aim against the lean to steady your tower.</span></li></ol>' +
      '<p class="sub">Solo play is endless. A classroom game gives each builder 12 turns.</p>');
  };
  document.addEventListener('keydown', function (e) {
    if (!$('overlay').hidden) {
      if (e.key === 'Escape' || e.keyCode === 27) closeModal();
      if (e.key === 'Tab' || e.keyCode === 9) {
        var items = $('overlay').querySelectorAll('button,input,textarea,select,a[href]');
        if (e.shiftKey && document.activeElement === items[0]) { e.preventDefault();items[items.length-1].focus(); }
        else if (!e.shiftKey && document.activeElement === items[items.length-1]) { e.preventDefault();items[0].focus(); }
      }
      return;
    }
    if(state && state.arcade && state.phase==='playing' && state.me && state.me.stage==='drop' && /^[1-4]$/.test(e.key) &&
        state.arcade.mode==='match' && !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) {
      e.preventDefault(); if(!busy) chooseArcade(Number(e.key)-1); return;
    }
    if ((e.code === 'Space' || e.keyCode === 32) && state && state.phase === 'playing' && state.me && state.me.stage === 'drop' &&
        !/^(INPUT|TEXTAREA|SELECT|A)$/.test(e.target.tagName) &&
        (e.target.tagName !== 'BUTTON' || e.target.id === 'drop' || e.target.hasAttribute('data-block'))) {
      e.preventDefault(); if (!e.repeat) {if(state.arcade) arcadeDrop(); else drop();}
    }
  });

  function paintPanel(key, html) {
    if (key === panelKey) return;
    panelKey = key; panel.innerHTML = html;
  }
  function setScene(key, options) {
    if (!scene && window.BloxxScene) scene = window.BloxxScene.mount($('scene'));
    if (scene && key !== visualKey) { visualKey = key; scene.set(options); }
  }
  function footer(label, right) {
    $('mode').innerHTML = '<i class="lamp" aria-hidden="true"></i>' + esc(label);
    $('counter').textContent = right;
  }
  function setLayout(name) {
    game.className = ('shell ' + name).trim();
    if (name === 'board' && scene) { scene.destroy(); scene = null; visualKey = ''; }
    $('crane-label').hidden = true;
    $('arcade-hud').hidden = name!=='stage arcade';
  }
  function home() {
    setLayout(''); setScene('attract',{mode:'attract',label:'',showRoof:false}); footer('Matching · Right / Wrong','Solo or class');
    var paused = savedRoom('mb-paused');
    var resume = paused && paused.expires > Date.now() && (!codeFromLink || codeFromLink === paused.room.code) ?
      '<button class="text-btn" id="resume">Resume room '+esc(paused.room.code)+'</button>' : '';
    paintPanel('home-' + resume, '<h2>Join a room</h2><p class="sub">Enter the code on your classroom screen.</p>' +
      '<form id="join-form"><label for="name">Your name</label><input id="name" type="text" maxlength="24" autocomplete="nickname" placeholder="First name" required value="'+esc(read('mb-name') || '')+'">' +
      '<label for="code">Room code</label><input id="code" class="code" type="text" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" placeholder="000000" title="Six digits" required value="'+esc(codeFromLink)+'">' +
      '<button class="button primary" type="submit">Join room</button></form><div class="divider"></div><div class="menu-tiles">' +
      '<button id="solo" class="menu-tile"><img src="assets/solo.png" alt="">Play solo</button><button id="host" class="menu-tile"><img src="assets/classroom.png" alt="">Host a class</button></div>'+
      '<button type="button" id="word-sets" class="text-btn">Word sets</button>'+resume);
    if ($('resume')) $('resume').onclick = function () { restore(paused.room); };
    $('join-form').onsubmit = function (e) {e.preventDefault(); enter('join');};
    $('solo').onclick = function () {
      if (busy) return;
      openSetup(false);
    };
    $('host').onclick = function () { if(!busy)openSetup(true); };
    $('word-sets').onclick = function () { if(!busy)openLibrary(); };
  }
  function modeLabel(mode) { return mode==='match'?'Matching':'Right / Wrong'; }
  function modeOptions(mode) {
    return '<option value="match"'+(mode==='match'?' selected':'')+'>Matching</option>'+
      '<option value="rightwrong"'+(mode==='rightwrong'?' selected':'')+'>Right / Wrong</option>';
  }
  function library() {
    var sets=savedRoom(poolKey);
    return Array.isArray(sets)?sets:[];
  }
  function optionsFor(mode, selected) {
    var game=BloxxArcade.config(mode);
    return '<option value="default">'+esc(game.set.name)+' (built in)</option>'+
      library().filter(function(entry){return entry.mode===mode;}).map(function(entry){
        return '<option value="'+esc(entry.id)+'"'+(entry.id===selected?' selected':'')+'>'+esc(entry.set.name)+'</option>';
      }).join('');
  }
  function loadPool(mode, id) {
    var saved=library().filter(function(entry){return entry.id===id && entry.mode===mode;})[0];
    return BloxxArcade.config(mode,saved?saved.set:null);
  }
  function openSetup(hosting, preferredMode, initialSet) {
    var mode=preferredMode || read('mb-preferred-mode') || 'match';
    if(mode!=='rightwrong')mode='match';
    modal('<h2 id="dialog-title">'+(hosting?'Host a class':'Play solo')+'</h2>'+
      '<label for="setup-mode">Game mode</label><select id="setup-mode">'+modeOptions(mode)+'</select>'+
      '<label for="setup-set">Word set</label><select id="setup-set">'+optionsFor(mode,initialSet)+'</select>'+
      '<p class="sub">'+(hosting?'12 turns per builder.':'Build as high as you can. Finish the run when you’re ready.')+'</p>'+
      '<button id="launch-arcade" class="button yellow">'+(hosting?'Create room':'Start building')+'</button>'+
      '<button id="edit-pool" class="text-btn">Edit word sets</button>','Cancel');
    $('setup-mode').onchange=function(){mode=this.value;$('setup-set').innerHTML=optionsFor(mode);};
    $('edit-pool').onclick=function(){openLibrary(mode,$('setup-set').value,hosting);};
    $('launch-arcade').onclick=function(){
      try {
        var selected=loadPool(mode,$('setup-set').value);
        save('mb-preferred-mode',mode);
        closeModal();
        invite=null;
        if(hosting) {roomSetup=selected;enter('create');}
        else {
          retryPayload=null;retrySession=null;session=null;
          activePractice=selected;
          arcadeRound='';
          practice=BloxxArcade.practice(selected,$('name').value.trim() || 'You');
          status('');cue('match');receive(practice.view());
        }
      } catch(error){status(error.message);}
    };
  }
  function openLibrary(mode, id, hosting) {
    mode=mode==='rightwrong'?'rightwrong':'match';
    id=id || 'default';
    modal('<h2 id="dialog-title">Word sets</h2><label for="pool-mode">Game mode</label>'+
      '<select id="pool-mode">'+modeOptions(mode)+'</select><label for="pool-set">Saved sets</label>'+
      '<select id="pool-set">'+optionsFor(mode,id)+'</select><div id="pool-fields"></div>'+
      '<p id="pool-error" class="feedback" role="status" hidden></p>'+
      '<button id="save-pool" class="button yellow">Save word set</button>'+
      '<button id="new-pool" class="text-btn">New set</button>'+
      '<button id="copy-pool" class="text-btn">Save a copy</button>',typeof hosting==='boolean'?'Back to setup':'Back to menu');
    function fields(blank) {
      var data=loadPool(mode,id).set;
      var type=mode==='match';
      var body='<label for="pool-name">Set name</label><input type="text" id="pool-name" maxlength="40" value="'+esc(blank?'':data.name)+'">';
      if(type) {
        body+='<label for="pool-rows">Matches</label><p class="sub pool-hint">One match per line. Use <strong>prompt | answer</strong>. You can also add three choices after the answer.</p>'+
          '<textarea id="pool-rows" rows="7" placeholder="a lecture | attend | get | make | give">'+
          esc(blank?'':data.rows.map(function(row){return row.join(' | ');}).join('\n'))+'</textarea>';
      } else {
        body+='<label for="pool-instruction">Rule shown to players</label><input type="text" id="pool-instruction" maxlength="80" value="'+esc(blank?'':data.instruction)+'">'+
          '<div class="pool-columns"><div><label for="pool-right">Right blocks</label><textarea id="pool-right" rows="6" placeholder="One entry per line">'+
          esc(blank?'':data.right.join('\n'))+'</textarea></div><div><label for="pool-wrong">Wrong blocks</label><textarea id="pool-wrong" rows="6" placeholder="One entry per line">'+
          esc(blank?'':data.wrong.join('\n'))+'</textarea></div></div>';
      }
      $('pool-fields').innerHTML=body;
      $('pool-error').hidden=true;
    }
    function lines(value) {return value.split(/\r?\n/).map(function(line){return line.trim();}).filter(Boolean);}
    function savePool(copy) {
      try {
        var values={name:$('pool-name').value};
        if(mode==='match') values.rows=lines($('pool-rows').value).map(function(row){return row.split('|');});
        else {values.instruction=$('pool-instruction').value;values.right=lines($('pool-right').value);values.wrong=lines($('pool-wrong').value);}
        var config=BloxxArcade.config(mode,values);
        var sets=library();
        if(copy || id==='default'){
          if(sets.length>=30)throw Error('This browser can store up to 30 sets.');
          id=Date.now().toString(36)+Math.random().toString(36).slice(2,8);
          sets.push({id:id,mode:mode,set:config.set});
        } else sets=sets.map(function(entry){return entry.id===id?{id:id,mode:mode,set:config.set}:entry;});
        localStorage.setItem(poolKey,JSON.stringify(sets));
        $('pool-set').innerHTML=optionsFor(mode,id);
        $('pool-error').textContent='Saved in this browser.';
        $('pool-error').hidden=false;
      } catch(error) {
        $('pool-error').textContent=error.message||'This browser could not save the set.';
        $('pool-error').hidden=false;
      }
    }
    $('pool-mode').onchange=function(){mode=this.value;id='default';$('pool-set').innerHTML=optionsFor(mode);fields(false);};
    $('pool-set').onchange=function(){id=this.value;fields(false);};
    $('new-pool').onclick=function(){id='default';$('pool-set').value='default';fields(true);$('pool-name').focus();};
    $('save-pool').onclick=function(){savePool(false);};
    $('copy-pool').onclick=function(){savePool(true);};
    if(typeof hosting==='boolean') {
      $('close-dialog').onclick=function(){closeModal();openSetup(hosting,mode,id);};
    }
    fields(false);
    $('pool-mode').focus();
  }
  function request(data, cb) {
    var xhr = new XMLHttpRequest(), finished = false;
    function done(err, response, code) { if (!finished) { finished = true; cb(err, response, code); } }
    try {
      xhr.open('POST',window.MATCHING_BLOXX_API,true); xhr.timeout = 20000;
      xhr.setRequestHeader('Content-Type','application/json');
      xhr.onload = function () {
        var body; try { body = JSON.parse(xhr.responseText); } catch (_) {}
        if (xhr.status >= 200 && xhr.status < 300 && body && body.phase) done(null, body,xhr.status);
        else done((body && body.error) || 'The room service did not respond. Try again.',null,xhr.status);
      };
      xhr.onerror = xhr.ontimeout = function () { done('Connection interrupted. Check your connection and try again.',null,0); };
      xhr.send(JSON.stringify(data));
    } catch (_) { done('The room service is unavailable. Please try again.',null,0); }
  }
  function setBusy(value) {
    busy = value; panel.setAttribute('aria-busy',String(value));
    var buttons = panel.querySelectorAll('button:not([data-free]),input');
    for (var i=0;i<buttons.length;i++) {
      if (buttons[i].getAttribute('data-disabled') !== 'true') buttons[i].disabled=value;
    }
  }
  function enter(type, collisionCount) {
    if (busy) return;
    try {
      var name = $('name').value.trim(), code = $('code').value.trim();
      if (type === 'join' && (!name || !/^\d{6}$/.test(code))) { status('Enter your name and the six-digit room code.'); return; }
      if (name) save('mb-name',name);
      if (!invite || invite.type !== type || (type === 'join' && (invite.code !== code || invite.name !== name))) {
        invite = {type:type,code:type === 'create' ? newCode() : code,token:token(),name:name,requestId:token()};
        if (type === 'create') {invite.presenterToken = token();invite.setup=roomSetup;}
        else {
          var seat = savedRoom('mb-seat-' + code);
          if (seat && seat.expires > Date.now()) invite.token = seat.token;
        }
      }
      var pending = invite;
      setBusy(true); status(type === 'create' ? 'Opening your classroom…' : 'Joining the room…');
      request(pending,function (error, data, http) {
        setBusy(false);
        if (error && type === 'create' && http === 409 && (collisionCount || 0) < 3) {
          invite = null; enter(type,(collisionCount || 0)+1); return;
        }
        if (error) {status(error);return;}
        session = {code:pending.code,token:pending.token,role:data.role};
        if (pending.presenterToken) session.presenterToken = pending.presenterToken;
        if (data.role === 'player') save('mb-seat-' + session.code,JSON.stringify({token:session.token,expires:Date.now()+86400000}));
        save(storageKey,JSON.stringify(session)); tabRoom(session); invite = null; status(''); receive(data); schedule();
      });
    } catch (err) { setBusy(false); status(err.message); }
  }
  function schedule() {
    clearTimeout(timer);
    if (!session || !state || state.phase === 'finished' || document.hidden) return;
    var delay = state.role === 'player' ? (state.phase === 'lobby' ? 4500 : 10500) : 4200;
    timer = setTimeout(refresh,delay + Math.floor(Math.random()*900));
  }
  function refresh() {
    if (busy || !session || document.hidden) {schedule();return;}
    var generation = ++pollGeneration;
    request({type:'state',code:session.code,token:session.token},function (error,data,http) {
      if (generation !== pollGeneration || !session) return;
      if (!error) {if (feedback.getAttribute('data-network')) {status(''); feedback.removeAttribute('data-network');} receive(data);}
      else if (http === 410 || http === 404 || http === 403 || http === 401) {reset();status(error);return;}
      else { feedback.setAttribute('data-network','1');status('Reconnecting to the classroom…'); }
      schedule();
    });
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) clearTimeout(timer); else if (session && state && state.phase !== 'finished') refresh();
  });
  function perform(type, fields, cb) {
    if (busy) return;
    pollGeneration++; clearTimeout(timer); status(''); setBusy(true);
    function done(error, data, http) {
      setBusy(false);
      if (error) {
        status(error);
        if (http === 409 && session) { retryPayload=null; refresh(); }
        else schedule();
        if (cb) cb(error);
        return;
      }
      retryPayload=null;
      if (cb) cb(null,data); else receive(data);
      schedule();
    }
    if (practice) {
      try { var view = practice.command(type,fields); done(null,view); } catch (err) { done(err.message); }
    } else {
      var data = {type:type,code:session.code,token:session.token};
      Object.keys(fields || {}).forEach(function(k){data[k]=fields[k];});
      var signature = JSON.stringify(data);
      if (retryPayload && retryPayload.signature === signature) data.requestId = retryPayload.id;
      else {data.requestId=token(); retryPayload={signature:signature,id:data.requestId};}
      request(data,done);
    }
  }
  function copyLink(url,label) {
    function manual() {
      modal('<h2 id="dialog-title">'+esc(label)+'</h2><p class="sub">Copy this link to the other device.</p><input id="copy-field" type="text" readonly value="'+esc(url)+'"><div class="divider"></div>');
      $('copy-field').focus();$('copy-field').select();
    }
    if (!navigator.clipboard || !navigator.clipboard.writeText) {manual();return;}
    navigator.clipboard.writeText(url).then(function(){status(label+' copied.');},manual);
  }
  function reset(pauseRoom) {
    pollGeneration++; clearTimeout(timer);
    if (!session || session.role !== 'presenter') {
      var saved=savedRoom(storageKey), paused=savedRoom('mb-paused');
      if (pauseRoom === true && session) save('mb-paused',JSON.stringify({room:session,expires:Date.now()+86400000}));
      else if (session && paused && paused.room.token === session.token) save('mb-paused',null);
      if (session && saved && saved.token === session.token) save(storageKey,null);
      if (session) tabRoom(null);
      if (session && session.role==='player' && pauseRoom !== true) save('mb-seat-'+session.code,null);
    }
    try { history.replaceState(null,'',location.pathname); } catch (_) {}
    state=null;session=null;practice=null;invite=null;retryPayload=null;retrySession=null;
    arcadeRound='';activePractice=null;roomSetup=null;
    screenKey='';codeFromLink='';motionKey='';previousPhase=null;visualKey='';panelKey='';
    setBusy(false);status('');home();
  }
  function leave() {
    if (state.phase === 'finished') {reset();return;}
    if (!practice) {reset(true);return;}
    var text = 'Your practice run will end.';
    modal('<h2 id="dialog-title">Leave this game?</h2><p class="sub">'+esc(text)+'</p><button class="button" id="confirm-leave">Leave game</button>','Keep playing');
    $('confirm-leave').onclick=function(){closeModal();reset();};
  }
  function statistics(me) {
    return '<div class="stats"><div class="stat"><small>Points</small><strong>'+me.score+'</strong></div><div class="stat"><small>Floors</small><strong>'+me.floors+'</strong></div></div>';
  }
  function line(row) {
    return '<li><b class="rank">'+row.rank+'</b><span class="person">'+esc(row.name)+'</span><span class="points">'+row.score+' pts</span></li>';
  }
  function standings(rows) {
    return '<div class="score-head"><span>Builder</span><span>Score</span></div><ol class="player-list">'+rows.map(line).join('')+'</ol>';
  }
  function hostScreenControls() {
    return '<div class="row-buttons"><button id="copy-join" class="small-action" data-free>Copy join link</button><a class="small-action" id="presenter" href="'+esc(urlForScreen())+'" target="_blank" rel="noopener noreferrer">Open presenter screen</a><button id="copy-screen" class="text-btn" data-free>Copy presenter link</button></div>';
  }
  function bindHost() {
    if ($('copy-join')) $('copy-join').onclick=function(){copyLink(joinLink(),'Join link');};
    if ($('copy-screen')) $('copy-screen').onclick=function(){copyLink(urlForScreen(),'Presenter link');};
    if ($('start')) $('start').onclick=function(){perform('start',{});};
    if ($('finish')) $('finish').onclick=function(){
      modal('<h2 id="dialog-title">Finish the game?</h2><p class="sub">This closes every crane and records the current scores.</p><button id="confirm-finish" class="button">Finish game</button>','Keep playing');
      $('confirm-finish').onclick=function(){closeModal();perform('finish',{});};
    };
  }
  function room() {
    setLayout('room'); setScene('room-attract',{mode:'attract',label:''}); footer('Classroom','Room '+state.code);
    var teacher=state.role==='host', lobby=state.phase==='lobby', players=state.players;
    var html='<p class="eyebrow">'+(teacher?'Teacher controls':'Classroom')+'</p><h2>'+(lobby?'Room lobby':'Live scores')+'</h2>';
    if(state.arcade)html+='<p class="sub">'+esc(modeLabel(state.arcade.mode))+' · '+esc(state.arcade.name)+'</p>';
    if (teacher) {
      html+='<p class="sub">Students can join with this code.</p><div class="room-code">'+esc(state.code)+'</div>'+hostScreenControls();
      if (lobby) html+='<button id="start" class="button primary"'+(!players.length?' data-disabled="true" disabled':'')+'>Start game</button>';
      else html+='<button id="finish" class="small-action">Finish game</button>';
    } else html+='<p class="sub">You’re in, '+esc(state.me.name)+'. Your teacher will start the game.</p>';
    html+='<div class="divider"></div><div class="row"><h3>Builders</h3><span class="tag">'+players.length+' / '+state.capacity+'</span></div>';
    if(players.length) html+=lobby?'<ul class="player-list">'+players.map(function(p){return '<li class="person">'+esc(p.name)+'</li>';}).join('')+'</ul>':standings(players);
    else html+='<p class="sub">Waiting for the first builder…</p>';
    html+='<button id="leave" class="text-btn">Back to menu</button>';
    paintPanel(html,html);bindHost();$('leave').onclick=leave;
  }
  var qrFor='',qrSrc='';
  function qr(code) {
    if(!window.qrcode) return '';
    if(qrFor!==code) {
      var qr = window.qrcode(0,'M'); qr.addData(joinLink()); qr.make();
      qrSrc=qr.createDataURL(4,16);qrFor=code;
    }
    return '<img class="join-qr" src="'+qrSrc+'" alt="Scan to join room '+esc(code)+'">';
  }
  function board() {
    setLayout('board');
    var finished=state.phase==='finished',lobby=state.phase==='lobby';
    var html='<div class="board-top"><div><p class="eyebrow">Matching Bloxx</p><h2>'+(finished?'Final standings':lobby?'Classroom lobby':'Live scoreboard')+'</h2><p class="sub">'+state.players.length+' / 36 builders'+(lobby?' · Waiting for the teacher':' · 12 rounds')+'</p></div>';
    if(!finished) html+='<div class="board-invite">'+qr(state.code)+'<div><span class="eyebrow">Room code</span><div class="room-code">'+state.code+'</div><small>'+esc(location.host+location.pathname)+'</small></div></div>';
    html+='</div>';
    if(!state.players.length) html+='<p class="sub">Scan the code to join.</p>';
    html+='<div class="board-grid">'+state.players.map(function(p){
      return '<div class="board-card'+(p.rank===1&&!lobby?' first':'')+'"><span class="rank">'+(lobby?'':p.rank)+'</span><span class="mini-tower" aria-hidden="true"><i style="height:'+Math.min(32,2+p.floors*2.5)+'px"></i></span><span class="person">'+esc(p.name)+'<small>'+p.floors+' floors · '+p.completed+'/12</small></span><strong class="points">'+p.score+'</strong></div>';
    }).join('')+'</div>';
    if(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen) html+='<button id="full" class="small-action" data-free>Full screen</button>';
    paintPanel(html,html);
    if($('full')) $('full').onclick=function(){
      var doc=document.documentElement;
      if(document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else {var req=(doc.requestFullscreen || doc.webkitRequestFullscreen).call(doc);if(req&&req.catch)req.catch(function(){});}
    };
  }
  function drop() {
    if(busy || !state || !state.me || state.me.stage!=='drop') return;
    var me=state.me, elapsed=Math.max(0,Math.round(now()-motionStart));
    var x=MatchingBloxxRules.position(me.motion,elapsed), landed=Math.abs(x)<.85, animDone=!scene, answer=null;
    var placement=typeof me.balance==='number' ? MatchingBloxxRules.placeFloor(me.placements,x) : null;
    var collapse=placement && placement.fallen ? placement : null;
    function settle() {
      if (!animDone || !answer) return;
      setBusy(false);
      var last=answer.me.last;
      if(last) cue(last.kind==='perfect'?'perfect':last.kind==='miss'?'miss':'land');
      receive(answer); schedule();
    }
    if(scene) scene.drop(x,landed,function(){animDone=true;settle();},collapse);
    perform('drop',{round:me.round,elapsedMs:elapsed},function(error,data){
      if(error){if(scene && scene.cancelDrop) scene.cancelDrop();visualKey='';render();return;}
      answer=data;
      if(!animDone) setBusy(true);
      settle();
    });
  }
  function player() {
    var me=state.me, stage=me.stage, done=stage==='done';
    var motionId=state.code+'-'+me.round+'-'+stage;
    if(motionKey!==motionId) {motionKey=motionId;motionStart=now();}
    setLayout('stage');
    var prompt=stage==='match'||stage==='drop'?me.prompt:'';
    setScene(motionId+'-'+me.placements.join(','),{mode:'build',floors:me.placements,balance:me.balance,showCrane:stage==='match'||stage==='drop',label:prompt,
      getOffset:stage==='drop' && me.motion ? function(){return MatchingBloxxRules.position(me.motion,Math.max(0,now()-motionStart));} : null});
    footer(practice?'Solo practice':'Room '+state.code,'Round '+me.round+' / 12');
    var html=(practice?'':'<p class="eyebrow">'+esc(me.name)+'</p>')+statistics(me);
    if(done) html+='<h2>Tower complete</h2><p class="sub">Waiting for the other builders to finish.</p>'+standings(state.players);
    else if(stage==='match') {
      html+='<h3>Choose the verb</h3><p class="question"><span class="blank" aria-hidden="true">___</span> '+esc(me.prompt)+'</p><div class="choices">'+me.choices.map(function(v){return '<button class="choice" data-verb="'+esc(v)+'">'+esc(v.toLowerCase())+'</button>';}).join('')+'</div>';
      if(me.gustPending) html+='<p class="wind-note">Incoming gust · Your next crane will swing faster.</p>';
      if(me.steady) {
        var targets=state.players.filter(function(p){return p.id!==me.id && p.canReceiveGust;});
        html+='<div class="row-buttons">'+(me.steadyArmed?'<span class="pill">Steady Crane ready</span>':
          '<button id="steady" class="small-action">Use Steady Crane</button>'+
          (targets.length?'<button id="gust" class="small-action">Send a gust</button>':''))+'</div>';
      }
    } else if(stage==='drop') {
      html+='<h2>Time your drop</h2><p class="sub">'+(me.motion && me.motion.gust?'A gust is speeding up your crane. ':'')+
        (Math.abs(me.balance)>=.5?'Aim a little to the '+(me.balance>0?'left':'right')+' to counter the lean.':'Release the floor over your tower.')+
        '</p>'+balanceMeter(me.balance)+'<button class="button yellow" id="drop">Drop floor</button>';
    } else if(stage==='result' && me.last) {
      html+=result(me.last)+'<button class="button yellow" id="next">'+(me.round===12?'See standings':'Next floor')+'</button>';
    }
    html+='<div class="row-buttons"><button class="text-btn" id="leave">'+(practice?'Leave game':'Back to menu')+'</button></div>';
    paintPanel(html,html);
    var choices=panel.querySelectorAll('[data-verb]');
    for(var i=0;i<choices.length;i++) choices[i].onclick=function(){
      perform('answer',{round:me.round,verb:this.getAttribute('data-verb')},function(error,data){
        if(!error){cue(data.me.stage==='drop'?'match':'miss');receive(data);}
      });
    };
    if($('drop')) $('drop').onclick=drop;
    if($('next')) $('next').onclick=function(){perform('next',{round:me.round});};
    if($('steady')) $('steady').onclick=function(){perform('steady',{round:me.round});};
    if($('gust')) $('gust').onclick=function(){
      modal('<h2 id="dialog-title">Send a gust</h2><p class="sub">Spend your bonus to speed up one builder’s next drop.</p>'+
        '<label for="rival">Builder</label><select id="rival">'+targets.map(function(p){
          return '<option value="'+esc(p.id)+'">'+esc(p.name)+'</option>';
        }).join('')+'</select><button class="button primary" id="send-gust">Send gust</button>','Cancel');
      $('send-gust').onclick=function(){
        var target=$('rival').value, name=$('rival').options[$('rival').selectedIndex].text;
        closeModal();perform('gust',{round:me.round,targetId:target},function(error,data){
          if(!error){receive(data);status('Gust sent to '+name+'.');}
        });
      };
    };
    $('leave').onclick=leave;
  }
  function result(last) {
    var title={wrong:'Not quite',miss:'Missed the tower',landed:'Floor landed',perfect:'Perfect drop!'};
    var heading=last.fallen>1?'Tower collapse':last.fallen?'Floor tipped off':title[last.kind];
    return '<h2>'+heading+'</h2><p class="result-line">'+(last.kind==='wrong'?'The match is ':'')+'<strong>'+esc(last.phrase)+'</strong>.</p>'+
      (last.fallen>1?'<p class="sub">'+last.fallen+' floors fell, including the new one.</p>':'')+
      '<p class="sub"><span class="pill">+'+last.points+' points</span></p>';
  }
  function balanceMeter(value) {
    if(typeof value!=='number') return '';
    var amount=Math.abs(value);
    var label=amount>=.5?(amount>=.8?'Tipping ':'Leaning ')+(value<0?'left':'right'):'Steady';
    var position=50+44*Math.max(-1,Math.min(1,value));
    return '<div class="balance"><div class="row"><strong>Balance</strong><span>'+label+'</span></div>'+
      '<div class="balance-track" aria-hidden="true"><i style="left:'+position+'%"></i></div></div>';
  }
  function arcadeOutcome(last) {
    if(!last)return '';
    var words={
      perfect:'★ Perfect drop',
      landed:'Floor landed',
      miss:last.fallen>1?'Tower tumbled':last.fallen?'Floor tipped off':'Missed the tower',
      wrong:'Wrong block',
      passed:'Wrong block skipped',
      'passed-right':'A right block was skipped'
    };
    var extra=last.lost?' · '+last.lost+(last.lost===1?' floor fell':' floors fell'):
      last.correction?' · '+last.correction:last.points?' · +'+last.points:'';
    return '<span class="drop-note '+(last.kind==='perfect'?'perfect':'')+'">'+esc(words[last.kind]+extra)+'</span>';
  }
  function chooseArcade(index) {
    if(busy || !state.me.choices[index])return;
    arcadeChoice=index;
    arcadePlayer();
    var choice=panel.querySelector('[data-block="'+index+'"]');
    if(choice)choice.focus();
  }
  function arcadeDrop() {
    if(busy || !state || !state.me.motion || arcadeChoice<0)return;
    var me=state.me;
    var elapsed=Math.max(0,Math.round(now()-motionStart));
    var path=BloxxArcade.flight(me.motion,elapsed);
    if(scene)scene.release(path);
    perform('arcadeDrop',{round:me.round,choice:arcadeChoice,elapsedMs:elapsed},function(error,data){
      if(error){if(scene)scene.cancelDrop();return;}
      function complete() {
        setBusy(false);
        receive(data);
        schedule();
      }
      function contact() {
        var last=data.me.last;
        cue(last.kind==='perfect'?'perfect':last.kind==='landed'?'land':'miss');
      }
      if(scene){setBusy(true);scene.impact(data.me.last,complete,contact);}
      else {contact();complete();}
    });
  }
  function arcadePlayer() {
    var me=state.me;
    var matching=state.arcade.mode==='match';
    var done=state.phase==='finished' || me.stage==='done';
    var round=state.code+'-'+me.round;
    if(arcadeRound!==round) {
      arcadeRound=round;
      arcadeChoice=matching?-1:0;
      motionStart=now();
    }
    var activeLabel=arcadeChoice>=0?me.choices[arcadeChoice]:'?';
    var target=matching?me.prompt:'';
    setLayout('stage arcade');
    setScene('arcade-'+round+'-'+arcadeChoice+'-'+done,{mode:'build',arcade:true,floors:me.placements,balance:me.balance,
      showCrane:!done,showRoof:done,target:target,label:activeLabel,choice:arcadeChoice,getOffset:null,
      getSwing:!done && me.motion?function(){return BloxxArcade.pose(me.motion,Math.max(0,now()-motionStart));}:null});
    $('arcade-hud').innerHTML='<span><b>'+me.score+'</b> points</span><span><b>'+me.floors+'</b> '+(me.floors===1?'floor':'floors')+'</span>';
    footer(modeLabel(state.arcade.mode),done?'Game over':state.total?'Turn '+me.round+' / '+state.total:'Turn '+me.round);
    var html='<div class="arcade-controls">';
    if(done) {
      html+='<div class="row"><h2>'+(practice?'Tower complete':state.phase==='finished'?'Final standings':'Tower complete')+'</h2></div>';
      if(!practice)html+=standings(state.players);
      html+=arcadeOutcome(me.last)+'<div class="row-buttons"><button id="again" class="small-action">'+(practice?'Build again':'Back to menu')+'</button>';
      if(practice)html+='<button id="leave" class="text-btn">Back to menu</button>';
      html+='</div>';
    } else {
      html+='<div class="arcade-title"><h2>'+(matching?'<span class="blank">___</span> '+esc(me.prompt):
        esc(state.arcade.instruction))+'</h2>'+arcadeOutcome(me.last)+'</div>';
      if(matching)html+='<div class="arcade-choices" aria-label="Choose a block">'+me.choices.map(function(word,i){
        return '<button type="button" class="choice" data-block="'+i+'" aria-pressed="'+(arcadeChoice===i)+'">'+esc(word)+'</button>';
      }).join('')+'</div>';
      else html+='<p class="word-on-crane">'+esc(me.prompt)+'</p>';
      var off=arcadeChoice<0?' data-disabled="true" disabled':'';
      html+='<div class="arcade-dropbar"><div>'+balanceMeter(me.balance)+'</div>'+
        '<button class="button yellow" id="drop"'+off+'>Drop floor</button>'+
        (matching?'':'<button class="button skip" id="skip">Skip block</button>')+'</div>';
      if(me.motion && me.motion.gust)html+='<p class="wind-note">Gust · faster swing</p>';
      if(me.motion && me.motion.assisted)html+='<p class="wind-note">Steady Crane · slower swing</p>';
      var targets=state.players.filter(function(p){return p.id!==me.id && p.canReceiveGust;});
      html+='<div class="row-buttons">'+(me.steady?(me.steadyArmed?'<span class="pill">Steady Crane ready for the next block</span>':
        '<button id="arcade-steady" class="small-action">Slow next swing</button>'+
        (targets.length?'<button id="arcade-gust" class="small-action">Send a gust</button>':'')):'')+
        '<button id="leave" class="text-btn">'+(practice?'Finish run':'Back to menu')+'</button></div>';
    }
    html+='</div>';
    paintPanel(html,html);
    var buttons=panel.querySelectorAll('[data-block]');
    for(var i=0;i<buttons.length;i++)buttons[i].onclick=function(){chooseArcade(Number(this.getAttribute('data-block')));};
    if($('drop'))$('drop').onclick=arcadeDrop;
    if($('skip'))$('skip').onclick=function(){perform('arcadePass',{round:me.round});};
    if($('arcade-steady'))$('arcade-steady').onclick=function(){perform('steady',{round:me.round});};
    if($('arcade-gust'))$('arcade-gust').onclick=function(){
      modal('<h2 id="dialog-title">Send a gust</h2><label for="arcade-rival">Builder</label><select id="arcade-rival">'+targets.map(function(p){
        return '<option value="'+esc(p.id)+'">'+esc(p.name)+'</option>';
      }).join('')+'</select><button class="button primary" id="arcade-send">Send gust</button>','Cancel');
      $('arcade-send').onclick=function(){
        var target=$('arcade-rival').value;
        closeModal();perform('gust',{round:me.round,targetId:target});
      };
    };
    if($('again'))$('again').onclick=function(){
      if(!practice){reset();return;}
      arcadeRound='';
      practice=BloxxArcade.practice(activePractice,me.name);
      previousPhase=null;
      receive(practice.view());
    };
    if($('leave'))$('leave').onclick=done?reset:practice?function(){perform('finish',{});}:leave;
  }
  function finalScreen() {
    setLayout('stage');var me=state.me;
    setScene('end-'+(me?me.placements.join(','):''),me?{mode:'build',floors:me.placements,showCrane:false,label:''}:{mode:'attract',label:''});
    footer(practice?'Solo practice':'Classroom','Game over');
    var html='<p class="eyebrow">Matching Bloxx</p><h2>'+(practice?'Practice complete':'Final standings')+'</h2>';
    if(me) {
      html+=statistics(me);
      if(me.last)html+=result(me.last);
    }
    if(!practice)html+=standings(state.players);
    html+='<button id="again" class="button primary">'+(practice?'Play again':'Back to menu')+'</button>';
    if(practice)html+='<button class="text-btn" id="leave">Back to menu</button>';
    paintPanel(html,html);
    $('again').onclick=function(){if(practice){practice=MatchingBloxxRules.practice(me.name);previousPhase=null;receive(practice.view());}else reset();};
    if($('leave'))$('leave').onclick=reset;
  }
  function render() {
    if(!state){home();return;}
    if(state.role==='presenter')board();
    else if(state.arcade && state.me && state.phase!=='lobby')arcadePlayer();
    else if(state.phase==='finished')finalScreen();
    else if(state.phase==='lobby'||state.role==='host')room();
    else player();
  }
  function receive(data) {
    state=data;render();
    if(data.phase==='finished' && previousPhase==='playing') cue('finish');
    previousPhase=data.phase;
  }
  function restore(known) {
    var stored=tabRoom() || savedRoom(storageKey);
    if(known) session=known;
    else if(screenKey && codeFromLink) session={code:codeFromLink,token:screenKey,role:'presenter'};
    else if(stored && (!codeFromLink || (stored.code===codeFromLink && stored.role==='player')))session=stored;
    if(!session)return;
    retrySession=session;
    setBusy(true);status('Reconnecting to your room…');
    request({type:'state',code:session.code,token:session.token},function(error,data,http){
      setBusy(false);
      if(error) {
        if(http===403||http===404||http===410||http===401){reset();status(error);return;}
        status(error);session=null;
        var b=document.createElement('button');b.className='small-action';b.textContent='Reconnect';
        b.onclick=function(){if(!busy)restore(retrySession);};feedback.appendChild(document.createTextNode(' '));feedback.appendChild(b);
        return;
      }
      if(session.role!=='presenter'){save(storageKey,JSON.stringify(session));tabRoom(session);}
      status('');receive(data);schedule();
    });
  }
  syncSound();home();restore();
}());
