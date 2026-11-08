export function studyDeck(words,sets){
 const cards=[...new Map(words.map(w=>[w.id,{id:w.id,title:'Vocabulary',front:w.kind==='letter'?'Listen to the letter':w.spanish||w.meaning,back:w.term,example:w.example,wordId:w.id,listening:w.kind==='letter'}])).values()];
 for(const g of sets)for(const [i,row]of (g.models?.rows||[]).entries())cards.push({id:g.id+':'+i,title:g.title,front:row[0],back:row.slice(1).map((s,j)=>(g.models.columns[j+1]||'Example')+': '+s).join('\n'),example:g.description});
 return cards;
}
