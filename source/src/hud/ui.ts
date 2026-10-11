
import {defaults,initialData,parseConfig,hudLines,verseOfDay,time,dateLabel,batteryText,weatherText,eventText,type Config,type Data} from './core';
const inside=typeof mentra!=='undefined',el=(id:string)=>document.getElementById('hud-'+id)!,input=(id:string)=>el(id) as HTMLInputElement;
let config:Config={...defaults},data:Data=initialData(),loaded=false,editing=false;
const send=(kind:'refresh'|'show'|'clear'|'test'|'notifications'|'next'|'previous'|'home')=>{if(inside)mentra.send(('hud'+kind[0].toUpperCase()+kind.slice(1)) as 'hudRefresh',{});else{el('message').textContent='Preview only. This control works inside Mentra.';if(kind==='test'){data.popup={app:'DISPLAY TEST',title:'Sample notification',content:'Preview only. No real phone notification received.',at:Date.now()};data.popupUntil=Date.now()+8000;draw();}}};
function fill(){for(const key of ['clock24','fahrenheit','showCalendar'] as const)input(key).checked=config[key];for(const key of ['popupSeconds','latitude','longitude','reminders','mode'] as const)(el(key) as HTMLInputElement).value=String(config[key]);}
function draw(){
 const now=new Date();el('host').textContent=inside?'MENTRA MINIAPP':'BROWSER PREVIEW';el('date').textContent=dateLabel(now);el('clock').textContent=time(now,config);el('weather').textContent=weatherText(data,config);
 el('verse').textContent=verseOfDay();el('battery').textContent=batteryText(data);
 el('events').replaceChildren();const events=config.showCalendar?data.calendar.filter(e=>Date.parse(e.endsAt)>Date.now()).slice(0,2):[];
 for(const e of events){const div=document.createElement('div');div.textContent=eventText(e,config);el('events').append(div);}
 if(!events.length)el('events').textContent=config.reminders|| (config.showCalendar?(data.calendarStatus==='Ready'?'No upcoming events':'Calendar unavailable'):'Calendar off');
 el('exact').textContent=data.renderedText??hudLines(data,config).join('\n');el('layout-label').textContent=data.renderedText===undefined?'Requested text · waiting for host layout':'Host-computed glasses text';
 el('status').textContent=[`Host: ${inside?'Mentra':'Browser preview; no glasses connection'}`,`Glasses: ${data.connected===undefined?'Waiting for host':data.connected?'Connected':'Disconnected'}`,`Display: ${data.displayStatus}`,`Head position: ${data.headUp===undefined?'No events yet':data.headUp?'Up':'Down'}`,`Calendar: ${data.calendarStatus}`,`Weather: ${data.weatherStatus}`,`Battery: ${data.batteryAt?'Received '+new Date(data.batteryAt).toLocaleTimeString():'No reading received'}`,`Notifications: ${data.notificationEvents} real events received; ${data.unread} unread`,`Glasses taps: ${data.touchEvents} (${data.lastTouch??'none yet'})`,`Clock loop: ${data.lastClockTick?new Date(data.lastClockTick).toLocaleTimeString():'Waiting for first tick'}`,`Refresh: ${data.refreshing?'In progress':data.lastRefresh?new Date(data.lastRefresh).toLocaleTimeString():'Not yet refreshed'}`,data.error??''].join('\n');
 (el('refresh') as HTMLButtonElement).disabled=data.refreshing;
}
if(inside){mentra.on('hudSnapshot',s=>{config=parseConfig(s.config);data=s.data;if(!loaded||!editing){fill();loaded=true;}draw();});}
else{try{config=parseConfig(JSON.parse(localStorage.getItem('personal-hud-preview')??'{}'));}catch{}fill();loaded=true;}
document.querySelectorAll('#hud-panel input,#hud-panel textarea,#hud-panel select').forEach(e=>e.addEventListener('input',()=>{editing=true;}));
el('save').onclick=()=>{const v=parseConfig({clock24:input('clock24').checked,fahrenheit:input('fahrenheit').checked,showCalendar:input('showCalendar').checked,showNotifications:false,mode:(el('mode') as HTMLSelectElement).value,popupSeconds:8,latitude:input('latitude').value,longitude:input('longitude').value,reminders:(el('reminders') as HTMLTextAreaElement).value});editing=false;if(inside){mentra.send('hudSave',v);el('message').textContent='Saving settings and refreshing…';}else{config=v;localStorage.setItem('personal-hud-preview',JSON.stringify(v));el('message').textContent='Preview settings saved locally.';draw();}};
for(const k of ['refresh','show','clear'] as const)el(k).onclick=()=>send(k);
setInterval(draw,1000);draw();

// Required host handshake, after DOM setup and channel subscriptions.

