export const FULL_ROI=Object.freeze({x:0,y:0,w:1,h:1});
export function validROI(r,w,h){return r&&[r.x,r.y,r.w,r.h].every(Number.isFinite)&&r.x>=0&&r.y>=0&&r.w>0&&r.h>0&&r.x+r.w<=1.000001&&r.y+r.h<=1.000001&&r.w*w>=24&&r.h*h>=24;}
export function remapPose(pose,r){return pose?.map(p=>({...p,x:r.x+p.x*r.w,y:r.y+p.y*r.h,z:p.z*r.w,visibility:p.x<0||p.x>1||p.y<0||p.y>1?0:p.visibility}))||null;}
export function contentRect(stageW,stageH,videoW,videoH){const scale=Math.min(stageW/videoW,stageH/videoH),w=videoW*scale,h=videoH*scale;return {x:(stageW-w)/2,y:(stageH-h)/2,w,h};}
export function imagePoint(x,y,rect){return {x:Math.max(0,Math.min(1,(x-rect.x)/rect.w)),y:Math.max(0,Math.min(1,(y-rect.y)/rect.h))};}
