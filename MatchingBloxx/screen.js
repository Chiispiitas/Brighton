(function (window) {
  'use strict';

  function clock() {
    return window.performance && performance.now ? performance.now() : Date.now();
  }

  function blockButton(word, index, selected) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'screen-choice';
    button.setAttribute('aria-pressed', String(!!selected));
    var picture = document.createElement('canvas');
    picture.setAttribute('aria-hidden','true');
    var label = document.createElement('span');
    label.textContent = word;
    button.appendChild(picture);
    button.appendChild(label);
    window.BloxxScene.segment(picture,index);
    return button;
  }

  function bindDrop(button, release) {
    button.onpointerdown = function (event) {
      if(event.button!==0 || button.disabled)return;
      event.preventDefault();
      release();
    };
    button.onclick = release;
  }

  function mount(board, config, names, turns, cue, leave) {
    var rules = window.MatchingBloxxRules;
    var arcade = window.BloxxArcade;
    var physics = window.BloxxPhysics;
    var matching = config.mode === 'match';
    var tiles = [];
    var seed = Math.floor(Math.random() * 1e9);
    var closed = false;

    board.innerHTML = '<header class="screen-bar"><div><h1>Screen mode</h1><p class="screen-set"></p></div>' +
      '<button type="button" class="small-action screen-exit">Back to menu</button></header>' +
      '<p class="screen-winners" role="status" hidden></p><div class="screen-grid"></div>';
    board.querySelector('.screen-set').textContent = config.set.name + ' · ' + turns +
      (matching ? (turns===1?' question each':' questions each') : (turns===1?' block each':' blocks each'));
    board.querySelector('.screen-exit').onclick = leave;
    var grid = board.querySelector('.screen-grid');
    var winners = board.querySelector('.screen-winners');
    board.setAttribute('data-players', names.length);

    function finishIfReady() {
      if (!tiles.every(function (tile) { return tile.finished; })) return;
      var standings = rules.standings(tiles.map(function (tile) { return tile.player; }));
      var leaders = standings.filter(function (row) { return row.rank === 1; });
      winners.textContent = leaders.map(function (row) { return row.name; }).join(' & ') +
        (leaders.length === 1 ? ' wins' : ' tie') + ' · ' + leaders[0].score + ' points';
      winners.hidden = false;
      cue('finish');
    }

    function makeTile(index) {
      var card = document.createElement('section');
      var player = rules.newPlayer('p' + index, names[index - 1], Math.floor(Math.random() * 1e9));
      player.stage = 'drop';
      var tower = physics.tower();
      var crane = {seed:seed,round:1,placements:[]};
      var craneStart;
      function rehang() {
        var now=clock();
        crane.round=player.round;
        crane.placements=player.placements;
        arcade.arm(crane,now,2,now-craneStart);
        crane.motion.period*=1.12;
        crane.motion.amplitude*=1.1;
        craneStart=now;
      }
      rehang();
      // Reserve a different first prompt where possible, then use each player's own shuffle.
      var playerConfig = config;
      if(matching) {
        var rows = config.set.rows.slice();
        var opening = arcade.card(config, (index - 1) % rows.length + 1, seed).label;
        var first = arcade.card(config, 1, player.seed).label;
        var openingSlot = rows.findIndex(function (row) { return row[0] === opening; });
        var firstSlot = rows.findIndex(function (row) { return row[0] === first; });
        var firstRow = rows[firstSlot];
        rows[firstSlot] = rows[openingSlot];
        rows[openingSlot] = firstRow;
        playerConfig = {mode:config.mode,shuffleAll:true,set:Object.assign({},config.set,{rows:rows})};
      }
      var colors = [];
      card.className = 'screen-tile'+(matching?'':' screen-sorting');
      card.setAttribute('aria-label', player.name);
      card.innerHTML = '<header class="screen-tile-head"><strong></strong><span></span></header>' +
        '<div class="screen-tower"></div><p class="screen-prompt"></p><div class="screen-controls">' +
        '<div class="screen-choices" aria-label="Matching blocks"></div>' +
        '<button type="button" class="screen-drop"></button></div>';
      grid.appendChild(card);
      card.querySelector('strong').textContent = player.name;
      var headline = card.querySelector('.screen-tile-head span');
      var prompt = card.querySelector('.screen-prompt');
      var choices = card.querySelector('.screen-choices');
      var drop = card.querySelector('.screen-drop');
      var scene = window.BloxxScene.mount(card.querySelector('.screen-tower'));
      var tile = {player:player, scene:scene, finished:false};
      var selected = -1, busy = false, view;

      function currentSwing() {
        return physics.swing(crane.motion, Math.max(0,clock()-craneStart));
      }

      function select(index) {
        if (busy || tile.finished) return;
        if (selected !== index) cue('match');
        selected = index;
        for (var i=0; i<choices.children.length; i++) {
          choices.children[i].setAttribute('aria-pressed', String(i === selected));
        }
        drop.disabled = false;
        scene.set({label:view.choices[index],choice:index,showRoof:false});
      }

      function next() {
        tile.finished = player.stage === 'done';
        view = arcade.playerView(player, playerConfig, tile.finished ? 'finished' : 'playing');
        selected = matching?-1:0;
        headline.textContent = view.score + ' pts · ' + (tile.finished ? 'Finished' : view.round + '/' + turns);
        prompt.textContent = tile.finished ? view.floors + (view.floors===1?' floor':' floors') :
          (matching && !/_{2,}|[.!?]$/.test(view.prompt)?'___ ':'') + view.prompt;
        if(!matching && !tile.finished) {
          var instruction=document.createElement('small');
          instruction.textContent=config.set.instruction;
          prompt.appendChild(instruction);
        }
        choices.textContent = '';
        choices.hidden = tile.finished || !matching;
        drop.hidden = tile.finished;
        drop.disabled = tile.finished || matching;
        drop.classList.remove('pressed');
        if (!tile.finished && matching) {
          view.choices.forEach(function (word, index) {
            var button = blockButton(word,index,false);
            button.onclick = function () { select(index); };
            choices.appendChild(button);
          });
        }
        scene.set({mode:'build', arcade:true, screen:true, physical:true, floors:view.placements, floorColors:colors.slice(),balance:view.balance,
          label:matching?'':view.prompt, choice:matching?-1:(player.round-1)%4, target:'', showCrane:!tile.finished,showRoof:tile.finished,
          getSwing:tile.finished?null:currentSwing,rockUntil:tile.finished?Date.now()+10000:0,
          getRock:function(){return tower.angle(clock());}});
        card.classList.remove('wrong-flash');
        busy = false;
      }

      drop.setAttribute('aria-label', player.name + ' drop floor');
      function release() {
        if (busy || tile.finished || selected < 0) return;
        var started = clock();
        var impact = arcade.trajectory(crane.motion,started-craneStart,player.placements,function(ahead){
          return tower.angle(started+ahead);
        },true);
        var question = arcade.card(playerConfig,player.round,player.seed);
        var last = arcade.screenDrop(player,matching,selected===question.correct,impact);
        if (last.floors.length > colors.length) colors.push(matching?selected:(player.round-1)%4);
        else colors.length = last.floors.length;
        player.placements = last.floors;
        player.score += last.points;
        if (++player.completed === turns) player.stage = 'done';
        else player.round++;
        busy = true;
        drop.classList.add('pressed');
        drop.disabled = true;
        for (var i=0; i<choices.children.length; i++) choices.children[i].disabled = true;
        scene.release(impact.path);
        scene.impact(last,function () {
          if (closed) return;
          if (player.stage !== 'done') rehang();
          next();
          finishIfReady();
        },function () {
          if(last.kind==='landed') tower.land(last.offset,clock(),player.placements.length);
          else if(last.kind==='perfect' || last.fallen) tower.land(0,clock(),player.placements.length);
          if(last.kind==='wrong') {
            card.classList.add('wrong-flash');
            cue('buzzer');
          } else {
            cue(last.kind==='perfect'?'perfect':last.kind==='landed'?'land':last.kind==='passed'?'match':'miss');
          }
        });
      }
      bindDrop(drop,release);
      next();
      return tile;
    }

    board.hidden = false;
    for (var i=1; i<=names.length; i++) tiles.push(makeTile(i));

    return function close() {
      closed = true;
      tiles.forEach(function (tile) { tile.scene.destroy(); });
      board.hidden = true;
      board.textContent = '';
    };
  }

  window.BloxxScreen = {mount:mount,blockButton:blockButton,bindDrop:bindDrop};
}(window));
