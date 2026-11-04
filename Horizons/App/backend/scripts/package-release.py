from pathlib import Path
import zipfile,json
b=Path(__file__).resolve().parents[1];out=Path('C:/Users/David/Documents/Codex/2026-11-04/horizons-backend-release');out.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(out/'build.zip','w',zipfile.ZIP_DEFLATED,strict_timestamps=False)as z:
 for folder in['dist','.wix']:
  for p in(b/folder).rglob('*'):
   if p.is_file()and p.name not in['.dev.vars','.env.local']:z.write(p,p.relative_to(b))
with zipfile.ZipFile(out/'source.zip','w',zipfile.ZIP_DEFLATED,strict_timestamps=False)as z:
 for folder in['src','backend-public','tests','scripts']:
  for p in(b/folder).rglob('*'):
   if p.is_file():z.write(p,p.relative_to(b))
 for n in['package.json','package-lock.json','astro.config.mjs','wix.config.json','wrangler.json','tsconfig.json','.gitignore','API-CONTRACT.json']:
  z.write(b/n,n)
print(json.dumps({'buildBytes':(out/'build.zip').stat().st_size,'sourceBytes':(out/'source.zip').stat().st_size,'directory':str(out)}))
