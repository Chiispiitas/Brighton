import test from 'node:test';
import assert from 'node:assert/strict';
import { spyPresentation, privateNoteText } from '../player-copy.mjs';

test('old spying notes display the new outcomes and preserve the identified wolf', () => {
  assert.deepEqual(spyPresentation('Heads — you stayed hidden. Rowan is a werewolf.'), {
    title: 'Undiscovered', text: 'You stayed unseen. Rowan is a werewolf.'
  });
  assert.deepEqual(spyPresentation('Tails — you were spotted. Ivy is a werewolf.'), {
    title: 'Discovered', text: 'You were discovered while spying. Ivy is a werewolf.'
  });
});

test('private notes use the new wording without changing unrelated information', () => {
  assert.equal(privateNoteText('Heads — you stayed hidden. Rowan is a werewolf.'), 'You stayed unseen. Rowan is a werewolf.');
  assert.equal(privateNoteText('You spotted Alex, the little girl, spying on you.'), 'You spotted Alex, the Little Girl, spying on you.');
  assert.equal(privateNoteText('Rowan is fortune.'), 'Rowan is fortune.');
});
