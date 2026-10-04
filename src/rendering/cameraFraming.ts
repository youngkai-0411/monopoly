export interface ScreenPoint { x:number; y:number }
export interface ScreenRect { left:number; top:number; right:number; bottom:number }
const intersects=(a:ScreenRect,b:ScreenRect)=>a.left<b.right+5&&a.right>b.left-5&&a.top<b.bottom+5&&a.bottom>b.top-5;
const bounds=(points:ScreenPoint[]):ScreenRect=>({left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),top:Math.min(...points.map(p=>p.y)),bottom:Math.max(...points.map(p=>p.y))});

/** Fit the projected tile surfaces, preserving the camera angle and game coordinates. */
export function fitOverview(width:number,height:number,tiles:ScreenPoint[][],overlays:ScreenRect[]){
 const relative=tiles.map(points=>points.map(p=>({x:p.x-width/2,y:p.y-height/2})));
 const xs=[0,-.04,.04,-.08,.08,-.12,.12,-.16,.16,-.20,.20];
 const ys=[0,-.04,.04,-.08,.08,-.12,.12,-.16,.16];
 for(let scale=1.04;scale>=.5;scale-=.02)for(const dx of xs)for(const dy of ys){
  const anchor={x:width*(.5+dx),y:height*(.5+dy)};
  const rects=relative.map(points=>bounds(points.map(p=>({x:anchor.x+p.x*scale,y:anchor.y+p.y*scale}))));
  if(rects.every(r=>r.left>=10&&r.top>=10&&r.right<=width-10&&r.bottom<=height-10&&!overlays.some(o=>intersects(r,o))))return {anchor,zoom:scale,clear:true};
 }
 const full=bounds(relative.flat());
 return {anchor:{x:width/2,y:height/2},zoom:Math.min((width-20)/(full.right-full.left),(height-20)/(full.bottom-full.top),.5),clear:false};
}
export function followAnchor(width:number,height:number,overlays:ScreenRect[]):ScreenPoint{
 for(const dx of [0,-.08,.08,-.16,.16,-.24,.24])for(const dy of [0,-.08,.08,-.16,.16]){
  const p={x:width*(.5+dx),y:height*(.46+dy)},r={left:p.x-60,right:p.x+60,top:p.y-90,bottom:p.y+45};
  if(r.left>=8&&r.top>=8&&r.right<=width-8&&r.bottom<=height-8&&!overlays.some(o=>intersects(r,o)))return p;
 }
 return {x:width*.4,y:height*.44};
}
