(function (window) {
  'use strict';

  function mount(root, hooks) {
    var mode = hooks.mode, id = hooks.id || 'default';
    var draft, editing;
    root.innerHTML =
      '<header class="we-header"><h2 id="dialog-title" tabindex="-1">Word sets</h2>' +
      '<button type="button" class="small-action" id="we-new">New set</button></header>' +
      '<div class="we-scroll"><div class="we-workspace">' +
        '<aside class="we-settings" aria-label="Set settings">' +
          '<label for="we-mode">Game mode</label><select id="we-mode"></select>' +
          '<label for="we-set">Saved sets</label><select id="we-set"></select>' +
          '<label for="we-name">Set name</label><input type="text" id="we-name" maxlength="40">' +
          '<div id="we-rules"></div>' +
          '<details class="pool-import"><summary>Bulk import</summary>' +
            '<p id="we-import-hint" class="sub pool-hint"></p>' +
            '<label for="we-file">Choose a file</label><input id="we-file" type="file" accept=".csv,.tsv,.txt,.json">' +
            '<label for="we-paste">Or paste your pool</label><textarea id="we-paste" rows="4"></textarea>' +
            '<button type="button" id="we-import" class="small-action">Load into editor</button>' +
          '</details>' +
        '</aside><div class="we-main" id="we-main"></div>' +
      '</div></div>' +
      '<footer class="we-footer"><p id="we-status" role="status" hidden></p><div class="we-footer-actions">' +
        '<button type="button" class="small-action" id="we-copy">Save a copy</button>' +
        '<button type="button" class="button yellow" id="we-save">Save word set</button>' +
      '</div></footer>';

    function byId(name) { return root.querySelector('#we-' + name); }
    var workspace = root.querySelector('.we-workspace');
    var scroll = root.querySelector('.we-scroll');
    var main = byId('main');
    var listScroll = 0;
    root.querySelector('.we-footer-actions').insertBefore(hooks.close, byId('copy'));
    byId('mode').innerHTML = hooks.modeOptions(mode);

    function status(message, error) {
      var line = byId('status');
      line.textContent = message || '';
      line.hidden = !message;
      line.classList.toggle('is-error', !!error);
    }

    function unique(values) {
      return values.filter(function (value, index) {
        return values.findIndex(function (other) { return value.toLowerCase() === other.toLowerCase(); }) === index;
      });
    }

    function load(data, unsaved) {
      var matching = mode === 'match';
      editing = null;
      data = data || {name:'', rows:[], right:[], wrong:[], instruction:'', sameOptions:false, options:[]};
      var rows = matching ? data.rows.map(function (row) { return row.slice(); }) : [];
      var answers = unique(rows.map(function (row) { return row[1]; }));
      draft = {
        name:data.name, instruction:data.instruction || '',
        shared:matching && (typeof data.sameOptions==='boolean' ? data.sameOptions :
          answers.length<=4 && rows.every(function (row) { return row.length===2; })),
        options:matching ? (data.options || answers.slice(0,4)).slice() : [],
        rows:rows, right:matching?[]:data.right.slice(), wrong:matching?[]:data.wrong.slice()
      };
      while (draft.options.length<4) draft.options.push('');
      if (matching && !draft.shared) fillDistractors(answers);
      byId('set').innerHTML = hooks.setOptions(mode,id);
      if(unsaved) {
        var option=document.createElement('option');
        option.textContent='Unsaved set';
        option.selected=true;
        option.disabled=true;
        byId('set').insertBefore(option, byId('set').firstChild);
      }
      byId('name').value = draft.name;
      byId('import-hint').textContent = matching ?
        'CSV, TSV, TXT or JSON. Use prompt | correct answer | other options. Two columns use shared options.' :
        'CSV, TSV, TXT or JSON. Use word | right or word | wrong, one per line.';
      byId('paste').placeholder = matching ? 'I enjoy ___ after school. | reading | to read' : 'pear | right\ncarrot | wrong';
      byId('file').value = '';
      byId('paste').value = '';
      renderSettings();
      showList(0);
      status();
    }

    function fillDistractors(answers) {
      draft.rows = draft.rows.map(function (row) {
        if(row.length>2) return row;
        return row.concat(answers.filter(function (answer) {
          return answer && answer.toLowerCase()!==row[1].toLowerCase();
        }).slice(0,3));
      });
    }

    function renderSettings() {
      var rules=byId('rules');
      if(mode==='rightwrong') {
        rules.innerHTML='<label for="we-instruction">Rule shown to players</label>' +
          '<input type="text" id="we-instruction" maxlength="80" placeholder="Build with the right blocks.">';
        byId('instruction').value=draft.instruction;
        byId('instruction').oninput=function () { draft.instruction=this.value; };
        return;
      }
      rules.innerHTML='<label class="pool-checkbox"><input id="we-shared" type="checkbox">Same options for every prompt</label>' +
        '<fieldset id="we-bank" class="we-bank"><legend>Shared options</legend><div class="we-bank-tiles"></div></fieldset>';
      byId('shared').checked=draft.shared;
      byId('bank').hidden=!draft.shared;
      byId('shared').onchange=function () {
        draft.shared=this.checked;
        byId('bank').hidden=!draft.shared;
        if(!draft.shared)fillDistractors(draft.options);
        showList();
      };
      draft.options.forEach(function (word, index) {
        var input=document.createElement('input');
        input.type='text';
        input.maxLength=48;
        input.value=word;
        input.placeholder='Option '+(index+1);
        input.setAttribute('aria-label', 'Shared option '+(index+1));
        input.onchange=function () {
          var previous=draft.options[index].trim().toLowerCase();
          var value=this.value.trim();
          draft.options[index]=value;
          if(previous && value)draft.rows.forEach(function (row) {
            if(row[1].toLowerCase()===previous)row[1]=value;
          });
          var previews=main.querySelectorAll('.we-option-preview');
          for(var i=0;i<previews.length;i++)renderChips(previews[i],draft.rows[i]);
        };
        byId('bank').querySelector('.we-bank-tiles').appendChild(input);
      });
    }

    function optionPreview(row) {
      if(!draft.shared) return row.slice(1);
      var options=draft.options.filter(Boolean);
      if(!options.some(function (option) { return option.toLowerCase()===row[1].toLowerCase(); })) options.unshift(row[1]);
      return options;
    }

    function renderChips(preview,row) {
      preview.textContent='';
      optionPreview(row).forEach(function (word) {
        var chip=document.createElement('span');
        var correct=word.toLowerCase()===row[1].toLowerCase();
        chip.textContent=correct?'✓ '+word:word;
        if(correct)chip.setAttribute('aria-label','Correct: '+word);
        preview.appendChild(chip);
      });
    }

    function buildCard(group, index, row) {
      var matching=group==='rows';
      var title=matching?row[0]:row;
      var article=document.createElement('article');
      article.className='we-card';
      article.innerHTML=(matching?'<span class="we-number" aria-label="Question '+(index+1)+'">'+(index+1)+'</span>':'')+
        '<div class="we-card-copy"><h3></h3><div class="we-option-preview"></div></div>' +
        '<div class="we-card-actions"><button type="button" class="small-action" data-action="edit">Edit</button>' +
        '<button type="button" class="we-link" data-action="duplicate">Duplicate</button>' +
        '<button type="button" class="we-link we-remove" data-action="remove">Remove</button></div>';
      article.querySelector('h3').textContent=title;
      var preview=article.querySelector('.we-option-preview');
      if(matching)renderChips(preview,row);
      else preview.remove();
      article.querySelectorAll('button').forEach(function (button) {
        button.setAttribute('aria-label', button.textContent+' '+title);
      });
      article.querySelector('[data-action=edit]').onclick=function () { openEntry(group,index,false); };
      article.querySelector('[data-action=duplicate]').onclick=function () { openEntry(group,index,true); };
      article.querySelector('[data-action=remove]').onclick=function () {
        draft[group].splice(index,1);
        showList();
        focusCard(group,index);
      };
      return article;
    }

    function buildList(group, title, singular, style) {
      var items=draft[group];
      var section=document.createElement('section');
      section.className='we-list '+style;
      section.dataset.group=group;
      section.innerHTML='<header class="we-list-head"><h3></h3><span></span>' +
        '<button type="button" class="small-action we-add"></button></header><div class="we-cards"></div>';
      section.querySelector('h3').textContent=title;
      section.querySelector('header span').textContent=items.length;
      var add=section.querySelector('.we-add');
      add.textContent='＋ Add '+singular;
      add.onclick=function () { openEntry(group,items.length,true); };
      var cards=section.querySelector('.we-cards');
      items.forEach(function (item,index) { cards.appendChild(buildCard(group,index,item)); });
      if(!items.length) {
        var empty=document.createElement('p');
        empty.className='we-empty';
        empty.textContent='No '+title.toLowerCase()+' yet.';
        cards.appendChild(empty);
      }
      return section;
    }

    function showList(top) {
      workspace.classList.remove('is-editing');
      main.textContent='';
      main.className='we-main'+(mode==='rightwrong'?' we-sort':'');
      if(mode==='match')main.appendChild(buildList('rows','Questions','question',''));
      else {
        main.appendChild(buildList('right','Right blocks','right block','we-right'));
        main.appendChild(buildList('wrong','Wrong blocks','wrong block','we-wrong'));
      }
      if(typeof top==='number')scroll.scrollTop=top;
    }

    function focusCard(group,index) {
      var section=main.querySelector('[data-group='+group+']');
      var cards=section.querySelectorAll('[data-action=edit]');
      (cards[Math.min(index,cards.length-1)] || section.querySelector('.we-add')).focus();
    }

    function openEntry(group,index,copy) {
      var items=draft[group], original=items[index];
      if(copy && items.length>=48){status('This list can hold up to 48 entries.',true);return;}
      var matching=group==='rows';
      if(matching && draft.shared && draft.options.filter(Boolean).length<2) {
        status('Fill in at least two shared options first.',true);
        byId('bank').querySelectorAll('input')[draft.options.indexOf('')].focus();
        return;
      }
      editing={group:group,index:copy && original?index+1:index,insert:copy,
        prompt:original?(matching?original[0]:original):'',answers:matching && original?original.slice(1):[],
        correct:0};
      listScroll=scroll.scrollTop;
      status();
      workspace.classList.add('is-editing');
      main.className='we-main';
      main.innerHTML='<form class="we-entry" id="we-entry"><header class="we-entry-head"><h3></h3>' +
        '<button type="button" class="small-action" id="we-cancel">Cancel</button>' +
        '<button type="submit" class="small-action we-done"></button></header>' +
        '<label for="we-prompt"></label>'+(matching?'<textarea id="we-prompt" rows="2" required></textarea>':
          '<input type="text" id="we-prompt" required>')+'<div id="we-answers"></div>' +
        '<p class="we-entry-error" role="alert" hidden></p></form>';
      main.querySelector('h3').textContent=matching?'Question '+(editing.index+1):(group==='right'?'Right block':'Wrong block');
      main.querySelector('.we-done').textContent=matching?'Save question':'Save block';
      main.querySelector('label').textContent=matching?'Prompt':'Block text';
      var prompt=byId('prompt');
      prompt.maxLength=matching?120:48;
      prompt.value=editing.prompt;
      prompt.placeholder=matching?'Enter a question or a sentence with ___':'Enter a word or phrase';
      prompt.oninput=function () { editing.prompt=this.value; };
      if(matching)renderAnswers();
      else byId('answers').innerHTML='<label for="we-category">Block type</label><select id="we-category">' +
        '<option value="right">Right block</option><option value="wrong">Wrong block</option></select>';
      if(!matching)byId('category').value=group;
      byId('cancel').onclick=function () {
        editing=null;
        showList(listScroll);
        focusCard(group,index);
      };
      byId('entry').onsubmit=function (event) { event.preventDefault(); finishEntry(true); };
      scroll.scrollTop=0;
      prompt.focus();
      if(copy && original)prompt.select();
    }

    function renderAnswers() {
      var fields=byId('answers');
      fields.innerHTML='<fieldset class="we-answer-fieldset"><legend>Choose the correct answer</legend><div class="we-answer-grid"></div></fieldset>';
      var grid=fields.querySelector('.we-answer-grid');
      var tiles=draft.shared?draft.options.filter(Boolean):['','','',''];
      if(!tiles.length) {
        fields.textContent='Add shared options in set settings before editing this question.';
        return;
      }
      tiles.forEach(function (value,index) {
        var tile=document.createElement('div');
        tile.className='we-answer';
        var radio=document.createElement('input');
        radio.type='radio';
        radio.name='we-correct';
        radio.id='we-correct-'+index;
        var chosen=draft.shared?editing.answers[0] && editing.answers[0].toLowerCase()===value.toLowerCase():editing.correct===index;
        radio.checked=!!chosen;
        radio.onchange=function () {
          if(draft.shared)editing.answers[0]=value;
          else editing.correct=index;
        };
        var label=document.createElement('label');
        label.htmlFor=radio.id;
        label.textContent=draft.shared?value:'Correct';
        radio.setAttribute('aria-label',draft.shared?'Correct answer: '+value:'Mark answer '+(index+1)+' correct');
        var mark=document.createElement('div');
        mark.className='we-mark';
        mark.appendChild(radio);
        mark.appendChild(label);
        tile.appendChild(mark);
        if(!draft.shared) {
          var input=document.createElement('input');
          input.type='text';
          input.maxLength=48;
          input.value=editing.answers[index] || '';
          input.placeholder=index<2?'Answer '+(index+1):'Answer '+(index+1)+' (optional)';
          input.setAttribute('aria-label','Answer '+(index+1));
          input.oninput=function () { editing.answers[index]=this.value; };
          tile.appendChild(input);
        }
        grid.appendChild(tile);
      });
    }

    function finishEntry(focus) {
      if(!editing)return true;
      var current=editing, group=current.group, index=current.index;
      var prompt=current.prompt.trim();
      var items=draft[group], target=group, value=prompt, error='';
      if(!prompt)error=group==='rows'?'Enter a prompt.':'Enter the block text.';
      else if(group==='rows') {
        var correct=(current.answers[draft.shared?0:current.correct] || '').trim();
        var others=draft.shared?[]:current.answers.map(function (answer, slot) {
          return slot===current.correct?'':answer.trim();
        }).filter(Boolean);
        if(items.some(function (row,slot) {
          return (current.insert || slot!==index) && row[0].toLowerCase()===prompt.toLowerCase();
        }))error='Use a different prompt. This one already exists.';
        else if(!correct || (draft.shared && !draft.options.some(function (option) {
          return option.trim().toLowerCase()===correct.toLowerCase();
        }))) error='Choose a correct answer.';
        else if(!draft.shared && !others.length)error='Enter at least one other answer.';
        else if(unique([correct].concat(others)).length!==others.length+1)error='Use different answers.';
        value=[prompt,correct].concat(others);
      } else {
        target=byId('category').value;
        if(target!==group && draft[target].length>=48)error='This list can hold up to 48 entries.';
        if(['right','wrong'].some(function (key) {
          return draft[key].some(function (word,slot) {
            return (key!==group || current.insert || slot!==index) && word.toLowerCase()===prompt.toLowerCase();
          });
        }))error='This block already exists in the set.';
      }
      if(error) {
        var warning=main.querySelector('.we-entry-error');
        warning.textContent=error;
        warning.hidden=false;
        return false;
      }
      if(target===group)items.splice(index,current.insert?0:1,value);
      else {
        if(!current.insert)items.splice(index,1);
        index=draft[target].length;
        draft[target].push(value);
      }
      editing=null;
      showList(listScroll);
      if(focus)focusCard(target,index);
      return true;
    }

    function save(copy) {
      if(!finishEntry(false))return;
      try {
        var data=mode==='match'?{name:draft.name,sameOptions:draft.shared,
          rows:draft.shared?draft.rows.map(function (row) { return row.slice(0,2); }):draft.rows}:
          {name:draft.name,instruction:draft.instruction,right:draft.right,wrong:draft.wrong};
        if(mode==='match' && draft.shared)data.options=draft.options.map(function (value) { return value.trim(); }).filter(Boolean);
        var set=window.BloxxArcade.config(mode,data).set;
        id=hooks.persist(mode,id,set,copy);
        byId('set').innerHTML=hooks.setOptions(mode,id);
        status('Saved in this browser.');
      } catch(error) {
        status(error.message || 'This browser could not save the set.',true);
      }
    }

    function importText(value, filename) {
      try {
        var data=window.BloxxArcade.importPool(mode,value,filename);
        id='default';
        load(data,true);
        status('Pool loaded. Review it and save as a new set.');
      } catch(error) { status(error.message,true); }
    }

    byId('name').oninput=function () { draft.name=this.value; };
    byId('mode').onchange=function () {
      mode=this.value;
      id='default';
      load(hooks.load(mode,id));
    };
    byId('set').onchange=function () { id=this.value; load(hooks.load(mode,id)); };
    byId('new').onclick=function () { id='default'; load(null,true); byId('name').focus(); };
    byId('save').onclick=function () { save(false); };
    byId('copy').onclick=function () { save(true); };
    byId('file').onchange=function () { if(this.files.length)byId('paste').value=''; };
    byId('import').onclick=function () {
      var field=byId('file'), file=field.files[0], pasted=byId('paste').value;
      if(pasted.trim() || !file) { importText(pasted,''); return; }
      if(file.size>65536) { status('Import a pool smaller than 64 KB.',true); return; }
      var reader=new FileReader(), currentDraft=draft;
      reader.onload=function () {
        if(byId('file')===field && draft===currentDraft)importText(reader.result,file.name);
      };
      reader.onerror=function () {
        if(byId('file')===field && draft===currentDraft)status('The file could not be read.',true);
      };
      reader.readAsText(file);
    };
    load(hooks.load(mode,id));
    root.querySelector('h2').focus();
    return {selection:function () { return {mode:mode,id:id}; }};
  }

  window.BloxxWordEditor={mount:mount};
}(window));
