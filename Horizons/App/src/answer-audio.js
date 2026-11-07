// Same key for authored model text and learner-facing answer labels.
export const audioKey=text=>String(text).normalize('NFKC').toLowerCase().replace(/[’‘]/g,"'").replace(/[.,!?;:]/g,'').replace(/\s+/g,' ').trim();
