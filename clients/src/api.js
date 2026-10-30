import {beginRequest} from './loading-state.js';
export async function api(path,options={}) {
  const finish=beginRequest(path,options.method||'GET');
  try {
    const isForm=options.body instanceof FormData;
    const response=await fetch(`/api${path}`,{credentials:'include',...options,headers:{...(!isForm&&options.body?{'Content-Type':'application/json'}:{}),...options.headers},body:options.body&&!isForm?JSON.stringify(options.body):options.body});
    const data=await response.json().catch(()=>({message:'The server returned an invalid response.'}));
    if(!response.ok){const error=new Error(data.message||'Request failed.');error.status=response.status;error.data=data;throw error;}return data;
  } finally {finish();}
}
export async function download(path,fallback='export.csv') {
  const finish=beginRequest(path);
  try {
    const response=await fetch(`/api${path}`,{credentials:'include'});if(!response.ok){const data=await response.json();throw new Error(data.message||'Download failed.');}
    const blob=await response.blob(),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=response.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1]||fallback;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  } finally {finish();}
}
export const displayTimezone=()=>sessionStorage.getItem('lms-timezone')||Intl.DateTimeFormat().resolvedOptions().timeZone;
export const fmtDate=(v,options={})=>v?new Date(v).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',timeZone:displayTimezone(),...options}):'—';
export const fmtDateTime=v=>v?new Date(v).toLocaleString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:displayTimezone()}):'—';
export const initials=(name='')=>name.split(' ').filter(Boolean).map(s=>s[0]).slice(0,2).join('').toUpperCase();
export function useLocalTime(value){if(!value)return '';const d=new Date(value);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);}
