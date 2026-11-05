"""Encode the actual renderer's 644 captured poses at normal speed; refresh review hashes."""
from pathlib import Path
from PIL import Image,ImageDraw
import subprocess,imageio_ffmpeg,hashlib,json,shutil
app=Path(__file__).resolve().parents[1]
p=app/'docs/avatar-face-v2'
frames=Path('C:/Users/David/Documents/Codex/2026-11-05/avatar-motion/face-v3-frames')
subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-y','-framerate','30','-i',str(frames/'frame-%04d.png'),'-frames:v','644','-an','-vf','pad=ceil(iw/2)*2:ceil(ih/2)*2:color=0xfffefa','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(p/'normal-speed-preview.mp4')],capture_output=True,check=True)
board=Image.new('RGB',(1600,1080),'#fffefa');draw=ImageDraw.Draw(board)
for j,i in enumerate(sorted(set(range(0,644,15))|{90,110,126,128,130,270,288,450,468})):
 im=Image.open(frames/f'frame-{i:04d}.png').convert('RGB').resize((160,160));x,y=j%10*160,j//10*180
 board.paste(im,(x,y));draw.text((x,y+161),f'{i/30:.1f}s',fill='#173e5c')
board.save(p/'preview-frames.png')
for name in ['all-costumes','hair-glasses']:
 shutil.copy2(Path('C:/Users/David/Documents/Codex/2026-11-05/avatar-motion/compatibility')/(name+'.png'),p/(name+'.png'))
record=json.loads((p/'reference-pack.json').read_text())
for item in record['references']:item['sha256']=hashlib.sha256((p/item['file']).read_bytes()).hexdigest()
(p/'reference-pack.json').write_text(json.dumps(record,indent=2)+'\n')
print('Encoded644 poses at30fps and refreshed current review references')
