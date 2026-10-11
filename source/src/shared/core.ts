import type {Channels as InsightChannels} from '../insight/core';
export const apps=[{name:'Close menu',packageName:''},{name:'Quick Insight',packageName:'internal.quickinsight'},{name:'Translation',packageName:'com.mentra.translation'},{name:'Notes',packageName:'com.mentra.notes'}]; 
export type State={open:boolean;selected:number;status:string;commands:number;displayToken?:string;active?:string;notificationEvents?:number;notifyStatus?:string;notes?:string;interop?:string};
export type Command='pause'|'play'|'nexttrack'|'previoustrack'|'seekforward'|'seekbackward'|'open'|'close'|'select';
export function step(s:State,c:Command):{state:State;launch?:string}{
 const n={...s};if(c==='play')return {state:n};n.commands++;
 if(c==='close'){n.open=false;return {state:n};}
 if(c==='select'||(c==='pause'&&n.open)){n.open=false;if(!apps[n.selected].packageName){n.status='Menu closed';return {state:n};}n.status='Launch requested: '+apps[n.selected].name;return {state:n,launch:apps[n.selected].packageName};}
 n.open=true;n.status='Menu open';
 if(c==='nexttrack'||c==='seekforward')n.selected=(n.selected+1)%apps.length;
 if(c==='previoustrack'||c==='seekbackward')n.selected=(n.selected+apps.length-1)%apps.length;
 return {state:n};
}
export function deepLink(packageName:string):string{if(!/^com\.mentra\.[a-z0-9.-]+$/.test(packageName))throw Error('Invalid app package');return 'com.mentra:///applet/local?packageName='+encodeURIComponent(packageName);}
export interface Channels extends InsightChannels{selectApp:number;hudSave:import("../hud/core").Config;hudRefresh:Record<string,never>;hudSnapshot:{config:import("../hud/core").Config;data:import("../hud/core").Data;text:string};hudShow:Record<string,never>;hudClear:Record<string,never>;hudTest:Record<string,never>;hudNotifications:Record<string,never>;hudNext:Record<string,never>;hudPrevious:Record<string,never>;hudHome:Record<string,never>;command:Command;snapshot:State;settings:{language:string};notify:boolean;}
declare global{var mentra:import('@mentra/miniapp/ui').MentraTyped<Channels>;}
