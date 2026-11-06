"""Create Jessica word models using the existing private Windows credential."""
from pathlib import Path
from datetime import datetime,timezone
import argparse,os,json,re,hashlib,subprocess,urllib.request,urllib.error,time,uuid,concurrent.futures,threading
import imageio_ffmpeg
from num2words import num2words
root=Path(__file__).resolve().parent.parent;folder=root/'assets/audio';plan=json.loads((folder/'plan.json').read_text(encoding='utf8'))
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
VOICE='cgSgspJ2msm6clMCkdW9';MODEL='eleven_v3';ffmpeg=imageio_ffmpeg.get_ffmpeg_exe();lock=threading.Lock()
recordsPath=folder/'generation-records.json';records=json.loads(recordsPath.read_text())if recordsPath.exists()else{}
def request(endpoint,body,ctype='application/json'):
 for attempt in range(4):
  try:
   req=urllib.request.Request('https://api.elevenlabs.io/v1/'+endpoint,data=body,headers={'xi-api-key':key,'Content-Type':ctype},method='POST')
   with urllib.request.urlopen(req,timeout=150)as res:return res.read(),res.headers.get('request-id')
  except urllib.error.HTTPError as e:
   if e.code not in [429,500,502,503,504]or attempt==3:raise RuntimeError(f'Speech service returned HTTP{e.code}')from None
   time.sleep(min(20,3*2**attempt))
def norm(text):
 text=re.sub(r'\d+',lambda m:num2words(int(m[0])),text.lower())
 return re.sub('[^a-z]','',text)
def transcribe(path):
 boundary='hz'+uuid.uuid4().hex;parts=[]
 for name,value in [('model_id','scribe_v2'),('language_code','en'),('tag_audio_events','true')]:parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode())
 parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="word.mp3"\r\nContent-Type: audio/mpeg\r\n\r\n'.encode()+path.read_bytes()+b'\r\n');parts.append(f'--{boundary}--\r\n'.encode())
 raw,rid=request('speech-to-text',b''.join(parts),'multipart/form-data; boundary='+boundary);return json.loads(raw),rid
def generate(row):
 path=folder/row['file'];digest=hashlib.sha256(row['script'].encode()).hexdigest();previous=records.get(row['id'])
 if previous and previous.get('scriptSha256')==digest and path.exists()and hashlib.sha256(path.read_bytes()).hexdigest()==previous.get('sha256'):return previous
 assert not re.search(r'\[\s*clearly\s*\]',row['script'],re.I)
 payload={'text':row['script'],'model_id':MODEL,'language_code':'en','voice_settings':{'stability':.5}}
 raw,rid=request('text-to-speech/'+VOICE+'?output_format=mp3_44100_128',json.dumps(payload).encode());assert len(raw)>1000;path.write_bytes(raw)
 result=subprocess.run([ffmpeg,'-hide_banner','-i',str(path),'-f','null','-'],capture_output=True,text=True);assert result.returncode==0,'Invalid generated MP3'
 m=re.search(r'Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)',result.stderr);assert m
 duration=int(m[1])*3600+int(m[2])*60+float(m[3]);assert .15<duration<20
 transcript,asrRid=transcribe(path);heard=transcript.get('text','');events=[w for w in transcript.get('words',[])if w.get('type')=='audio_event'];match=norm(heard)==norm(row['script'])
 record={'id':row['id'],'term':row['term'],'file':row['file'],'script':row['script'],'scriptSha256':digest,'model':MODEL,'voice':'Jessica','voiceId':VOICE,'bytes':len(raw),'durationSeconds':duration,'sha256':hashlib.sha256(raw).hexdigest(),'generatedAt':datetime.now(timezone.utc).isoformat(),'requestId':rid,'transcriptionRequestId':asrRid,'transcript':heard,'transcriptExactNormalizedMatch':match,'audioEvents':events,'forbiddenTagPreflight':True}
 with lock:records[row['id']]=record;recordsPath.write_text(json.dumps(records,indent=2)+'\n')
 return record
done=[];failures=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=3)as pool:
 futures={pool.submit(generate,row):row for row in plan}
 for future in concurrent.futures.as_completed(futures):
  row=futures[future]
  try:done.append(future.result())
  except Exception as e:failures.append({'id':row['id'],'error':str(e)[:200]})
  if (len(done)+len(failures))%10==0:print(json.dumps({'completed':len(done),'failed':len(failures),'total':len(plan)}),flush=True)
manifest={'voice':'Jessica','voiceId':VOICE,'model':MODEL,'files':{r['id']:{'src':'assets/audio/'+r['file'],'durationSeconds':r['durationSeconds'],'sha256':r['sha256'],'transcriptVerified':r['transcriptExactNormalizedMatch'],'events':len(r['audioEvents'])}for r in done},'failures':failures,'reviewRequired':[{'id':r['id'],'expected':r['script'],'heard':r['transcript'],'events':r['audioEvents']}for r in done if not r['transcriptExactNormalizedMatch']or r['audioEvents']]}
if options.only and (folder/'manifest.json').exists():
 previousManifest=json.loads((folder/'manifest.json').read_text());previousManifest['files'].update(manifest['files']);manifest={**manifest,'files':previousManifest['files'],'failures':[r for r in previousManifest.get('failures',[]) if r['id'] not in options.only]+manifest['failures'],'reviewRequired':[r for r in previousManifest.get('reviewRequired',[]) if r['id'] not in options.only]+manifest['reviewRequired']}
(folder/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps({'completed':len(done),'failures':failures,'reviewRequired':manifest['reviewRequired']},indent=2),flush=True)
raise SystemExit(bool(failures))
