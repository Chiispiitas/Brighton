(function (window) {
  'use strict';

  function clock() {
    return window.performance && performance.now ? performance.now() : Date.now();
  }

  function mount(board, config, count, cue, leave) {
    var rules = window.MatchingBloxxRules;
    var arcade = window.BloxxArcade;
    var tiles = [];
    var seed = Math.floor(Math.random() * 1e9);
    var closed = false;
    var turns = rules.total;

    board.innerHTML = '<header class="screen-bar"><div><h1>Screen mode</h1><p class="screen-set"></p></div>' +
      '<button type="button" class="small-action screen-exit">Back to menu</button></header>' +
      '<p class="screen-winners" role="status" hidden></p><div class="screen-grid"></div>';
    board.querySelector('.screen-set').textContent = config.set.name + ' · ' + turns + ' turns each';
    board.querySelector('.screen-exit').onclick = leave;
    var grid = board.querySelector('.screen-grid');
    var winners = board.querySelector('.screen-winners');
    board.setAttribute('data-players', count);

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
      var player = rules.newPlayer('p' + index, 'Player ' + index, seed);
      // Everyone gets the same prompts and crane patterns, on their own clock.
      arcade.arm(player, Date.now());
      card.className = 'screen-tile';
      card.setAttribute('aria-label', player.name);
      card.innerHTML = '<header class="screen-tile-head"><strong></strong><span></span></header>' +
        '<div class="screen-tower"></div><div class="screen-controls"><p class="screen-prompt"></p>' +
        '<div class="screen-choices" aria-label="Matching blocks"></div>' +
        '<button type="button" class="screen-drop">DROP</button><p class="screen-feedback" aria-live="polite"></p></div>';
      grid.appendChild(card);
      card.querySelector('strong').textContent = player.name;
      var headline = card.querySelector('.screen-tile-head span');
      var prompt = card.querySelector('.screen-prompt');
      var choices = card.querySelector('.screen-choices');
      var drop = card.querySelector('.screen-drop');
      var feedback = card.querySelector('.screen-feedback');
      var scene = window.BloxxScene.mount(card.querySelector('.screen-tower'), {canvasOnly:true});
      var tile = {player:player, scene:scene, finished:false};
      var selected = -1, busy = false, start, view;

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
        view = arcade.playerView(player, config, tile.finished ? 'finished' : 'playing');
        selected = -1;
        start = clock();
        headline.textContent = view.score + ' pts · ' + (tile.finished ? 'Finished' : view.round + '/' + turns);
        prompt.textContent = tile.finished ? view.floors + (view.floors===1?' floor':' floors') :
          (view.prompt.indexOf('__')>=0?'':'___ ') + view.prompt;
        choices.textContent = '';
        choices.hidden = tile.finished;
        drop.hidden = tile.finished;
        drop.disabled = true;
        if (!tile.finished) {
          view.choices.forEach(function (word, index) {
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'screen-choice';
            button.textContent = word;
            button.setAttribute('aria-pressed', 'false');
            button.onclick = function () { select(index); };
            choices.appendChild(button);
          });
        }
        scene.set({mode:'build', arcade:true, floors:view.placements, balance:view.balance,
          label:'?', choice:-1, target:view.prompt, showCrane:!tile.finished,showRoof:tile.finished,
          getSwing:tile.finished?null:function(){return arcade.pose(view.motion,Math.max(0,clock()-start));}});
        if(view.last) {
          var notes={perfect:'★ Perfect drop',landed:'Floor landed',wrong:'Wrong block',miss:view.last.lost?'Tower tumbled':'Missed the tower'};
          feedback.textContent=notes[view.last.kind]+(view.last.correction?' · '+view.last.correction:
            view.last.points?' · +'+view.last.points:'');
        }
        busy = false;
      }

      drop.setAttribute('aria-label', player.name + ' drop floor');
      drop.onclick = function () {
        if (busy || tile.finished || selected < 0) return;
        var elapsed = Math.max(0,Math.round(clock()-start));
        var path = arcade.flight(view.motion,elapsed);
        try {
          arcade.move(player,config,'arcadeDrop',{round:view.round,choice:selected,elapsedMs:elapsed},Date.now(),false);
        } catch (error) {
          feedback.textContent = error.message;
          return;
        }
        busy = true;
        drop.disabled = true;
        for (var i=0; i<choices.children.length; i++) choices.children[i].disabled = true;
        scene.release(path);
        scene.impact(player.last,function () {
          if (closed) return;
          next();
          finishIfReady();
        },function () {
          cue(player.last.kind==='perfect'?'perfect':player.last.kind==='landed'?'land':'miss');
        });
      };
      next();
      return tile;
    }

    board.hidden = false;
    for (var i=1; i<=count; i++) tiles.push(makeTile(i));

    return function close() {
      closed = true;
      tiles.forEach(function (tile) { tile.scene.destroy(); });
      board.hidden = true;
      board.textContent = '';
    };
  }

  window.BloxxScreen = {mount:mount};
}(window));
