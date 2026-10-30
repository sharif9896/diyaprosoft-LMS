const listeners=new Set();
let snapshot=Object.freeze({requests:0,visuals:0,dialogs:0});

function track(key) {
  const change=amount=>{
    snapshot=Object.freeze({...snapshot,[key]:snapshot[key]+amount});
    for(const listener of listeners)listener();
  };
  change(1);
  let active=true;
  return()=>{if(active){active=false;change(-1);}};
}

export const subscribeLoading=listener=>{listeners.add(listener);return()=>listeners.delete(listener);};
export const getLoadingSnapshot=()=>snapshot;
export const registerLoadingVisual=()=>track('visuals');
export const registerLoadingDialog=()=>track('dialogs');

export function beginRequest(path,method='GET') {
  // Background answer saves should not interrupt the examination every few seconds.
  if(method.toUpperCase()==='PUT'&&/^\/student\/attempts\/[^/]+\/answers(?:\?|$)/.test(path))return()=>{};
  return track('requests');
}
