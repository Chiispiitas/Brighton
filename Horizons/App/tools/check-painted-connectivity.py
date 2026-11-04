"""Analyze native browser alpha; never writes or repaints the artwork."""
import json,sys
from pathlib import Path
import numpy as np
from PIL import Image

def components(mask):
    parents=[]; stats=[]; previous=[]
    def root(k):
        while parents[k]!=k:
            parents[k]=parents[parents[k]]; k=parents[k]
        return k
    for y,row in enumerate(mask):
        edges=np.diff(np.r_[False,row,False].astype(np.int8)); starts=np.where(edges==1)[0]; ends=np.where(edges==-1)[0]; current=[]
        for x0,x1 in zip(starts,ends):
            k=len(parents);parents.append(k);stats.append([int(x1-x0),int(x0),y,int(x1),y+1]);current.append((x0,x1,k))
            for a,b,pk in previous:
                if a<x1 and b>x0:
                    rk,rp=root(k),root(pk)
                    if rk!=rp: parents[rp]=rk
        previous=current
    merged={}
    for k,(area,x0,y0,x1,y1) in enumerate(stats):
        r=root(k)
        if r not in merged: merged[r]=[area,x0,y0,x1,y1]
        else:
            s=merged[r];s[0]+=area;s[1]=min(s[1],x0);s[2]=min(s[2],y0);s[3]=max(s[3],x1);s[4]=max(s[4],y1)
    return sorted([{'pixels':s[0],'box':s[1:]} for s in merged.values() if s[0]>=12],key=lambda s:-s['pixels'])

if __name__=='__main__':
    folder=Path(sys.argv[1]);data=json.loads((folder/'capture.json').read_text());bad=[]
    for c in data['cases']:
        parts=components(np.asarray(Image.open(c['file']).convert('RGBA'))[:,:,3]>170)
        if len(parts)>1:bad.append({**c,'parts':parts})
    report={'scope':'Connected opaque alpha components >=12px in transparent actual browser captures. Separate components need visual diagnosis; connectivity alone does not prove anatomy.','frames':len(data['cases']),'multipleComponentFrames':len(bad),'cases':bad}
    (folder/'component-diagnosis.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k!='cases'}));print(json.dumps(bad[:4],indent=2))
