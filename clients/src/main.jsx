import {LoginCredentials} from './LoginCredentials';
import {AccountMenu} from './AccountMenu';
import React,{createContext,useContext,useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter,Routes,Route,Navigate,NavLink,Outlet,useNavigate,useLocation,Link} from 'react-router-dom';
import {GraduationCap,LayoutDashboard,Users,BookOpen,ClipboardList,ListChecks,BarChart3,Settings,LogOut,HelpCircle,CalendarDays,ChevronRight,Menu,X,ShieldCheck,ArrowRight,Mail,LockKeyhole,Eye,EyeOff,UserRound,Check,ArrowUpRight} from 'lucide-react';
import {api,fmtDate} from './api';
import {Avatar,Loading,Modal,Notice} from './components';
import {AdminDashboard,ManageRecords,AdminResults} from './pages/Admin';
import {StudentDashboard,StudentCourses,StudentExams,StudentResults,ExamRoom} from './pages/Student';
import {Profile,SettingsPage} from './pages/Profile';
import {FeedbackProvider} from './feedback';
import {NetworkActivity} from './loading';
import './styles.css';
import './feedback.css';
import './theme.css';
import './enhancements.css';
import './greetings.css';
import './student-signin.css';
const AuthContext=createContext();
export const useAuth=()=>useContext(AuthContext);
const ToastContext=createContext();
export const useToast=()=>useContext(ToastContext);
function Providers({children}){const [user,storeUser]=useState(null),[loading,setLoading]=useState(true),[toasts,setToasts]=useState([]);function setUser(value){if(value)sessionStorage.setItem('lms-timezone',value.preferences?.timezone||'Asia/Kolkata');else sessionStorage.removeItem('lms-timezone');storeUser(value);}useEffect(()=>{api('/auth/me').then(r=>setUser(r.user)).catch(()=>{}).finally(()=>setLoading(false));},[]);function toast(message,type='success'){const id=Date.now()+Math.random();setToasts(s=>[...s,{id,message,type}]);setTimeout(()=>setToasts(s=>s.filter(t=>t.id!==id)),6000);}return <AuthContext.Provider value={{user,setUser,loading}}><ToastContext.Provider value={toast}><FeedbackProvider>{children}<div className="toasts" aria-live="polite">{toasts.map(t=><div className={`toast ${t.type}`} key={t.id}>{t.type==='success'?<Check size={18}/>:<HelpCircle size={18}/>}<span>{t.message}</span><button aria-label="Dismiss notification" onClick={()=>setToasts(s=>s.filter(x=>x.id!==t.id))}><X size={16}/></button></div>)}</div><NetworkActivity/></FeedbackProvider></ToastContext.Provider></AuthContext.Provider>;}
function Brand(){return <div className="brand"><div className="brand-mark"><GraduationCap size={25}/></div><div>Diyaprosoft<span>LEARNING & EXAMINATIONS</span></div></div>;}
function Login(){const {user,setUser,loading}=useAuth();const navigate=useNavigate();if(loading)return <Loading/>;if(user)return <Navigate to={`/${user.role}`} replace/>;return <div className="login-page"><section className="login-story"><Brand/><div className="story-content"><span className="story-tag"><span/> A BETTER WAY TO LEARN</span><h1>Big ambitions.<br/>One next step.</h1><p>Your courses, examinations, and progress.<br/>A little more connected. A lot more possible.</p><div className="learning-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="art-main"><div className="art-icon"><GraduationCap size={48}/></div><span>YOUR LEARNING JOURNEY</span><h3>Ready for what’s next.</h3><div className="art-progress"><i/></div><div className="art-check"><Check size={15}/> Learn. Practice. Achieve.</div></div><div className="art-float float-one"><ShieldCheck size={22}/><div>Built for confidence<span>Secure examinations</span></div></div><div className="art-float float-two"><span className="mini-chart">▂▅▃▇▅█</span><div>Keep moving forward<span>Track every milestone</span></div></div></div></div><div className="story-footer">A smarter space for every student.<span>© {new Date().getFullYear()} Diyaprosoft</span></div></section><section className="login-form-side"><div className="login-small-brand"><Brand/></div><LoginCredentials onSignedIn={nextUser=>{setUser(nextUser);navigate(`/${nextUser.role}`,{replace:true});}}/><div className="login-bottom">One platform. Every possibility.</div></section></div>;}
const adminNav=[['','Overview',LayoutDashboard],['students','Students',Users],['courses','Courses',BookOpen],['exams','Examinations',ClipboardList],['questions','Question bank',ListChecks],['results','Results & reports',BarChart3]];
const studentNav=[['','Overview',LayoutDashboard],['courses','My courses',BookOpen],['exams','My examinations',ClipboardList],['results','My results',BarChart3],['profile','My profile',UserRound]];
function Help({onClose,admin}){return <Modal title="A little help to get you started" onClose={onClose}><div className="modal-body guide"><p>{admin?'Manage the full examination journey from your workspace.':'Everything you need for your next examination is right here.'}</p>{(admin?[['1','Add your courses','Create a course manually, or download a template and import a CSV or Excel file.'],['2','Enroll your students','Assign one or more course codes to each student. Enter each student’s register number and date of birth for sign-in.'],['3','Prepare an examination','Save a draft exam, add its questions and correct answers, then edit the exam to publish it.'],['4','Track the results','Results are scored automatically. Export all completed attempts as CSV or Excel from Results & reports.']]:[['1','Explore your courses','Your administrator assigns your courses and examinations.'],['2','Take your next test','Check the time limit and attempts available before starting. Answers save as you work.'],['3','Review your progress','Submitted examinations and your scores are available in My results.'],['4','Keep your details current','Update your profile and view your register number in Settings. Contact your administrator to correct sign-in details.']]).map(([n,t,d])=><div className="guide-step" key={n}><span>{n}</span><div><h3>{t}</h3><p>{d}</p></div></div>)}</div><div className="modal-footer"><button className="btn primary" onClick={onClose}>Got it<Check size={16}/></button></div></Modal>;}
function Shell({role}) {
  const {user,setUser,loading}=useAuth(),toast=useToast();
  const [mobile,setMobile]=useState(false),[help,setHelp]=useState(false),[loggingOut,setLoggingOut]=useState(false);
  const location=useLocation(),navigate=useNavigate();
  useEffect(()=>{setMobile(false);},[location.pathname]);
  if(loading)return <Loading/>;
  if(!user)return <Navigate to="/login" replace/>;
  if(user.role!==role)return <Navigate to={`/${user.role}`} replace/>;
  const nav=role==='admin'?adminNav:studentNav;
  const current=nav.find(([path])=>location.pathname===`/${role}${path?'/'+path:''}`)?.[1]||'Your workspace';

  async function logout() {
    if(loggingOut)return;
    setLoggingOut(true);
    try {
      await api('/auth/logout',{method:'POST'});
      setMobile(false);
      setUser(null);
      navigate('/login',{replace:true});
    } catch(e) {
      toast(e.message,'error');
    } finally {
      setLoggingOut(false);
    }
  }

  return <div className="app-layout">
    {mobile&&<div className="sidebar-shade" onClick={()=>setMobile(false)}/>}
    <aside className={`sidebar ${mobile?'open':''}`}>
      <Link to={`/${role}`} className="brand-link"><Brand/></Link>
      <div className="workspace-label">
        <span className="workspace-symbol">{role==='admin'?<ShieldCheck size={16}/>:<GraduationCap size={16}/>}</span>
        <div>{role==='admin'?'Admin workspace':'Student workspace'}<span>{role==='admin'?'Manage with confidence':'Your next chapter starts here'}</span></div>
        <ChevronRight size={15}/>
      </div>
      <div className="nav-label">WORKSPACE</div>
      <nav>{nav.map(([path,label,Icon])=><NavLink key={path} to={`/${role}${path?'/'+path:''}`} end={!path} className={({isActive})=>`nav-item ${isActive?'active':''}`}>
        <Icon size={19}/><span>{label}</span>{path==='exams'&&<span className="nav-new">{role==='admin'?'Manage':'Explore'}</span>}
      </NavLink>)}</nav>
      <div className="sidebar-bottom">
        <div className="support-card">
          <div className="support-icon"><HelpCircle size={21}/></div>
          <h4>A little guidance?</h4><p>Make the most of your workspace.</p>
          <button onClick={()=>setHelp(true)}>Explore the quick guide<ArrowUpRight size={14}/></button>
        </div>
        <NavLink className="nav-item" to={`/${role}/settings`}><Settings size={19}/>Settings</NavLink>
        <button type="button" className="nav-item logout" onClick={logout} disabled={loggingOut} aria-busy={loggingOut}>
          <LogOut size={19}/>{loggingOut?'Logging out…':'Log out'}
        </button>
        <div className="sidebar-user">
          <Avatar name={user.name}/>
          <div><strong>{user.name}</strong><span>{role==='admin'?'Administrator':user.studentId||'Student'}</span></div>
          <Link to={`/${role}/profile`} aria-label="Open your profile"><ChevronRight size={17}/></Link>
        </div>
      </div>
    </aside>
    <div className="main-shell">
      <header className="topbar">
        <div className="breadcrumb">
          <button className="icon-btn mobile-menu" aria-label="Open navigation" onClick={()=>setMobile(true)}><Menu size={21}/></button>
          <span>Workspace</span><ChevronRight size={14}/><strong>{current}</strong>
        </div>
        <div className="topbar-right">
          <span className="today"><CalendarDays size={16}/>{fmtDate(new Date())}</span><span className="topbar-divider"/>
          <button className="icon-btn" aria-label="Open help" onClick={()=>setHelp(true)}><HelpCircle size={20}/></button>
          <AccountMenu user={user} role={role} onLogout={logout} loggingOut={loggingOut}/>
        </div>
      </header>
      <main className="page-content"><Outlet/></main>
      <footer className="app-footer"><span>© {new Date().getFullYear()} Diyaprosoft. Made for better learning.</span><span><span className="status-dot"/> Examination workspace</span></footer>
    </div>
    {help&&<Help onClose={()=>setHelp(false)} admin={role==='admin'}/>}
  </div>;
}
function App(){return <BrowserRouter><Providers><Routes><Route path="/login" element={<Login/>}/><Route path="/admin" element={<Shell role="admin"/>}><Route index element={<AdminDashboard/>}/><Route path="students" element={<ManageRecords entity="students"/>}/><Route path="courses" element={<ManageRecords entity="courses"/>}/><Route path="exams" element={<ManageRecords entity="exams"/>}/><Route path="questions" element={<ManageRecords entity="questions"/>}/><Route path="results" element={<AdminResults/>}/><Route path="profile" element={<Profile/>}/><Route path="settings" element={<SettingsPage/>}/></Route><Route path="/student" element={<Shell role="student"/>}><Route index element={<StudentDashboard/>}/><Route path="courses" element={<StudentCourses/>}/><Route path="exams" element={<StudentExams/>}/><Route path="results" element={<StudentResults/>}/><Route path="profile" element={<Profile/>}/><Route path="settings" element={<SettingsPage/>}/><Route path="attempts/:id" element={<ExamRoom/>}/></Route><Route path="*" element={<Home/>}/></Routes></Providers></BrowserRouter>;}
function Home(){const {user,loading}=useAuth();return loading?<Loading/>:<Navigate to={user?`/${user.role}`:'/login'} replace/>;}
createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
