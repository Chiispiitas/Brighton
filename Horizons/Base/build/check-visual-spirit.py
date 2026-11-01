"""Check declared visual identity coverage; a personal visual review is still required.

Use for every current/future Horizons level: python .../check-visual-spirit.py Horizons/A1
"""
from pathlib import Path
from bs4 import BeautifulSoup
import hashlib,json,re,sys
from urllib.parse import unquote

def main():
 book=Path(sys.argv[1] if len(sys.argv)>1 else 'Horizons/A1').resolve()
 register=json.loads((book/'Sources/Visual-personality.json').read_text(encoding='utf-8'))
 records={x['lesson']:x for x in register['spreads']};problems=[];panels=0;selectors=0;masters=[];worlds=0
 for p in (book/'Lessons').glob('*.html'):
  if not re.fullmatch(r'\d+[A-DR]',p.stem):continue
  masters.append(p.stem);doc=BeautifulSoup(p.read_text(encoding='utf-8'),'html.parser');entry=records.get(p.stem)
  if not entry or not entry.get('visual_idea') or not entry.get('protected_elements'):problems.append(p.stem+': missing explicit visual idea/protected elements');continue
  for x in entry.get('selectors',[]):
   if not doc.select(x):problems.append(p.stem+': protected selector missing: '+x)
   selectors+=1
  world=entry.get('generated_visual_world')
  if world:
   worlds+=1;asset=book/world['asset']
   if not asset.is_file():problems.append(p.stem+': registered visual-world asset missing')
   elif hashlib.sha256(asset.read_bytes()).hexdigest()!=world['sha256']:problems.append(p.stem+': visual-world bytes changed; recheck asset and register')
   if not doc.select(world['selector']):problems.append(p.stem+': visual-world integration selector missing')
   styles=[]
   for link in doc.select('link[rel="stylesheet"][href]'):
    href=link['href'].split('?')[0].split('#')[0]
    if re.match(r'^[a-z]+:',href,re.I):continue
    css=p.parent/unquote(href)
    if css.is_file():styles.append(css.read_text(encoding='utf-8'))
   if asset.name not in '\n'.join(styles):problems.append(p.stem+': visual-world asset is absent from linked styles')
  for x in doc.select('.hz-focus-box'):
   if x.get('data-hz-tool') not in {'grammar','vocabulary','communication','writing','skills','pronunciation'}:problems.append(p.stem+': undeclared functional tool role')
   panels+=1
 if set(records)!=set(masters):problems.append('Visual register does not cover exactly the produced masters')
 assert not problems,'\n'.join(problems)
 print(f'Visual spirit declared for {len(masters)} spreads; {panels} functional tools; {selectors} protected selectors resolve.')
 if worlds:print(f'{worlds} declared visual-world assets retain their registered source bytes and integration selectors.')
 print('Coverage only. Inspect colour/contrast, adult warmth, display lettering, images, writing space and neighbouring spreads in the saved PDF.')
 return 0

if __name__=='__main__':sys.exit(main())
