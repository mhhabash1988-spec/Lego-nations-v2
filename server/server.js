const express=require("express");
const path=require("path");
const http=require("http");
const WebSocket=require("ws");
const app=express();app.use(express.json({limit:"20kb"}));
app.use(express.static(path.join(__dirname,"public")));
const server=http.createServer(app),wss=new WebSocket.Server({server});
const clients=new Set(),userTeams=new Map(),battle=require("./battle");
let live=null,liveUsername=null,connected=false;
function broadcast(payload){const s=JSON.stringify(payload);for(const c of clients)if(c.readyState===WebSocket.OPEN)c.send(s)}
function status(state,message,extra={}){broadcast({type:"status",status:state,message,...extra})}
function normalizeUsername(v){return String(v||"").trim().replace(/^https?:\/\/(www\.)?tiktok\.com\//i,"").split(/[/?#]/)[0].replace(/^@+/,"")}
function getUser(u){const n=u?.uniqueId||u?.displayId||u?.nickname||"viewer";const username=String(n).replace(/^@/,"");return {username,key:username.toLowerCase(),nickname:u?.nickname||username}}
function onChat(e){const u=getUser(e?.user),comment=String(e?.comment||"").trim(),m=comment.match(/^([1-7])$/);
 if(m){const team=Number(m[1]);userTeams.set(u.key,team);battle.join(team);broadcast(battle.snapshot());broadcast({type:"join",username:u.username,nickname:u.nickname,team,comment})}
 else broadcast({type:"chat",username:u.username,nickname:u.nickname,comment})}
function onGift(e){const u=getUser(e?.user);if(e?.streakable&&!e?.repeatEnd)return;
 const team=userTeams.get(u.key)||null,diamonds=Math.max(0,Number(e?.diamondCount||0)*Math.max(1,Number(e?.repeatCount||1)));
 if(team)battle.boost(team,diamonds);
 broadcast({type:"gift",username:u.username,nickname:u.nickname,giftName:e?.giftName||"هدية",team,diamonds});
}
wss.on("connection",s=>{clients.add(s);s.send(JSON.stringify({type:"status",status:connected?"connected":"disconnected",message:connected?"متصل بالبث المباشر":"بانتظار الاتصال بالبث",username:liveUsername}));s.send(JSON.stringify(battle.snapshot()));s.on("close",()=>clients.delete(s))});
app.get("/health",(_q,r)=>r.json({ok:true,service:"lego-nations-live",connected,username:liveUsername}));
app.get("/state",(_q,r)=>r.json({connected,username:liveUsername,battle:battle.snapshot()}));
app.post("/connect",async(req,res)=>{
 const username=normalizeUsername(req.body?.username);
 if(!/^[a-zA-Z0-9._]{2,24}$/.test(username))return res.status(400).json({error:"اسم المستخدم غير صحيح. أدخل المعرّف الموجود بعد @ فقط."});
 try{
  if(live){try{live.disconnect()}catch(_){}live=null}
  connected=false;liveUsername=username;userTeams.clear();battle.reset();broadcast(battle.snapshot());status("connecting","جارٍ الاتصال بالبث المباشر...",{username});
  const {TikTokLive}=await import("./vendor/tiktok-signer/packages/tiktok-live/dist/index.js");
  const connection=new TikTokLive(username,{fetchGifts:true,reconnect:{attempts:5,initialMs:2000,maxMs:60000}});
  connection.on("chat",onChat);connection.on("gift",onGift);
  connection.on("connected",state=>{connected=true;status("connected","تم الاتصال بالبث المباشر",{username,roomId:state?.roomId||connection.roomId||null})});
  connection.on("disconnected",detail=>{connected=false;status("disconnected","انقطع اتصال اللعبة بالبث أو يجري إعادة الاتصال",{username,reason:detail?.reason||""})});
  connection.on("reconnecting",detail=>{connected=false;status("connecting","انقطع الاتصال مؤقتاً، جارٍ إعادة المحاولة...",{username,attempt:detail?.attempt||null})});
  connection.on("error",error=>{console.error("TikTok LIVE event error:",error?.stack||error);broadcast({type:"connector-error",message:"حدث خطأ أثناء استقبال أحداث TikTok."})});
  live=connection;const state=await connection.connect();connected=true;
  status("connected","تم الاتصال بالبث المباشر. اكتبوا رقم الفريق من 1 إلى 7.",{username,roomId:state?.roomId||connection.roomId||null});
  res.json({ok:true,username,roomId:state?.roomId||connection.roomId||null});
 }catch(error){connected=false;live=null;const detail=String(error?.message||error||"Unknown error");console.error("TikTok LIVE connection failed:",error?.stack||error);status("error","تعذر الاتصال: "+detail,{username});res.status(502).json({error:"تعذر الاتصال ببث TikTok: "+detail})}
});
setInterval(()=>broadcast(battle.tick()),850);
server.listen(process.env.PORT||3000,()=>console.log("LEGO NATIONS LIVE server ready"));