import {useState} from 'react';
import {ArrowRight,CalendarDays,Eye,EyeOff,GraduationCap,IdCard,LockKeyhole,Mail,ShieldCheck} from 'lucide-react';
import {api} from './api';
import {Notice} from './components';

export function LoginCredentials({onSignedIn}) {
  const [mode,setMode]=useState('student'),[form,setForm]=useState({registerNumber:'',dateOfBirth:'',email:'',password:''});
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[show,setShow]=useState(false);
  const student=mode==='student';
  const now=new Date(),today=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
  const update=(field,value)=>setForm(current=>({...current,[field]:value}));
  function switchMode(value) {setMode(value);setError('');setShow(false);setForm(current=>({...current,password:'',dateOfBirth:''}));}
  async function submit(event) {
    event.preventDefault();if(busy)return;setBusy(true);setError('');
    try {
      const body=student?{registerNumber:form.registerNumber,dateOfBirth:form.dateOfBirth}:{email:form.email,password:form.password};
      const response=await api(student?'/auth/student-login':'/auth/login',{method:'POST',body});
      onSignedIn(response.user);
    } catch(e) {setError(e.message);} finally {setBusy(false);}
  }
  return <div className="login-form">
    <div className="eyebrow">WELCOME TO YOUR WORKSPACE</div><h2>Good to see you again.</h2><p>{student?'Use your register number and date of birth to sign in.':'Sign in to manage your examination workspace.'}</p>
    <div className="signin-modes" role="group" aria-label="Sign-in type"><button type="button" className={student?'selected':''} aria-pressed={student} disabled={busy} onClick={()=>switchMode('student')}><GraduationCap size={17}/>Student</button><button type="button" className={!student?'selected':''} aria-pressed={!student} disabled={busy} onClick={()=>switchMode('admin')}><ShieldCheck size={17}/>Administrator</button></div>
    {error&&<Notice>{error}</Notice>}
    <form onSubmit={submit}>
      {student?<><label>Register number<div className="input-icon"><IdCard size={18}/><input name="registerNumber" type="text" autoComplete="username" autoCapitalize="off" spellCheck={false} required maxLength={50} placeholder="Enter your register number" value={form.registerNumber} onChange={e=>update('registerNumber',e.target.value)}/></div></label><label>Date of birth<div className="input-icon"><CalendarDays size={18}/><input name="dateOfBirth" type="date" autoComplete="off" required min="1900-01-01" max={today} value={form.dateOfBirth} onChange={e=>update('dateOfBirth',e.target.value)}/></div><span className="field-hint">Select the date recorded by your administrator.</span></label></>:<><label>Email address<div className="input-icon"><Mail size={18}/><input name="email" type="email" autoComplete="username" required placeholder="you@example.com" value={form.email} onChange={e=>update('email',e.target.value)}/></div></label><label>Password<div className="input-icon"><LockKeyhole size={18}/><input name="password" type={show?'text':'password'} autoComplete="current-password" required maxLength={128} placeholder="Enter your password" value={form.password} onChange={e=>update('password',e.target.value)}/><button className="icon-btn" type="button" aria-label={show?'Hide password':'Show password'} onClick={()=>setShow(value=>!value)}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label></>}
      <button className="btn primary login-submit" disabled={busy}>{busy?'Signing in...':'Sign in to your account'}<ArrowRight size={18}/></button>
    </form><div className="login-help"><ShieldCheck size={18}/><span>Your administrator manages your account.<br/>{student?'Contact them to correct your register number or date of birth.':'Contact them if you need access or a password reset.'}</span></div>
  </div>;
}
