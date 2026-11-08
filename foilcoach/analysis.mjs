// Pure, camera-space measurements. Never interprets force, balance or board geometry.
export const EDGES = [[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28],[27,29],[29,31],[28,30],[30,32]];
export function visible(p, ids) { return ids.every(i => p?.[i] && (p[i].visibility ?? 0) >= .65 && Number.isFinite(p[i].x) && Number.isFinite(p[i].y) && p[i].x >= 0 && p[i].x <= 1 && p[i].y >= 0 && p[i].y <= 1); }
export function angle(a,b,c,w,h) {
 const u=[(a.x-b.x)*w,(a.y-b.y)*h],v=[(c.x-b.x)*w,(c.y-b.y)*h];
 const d=Math.hypot(...u)*Math.hypot(...v); return d<1 ? null : Math.acos(Math.max(-1,Math.min(1,(u[0]*v[0]+u[1]*v[1])/d)))*180/Math.PI;
}
export function measure(p,w,h,view) {
 const valid=visible(p,[11,12,23,24]);
 const r={visible:valid, knee:null,side:null,hip:null,torso:null};
 if(!valid) return r;
 r.hip=((p[23].y+p[24].y)/2)*h;
 r.torso=Math.hypot(((p[11].x+p[12].x-p[23].x-p[24].x)/2)*w,((p[11].y+p[12].y-p[23].y-p[24].y)/2)*h);
 if(view!=='side') return r;
 const sides=[[23,25,27],[24,26,28]].filter(ids=>visible(p,ids));
 if(sides.length){const ids=sides.sort((a,b)=> Math.min(...b.map(i=>p[i].visibility))-Math.min(...a.map(i=>p[i].visibility)))[0];r.knee=angle(...ids.map(i=>p[i]),w,h);r.side=ids[0]===23?'left':'right';}
 return r;
}
export function nearest(frames,time,maxGap=.22){let best=null;for(const f of frames)if(!best||Math.abs(f.t-time)<Math.abs(best.t-time))best=f;return best&&Math.abs(best.t-time)<=maxGap?best:null;}
export function checkpoints(frames){const good=frames.filter(f=>f.metrics.visible);if(!good.length)return [];return [0,1/3,2/3,1].map(q=>good[Math.round((good.length-1)*q)]);}
export function summary(frames){const good=frames.filter(f=>f.metrics.visible);const knees=good.filter(f=>f.metrics.knee!==null);return {total:frames.length,good:good.length,coverage:frames.length?Math.round(good.length/frames.length*100):0,knees,kneeRange:knees.length>=3?Math.max(...knees.map(f=>f.metrics.knee))-Math.min(...knees.map(f=>f.metrics.knee)):null};}
