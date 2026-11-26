(function (window) {
  'use strict';

  function clock() {
    return window.performance && performance.now ? performance.now() : Date.now();
  }

  function mount(board, config, names, turns, cue, leave) {
    var rules = window.MatchingBloxxRules;
    var arcade = window.BloxxArcade;
    var physics = window.BloxxScreenMotion;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var tiles = [];
    var seed = Math.floor(Math.random() * 1e9);
    var closed = false;
    var craneStart = clock();
    var crane = {seed:seed,round:1};
    arcade.arm(crane, Date.now());
    crane.motion.period *= 1.26;
    crane.motion.amplitude *= 1.1;

    board.innerHTML = '<header class="screen-bar"><div><h1>Screen mode</h1><p class="screen-set"></p></div>' +
      '<button type="button" class="small-action screen-exit">Back to menu</button></header>' +
      '<p class="screen-winners" role="status" hidden></p><div class="screen-grid"></div>';
    board.querySelector('.screen-set').textContent = config.set.name + ' · ' + turns + (turns===1?' question each':' questions each');
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
      var motion = crane.motion;
      var tower = physics.tower();
      // Reserve a different first prompt where possible, then use each player's own shuffle.
      var rows = config.set.rows.slice();
      var opening = arcade.card(config, (index - 1) % rows.length + 1, seed).label;
      var first = arcade.card(config, 1, player.seed).label;
      var openingSlot = rows.findIndex(function (row) { return row[0] === opening; });
      var firstSlot = rows.findIndex(function (row) { return row[0] === first; });
      var firstRow = rows[firstSlot];
      rows[firstSlot] = rows[openingSlot];
      rows[openingSlot] = firstRow;
      var playerConfig = {mode:config.mode,shuffleAll:true,set:Object.assign({},config.set,{rows:rows})};
      var colors = [];
      card.className = 'screen-tile';
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
      var scene = window.BloxxScene.mount(card.querySelector('.screen-tower'), {canvasOnly:true});
      var tile = {player:player, scene:scene, finished:false};
      var selected = -1, busy = false, view;

      function currentSwing() {
        return physics.swing(motion, Math.max(0,clock()-craneStart));
      }

      function select(index) {
        if (busy || tile.finished) return;
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
        selected = -1;
        headline.textContent = view.score + ' pts · ' + (tile.finished ? 'Finished' : view.round + '/' + turns);
        prompt.textContent = tile.finished ? view.floors + (view.floors===1?' floor':' floors') :
          (/_{2,}|[.!?]$/.test(view.prompt)?'':'___ ') + view.prompt;
        choices.textContent = '';
        choices.hidden = tile.finished;
        drop.hidden = tile.finished;
        drop.disabled = true;
        drop.classList.remove('pressed');
        if (!tile.finished) {
          view.choices.forEach(function (word, index) {
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'screen-choice';
            var picture = document.createElement('canvas');
            picture.width = 116;
            picture.height = 90;
            picture.setAttribute('aria-hidden','true');
            var label = document.createElement('span');
            label.textContent = word;
            button.appendChild(picture);
            button.appendChild(label);
            window.BloxxScene.segment(picture,index);
            button.setAttribute('aria-pressed', 'false');
            button.onclick = function () { select(index); };
            choices.appendChild(button);
          });
        }
        scene.set({mode:'build', arcade:true, screen:true, floors:view.placements, floorColors:colors.slice(),balance:view.balance,
          label:'', choice:-1, target:'', showCrane:!tile.finished,showRoof:tile.finished,
          getSwing:tile.finished?null:currentSwing,rockUntil:tile.finished?Date.now()+10000:0,
          getRock:function(){return tower.angle(clock());}});
        card.classList.remove('wrong-flash');
        busy = false;
      }

      drop.setAttribute('aria-label', player.name + ' drop floor');
      function release() {
        if (busy || tile.finished || selected < 0) return;
        var started = clock();
        var path = physics.drop(physics.swing(motion, Math.max(0,started-craneStart)));
        var question = arcade.card(playerConfig,player.round,player.seed);
        var correctWord = selected === question.correct;
        var last;
        if (correctWord) {
          var height = (player.placements.length + 1) * physics.floorHeight;
          var sway = reduced ? 0 : physics.shift(height,tower.angle(started + path.duration * 1000));
          var contact = (path.impact.centerX - sway + .12 * Math.sin(path.impact.angle)) * .30;
          var placed = rules.placeFloor(player.placements,contact);
          last = {kind:placed.kind,points:100+placed.bonus,fallen:placed.fallen,direction:placed.direction,offset:contact};
          if (placed.floors.length > colors.length) colors.push(selected);
          else colors.length = placed.floors.length;
          player.placements = placed.floors;
        } else {
          last = {kind:'wrong',points:0,fallen:0};
        }
        player.last = last;
        player.score += last.points;
        if (++player.completed === turns) player.stage = 'done';
        else player.round++;
        busy = true;
        drop.classList.add('pressed');
        drop.disabled = true;
        for (var i=0; i<choices.children.length; i++) choices.children[i].disabled = true;
        scene.release(path);
        scene.impact(player.last,function () {
          if (closed) return;
          next();
          finishIfReady();
        },function () {
          if(!correctWord) {
            card.classList.add('wrong-flash');
            cue('buzzer');
          } else {
            if (last.kind === 'landed') tower.land(last.offset,clock());
            else if (last.kind === 'perfect' || last.fallen) tower.land(0,clock());
            cue(last.kind==='perfect'?'perfect':last.kind==='landed'?'land':'miss');
          }
        });
      }
      drop.onpointerdown = function (event) {
        if(event.button!==0)return;
        event.preventDefault();
        release();
      };
      drop.onclick = release;
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

  window.BloxxScreen = {mount:mount};
}(window));
