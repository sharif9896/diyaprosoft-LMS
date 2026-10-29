import {PartyBurst} from './party-burst';
import {createContext,useCallback,useContext,useRef,useState} from 'react';
import {AlertTriangle,ArrowRight,XCircle} from 'lucide-react';
import {Modal} from './components';

const FeedbackContext=createContext();
export const useFeedback=()=>useContext(FeedbackContext);

export function FeedbackProvider({children}) {
  const [queue,setQueue]=useState([]),sequence=useRef(0);
  const showFeedback=useCallback(details=>{
    const id=++sequence.current;
    setQueue(current=>[...current,{...details,id}]);
  },[]);
  const close=()=>setQueue(current=>current.slice(1));
  return <FeedbackContext.Provider value={showFeedback}>
    {children}
    {queue[0]&&<FeedbackPopup key={queue[0].id} {...queue[0]} onClose={close}/>}
  </FeedbackContext.Provider>;
}

function FeedbackPopup({title,description,eyebrow='ACTION COMPLETE',tone='success',stats=[],buttonLabel='Continue',note,celebrate=false,onClose}) {
  return <Modal title={title} eyebrow={eyebrow} className={`feedback-dialog feedback-${tone}`} showActivity={false} onClose={onClose}>
    {celebrate&&tone==='success'&&<PartyBurst/>}
    <div className="feedback-content">
      <div className="feedback-art" aria-hidden="true">
        <div className="feedback-halo"/>
        {tone==='success'&&Array.from({length:12},(_,i)=><i key={i} className="feedback-confetti" style={{'--angle':`${i*30}deg`,'--travel':`${64+i%3*13}px`,'--delay':`${160+i%4*45}ms`,'--piece-color':['#12386b','#94a3b8','#5c7fa9'][i%3]}}/>)}
        <div className="feedback-symbol">
          {tone==='success'?<svg className="feedback-check" viewBox="0 0 48 48" fill="none"><path d="m12 25 8 8 17-18" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>:tone==='warning'?<AlertTriangle size={38}/>:<XCircle size={38}/>}
        </div>
      </div>
      <p className="feedback-description">{description}</p>
      {stats.length>0&&<div className="feedback-stats" style={{'--stat-columns':Math.min(stats.length,3)}}>{stats.map(({label,value})=><div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>}
      <button type="button" className="btn primary feedback-continue" onClick={onClose} autoFocus>{buttonLabel}<ArrowRight size={17}/></button>
      {note&&<p className="feedback-note">{note}</p>}
    </div>
  </Modal>;
}
