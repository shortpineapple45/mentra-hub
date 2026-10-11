import {installInsight} from '../insight/background';
import {installHud} from '../hud/background';
import {registerMiniapp} from '@mentra/miniapp/background';
import {apps,step,deepLink,type State,type Channels,type Command} from '../shared/core';
registerMiniapp<Channels>(session=>{
 let state:State={open:false,selected:0,status:'Ready',commands:0,notificationEvents:0,notifyStatus:'Not checked'},ready=false,alive=true,ownsFrame=false,queue=Promise.resolve();
 const insight=installInsight(session,()=>!state.open&&(!state.active||state.active==='internal.quickinsight'));
 installHud(session,()=>state.open||Boolean(state.active)||insight.isRunning());
 let language='en',notes:string[]=[],noteIndex=0;
 const snapshot=()=>session.ui.send('snapshot',state);
 async function text(value:string){const d=session.capabilities?.display;const result=await session.display.render([{type:'text',id:'ring-shortcuts',box:{x:0,y:0,w:d?.width??640,h:d?.height??200},text:value,style:{maxLines:5,overflow:'ellipsis'}}],{view:'main'});if(result.status==='blocked')throw Error('Display blocked: '+result.reason);state.displayToken=result.displayToken;ownsFrame=true;}
 async function clear(){if(state.displayToken||ownsFrame){await session.display.render([],{view:'main',ifDisplayToken:state.displayToken});state.displayToken=undefined;ownsFrame=false;}}
 async function menu(){const start=Math.max(1,state.selected-3);const visible=[0,...Array.from({length:Math.min(4,apps.length-start)},(_,i)=>start+i)];await text(visible.map(i=>(i===state.selected?'> ':'  ')+apps[i].name).join('\n'));}
 async function stopActive(){if(state.active){if(state.active==='internal.quickinsight')await insight.stop();else await session.miniapps.stop(state.active);state.active=undefined;notes=[];state.notes=undefined;}await clear();}
 async function launch(pkg:string){if(pkg==='internal.quickinsight'){await clear();await insight.whenReady();if(insight.start()){state.active=pkg;state.status='Quick Insight listening. Pause to stop and return to menu';}else{state.open=true;state.status='Save your PC address and private key in Quick Insight settings first';await menu();}return;}const inventory=await session.miniapps.list();state.interop='Developer app controls available';const app=inventory.find(a=>a.packageName===pkg);if(!app)throw Error('Install '+apps.find(a=>a.packageName===pkg)?.name+' in Mentra first');
 await clear();await session.miniapps.start(pkg);state.active=pkg;

 const invoke=(id:string,params:Record<string,unknown>)=>{if(!app.actions?.some(a=>a.id===id))throw Error('This installed app does not expose '+id);return session.actions.invoke(pkg,id,params);};
 try{if(pkg==='com.mentra.translation')await invoke('start_translation',{targetLanguage:language});
 if(pkg==='com.mentra.notes'){const result=await invoke('get_notes',{limit:50}) as {notes?:Record<string,unknown>[]};notes=(result.notes??[]).map(n=>String(n.title??'Note')+'\n'+String(n.content??n.summary??''));noteIndex=0;state.notes=notes.length?notes[0]:'No notes returned';await text(state.notes);}
 state.status='Running '+app.name+'. Pause to stop it and return to menu';}catch(e){state.status='App started but action failed: '+String(e)+'. Pause to stop and return';}
 }
 async function handle(command:Command){if(!alive||!ready)return;if(command==='play'){snapshot();return;}
 if(state.active){if(state.active==='com.mentra.notes'&&notes.length&&['nexttrack','seekforward','previoustrack','seekbackward'].includes(command)){noteIndex=(noteIndex+(['nexttrack','seekforward'].includes(command)?1:notes.length-1))%notes.length;state.notes=notes[noteIndex];await text(state.notes);snapshot();return;}await stopActive();state.open=true;state.status='Returned to menu';state.commands++;await menu();snapshot();return;}
 if(insight.isRunning())await insight.stop();
 const result=step(state,command);state=result.state;
 if(result.launch){try{await launch(result.launch);}catch(e){state.open=true;state.status='Could not launch: '+String(e)+'. Use the developer QR, not release QR.';await menu();}}
 else if(state.open)await menu();else await clear();snapshot();}
 function enqueue(work:()=>Promise<void>){queue=queue.then(work).catch(e=>{state.status=String(e);snapshot();});return queue;}
 session.ui.on('command',command=>enqueue(()=>handle(command)));
 session.ui.on('selectApp',index=>enqueue(async()=>{if(!alive||!ready||!Number.isInteger(index)||index<0||index>=apps.length)return;await stopActive();await insight.stop();state.selected=index;state.open=false;if(index===0){state.status='Menu closed';}else{try{await launch(apps[index].packageName);}catch(e){state.open=true;state.status=String(e);await menu();}}snapshot();}));
 session.ui.on('settings',v=>{language=v.language.trim()||'en';state.status='Launch settings applied';snapshot();});
 session.on('ready',()=>{ready=true;snapshot();});session.ui.onOpen(snapshot);
 const off=session.input.onTouch(t=>{const c:Command|undefined=t.kind==='single_tap'?'nexttrack':t.kind==='double_tap'?'select':t.kind==='long_press'?'open':undefined;if(c)return enqueue(()=>handle(c));});
 session.on('error',e=>{state.status='Mentra error: '+String(e);snapshot();});session.on('disconnect',()=>{alive=false;off();});
});
