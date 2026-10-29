import {useSyncExternalStore} from 'react';
import {getLoadingSnapshot,subscribeLoading} from './loading-state';

export function EmblemLoader({compact=false,label='Loading your workspace...'}) {
  return <div className={`brand-loader ${compact?'brand-loader--compact':''}`}>
    <div className="brand-loader-art" aria-hidden="true"><span className="brand-loader-halo"/><img className="brand-loader-image" src="/vmes-emblem.png" width="150" height="150" alt="" decoding="async"/></div>
    <div className="brand-loader-copy"><span className="brand-loader-label">{label}</span><span className="brand-loader-dots" aria-hidden="true"><i/><i/><i/></span></div>
  </div>;
}

export function NetworkActivity({inDialog=false}) {
  const {requests,visuals,dialogs}=useSyncExternalStore(subscribeLoading,getLoadingSnapshot,getLoadingSnapshot);
  if(!requests||(!inDialog&&(visuals||dialogs)))return null;
  return <div className={`network-activity ${inDialog?'network-activity--dialog':''}`} role="status" aria-live="polite" aria-atomic="true">
    <EmblemLoader compact label="Loading, please wait..."/>
  </div>;
}
