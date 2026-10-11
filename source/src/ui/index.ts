import '../insight/ui';
import {apps,step,type State,type Command} from '../shared/core';
import {HeadphoneController} from '../shared/media';
const inside=typeof mentra!=='undefined',el=(id:string)=>document.getElementById(id)!;
let state:State={open:false,selected:0,status:'Connecting',commands:0};
const report=(s:string)=>{el('message').textContent=s;};
function draw(){el('apps').replaceChildren();apps.forEach((app,i)=>{const row=document.createElement('div');const active=!!app.packageName&&state.active===app.packageName;row.className='item'+(active?' selected':'');const name=document.createElement('span');name.textContent=app.name+(active?' · active':'');row.append(name);const button=document.createElement('button');button.textContent=active?'Close':'Select';button.onclick=()=>{if(active){send('open');return;}if(inside)mentra.send('selectApp',i);else report('Install this app in Mentra to select apps.');};row.append(button);el('apps').append(row);});el('message').textContent=state.status;}
function send(command:Command){if(inside)mentra.send('command',command);else{state=step(state,command).state;state.status='Preview only; install in Mentra';draw();}}
const audio=el('silence') as HTMLAudioElement;
const controls=new HeadphoneController(audio,'mediaSession' in navigator?navigator.mediaSession:undefined,send,report);
el('enable').onclick=()=>{if('mediaSession' in navigator&&typeof MediaMetadata!=='undefined')navigator.mediaSession.metadata=new MediaMetadata({title:'Personal Hub',artist:'Menu controls'});void controls.start();};el('disable').onclick=()=>controls.stop();
el('open').onclick=()=>send('open');el('close').onclick=()=>send('close');
if(inside)mentra.on('snapshot',s=>{state=s;draw();});
audio.addEventListener('error',()=>report('Silent audio could not load.'));
window.addEventListener('pagehide',()=>controls.stop());draw();if(inside)mentra.ready();
