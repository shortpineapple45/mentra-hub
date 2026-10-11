import type {TypedMiniappSession} from '@mentra/miniapp/background';
import type {Channels as HubChannels} from '../shared/core';
import {defaults,normalize,insight,prompt,lookupQuery,responseText,webSources,searchPrompt,type GeminiData,type Channels,type State} from './core';
export function installInsight(session:TypedMiniappSession<HubChannels>,canDisplay:()=>boolean){
 let key='',alive=true,busy=false,epoch=0,backoff=0,dirty=false;
 let timer:ReturnType<typeof setTimeout>|undefined,off:(()=>void)|undefined,displayToken:string|undefined;
 let context:{text:string;at:number}[]=[];
 let state:State={ready:false,running:false,hasKey:false,settings:defaults,status:'Connecting to Mentra',transcript:'',lastInsight:'',requests:0,silent:0,latency:0,history:[]};
 const send=()=>{if(alive)session.ui.send('insightSnapshot',state);};
 const status=(v:string)=>{state.status=v;send();};
 const error=(e:unknown)=>status(e instanceof Error?e.message:'Mentra operation failed');
 async function clear(){if(displayToken){const token=displayToken;displayToken=undefined;await session.display.render([],{view:'main',ifDisplayToken:token});}}
 async function display(text:string){if(!canDisplay()){status('Insight ready; popup held while menu or another app is open');return;}const d=session.capabilities?.display;if(!d){status('Insight generated; no glasses display reported');return;}const result=await session.display.render([{type:'text',id:'insight',box:{x:0,y:0,w:d.width??640,h:d.height??200},text,style:{maxLines:5,overflow:'ellipsis'}}],{view:'main',durationMs:state.settings.duration*1000});if(result.status==='blocked')status('Glasses display blocked: '+result.reason);else displayToken=result.displayToken;}
 function cancel(){epoch++;if(timer)clearTimeout(timer);timer=undefined;off?.();off=undefined;dirty=false;context=[];state.running=false;}
 function schedule(){if(!state.running||!dirty||busy||timer)return;const delay=Math.max(0,backoff-Date.now());timer=setTimeout(()=>{timer=undefined;void request();},delay);}
 async function ask(system:string,text:string,web=false):Promise<GeminiData>{
  state.requests++;send();const settings=state.settings;
  const body={systemInstruction:{parts:[{text:system}]},contents:[{role:'user',parts:[{text}]}],...(web?{tools:[{google_search:{}}]}:{}),generationConfig:{temperature:0.2,maxOutputTokens:web?512:256,thinkingConfig:settings.model.startsWith('gemini-2.5')?{thinkingBudget:0}:{thinkingLevel:'minimal'}}};
  let timeout:ReturnType<typeof setTimeout>|undefined;
  try{return await Promise.race([(async()=>{const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+settings.model+':generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify(body)});
   if(!response.ok){if(response.status===429){backoff=Date.now()+60000;throw new Error('Gemini quota/rate limit reached. Waiting 60 seconds; daily limits may require waiting longer.');}if(web&&(response.status===400||response.status===403))throw new Error('Google Search is unavailable for this key/model. Check AI Studio API access and billing. Regular insights still work.');if(response.status===401||response.status===403)throw new Error('Gemini rejected the key or its permissions. Check AI Studio.');if(response.status===404)throw new Error('Model unavailable for this key. Choose another model.');throw new Error('Gemini request failed (HTTP '+response.status+').');}
   return await response.json() as GeminiData;})(),new Promise<never>((_,reject)=>{timeout=setTimeout(()=>reject(new Error(web?'Web lookup timed out. Try again.':'Gemini timed out. Check your connection.')),web?30000:20000);})]);}finally{if(timeout)clearTimeout(timeout);}
 }
 async function request(test?:string){if(busy){status('A request is already in progress');return;}if(!key){status('Save your Gemini API key first');return;}if(!test&&!state.running)return;
 const now=Date.now();context=context.filter(x=>now-x.at<90000).slice(-6);const text=test||context.map(x=>x.text).join('\n');if(!text.trim())return;
 const generation=epoch,settings={...state.settings};busy=true;dirty=false;status('Checking for a useful insight…');
 try{
 const clock=new Date();const locality=`Local date/time: ${clock.toString()}. Local place for weather/nearby questions: ${settings.area||'not provided; ask for city when needed'}.`;
 let data=await ask(prompt(settings.words,settings.frequency),locality+'\nPrevious insights: '+state.history.slice(0,5).join(' | ')+'\nConversation:\n'+text);
 if(!alive||generation!==epoch)return;
 let raw=responseText(data);const query=lookupQuery(raw);
 state.sources=[];state.searchHTML='';state.lookupStatus='Regular insight';
 if(query){
  state.lookupStatus='Current information needs a web lookup';
  if(!settings.web){raw='Live lookup is off. Enable web lookup in Quick Insight settings.';state.lookupStatus='Web lookup is off';}
  else{status('Looking up current information…');data=await ask(searchPrompt(settings.words),locality+'\nQuestion to verify: '+query+'\nLatest conversation: '+text,true);
   if(!alive||generation!==epoch)return;
   state.sources=webSources(data);state.searchHTML=data.candidates?.[0]?.groundingMetadata?.searchEntryPoint?.renderedContent||'';
   raw=state.sources.length?responseText(data):'I could not verify that with current web sources.';
   state.lookupStatus=state.sources.length?'Verified with web sources':'No supporting web sources returned';
  }
 }
 state.latency=Date.now()-now;
 if(!raw.trim())throw new Error('Gemini returned no text; the response may have been blocked.');
 const value=insight(raw,settings.words);
 if(!value){state.silent++;status('No insight — no popup');return;}
 if(state.history.some(x=>x.toLowerCase()===value.toLowerCase())){status('Repeated insight ignored');return;}
 state.lastInsight=value;state.history=[value,...state.history].slice(0,20);status('Insight ready');await display(value);
 }catch(e){if(alive&&generation===epoch)error(e);}finally{busy=false;schedule();}
 }
 session.on('ready',()=>{void (async()=>{key=await session.storage.get('gemini-key')||'';const stored=await session.storage.get('insight-settings');if(stored){try{state.settings=normalize(JSON.parse(stored));}catch{}}state.ready=true;state.hasKey=!!key;status(key?'Ready — tap Start listening':'Save your Gemini API key to begin');})().catch(error);});
 session.ui.onOpen(send);session.ui.on('insightRefresh',send);
 session.ui.on('insightSave',v=>{void (async()=>{cancel();if(v.key.trim())key=v.key.trim();state.settings=normalize(v.settings);await session.storage.set('insight-settings',JSON.stringify(state.settings));if(key)await session.storage.set('gemini-key',key);state.hasKey=!!key;status('Saved on this phone. Tap Start listening.');})().catch(error);});
 session.ui.on('insightForget',()=>{cancel();key='';state.hasKey=false;void session.storage.delete('gemini-key').then(()=>status('Key removed')).catch(error);});
 function start(){if(!state.ready||!key){status('Wait for Mentra and save your key first');return false;}cancel();state.running=true;off=session.transcription.on(tx=>{if(!state.running||!tx.isFinal||!tx.text.trim())return;const text=tx.text.trim();if(context.at(-1)?.text===text)return;context.push({text,at:Date.now()});context=context.slice(-6);state.transcript=text;dirty=true;send();schedule();});status('Listening for completed thoughts');return true;}
 async function stop(){cancel();status('Paused');await clear();}
 session.ui.on('insightStart',start);
 session.ui.on('insightStop',()=>{void stop().catch(error);});
 session.ui.on('insightTest',text=>{if(state.ready)void request(text.slice(0,3000));});
 session.ui.on('insightSample',()=>{void display('Quick Insight\nThis is a display test.').catch(error);});
 session.ui.on('insightClear',()=>{void clear().catch(error);});
 session.permissions.onPermissionError(()=>status('Microphone permission failed. Check Mentra and iPhone microphone access.'));
 session.on('error',()=>status('Mentra host error. Restart this miniapp.'));
 session.on('disconnect',()=>{cancel();alive=false;});
 return {start,stop,isRunning:()=>state.running};
}
