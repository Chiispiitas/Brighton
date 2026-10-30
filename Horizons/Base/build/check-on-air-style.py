"""Check the recurring show markup, including secondary activities. Render QA is separate."""
from pathlib import Path
import json,sys
from bs4 import BeautifulSoup

def main():
 b=Path(sys.argv[1] if len(sys.argv)>1 else 'Horizons/A1').resolve()
 spec=json.loads((b/'book-audit.json').read_text(encoding='utf-8'))['on_air_identity']
 reference=BeautifulSoup((b/'Lessons/2B.html').read_text(encoding='utf-8'),'html.parser')
 waveform=reference.select_one('.l2b-show-waveform path')['d'];seen=set();count=0
 for episode in spec['episodes']:
  code=episode['lesson'];doc=BeautifulSoup((b/f'Lessons/{code}.html').read_text(encoding='utf-8'),'html.parser');seen.add(code)
  exs={int(ex.select_one('.hz-exercise-number').get_text()):ex for ex in doc.select('.hz-exercise')}
  if code!='2B':assert doc.select_one('link[href="./horizons-on-air.css"]'),f'{code}: missing shared stylesheet'
  for n in [episode['main'],*episode['secondary']]:
   ex=exs[n];main_head=n==episode['main']
   h=ex.select_one('.l2b-show-head') if code=='2B' else ex.select_one('.hz-onair-head--main' if main_head else '.hz-onair-head--secondary')
   assert h is not None,f'{code} activity {n}: missing main/secondary identity'
   brand=h.select_one('[class*="show-brand"]');assert brand is not None,(code,n,'missing logo')
   assert brand.b.get_text(strip=True)=='HORIZONS' and brand.em.get_text(strip=True)=='ON AIR',(code,n,'logo wording')
   title=h.select_one('.l2b-show-episode' if code=='2B' else '.hz-onair-title');assert title.get_text(' ',strip=True).casefold()==episode['title'].casefold(),(code,n,'wrong episode')
   assert h.select_one('svg path')['d']==waveform,(code,n,'different waveform')
   instruction=ex.select_one('.hz-exercise__instruction');assert h in list(instruction.previous_siblings),(code,n,'header must precede instruction')
   count+=1
  if code!='2B':
   assert len(doc.select('.hz-onair-head'))==1+len(episode['secondary']),(code,'unexpected/uncovered header')
   assert not doc.select('.l3b-show-brand,.l5b-show-brand,.l7b-show-brand'),(code,'legacy logo variant remains')
 for p in (b/'Lessons').glob('*.html'):
  doc=BeautifulSoup(p.read_text(encoding='utf-8'),'html.parser')
  if doc.select('[class*="show-brand"]'):assert p.stem in seen,f'{p.stem}: episode needs declared main/secondary coverage'
 print(f'2B identity structures verified: {len(seen)} episodes, {count} main/secondary headers. Check computed styles and rendered pages separately.')
 return 0

if __name__=='__main__':sys.exit(main())
