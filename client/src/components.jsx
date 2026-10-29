import {useEffect,useId,useLayoutEffect,useRef,useState} from 'react';
import {X,Search,ArrowUpRight,ChevronLeft,ChevronRight,Inbox,AlertCircle,CheckCircle2} from 'lucide-react';
import {api} from './api';
import {EmblemLoader,NetworkActivity} from './loading';
import {registerLoadingVisual,registerLoadingDialog} from './loading-state';
export function useData(path,version=0){const [state,setState]=useState({data:null,loading:true,error:null});useEffect(()=>{let active=true;setState(s=>({...s,loading:true,error:null}));api(path).then(data=>active&&setState({data,loading:false,error:null})).catch(error=>active&&setState({data:null,loading:false,error}));return()=>{active=false;};},[path,version]);return state;}
export function Loading(){useLayoutEffect(()=>registerLoadingVisual(),[]);return <div className="loading" role="status" aria-live="polite"><EmblemLoader/></div>;}
export function ErrorState({error,onRetry}){return <div className="empty error-state" role="alert"><AlertCircle/><h3>We couldn’t load this page</h3><p>{error.message}</p>{onRetry?<button className="btn" onClick={onRetry}>Try again</button>:<button className="btn" onClick={()=>window.location.reload()}>Reload page</button>}</div>;}
export function Empty({title='Nothing here yet',text='New records will appear here.',action}){return <div className="empty"><div className="empty-icon"><Inbox size={26}/></div><h3>{title}</h3><p>{text}</p>{action}</div>;}
export function Badge({value,children}){const cls=['active','published','passed','submitted'].includes(value)?'green':['draft','in_progress','upcoming'].includes(value)?'amber':['inactive','archived','failed','closed'].includes(value)?'gray':'purple';return <span className={`badge ${cls}`}><i/>{children||String(value).replaceAll('_',' ')}</span>;}
export function Avatar({name,color='purple',size=''}){return <span className={`avatar ${color} ${size}`}>{(name||'?').split(' ').filter(Boolean).map(s=>s[0]).slice(0,2).join('').toUpperCase()}</span>;}
let openDialogs=0,previousBodyOverflow='';
export function Modal({title,children,onClose,wide=false,className='',eyebrow='DIYAPROSOFT WORKSPACE',showActivity=true}) {
  const ref=useRef(),titleId=useId();
  useEffect(()=>{
    const dialog=ref.current;
    dialog.showModal();
    const releaseDialog=registerLoadingDialog();
    if(openDialogs++===0)previousBodyOverflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    return()=>{
      dialog.close();
      releaseDialog();
      if(--openDialogs===0)document.body.style.overflow=previousBodyOverflow;
    };
  },[]);
  return <dialog ref={ref} className={`modal ${wide?'wide':''} ${className}`} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===ref.current)onClose();}} aria-labelledby={titleId}>
    <div className="modal-head"><div><span className="eyebrow">{eyebrow}</span><h2 id={titleId}>{title}</h2></div><button type="button" className="icon-btn" aria-label="Close dialog" onClick={onClose}><X size={20}/></button></div>
    {showActivity&&<NetworkActivity inDialog/>}
    {children}
  </dialog>;
}
export function PageHeading({eyebrow,title,description,children}){return <div className="page-heading"><div><div className="eyebrow">{eyebrow||'YOUR EXAMINATION WORKSPACE'}</div><h1>{title}</h1><p>{description}</p></div><div className="heading-actions">{children}</div></div>;}
export function SearchBox({value,onChange,placeholder='Search records…'}){return <div className="search-box"><Search size={17}/><input aria-label={placeholder} placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)}/>{value&&<button className="icon-btn tiny" aria-label="Clear search" onClick={()=>onChange('')}><X size={14}/></button>}</div>;}
export function StatCard({label,value,icon:Icon,tone='purple',note}){return <div className="stat-card"><div className="stat-top"><span>{label}</span><div className={`stat-icon ${tone}`}><Icon size={20}/></div></div><strong>{value??'—'}</strong><div className="stat-note"><span className={`dot ${tone}`}/>{note}</div></div>;}
export function Pagination({page,setPage,total,pageSize=8}){const pages=Math.max(1,Math.ceil(total/pageSize));return <div className="pagination"><span>Showing <b>{total?(page-1)*pageSize+1:0}–{Math.min(page*pageSize,total)}</b> of <b>{total}</b> records</span><div><button className="icon-btn" disabled={page<=1} aria-label="Previous page" onClick={()=>setPage(page-1)}><ChevronLeft size={17}/></button><span>{page} / {pages}</span><button className="icon-btn" disabled={page>=pages} aria-label="Next page" onClick={()=>setPage(page+1)}><ChevronRight size={17}/></button></div></div>;}
export function Notice({children,type='error'}){return <div className={`notice ${type}`} role={type==='error'?'alert':'status'}>{type==='error'?<AlertCircle size={18}/>:<CheckCircle2 size={18}/>}<div>{children}</div></div>;}
export function ActivityChart({months}){const max=Math.max(5,...months.map(m=>m.attempts));const y=n=>152-n/max*124;const pts=months.map((m,i)=>`${52+i*91},${y(m.attempts)}`).join(' ');return <div className="chart-wrap"><svg viewBox="0 0 550 196" role="img" aria-label="Monthly exam attempts and passes"><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#12386b" stopOpacity=".2"/><stop offset="1" stopColor="#12386b" stopOpacity="0"/></linearGradient></defs>{[0,1,2,3,4].map(i=><g key={i}><line x1="40" x2="525" y1={152-i*31} y2={152-i*31} stroke="#e2e8f0" strokeDasharray="4 4"/><text x="25" y={156-i*31} textAnchor="end" fill="#64748b" fontSize="10">{Math.round(max*i/4)}</text></g>)}<polygon points={`52,152 ${pts} 507,152`} fill="url(#area)"/><polyline points={pts} fill="none" stroke="#12386b" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/><polyline points={months.map((m,i)=>`${52+i*91},${y(m.passed)}`).join(' ')} fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="5 5"/>{months.map((m,i)=><g key={m.month}><circle cx={52+i*91} cy={y(m.attempts)} r="4" fill="white" stroke="#12386b" strokeWidth="2"><title>{m.month}: {m.attempts} attempts, {m.passed} passed</title></circle><text x={52+i*91} y="184" textAnchor="middle" fill="#64748b" fontSize="11">{m.month}</text></g>)}</svg></div>;}
export function TextLink({children,onClick}){return <button className="text-link" onClick={onClick}>{children}<ArrowUpRight size={15}/></button>;}
