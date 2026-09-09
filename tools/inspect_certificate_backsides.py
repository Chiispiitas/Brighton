from pathlib import Path
import fitz

for path in [Path('Certificate Generator/C1 Backside.pdf'), Path('Certificate Generator/B1+ Backside.pdf')]:
    print(f'\n=== {path} ===')
    doc = fitz.open(path)
    page = doc[0]
    print('PAGE', page.rect)
    print('TEXT START')
    print(page.get_text())
    print('TEXT BLOCKS TOP')
    for block in page.get_text('blocks'):
        x0, y0, x1, y1, text, *rest = block
        if y0 < 300:
            print((round(x0,2), round(y0,2), round(x1,2), round(y1,2)), repr(text))
    doc.close()
