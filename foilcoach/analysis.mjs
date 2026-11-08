// Pure, camera-space measurements. Never interprets force, balance or board geometry.
export const EDGES = [[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28],[27,29],[29,31],[28,30],[30,32]];
export function visible(p, ids) { return ids.every(i => p?.[i] && (p[i].visibility ?? 0) >= .65 && Number.isFinite(p[i].x) && Number.isFinite(p[i].y) && p[i].x >= 0 && p[i].x <= 1 && p[i].y >= 0 && p[i].y <= 1); }
export function angle(a,b,c,w,h) {
 const u=[(a.x-b.x)*w,(a.y-b.y)*h],v=[(c.x-b.x)*w,(c.y-b.y)*h];
 const d=Math.hypot(...u)*Math.hypot(...v); return d<1 ? null : Math.acos(Math.max(-1,Math.min(1,(u[0]*v[0]+u[1]*v[1])/d)))*180/Math.PI;
}
export function measure(p,w,h,view) {
 const torsoSides=[[11,23],[12,24]].filter(ids=>visible(p,ids));
 const valid=torsoSides.length>0;
 const r={visible:valid, knee:null,side:null,hip:null,torso:null};
 if(!valid) return r;
 const [shoulder,hip]=torsoSides.sort((a,b)=>Math.min(...b.map(i=>p[i].visibility))-Math.min(...a.map(i=>p[i].visibility)))[0];
 r.hip=p[hip].y*h;
 r.torso=Math.hypot((p[shoulder].x-p[hip].x)*w,(p[shoulder].y-p[hip].y)*h);
 if(view!=='side') return r;
 const sides=[[23,25,27],[24,26,28]].filter(ids=>visible(p,ids));
 if(sides.length){const ids=sides.sort((a,b)=> Math.min(...b.map(i=>p[i].visibility))-Math.min(...a.map(i=>p[i].visibility)))[0];r.knee=angle(...ids.map(i=>p[i]),w,h);r.side=ids[0]===23?'left':'right';}
 return r;
}
export function nearest(frames,time,maxGap=.22){let best=null;for(const f of frames)if(!best||Math.abs(f.t-time)<Math.abs(best.t-time))best=f;return best&&Math.abs(best.t-time)<=maxGap?best:null;}
export function checkpoints(frames){const good=[...new Map(frames.filter(f=>f.metrics.visible).map(f=>[f.t.toFixed(3),f])).values()].sort((a,b)=>a.t-b.t);if(good.length<4)return [];return [0,1/3,2/3,1].map(q=>good[Math.round((good.length-1)*q)]);}
export function summary(frames){const good=frames.filter(f=>f.metrics.visible);const knees=good.filter(f=>f.metrics.knee!==null);return {total:frames.length,good:good.length,coverage:frames.length?Math.round(good.length/frames.length*100):0,knees,kneeRange:knees.length>=3?Math.max(...knees.map(f=>f.metrics.knee))-Math.min(...knees.map(f=>f.metrics.knee)):null};}
export function bodyObservations(p,w,h,view,direction='unknown') {
 const out={torso:null,elbow:null,hipOffset:null,headOffset:null};
 if(view!=='side'||!p)return out;
 const sides=[[11,23,13,15],[12,24,14,16]].filter(ids=>visible(p,ids.slice(0,2))).sort((a,b)=>Math.min(...b.slice(0,2).map(i=>p[i].visibility))-Math.min(...a.slice(0,2).map(i=>p[i].visibility)));
 if(!sides.length)return out;
 const [s,hip,elbow,wrist]=sides[0];const torso=Math.hypot((p[s].x-p[hip].x)*w,(p[s].y-p[hip].y)*h);
 if(torso<12)return out; // Too few source pixels to normalize a body relationship.
 out.torso=Math.atan2((p[s].x-p[hip].x)*w,(p[hip].y-p[s].y)*h)*180/Math.PI;
 if(visible(p,[s,elbow,wrist]))out.elbow=angle(p[s],p[elbow],p[wrist],w,h);
 if(direction==='unknown')return out;
 const sign=direction==='left'?-1:1;
 if(visible(p,[23,24,27,28]))out.hipOffset=sign*((p[23].x+p[24].x-p[27].x-p[28].x)/2)*w/torso;
 if(visible(p,[0,s]))out.headOffset=sign*(p[0].x-p[s].x)*w/torso;
 return out;
}

export function sampleEvidence(frames){const good=frames.filter(f=>f.metrics.visible);return {total:frames.length,torso:good.length,kneeBySide:Object.fromEntries(['left','right'].map(side=>[side,good.filter(f=>f.metrics.side===side&&Number.isFinite(f.metrics.knee)).length])),body:Object.fromEntries(['torso','elbow','hipOffset','headOffset'].map(key=>[key,good.filter(f=>Number.isFinite(f.body?.[key])).length]))};}
