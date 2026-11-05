// Build patterns from trusted accepted answers, never from unescaped learner input.
const standard=value=>String(value??'').normalize('NFKC').replace(/[‘’]/g,"'").trim();
const contractions={"i'm":'i am',"you're":'you are',"he's":'he is',"she's":'she is',"it's":'it is',"we're":'we are',"they're":'they are',"isn't":'is not',"aren't":'are not',"what's":'what is',"where's":'where is',"who's":'who is'};
export function normalizeAnswer(value,mode='normal'){
 if(Array.isArray(value))value=value.map(x=>typeof x==='object'&&x?x.text??x.value??x.id:x).join(' ');
 const text=standard(value);
 if(mode==='capitalization')return text.replace(/\s+/g,' ');
 if(mode==='digits')return text.replace(/[\s()+.-]/g,'');
 if(mode==='spelling')return text.replace(/[\s.-]/g,'').toLowerCase();
 if(mode==='letter')return text.replace(/\s/g,'');
 if(mode==='code')return text.split(/[\s,;.-]+/).filter(Boolean).map(x=>/^\d+$/.test(x)?String(Number(x)):x).join(' ');
 return text.toLowerCase().replace(/[.!?,;:]/g,'').replace(/[–—-]/g,' ').replace(/\s+/g,' ').trim();
}
function expand(value){return value.replace(/\b(?:i'm|you're|he's|she's|it's|we're|they're|isn't|aren't|what's|where's|who's)\b/g,match=>contractions[match]);}
const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export function compileAnswerPattern(answers,{mode='normal',allowContractions=false}={}){
 const normalized=[...new Set(answers.map(answer=>normalizeAnswer(answer,mode)).map(value=>allowContractions?expand(value):value))];
 return new RegExp(`^(?:${normalized.map(escape).join('|')})$`,'u');
}
export function matchesAcceptedAnswer(submitted,answers,{mode='normal',allowContractions=false}={}){
 if(!Array.isArray(answers)||!answers.length)return false;
 let value=normalizeAnswer(submitted,mode);if(allowContractions)value=expand(value);
 return compileAnswerPattern(answers,{mode,allowContractions}).test(value);
}
