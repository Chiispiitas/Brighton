"""Generate native ElevenLabs progression cues using the existing private Windows credential."""
from pathlib import Path
from datetime import datetime,timezone
import argparse,os,json,re,hashlib,subprocess,urllib.request,urllib.error,time,uuid,concurrent.futures,threading
import imageio_ffmpeg
from num2words import num2words
root=Path(__file__).resolve().parent.parent;folder=root/'assets/audio/progression-v1';plan=json.loads((folder/'plan.json').read_text(encoding='utf8'))
parser=argparse.ArgumentParser();parser.add_argument('--only',nargs='+');options=parser.parse_args()
if options.only:
 assert set(options.only).issubset({r['id'] for r in plan}),'Unknown word audio ID'
 plan=[r for r in plan if r['id'] in options.only]
key=os.getenv('ELEVENLABS_API_KEY')
if not key:
 saved=Path(os.environ['ELEVENLABS_CREDENTIAL_FILE']).read_text(encoding='utf-8-sig').strip()
 if saved.startswith('{'):
  creds=json.loads(saved);key=creds.get('api_key')or creds.get('ELEVENLABS_API_KEY')or creds.get('key')
 else:key=saved
if key and not key.startswith('sk_'):
 command="$s=ConvertTo-SecureString ([IO.File]::ReadAllText($env:ELEVENLABS_CREDENTIAL_FILE).Trim());[Console]::Out.Write([pscredential]::new('elevenlabs',$s).GetNetworkCredential().Password)"
 key=subprocess.run(['C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/powershell/pwsh.exe','-NoProfile','-Command',command],capture_output=True,text=True,check=True).stdout.strip()
assert key and key.startswith('sk_'),'Existing private speech credential unavailable'
MODEL='eleven_text_to_sound_v3';ffmpeg=imageio_ffmpeg.get_ffmpeg_exe();lock=threading.Lock();recordsPath=folder/'generation-records.json';records=json.loads(recordsPath.read_text())if recordsPath.exists()else{}
def generate(row):
 path=folder/(row['id']+'.mp3');digest=hashlib.sha256(row['prompt'].encode()).hexdigest();old=records.get(row['id'])
 if old and old['promptSha256']==digest and path.exists():return old
 assert len(row['prompt'])<=450
 payload={'text':row['prompt'],'model_id':MODEL,'duration_seconds':row['duration'],'prompt_influence':.3}
 for attempt in range(4):
  try:
   req=urllib.request.Request('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128',data=json.dumps(payload).encode(),headers={'xi-api-key':key,'Content-Type':'application/json'},method='POST')
   with urllib.request.urlopen(req,timeout=180)as response:raw=response.read();rid=response.headers.get('request-id')
   break
  except Exception as error:
   if attempt==3:raise RuntimeError('Sound generation failed for '+row['id']+': '+type(error).__name__)from None
   time.sleep(3*(attempt+1))
 path.write_bytes(raw);run=subprocess.run([ffmpeg,'-hide_banner','-i',str(path),'-f','f32le','-ac','1','-ar','44100','-'],capture_output=True,check=True)
 import numpy as np
 samples=np.frombuffer(run.stdout,dtype=np.float32);assert len(samples)>1000
 peak=float(np.max(np.abs(samples)));rms=float(np.sqrt(np.mean(samples*samples)));duration=len(samples)/44100
 assert duration<4 and peak<1 and rms>0.001
 record={**row,'model':MODEL,'requestId':rid,'promptSha256':digest,'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),'decodedSeconds':duration,'peak':peak,'rms':rms,'clippedSamples':int(np.sum(np.abs(samples)>=1))}
 with lock:records[row['id']]=record;recordsPath.write_text(json.dumps(records,indent=2)+'\n')
 print('Generated '+row['id'],flush=True);return record
with concurrent.futures.ThreadPoolExecutor(max_workers=3)as pool:done=list(pool.map(generate,plan))
print(json.dumps({'completed':len(done)}))
