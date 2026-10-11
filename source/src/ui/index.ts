import '../insight/ui';
import '../hud/ui';
import {apps,step,type State,type Command} from '../shared/core';
import {HeadphoneController} from '../shared/media';
const inside=typeof mentra!=='undefined',el=(id:string)=>document.getElementById(id)!;
let state:State={open:false,selected:0,status:'Connecting',commands:0},remoteCount=0,logs:string[]=[];
const report=(s:string)=>{logs=[new Date().toLocaleTimeString()+' '+s,...logs].slice(0,12);el('log').textContent=logs.join('\n');el('message').textContent=s;};
function draw(){el('apps').replaceChildren();apps.forEach((app,i)=>{const row=document.createElement('div');row.className='item'+(i===state.selected?' selected':'');const name=document.createElement('span');name.textContent=(i===state.selected?'> ':'')+app.name;row.append(name);const button=document.createElement('button');button.textContent='Select';button.onclick=()=>{const steps=(i-state.selected+apps.length)%apps.length;for(let n=0;n<steps;n++)send('nexttrack');send('select');};row.append(button);el('apps').append(row);});el('status').textContent=[`Host: ${inside?'Mentra':'Browser preview'}`,`Menu: ${state.open?'open':'closed'}`,`Selected: ${apps[state.selected].name}`,`Media commands received: ${remoteCount}`,`Active app: ${state.active??"none"}`,`Menu commands: ${state.commands}`,`Status: ${state.status}`,`Media Session: ${'mediaSession' in navigator?'available':'unavailable'}`].join('\n');}
function send(command:Command){if(inside)mentra.send('command',command);else{state=step(state,command).state;state.status='Preview only; no glasses or app launch';draw();}}
const audio=el('silence') as HTMLAudioElement;
const controls=new HeadphoneController(audio,'mediaSession' in navigator?navigator.mediaSession:undefined,command=>{remoteCount++;send(command);draw();},report);
el('enable').onclick=()=>{if('mediaSession' in navigator&&typeof MediaMetadata!=='undefined')navigator.mediaSession.metadata=new MediaMetadata({title:'Ring Shortcuts',artist:'Mentra control test'});void controls.start();};el('disable').onclick=()=>controls.stop();
for(const command of ['open','close','nexttrack','previoustrack','select'] as const)el(command).onclick=()=>send(command);
if(inside)mentra.on('snapshot',s=>{state=s;draw();});
audio.addEventListener('error',()=>report('Silent audio could not load.'));
window.addEventListener('pagehide',()=>controls.stop());draw();if(inside)mentra.ready();

el("save").onclick=()=>{if(inside)mentra.send("settings",{language:(el("language") as HTMLInputElement).value});};

