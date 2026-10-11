export type Config={clock24:boolean;fahrenheit:boolean;mode:'dashboard'|'main';showCalendar:boolean;showNotifications:boolean;popupSeconds:number;latitude:string;longitude:string;reminders:string};
export const defaults:Config={clock24:true,fahrenheit:true,mode:'dashboard',showCalendar:true,showNotifications:false,popupSeconds:8,latitude:'',longitude:'',reminders:''};
export type Event={title:string;startsAt:string;endsAt:string;allDay:boolean};
export type Notice={app:string;title:string;content:string;at:number;id?:string};
export type Weather={temperature:number;code:number;at:number};
export type Data={battery?:number;batteryAt?:number;charging?:boolean;connected?:boolean;weather?:Weather;calendar:Event[];notifications:Notice[];notificationEvents:number;unread:number;selectedNotice?:number;touchEvents:number;lastTouch?:string;lastClockTick?:number;popup?:Notice;popupUntil?:number;calendarStatus:string;weatherStatus:string;displayStatus:string;renderedText?:string;headUp?:boolean;refreshing:boolean;lastRefresh?:number;error?:string};
export const initialData=():Data=>({calendar:[],notifications:[],notificationEvents:0,unread:0,touchEvents:0,calendarStatus:'Waiting for calendar',weatherStatus:'Waiting for weather',displayStatus:'Waiting for Mentra',refreshing:false});
export function parseConfig(v:unknown):Config{
 const x=(v&&typeof v==='object'?v:{}) as Partial<Config>;
 return {...defaults,clock24:typeof x.clock24==='boolean'?x.clock24:defaults.clock24,fahrenheit:typeof x.fahrenheit==='boolean'?x.fahrenheit:defaults.fahrenheit,mode:x.mode==='main'?'main':'dashboard',showCalendar:x.showCalendar!==false,showNotifications:false,popupSeconds:Math.min(30,Math.max(3,Number(x.popupSeconds)||8)),latitude:String(x.latitude??'').slice(0,20),longitude:String(x.longitude??'').slice(0,20),reminders:String(x.reminders??'').slice(0,2000)};
}
// Preserve Unicode; the Mentra host measures and wraps native display text.
export function fit(s:string):string{return s.replace(/[\r\n\t]+/g,' ');}
export function conditions(code:number):string{
 if(code===0)return 'Clear';if(code<=3)return 'Cloudy';if(code<=48)return 'Fog';if(code<=57)return 'Drizzle';if(code<=67)return 'Rain';if(code<=77)return 'Snow';if(code<=82)return 'Showers';if(code<=86)return 'Snow showers';return 'Thunderstorm';
}
const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
export function dateLabel(d:Date):string{const n=d.getDate(),suffix=n%100>=11&&n%100<=13?'th':({1:'st',2:'nd',3:'rd'}[n%10]??'th');return `${months[d.getMonth()]} ${n}${suffix}, ${d.getFullYear()}`;}
export function time(d:Date,c:Config):string{const h=d.getHours(),m=String(d.getMinutes()).padStart(2,'0');return c.clock24?`${String(h).padStart(2,'0')}:${m}`:`${h%12||12}:${m} ${h<12?'AM':'PM'}`;}
export function batteryText(d:Data,now=Date.now()):string{return `[=] ${d.battery===undefined?'--':Math.round(d.battery)+'%'}${d.charging?'+':''}${d.batteryAt&&now-d.batteryAt>15*60000?' old':''}`;}
export function weatherText(d:Data,c:Config,now=Date.now()):string{
 if(!d.weather)return 'Weather unavailable';const t=c.fahrenheit?d.weather.temperature:d.weather.temperature*5/9-160/9;
 return `${Math.round(t)}${c.fahrenheit?'F':'C'} ${conditions(d.weather.code)}${now-d.weather.at>30*60000?' (old)':''}`;
}
export function eventText(e:Event,c:Config,now=Date.now()):string{const start=new Date(e.startsAt),end=new Date(e.endsAt),today=new Date(now);const day=start.toDateString()===today.toDateString()?'Today':`${months[start.getMonth()].slice(0,3)} ${start.getDate()}`;return `${day} ${e.allDay?'All day':time(start,c)+'-'+time(end,c)} | ${fit(e.title)}`;}
export function noticeLines(n:Notice,c:Config,index:number,total:number):string[]{return [`${time(new Date(),c)}  Notifications ${index+1}/${total}`,`${fit(n.app)} | ${time(new Date(n.at),c)}`,fit(n.title),fit(n.content)];}
// Short KJV verses fit the final HUD row; no network request is needed.
const dailyVerses=[
 '1 Th 5:16 | Rejoice evermore.',
 '1 Th 5:17 | Pray without ceasing.',
 '1 Th 5:19 | Quench not the Spirit.',
 'Jn 11:35 | Jesus wept.',
 '1 Th 5:20 | Despise not prophesyings.',
 'Ex 20:15 | Thou shalt not steal.',
 'Heb 13:1 | Let brotherly love continue.'
];
export function verseOfDay(now=Date.now()):string{
 const d=new Date(now);
 const day=Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/86400000);
 return dailyVerses[((day%dailyVerses.length)+dailyVerses.length)%dailyVerses.length];
}
export function hudLines(d:Data,c:Config,now=Date.now()):string[]{
 if(c.showNotifications&&d.selectedNotice!==undefined){const n=d.notifications[d.notifications.length-1-d.selectedNotice];if(n)return noticeLines(n,c,d.selectedNotice,d.notifications.length);}
 if(c.showNotifications&&d.popup&&now<(d.popupUntil??0))return noticeLines(d.popup,c,0,Math.max(1,d.notifications.length));
 const lines=[dateLabel(new Date(now)),`${time(new Date(now),c)}  ${weatherText(d,c,now)}  ${batteryText(d,now)}`];
 const events=c.showCalendar?d.calendar.filter(e=>Date.parse(e.endsAt)>now).slice(0,2):[];
 const reminders=c.reminders.split('\n').map(x=>x.trim()).filter(Boolean);
 const content=events.map(e=>eventText(e,c,now));for(const r of reminders)if(content.length<2)content.push(r);
 lines.push(fit(content[0]??(c.showCalendar?(d.calendarStatus==='Ready'?'No upcoming events':'Calendar unavailable'):'Personal HUD')));
 lines.push(fit(content[1]??''));
 lines.push(verseOfDay(now));
 return lines;
}

