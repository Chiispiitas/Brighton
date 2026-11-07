"""Extract supplied card faces without redrawing; the original sheets stay read-only."""
from pathlib import Path
from PIL import Image
import json

source = Path(r'C:\Users\David\Downloads\CARTAS SABOTEUR')
dest = Path(__file__).resolve().parents[1] / 'assets' / 'cards'
dest.mkdir(exist_ok=True, parents=True)
entries = {
    'miner': ('MINEROS/mineros.jpg',0,0),
    'saboteur': ('SABOTEADORES/saboteadores.jpg',0,0),
    'rockfall': ('CARTAS ACCION/cartas de accion1.jpg',0,0),
    'break-pick': ('CARTAS ACCION/cartas de accion1.jpg',0,1),
    'repair-pick': ('CARTAS ACCION/cartas de accion1.jpg',0,2),
    'break-lantern': ('CARTAS ACCION/cartas de accion3.jpg',1,2),
    'repair-cart': ('CARTAS ACCION/cartas de accion2.jpg',0,0),
    'repair-pick-lantern': ('CARTAS ACCION/cartas de accion2.jpg',2,0),
    'repair-lantern': ('CARTAS ACCION/cartas de accion2.jpg',0,1),
    'repair-pick-cart': ('CARTAS ACCION/cartas de accion2.jpg',2,1),
    'repair-lantern-cart': ('CARTAS ACCION/cartas de accion2.jpg',0,2),
    'map': ('CARTAS ACCION/cartas de accion2.jpg',1,2),
    'break-cart': ('CARTAS ACCION/cartas de accion3.jpg',1,1),
    'gold-1': ('CARTAS PEPITAS/cartas de pepitas3.jpg',0,1),
    'gold-2': ('CARTAS PEPITAS/cartas de pepitas2.jpg',0,0),
    'gold-3': ('CARTAS PEPITAS/cartas de pepitas3.jpg',0,0),
    'back': ('CAMINOS 1/dorso caminos IMPRIMIR 4.jpg',0,0),
    'role-back': ('MINEROS/dorso enanos IMPRIMIR 1.jpg',0,0),
    'gold-back': ('CAMINOS 2/dorso caminos IMPRIMIR 1.jpg',0,0),
}
manifest = {}
for name, (sheet,x,y) in entries.items():
    im = Image.open(source/sheet).convert('RGB')
    box = (round(x*im.width/3),round(y*im.height/3),round((x+1)*im.width/3),round((y+1)*im.height/3))
    card = im.crop(box)
    card.thumbnail((420,660),Image.Resampling.LANCZOS)
    card.save(dest/f'{name}.webp',quality=94)
    manifest[name] = {'source':sheet,'column':x+1,'row':y+1,'operation':'Exact sheet-cell extraction and WebP conversion; no redraw.'}
    if name == 'repair-pick':
        icon = card.crop((round(card.width*.055),round(card.height*.035),round(card.width*.31),round(card.height*.20)))
        for size, filename in [(32,'favicon-32.png'),(180,'apple-touch-icon.png')]:
            icon.resize((size,size),Image.Resampling.LANCZOS).save(dest.parent/filename)
(dest/'supplied-cards.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf8')
print(f'Packaged {len(entries)} supplied card faces without altering the originals.')
