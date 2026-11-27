const TEAMS = [
  {id:1,name:"فلسطين",flag:"🇵🇸",color:"#23c98b"},
  {id:2,name:"إسرائيل",flag:"🇮🇱",color:"#659cff"},
  {id:3,name:"الأردن",flag:"🇯🇴",color:"#ff6969"},
  {id:4,name:"السعودية",flag:"🇸🇦",color:"#91d35e"},
  {id:5,name:"سوريا",flag:"🇸🇾",color:"#ffc45e"},
  {id:6,name:"مصر",flag:"🇪🇬",color:"#ff9365"},
  {id:7,name:"الإمارات",flag:"🇦🇪",color:"#bd91ff"}
];
const bases=[[0,-5],[4,-3],[5,2],[1,5],[-4,4],[-5,-1],[0,0]];
const key=(q,r)=>q+","+r, cells=[], cellMap=new Map();
const dirs=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
const ammo=Array(8).fill(0), active=new Set(); let tickNo=0;
function reset(){
 cells.length=0;cellMap.clear();
 for(let q=-5;q<=5;q++)for(let r=-5;r<=5;r++)if(Math.max(Math.abs(q),Math.abs(r),Math.abs(q+r))<=5){
  const c={q,r,owner:0,hp:0,base:false};cells.push(c);cellMap.set(key(q,r),c);
 }
 bases.forEach(([q,r],i)=>{const c=cellMap.get(key(q,r));c.owner=i+1;c.hp=5;c.base=true});
 ammo.fill(0);active.clear();tickNo=0;
}
function neighbors(c){return dirs.map(([a,b])=>cellMap.get(key(c.q+a,c.r+b))).filter(Boolean)}
function counts(){const a=Array(8).fill(0);for(const c of cells)if(c.owner)a[c.owner]++;return a}
function join(t){if(t>=1&&t<=7){active.add(t);ammo[t]+=1}}
function boost(t,n){if(t>=1&&t<=7){active.add(t);ammo[t]+=Math.max(1,Math.min(20,Math.ceil(n/5)))}}
function tick(){
 tickNo++;const shots=[];
 for(let t=1;t<=7;t++){
  if(!active.has(t)||(tickNo%2!==0&&ammo[t]<=0))continue;
  const owned=cells.filter(c=>c.owner===t);
  const edges=owned.map(c=>({c,targets:neighbors(c).filter(n=>n.owner!==t)})).filter(x=>x.targets.length);
  if(!edges.length)continue;
  const src=edges[Math.floor(Math.random()*edges.length)],dst=src.targets[Math.floor(Math.random()*src.targets.length)];
  if(ammo[t]>0)ammo[t]--;
  if(dst.owner===0){dst.owner=t;dst.hp=1}
  else if(dst.base){dst.hp=Math.max(1,dst.hp-1);if(dst.hp===1&&dst.owner!==t){dst.owner=t;dst.base=false}}
  else{dst.owner=t;dst.hp=1}
  shots.push({team:t,from:{q:src.c.q,r:src.c.r},to:{q:dst.q,r:dst.r}});
 }
 return {type:"battle-tick",tick:tickNo,cells:cells.map(c=>({...c})),counts:counts(),shots};
}
function snapshot(){return {type:"battle-state",tick:tickNo,cells:cells.map(c=>({...c})),counts:counts(),teams:TEAMS}}
reset();module.exports={TEAMS,reset,join,boost,tick,snapshot};