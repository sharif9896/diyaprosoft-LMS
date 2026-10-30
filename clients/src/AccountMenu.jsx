import {useEffect,useId,useRef,useState} from 'react';
import {Link,useLocation} from 'react-router-dom';
import {ChevronDown,LogOut,UserRound} from 'lucide-react';
import {Avatar} from './components';

export function AccountMenu({user,role,onLogout,loggingOut}) {
  const [open,setOpen]=useState(false);
  const root=useRef(null),trigger=useRef(null),menu=useRef(null),initialFocus=useRef('first');
  const menuId=useId(),location=useLocation();
  useEffect(()=>{setOpen(false);},[location.pathname]);
  useEffect(()=>{
    if(!open)return;
    const items=menu.current?.querySelectorAll('[role="menuitem"]');
    items?.[initialFocus.current==='last'?items.length-1:0]?.focus();
    function dismiss(event) {if(!root.current?.contains(event.target))setOpen(false);}
    function escape(event) {
      if(event.key==='Escape'){event.preventDefault();setOpen(false);trigger.current?.focus();}
    }
    document.addEventListener('pointerdown',dismiss);
    document.addEventListener('keydown',escape);
    return()=>{document.removeEventListener('pointerdown',dismiss);document.removeEventListener('keydown',escape);};
  },[open]);
  function moveFocus(event) {
    const items=Array.from(menu.current.querySelectorAll('[role="menuitem"]:not(:disabled)'));
    const index=items.indexOf(document.activeElement);
    let next;
    if(event.key==='ArrowDown')next=(index+1)%items.length;
    if(event.key==='ArrowUp')next=(index-1+items.length)%items.length;
    if(event.key==='Home')next=0;
    if(event.key==='End')next=items.length-1;
    if(next!==undefined){event.preventDefault();items[next]?.focus();}
  }
  return <div className="account-menu" ref={root} onBlur={event=>{
    if(!event.currentTarget.contains(event.relatedTarget))setOpen(false);
  }}>
    <button ref={trigger} type="button" className={`account-menu-trigger ${open?'is-open':''}`} aria-label="Open account menu" aria-haspopup="menu" aria-expanded={open} aria-controls={open?menuId:undefined} onClick={()=>{
      initialFocus.current='first';setOpen(value=>!value);
    }} onKeyDown={event=>{
      if(event.key==='ArrowDown'||event.key==='ArrowUp'){
        event.preventDefault();initialFocus.current=event.key==='ArrowUp'?'last':'first';
        if(open){const items=menu.current?.querySelectorAll('[role="menuitem"]:not(:disabled)');items?.[initialFocus.current==='last'?items.length-1:0]?.focus();}
        else setOpen(true);
      }
    }}><Avatar name={user.name} size="small"/><span className="account-trigger-name">{user.name.split(' ')[0]}</span><ChevronDown size={15} className="account-chevron" aria-hidden="true"/></button>
    {open&&<div id={menuId} ref={menu} role="menu" aria-label="Your account" className="account-dropdown" onKeyDown={moveFocus}>
      <div className="account-menu-heading" role="presentation"><strong>{user.name}</strong><span>{user.email}</span></div>
      <Link role="menuitem" className="account-menu-item" to={`/${role}/profile`} onClick={()=>setOpen(false)}><UserRound size={17}/>My profile</Link>
      <div className="account-menu-divider" role="separator"/>
      <button role="menuitem" type="button" className="account-menu-item topbar-logout" onClick={onLogout} disabled={loggingOut} aria-busy={loggingOut}><LogOut size={17}/><span>{loggingOut?'Logging out...':'Log out'}</span></button>
    </div>}
  </div>;
}
