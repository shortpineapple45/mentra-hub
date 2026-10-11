import type {TypedMiniappSession} from '@mentra/miniapp/background';
import type {Channels as HubChannels} from '../shared/core';
import {defaults,normalize,insight,prompt,lookupQuery,type State} from './core';
export function installInsight(session:TypedMiniappSession<HubChannels>,canDisplay:()=>boolean){
 let key='',alive=true,busy=false,epoch=0,dirty=false,storageWork:Promise<void>=Promise.resolve();
 let timer:ReturnType<typeof setTimeout>|undefined,off:(()=>void)|undefined,displayToken:string|undefined;
 let context:{text:string;at:number}[]=[];
 let state:State={ready:false,running:false,hasKey:false,settings:defaults,status:'Connecting to Mentra',transcript:'',lastInsight:'',requests:0,silent:0,latency:0,history:[],transcriptEvents:0,lastResponse:'',connection:'Not checked'};
 const send=()=>{if(alive)session.ui.send('insightSnapshot',state);};
 const status=(v:string)=>{state.status=v;send();};
 const error=(e:unknown)=>status(e instanceof Error?e.message:'Mentra operation failed');
 async function clear(){if(displayToken){const token=displayToken;displayToken=undefined;await session.display.render([],{view:'main',ifDisplayToken:token});}}
 async function display(text:string){if(!canDisplay()){status('PC replied. Select Quick Insight to show it on glasses.');return;}const d=session.capabilities?.display;if(!d){status('PC replied; no glasses display reported. See phone preview.');return;}const result=await session.display.render([{type:'text',id:'insight',box:{x:0,y:0,w:d.width??640,h:d.height??200},text,style:{maxLines:5,overflow:'ellipsis'}}],{view:'main',durationMs:state.settings.duration*1000});if(result.status==='blocked')status('Glasses display blocked: '+result.reason);else displayToken=result.displayToken;}
 function cancel(){epoch++;if(timer)clearTimeout(timer);timer=undefined;off?.();off=undefined;dirty=false;context=[];state.running=false;}
 function schedule(){if(!state.running||!dirty||busy||timer)return;timer=setTimeout(()=>{timer=undefined;void request();},0);}
 function endpoint(){if(!key)throw Error('Save your private PC API key first.');let u:URL;try{u=new URL(state.settings.endpoint);}catch{throw Error('Save the HTTPS address from your desktop app first.');}if(u.protocol!=='https:'||u.username||u.password)throw Error('Use an HTTPS address without a key in the URL.');return state.settings.endpoint;}
 // Promise timeout works even in hosts without AbortSignal.timeout.
 async function call(path:string,body?:unknown):Promise<Record<string,unknown>>{
  const base=endpoint();let timeout:ReturnType<typeof setTimeout>|undefined;
  try{return await Promise.race([(async()=>{let response:Response;try{response=await fetch(base+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},...(body?{body:JSON.stringify(body)}:{})});}catch{throw Error('Cannot reach your PC. Check the current tunnel address and keep the desktop app running.');}
   if(!response.ok){if(response.status===401)throw Error('PC rejected the API key. Copy private key from the desktop app, paste it here, then Save.');if(response.status===404)throw Error('API endpoint not found. Use the desktop API address, not the Render miniapp address.');let message='';try{const data=await response.json() as {error?:string};message=data.error||'';}catch{}throw Error('PC request failed (HTTP '+response.status+'). '+message);}
   return await response.json() as Record<string,unknown>;})(),new Promise<never>((_,reject)=>{timeout=setTimeout(()=>reject(Error('PC request timed out. Check Ollama, the desktop app and your current tunnel address.')),60000);})]);}finally{if(timeout)clearTimeout(timeout);}
 }
 async function connect(){await storageWork;const generation=epoch;state.connection='Checking…';send();try{const data=await call('/health');if(!alive||generation!==epoch)return;if(data.service!=='personal-ai')throw Error('That address does not point to the Personal AI server.');state.connection='Connected to PC · '+String(data.model||'model ready');status('PC connection and private key verified. Select Quick Insight to listen.');}catch(e){if(alive&&generation===epoch){state.connection='Failed';error(e);}}}
 async function request(test?:string){await storageWork;if(!alive)return;if(busy){status('A PC request is already in progress');return;}if(!test&&!state.running)return;
 const now=Date.now();context=context.filter(x=>now-x.at<90000).slice(-6);const text=test||context.map(x=>x.text).join('\n');if(!text.trim())return;
 const generation=epoch,settings={...state.settings};busy=true;dirty=false;status('Sending prompt to your PC…');
 try{
  const locality=`Local date/time: ${new Date().toString()}. Local place: ${settings.area||'not provided; ask for city when needed'}.`;
  state.requests++;send();const data=await call('/v1/chat',{system:prompt(settings.words,settings.frequency),text:locality+'\nPrevious insights: '+state.history.slice(0,5).join(' | ')+'\nConversation (latest utterance last):\n'+text});
  if(!alive||generation!==epoch)return;
  let raw=typeof data.text==='string'?data.text:'';state.lastResponse=raw;state.latency=Date.now()-now;state.connection='PC replied';
  if(!raw.trim())throw Error('PC returned no usable answer. Check the prompt console.');
  if(lookupQuery(raw))raw='Live web search is not connected to your PC server yet.';
  const value=insight(raw,settings.words);
  if(!value){state.silent++;status('PC returned NO_INSIGHT — intentionally no popup');return;}
  state.lastInsight=value;
  // Explicit tests always show their result, even if it repeats a previous insight.
  if(!test&&state.history.some(x=>x.toLowerCase()===value.toLowerCase())){status('PC replied with a repeated insight — popup skipped');return;}
  state.history=[value,...state.history].slice(0,20);status('PC insight received');await display(value);
 }catch(e){if(alive&&generation===epoch)error(e);}finally{busy=false;schedule();}
 }
 session.on('ready',()=>{storageWork=(async()=>{key=await session.storage.get('local-ai-key')||'';const stored=await session.storage.get('insight-settings');if(stored){try{state.settings=normalize(JSON.parse(stored));}catch{}}state.ready=true;state.hasKey=!!key;status(key?'Ready. Select Quick Insight to listen.':'Save your PC HTTPS address and private key.');})().catch(error);});
 session.ui.onOpen(send);session.ui.on('insightRefresh',send);
 session.ui.on('insightSave',v=>{storageWork=storageWork.then(async()=>{const resume=state.running;cancel();state.settings=normalize(v.settings);if(v.key.trim())key=v.key.trim();await session.storage.set('insight-settings',JSON.stringify(state.settings));if(key)await session.storage.set('local-ai-key',key);state.hasKey=!!key;state.connection='Not checked';status('Saved. Check PC connection, then select Quick Insight.');if(resume)start();}).catch(error);});
 session.ui.on('insightForget',()=>{storageWork=storageWork.then(async()=>{cancel();key='';state.hasKey=false;await session.storage.delete('local-ai-key');status('Private key removed. Listening stopped.');}).catch(error);});
 function start(){if(!state.ready){status('Wait for Mentra to finish loading settings.');return false;}try{endpoint();}catch(e){error(e);return false;}cancel();state.running=true;try{off=session.transcription.on(tx=>{if(!state.running||!tx.text.trim())return;state.transcriptEvents++;state.transcript=tx.text.trim();send();if(!tx.isFinal)return;const text=tx.text.trim();if(context.at(-1)?.text===text)return;context.push({text,at:Date.now()});context=context.slice(-6);dirty=true;schedule();});}catch(e){cancel();error(e);return false;}status('Listening. Speak a full sentence; leaving Quick Insight stops listening.');return true;}
 async function stop(){cancel();status('Quick Insight unselected. Listening stopped.');await clear();}
 session.ui.on('insightConnect',()=>{void connect();});
 session.ui.on('insightTest',text=>{void request(text.slice(0,3000));});
 session.ui.on('insightSample',()=>{void display('Quick Insight\nThis is a display test.').catch(error);});
 session.ui.on('insightClear',()=>{void clear().catch(error);});
 session.permissions.onPermissionError(()=>status('Microphone permission failed. Check Mentra and iPhone microphone access.'));
 session.on('error',()=>status('Mentra host error. Restart this miniapp.'));
 session.on('disconnect',()=>{cancel();alive=false;});
 return {start,stop,isRunning:()=>state.running,whenReady:()=>storageWork};
}
