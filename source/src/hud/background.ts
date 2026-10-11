import type {TypedMiniappSession} from '@mentra/miniapp/background';
import type {Channels} from '../shared/core';
import {defaults,initialData,parseConfig,hudLines,noticeLines,type Notice,type Config,type Event} from './core';
export function installHud(session:TypedMiniappSession<Channels>,mainBusy:()=>boolean){
 let config:Config={...defaults},data=initialData(),alive=true,ready=false,hydrated=false,manuallyHidden=false,lastFrame='',lastView:Config['mode']='dashboard',drawQueue=Promise.resolve(),configRevision=0,pendingRefresh=false;
 const snapshot=()=>session.ui.send('hudSnapshot',{config,data,text:hudLines(data,config).join('\n')});
 function draw(force=false){
  if(!alive||!ready||!hydrated)return;
  drawQueue=drawQueue.then(async()=>{
   if(!alive)return;
   const visible=!manuallyHidden;
   const text=visible?hudLines(data,config).join('\n'):'';
   if(text===lastFrame&&!force){snapshot();return;}
   if(lastView!=='dashboard'){await session.display.render([],{view:lastView});lastView='dashboard';}
   const display=session.capabilities?.display;
   const result=await session.display.render(text?[{type:'text',id:'personal-hud',box:{x:0,y:0,w:display?.width??640,h:display?.height??200},text,style:{maxLines:5,overflow:'ellipsis'}}]:[],{view:'dashboard',includeTextLayout:true});
   if(result.status!=='blocked'){lastFrame=text;data.renderedText=visible?result.textLayout?.['personal-hud']?.lines.map(line=>line.text).join('\n'):'';data.displayStatus=visible?'HUD sent to '+'dashboard'+' view':'Display cleared';}
   else data.displayStatus='Display blocked: '+(result.reason??'host restriction');
   snapshot();
  }).catch(e=>{data.displayStatus='Display error: '+String(e);snapshot();});
 }
 async function withTimeout<T>(p:Promise<T>,ms=18000):Promise<T>{let id:ReturnType<typeof setTimeout>;try{return await Promise.race([p,new Promise<T>((_,reject)=>{id=setTimeout(()=>reject(Error('Timed out; try Refresh')),ms);})]);}finally{clearTimeout(id!);}}
 async function refresh(){
  if(!hydrated||!ready||!alive)return;
  if(data.refreshing){pendingRefresh=true;return;}
  data.refreshing=true;data.error=undefined;snapshot();const revision=configRevision,current={...config};
  const calendar=async()=>{
   if(!current.showCalendar)return;
   try{const r=await withTimeout(session.phone.calendar.listEvents({startsAt:new Date(Date.now()-86400000),endsAt:new Date(Date.now()+7*86400000),limit:30}));if(!alive||revision!==configRevision)return;
    data.calendar=r.events.filter(e=>Date.parse(e.endsAt)>Date.now()).sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt)).map(e=>({title:e.title,startsAt:e.startsAt,endsAt:e.endsAt,allDay:e.allDay} satisfies Event));data.calendarStatus='Ready';
   }catch(e){if(revision===configRevision)data.calendarStatus=String(e);}
  };
  const weather=async()=>{
   try{
    let lat:number,lng:number;
    if(current.latitude.trim()&&current.longitude.trim()){lat=Number(current.latitude);lng=Number(current.longitude);}
    else {const loc=await withTimeout(session.location.getOnce());lat=loc.lat;lng=loc.lng;}
    if(!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180)throw Error('Invalid coordinates');
    const response=await withTimeout(fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=auto`));
    if(!response.ok)throw Error('Weather service HTTP '+response.status);
    const payload=await withTimeout(response.json()) as {current?:{temperature_2m:number;weather_code:number}};
    if(!payload.current||!Number.isFinite(payload.current.temperature_2m))throw Error('No current weather returned');
    if(!alive||revision!==configRevision)return;
    data.weather={temperature:payload.current.temperature_2m,code:payload.current.weather_code,at:Date.now()};data.weatherStatus='Ready';
   }catch(e){if(revision===configRevision)data.weatherStatus=String(e);}
  };
  try{await Promise.allSettled([calendar(),weather()]);}finally{data.refreshing=false;data.lastRefresh=Date.now();if(alive){draw();if(pendingRefresh){pendingRefresh=false;void refresh();}}}
 }
 session.on('ready',()=>{ready=true;void withTimeout(session.storage.get('settings'),5000).then(raw=>{if(raw)config={...parseConfig(JSON.parse(raw)),clock24:true,showNotifications:false,mode:"dashboard"};}).catch(e=>{data.error='Settings: '+String(e);}).finally(()=>{hydrated=true;draw(true);void refresh();});});
 session.glasses.onBattery(e=>{if(Number.isFinite(e.level)&&e.level>=0&&e.level<=100){data.battery=e.level;data.batteryAt=Date.now();data.charging=e.charging;draw();}});
 session.glasses.onConnection(e=>{data.connected=e.connected;if(e.connected)draw(true);else snapshot();});
 session.imu.onHeadPosition(e=>{data.headUp=e.position==='up';if(data.headUp&&config.showNotifications&&data.unread){data.selectedNotice=0;data.unread=0;draw(true);}else snapshot();});
 function popupOnMain(notice:Notice){if(!mainBusy()&&!manuallyHidden){const d=session.capabilities?.display;void session.display.render([{type:'text',id:'personal-hud-popup',box:{x:0,y:0,w:d?.width??640,h:d?.height??200},text:noticeLines(notice,config,0,data.notifications.length).join('\n'),style:{maxLines:5,overflow:'ellipsis'}}],{view:'main',durationMs:config.popupSeconds*1000}).then(r=>{if(r.status==='blocked'){data.error='Notification popup blocked: '+(r.reason??'display owned by another app');snapshot();}});}}
 const seen=new Set<string>();
 session.phone.notifications.on(e=>{
  if(!alive)return;const key=e.notificationId+'|'+e.title+'|'+e.content;if(seen.has(key))return;seen.add(key);if(seen.size>100)seen.delete(seen.values().next().value!);
  const notice:Notice={id:key,app:e.app||e.packageName||'Notification',title:e.title??'',content:e.content??'',at:Number.isFinite(e.timestamp)?e.timestamp:Date.now()};data.notificationEvents++;data.unread++;data.notifications=[...data.notifications,notice].slice(-20);
  if(config.showNotifications){data.popup=notice;data.popupUntil=Date.now()+config.popupSeconds*1000;if(data.selectedNotice!==undefined)data.selectedNotice=0;popupOnMain(notice);}draw();
 });
 function browse(direction=1){if(!config.showNotifications||!data.notifications.length){snapshot();return;}data.popup=undefined;data.unread=0;const n=data.notifications.length;if(data.selectedNotice===undefined)data.selectedNotice=direction>0?0:n-1;else{const next=data.selectedNotice+direction;data.selectedNotice=next<0||next>=n?undefined:next;}manuallyHidden=false;draw(true);}
 function home(){data.selectedNotice=undefined;data.popup=undefined;draw(true);}
 session.ui.on('hudNotifications',()=>{data.selectedNotice=undefined;browse();});session.ui.on('hudNext',()=>browse());session.ui.on('hudPrevious',()=>browse(-1));session.ui.on('hudHome',home);
 session.on('error',e=>{data.error='Mentra: '+String(e);snapshot();});
 let saves=Promise.resolve();
 session.ui.on('hudSave',incoming=>{saves=saves.then(async()=>{try{const next=parseConfig(incoming);await session.storage.set('settings',JSON.stringify(next));if(next.latitude!==config.latitude||next.longitude!==config.longitude){data.weather=undefined;data.weatherStatus='Waiting for new location';}config={...next,mode:"dashboard"};configRevision++;draw(true);void refresh();}catch(e){data.error='Could not save: '+String(e);snapshot();}});return saves;});
 session.ui.on('hudRefresh',()=>void refresh());session.ui.onOpen(snapshot);
 session.ui.on('hudShow',()=>{manuallyHidden=false;home();});
 session.ui.on('hudClear',()=>{manuallyHidden=true;draw(true);});
 session.ui.on('hudTest',()=>{data.popup={app:'DISPLAY TEST',title:'Sample notification',content:'This tests the HUD only. No phone notification was received.',at:Date.now()};data.popupUntil=Date.now()+config.popupSeconds*1000;popupOnMain(data.popup);draw();});
 let lastMinute=-1;
 const clock=setInterval(()=>{data.lastClockTick=Date.now();let changed=false;if(data.popup&&Date.now()>=(data.popupUntil??0)){data.popup=undefined;changed=true;}const minute=Math.floor(Date.now()/60000);if(minute!==lastMinute){lastMinute=minute;changed=true;}if(changed)draw();},1000);
 const polling=setInterval(()=>void refresh(),10*60000);
 session.on('disconnect',()=>{alive=false;clearInterval(clock);clearInterval(polling);session.phone.notifications.stop();});
}
