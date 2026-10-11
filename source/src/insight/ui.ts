import {defaults,levels,type Channels,type State} from './core';
const inside=typeof mentra!=='undefined';const el=(id:string)=>document.getElementById('insight-'+id)!;const input=(id:string)=>el(id) as HTMLInputElement;
let initialized=false;
function draw(s:State){el('status').textContent=s.status;el('stats').textContent=`PC: ${s.connection} | ${s.running?'Listening':'Not listening'}\nSpeech events: ${s.transcriptEvents} | PC requests: ${s.requests} | No insight: ${s.silent}\nLast request: ${s.latency?(s.latency/1000).toFixed(2)+' seconds':'—'}\nLatest speech: ${s.transcript||'No speech received yet'}`;el('key-status').textContent=s.hasKey?'Private PC key saved.':'No private PC key saved.';el('preview').textContent=s.lastInsight||'Your next insight appears here.';el('response').textContent=s.lastResponse||'No PC response yet.';el('history').replaceChildren(...s.history.map(text=>{const p=document.createElement('p');p.textContent=text;return p;}));if(!initialized&&s.ready){for(const k of ['endpoint','words','frequency','duration','area'] as const)input(k).value=String(s.settings[k]);initialized=true;sliders();}}
function send<K extends keyof Channels>(name:K,value:Channels[K]){if(inside)(mentra.send as (n:K,v:Channels[K])=>void)(name,value);else el('status').textContent='Preview only — open in Mentra to connect to your PC.';}
for(const [id,name] of [['clear','insightClear'],['sample','insightSample'],['forget','insightForget']] as const)el(id).onclick=()=>send(name,{});
function save(){send('insightSave',{key:input('key').value,settings:{endpoint:input('endpoint').value,words:Number(input('words').value),frequency:Number(input('frequency').value),duration:Number(input('duration').value),area:input('area').value}});input('key').value='';}
el('save').onclick=save;
el('connect').onclick=()=>{save();send('insightConnect',{});};
el('test').onclick=()=>{const text=(el('sentence') as HTMLTextAreaElement).value.trim();if(text){save();send('insightTest',text);}else el('status').textContent='Type a sentence first, or select Quick Insight and speak.';};
if(inside){mentra.on('insightSnapshot',draw);mentra.send('insightRefresh',{});}else draw({ready:false,running:false,hasKey:false,settings:defaults,status:'Preview — install in Mentra',transcript:'',lastInsight:'',requests:0,silent:0,latency:0,history:[],transcriptEvents:0,lastResponse:'',connection:'Not connected'});
function sliders(){el('words-value').textContent=input('words').value;el('duration-value').textContent=input('duration').value+' seconds';el('frequency-value').textContent=input('frequency').value+' / 5';el('frequency-description').textContent=levels[Number(input('frequency').value)];}
for(const id of ['words','duration','frequency'])input(id).oninput=sliders;
sliders();
