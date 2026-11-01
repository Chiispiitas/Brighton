// Existing rooms retain their original notes; only the presentation changes.
export function spyPresentation(text) {
  const unseen = /^Heads\s*[—–-]\s*you stayed hidden\.\s*/i;
  const discovered = /^Tails\s*[—–-]\s*you were spotted\.\s*/i;
  if (unseen.test(text)) return { title: 'Undiscovered', text: text.replace(unseen, 'You stayed unseen. ') };
  if (discovered.test(text)) return { title: 'Discovered', text: text.replace(discovered, 'You were discovered while spying. ') };
  return { title: 'Spying result', text };
}

export function privateNoteText(text) {
  return spyPresentation(text).text.replace(/\bthe little girl\b/g, 'the Little Girl');
}
