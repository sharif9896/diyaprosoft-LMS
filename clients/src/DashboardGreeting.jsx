import {useEffect,useState} from 'react';
import {Hand,Pause,Play} from 'lucide-react';
import {greetingMessages} from './greeting-messages';

export function DashboardGreeting({name,prefix='Welcome back'}) {
  return <span className="dashboard-greeting">{prefix}, {name.split(' ')[0]} <span className="greeting-wave" role="img" aria-label="Waving hand"><Hand size={32} strokeWidth={2} aria-hidden="true"/><svg className="wave-trails" viewBox="0 0 16 20" fill="none" aria-hidden="true"><path d="M5 5c-3 3-3 7 0 10M1 1c-5 5-5 13 0 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg></span></span>;
}

export function MotivationTypewriter() {
  const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [paused,setPaused]=useState(false);
  const [frame,setFrame]=useState({index:0,length:0,deleting:false});
  useEffect(()=>{
    const media=matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>setReduced(media.matches);
    media.addEventListener('change',update);
    return()=>media.removeEventListener('change',update);
  },[]);
  useEffect(()=>{
    if(reduced||paused)return;
    const message=greetingMessages[frame.index];
    const complete=frame.length===message.length;
    const timer=setTimeout(()=>setFrame(current=>{
      if(current.deleting){
        return current.length>0?{...current,length:current.length-1}:{index:(current.index+1)%greetingMessages.length,length:0,deleting:false};
      }
      return current.length===greetingMessages[current.index].length?{...current,deleting:true}:{...current,length:current.length+1};
    }),frame.deleting?22:complete?(frame.index===4?3200:2200):46);
    return()=>clearTimeout(timer);
  },[frame,reduced,paused]);
  return <span className={`motivation-line ${paused?'is-paused':''} ${reduced?'is-reduced':''}`}>
    <span className="motivation-copy" aria-hidden="true"><span className="motivation-text">{reduced?greetingMessages[0]:greetingMessages[frame.index].slice(0,frame.length)}</span>{!reduced&&<span className="typing-cursor"/>}{reduced&&<span className="motivation-credit">{greetingMessages[4]}</span>}</span>
    <span className="greeting-sr-only">{greetingMessages.join(' ')}</span>
    {!reduced&&<button type="button" className="motivation-pause" aria-label={paused?'Resume motivational messages':'Pause motivational messages'} title={paused?'Resume messages':'Pause messages'} aria-pressed={paused} onClick={()=>setPaused(value=>!value)}>{paused?<Play size={12}/>:<Pause size={12}/>}</button>}
  </span>;
}
