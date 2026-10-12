import type {TypedMiniappSession} from '@mentra/miniapp/background';
import type {Channels as HubChannels} from '../shared/core';
import {defaults,normalize,validEndpoint,insight,prompt,lookupQuery,type State} from './core';
export function installInsight(session:TypedMiniappSession<HubChannels>,canDisplay:()=>boolean){
 let key='',alive=true,busy=false,epoch=0,dirty=false,revision=0,pendingTest:string|undefined,displayRevision=0,holdUntil=0,storageWork:Promise<void>=Promise.resolve();
 let timer:ReturnType<typeof setTimeout>|undefined,off:(()=>void)|undefined,displayToken:string|undefined,pageTimer:ReturnType<typeof setTimeout>|undefined;
 let context:{text:string;at:number}[]=[];
 let state:State={ready:false,running:false,hasKey:false,settings:defaults,status:'Connecting to Mentra',transcript:'',lastInsight:'',requests:0,silent:0,latency:0,history:[],transcriptEvents:0,lastResponse:'',connection:'Not checked'};
 const send=()=>{if(alive)session.ui.send('insightSnapshot',state);};
 const status=(v:string)=>{state.status=v;send();};
 const error=(e:unknown)=>status(e instanceof Error?e.message:'Mentra operation failed');
 function cancelPages(){displayRevision++;if(pageTimer)clearTimeout(pageTimer);pageTimer=undefined;}
 async function clear(){holdUntil=0;cancelPages();if(displayToken){const token=displayToken;displayToken=undefined;await session.display.render([],{view:'main',ifDisplayToken:token});}state.displayStatus='Cleared';send();}
 async function display(text:string){cancelPages();const serial=displayRevision,generation=epoch;const d=session.capabilities?.display;
  if(!canDisplay()){state.displayStatus='Held: another menu/app is open';status('PC replied. Select Quick Insight to show it on glasses.');return;}
  if(!d){state.displayStatus='No glasses reported';status('PC replied; no glasses display reported. See phone preview.');return;}
  const token=displayToken;displayToken=undefined;if(token)await session.display.render([],{view:'main',ifDisplayToken:token});
  let rest=text,page=0;const frameId=state.requestId||String(Date.now());
  async function pageNext(){if(!alive||serial!==displayRevision||generation!==epoch||!canDisplay())return;
   // Conservative fallback pages, then use actual host offsets when available.
   let candidate=rest.slice(0,150);if(rest.length>150){const boundary=candidate.lastIndexOf(' ');if(boundary>0)candidate=candidate.slice(0,boundary);}
   const id='insight-'+frameId+'-'+(++page);
   holdUntil=Date.now()+state.settings.duration*1000;
   const result=await session.display.render([{type:'text',id,box:{x:0,y:0,w:d!.width??640,h:d!.height??200},text:candidate,style:{maxLines:5,overflow:'clip',breakMode:'word'}}],{view:'main',durationMs:state.settings.duration*1000,includeTextLayout:true});
   if(!alive||serial!==displayRevision||generation!==epoch){if(result.displayToken)await session.display.render([],{view:'main',ifDisplayToken:result.displayToken});return;}
   if(result.status==='blocked'){holdUntil=0;state.displayStatus='Blocked: '+result.reason;status('Glasses display blocked: '+result.reason);return;}
   displayToken=result.displayToken;const layout=result.textLayout?.[id];const consumed=layout?.truncated?layout.lines.at(-1)?.end: candidate.length;
   if(!consumed){state.displayStatus='Host could not fit text';status('Glasses could not fit this text. Full answer is in phone preview.');return;}
   rest=rest.slice(consumed).trimStart();state.displayStatus='Frame accepted · page '+page+(rest?' · more follows':'');send();
   if(rest)pageTimer=setTimeout(()=>{pageTimer=undefined;void pageNext().catch(error);},state.settings.duration*1000);
   schedule();
  }
  await pageNext();
 }
 function cancel(){holdUntil=0;epoch++;revision++;pendingTest=undefined;cancelPages();if(timer)clearTimeout(timer);timer=undefined;off?.();off=undefined;dirty=false;context=[];state.running=false;}
 function schedule(){if((!pendingTest&&(!state.running||!dirty))||busy||timer||pageTimer)return;timer=setTimeout(()=>{timer=undefined;if(holdUntil>Date.now()||pageTimer){schedule();return;}const test=pendingTest;pendingTest=undefined;void request(test);},Math.max(0,holdUntil-Date.now()));}
 function endpoint(){if(!key)throw Error('Save your private PC API key first.');const address=state.settings.endpoint;if(!address)throw Error('No PC address saved. Paste the desktop HTTPS address and tap Save & check PC connection.');if(!validEndpoint(address))throw Error('Invalid PC address. Paste the complete https:// address from your desktop app.');return address;}

 // Promise timeout works even in hosts without AbortSignal.timeout.
 async function call(path:string,body?:unknown):Promise<Record<string,unknown>>{
  const base=endpoint();let timeout:ReturnType<typeof setTimeout>|undefined;
  try{return await Promise.race([(async()=>{let response:Response;try{response=await fetch(base+path,{method:body?'POST':'GET',cache:'no-store',headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},...(body?{body:JSON.stringify(body)}:{})});}catch{throw Error('Cannot reach your PC. Check the current tunnel address and keep the desktop app running.');}
   if(!response.ok){if(response.status===401)throw Error('PC rejected the API key. Copy private key from the desktop app, paste it here, then Save.');if(response.status===404)throw Error('API endpoint not found. Use the desktop API address, not the Render miniapp address.');let message='';try{const data=await response.json() as {error?:string};message=data.error||'';}catch{}throw Error('PC request failed (HTTP '+response.status+'). '+message);}
   return await response.json() as Record<string,unknown>;})(),new Promise<never>((_,reject)=>{timeout=setTimeout(()=>reject(Error('PC request timed out. Check Ollama, the desktop app and your current tunnel address.')),60000);})]);}finally{if(timeout)clearTimeout(timeout);}
 }
 async function connect(){await storageWork;const generation=epoch;state.connection='Checking…';send();try{const data=await call('/health');if(!alive||generation!==epoch)return;if(data.service!=='personal-ai')throw Error('That address does not point to the Personal AI server.');state.connection='Connected to PC · '+String(data.model||'model ready');status('PC connection and private key verified. Select Quick Insight to listen.');}catch(e){if(alive&&generation===epoch){state.connection='Failed';error(e);}}}
 async function request(test?:string){await storageWork;if(!alive)return;if(busy){if(test){pendingTest=test;schedule();}return;}if(!test&&!state.running)return;
 const now=Date.now();context=context.filter(x=>now-x.at<90000).slice(-6);const text=test||context.map(x=>x.text).join('\n');if(!text.trim())return;
 const generation=epoch,requestId=String(Date.now())+'-'+String(state.requests+1),settings={...state.settings};busy=true;dirty=false;status('Sending prompt to your PC…');
 try{
  const locality=`Local date/time: ${new Date().toString()}. Local place: ${settings.area||'not provided; ask for city when needed'}.`;
  state.requests++;state.requestId=requestId;send();const data=await call('/v1/chat',{requestId,latestText:test||context.at(-1)?.text||text,system:prompt(settings.words,settings.frequency),text:locality+'\nPrevious insights: '+state.history.slice(0,5).join(' | ')+'\nConversation (latest utterance last):\n'+text});
  if(!alive||generation!==epoch)return;
  // Speech arriving during this request is queued; finish showing this answer first.
  if(data.requestId&&data.requestId!==requestId)throw Error('PC returned a mismatched request ID. Reply ignored.');
  let raw=typeof data.text==='string'?data.text:'';state.lastResponse=raw;state.latency=Date.now()-now;state.connection='PC replied';
  if(!raw.trim())throw Error('PC returned no usable answer. Check the prompt console.');
  if(lookupQuery(raw))raw='Live web search is not connected to your PC server yet.';
  const value=insight(raw,settings.words);
  if(!value){state.silent++;status('PC returned NO_INSIGHT — intentionally no popup');return;}
  state.lastInsight=value;
  state.history=[value,...state.history].slice(0,20);status('PC insight received');await display(value);
 }catch(e){if(alive&&generation===epoch)error(e);}finally{busy=false;schedule();}
 }
 session.on('ready',()=>{storageWork=(async()=>{key=await session.storage.get('local-ai-key')||'';const stored=await session.storage.get('insight-settings');if(stored){try{state.settings=normalize(JSON.parse(stored));}catch{}}state.ready=true;state.hasKey=!!key;status(key?'Ready. Select Quick Insight to listen.':'Save your PC HTTPS address and private key.');})().catch(error);});
 session.ui.onOpen(send);session.ui.on('insightRefresh',send);
 session.ui.on('insightSave',v=>{storageWork=storageWork.then(async()=>{const resume=state.running;cancel();state.settings=normalize(v.settings);if(v.key.trim())key=v.key.trim();await session.storage.set('insight-settings',JSON.stringify(state.settings));if(key)await session.storage.set('local-ai-key',key);state.hasKey=!!key;state.connection='Not checked';status('Saved. Check PC connection, then select Quick Insight.');if(resume)start();}).catch(error);});
 session.ui.on('insightForget',()=>{storageWork=storageWork.then(async()=>{cancel();key='';state.hasKey=false;await session.storage.delete('local-ai-key');status('Private key removed. Listening stopped.');}).catch(error);});
 function start(){if(!state.ready){status('Wait for Mentra to finish loading settings.');return false;}try{endpoint();}catch(e){error(e);return false;}cancel();state.running=true;try{off=session.transcription.on(tx=>{if(!state.running||!tx.text.trim())return;state.transcriptEvents++;state.transcript=tx.text.trim();send();if(!tx.isFinal)return;const text=tx.text.trim();if(context.at(-1)?.text===text)return;revision++;context.push({text,at:Date.now()});context=context.slice(-6);dirty=true;schedule();});}catch(e){cancel();error(e);return false;}status('Listening. Speak a full sentence; leaving Quick Insight stops listening.');return true;}
 async function stop(){cancel();status('Quick Insight unselected. Listening stopped.');await clear();}
 session.ui.on('insightConnect',()=>{void connect();});
 session.ui.on('insightTest',text=>{revision++;pendingTest=text.slice(0,3000);schedule();});
 session.ui.on('insightSample',()=>{void display('Quick Insight\nThis is a display test.').catch(error);});
 session.ui.on('insightClear',()=>{void clear().then(schedule).catch(error);});
 session.permissions.onPermissionError(()=>status('Microphone permission failed. Check Mentra and iPhone microphone access.'));
 session.on('error',()=>status('Mentra host error. Restart this miniapp.'));
 session.on('disconnect',()=>{cancel();alive=false;});
 return {start,stop,isRunning:()=>state.running,whenReady:()=>storageWork};
}
