export type MediaCommand='pause'|'play'|'nexttrack'|'previoustrack'|'seekbackward'|'seekforward';
export interface AudioPort {loop:boolean;currentTime:number;paused:boolean;play():Promise<void>;pause():void;}
export interface MediaPort {setActionHandler(action:MediaCommand,handler:(()=>void)|null):void;playbackState:MediaSessionPlaybackState;}
export class HeadphoneController {
 enabled=false;private registered:MediaCommand[]=[];private generation=0;private resumePending=false;
 private audio:AudioPort;private media:MediaPort|undefined;private navigate:(command:MediaCommand)=>void;private report:(text:string)=>void;
 constructor(audio:AudioPort,media:MediaPort|undefined,navigate:(command:MediaCommand)=>void,report:(text:string)=>void){this.audio=audio;this.media=media;this.navigate=navigate;this.report=report;}
 async start(){
  if(this.enabled)return;
  if(!this.media){this.report('Media Session unavailable. Use the preview buttons.');return;}
  this.enabled=true;this.audio.loop=true;const generation=++this.generation;
  for(const action of ['pause','play','nexttrack','previoustrack','seekbackward','seekforward'] as MediaCommand[]){
   try{this.media.setActionHandler(action,()=>this.remote(action));this.registered.push(action);}catch{this.report('Unsupported media action: '+action);}
  }
  try{await this.audio.play();if(!this.enabled||generation!==this.generation){if(!this.enabled)this.audio.pause();return;}this.media.playbackState='playing';this.report('Silent loop active. Test actual headphone buttons; registered handlers are not proof of delivery.');}
  catch(e){if(generation===this.generation){this.stop();this.report('Audio start blocked: '+String(e));}}
 }
 remote(command:MediaCommand){
  if(!this.enabled)return;
  this.report('Received media command: '+command);
  // Navigate only here, never in audio play/pause events or resume callbacks.
  if(command!=='play')this.navigate(command);
  if(command==='pause')this.audio.pause();
  void this.resume();
 }
 private async resume(){
  if(this.resumePending)return;
  this.resumePending=true;const generation=this.generation;
  try{await this.audio.play();if(this.enabled&&generation===this.generation){if(this.media)this.media.playbackState='playing';this.report('Resumed silently — zero navigation events from resume.');}else if(!this.enabled)this.audio.pause();}
  catch(e){this.report('Resume failed; tap Start again: '+String(e));this.stop();}
  finally{this.resumePending=false;}
 }
 stop(){
  this.enabled=false;this.generation++;this.audio.pause();
  for(const action of this.registered){try{this.media?.setActionHandler(action,null);}catch{}}
  this.registered=[];if(this.media)this.media.playbackState='none';this.report('Headphone test stopped.');
 }
}
