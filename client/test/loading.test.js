import test from 'node:test';
import assert from 'node:assert/strict';
import {api} from '../src/api.js';
import {beginRequest,getLoadingSnapshot,registerLoadingDialog,registerLoadingVisual,subscribeLoading} from '../src/loading-state.js';

test('concurrent loading operations and dialog/visual registrations release independently',()=>{
  let notifications=0;
  const unsubscribe=subscribeLoading(()=>notifications++);
  const first=beginRequest('/admin/students'),second=beginRequest('/admin/courses');
  const visual=registerLoadingVisual(),dialog=registerLoadingDialog();
  assert.deepEqual(getLoadingSnapshot(),{requests:2,visuals:1,dialogs:1});
  first();first();assert.equal(getLoadingSnapshot().requests,1);
  visual();dialog();second();unsubscribe();
  assert.deepEqual(getLoadingSnapshot(),{requests:0,visuals:0,dialogs:0});
  assert.equal(notifications,8);
});

test('API loading remains active until the response body is read and clears on HTTP failure',async()=>{
  const originalFetch=globalThis.fetch;
  let releaseBody;
  globalThis.fetch=async()=>({ok:true,json:()=>new Promise(resolve=>{releaseBody=resolve;})});
  try {
    const pending=api('/student/dashboard');
    await Promise.resolve();
    assert.equal(getLoadingSnapshot().requests,1);
    releaseBody({exams:[]});await pending;
    assert.equal(getLoadingSnapshot().requests,0);
    globalThis.fetch=async()=>({ok:false,status:500,json:async()=>({message:'Request failed.'})});
    await assert.rejects(api('/admin/courses'),/Request failed/);
    assert.equal(getLoadingSnapshot().requests,0);
  } finally {globalThis.fetch=originalFetch;}
});

test('API requests retain session credentials, query strings and multipart uploads through the production proxy',async()=>{
  const originalFetch=globalThis.fetch,calls=[];
  globalThis.fetch=async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({ok:true})};};
  try {
    await api('/admin/students?page=2');
    const file=new FormData();file.append('file',new Blob(['code,title\nT1,Test course\n']),'courses.csv');
    await api('/admin/courses/import',{method:'POST',body:file});
    assert.equal(calls[0].url,'/api/admin/students?page=2');
    assert.equal(calls[0].options.credentials,'include');
    assert.equal(calls[1].url,'/api/admin/courses/import');
    assert.equal(calls[1].options.credentials,'include');
    assert.equal(calls[1].options.body,file);
    assert.equal(calls[1].options.headers['Content-Type'],undefined);
  } finally {globalThis.fetch=originalFetch;}
});

test('network errors release activity; quiet answer saving does not display a global loader',async()=>{
  const originalFetch=globalThis.fetch;
  globalThis.fetch=async()=>{throw new Error('Network unavailable');};
  try {
    await assert.rejects(api('/profile',{method:'PATCH',body:{name:'Student'}}),/Network unavailable/);
    assert.equal(getLoadingSnapshot().requests,0);
    const stopSave=beginRequest('/student/attempts/abc/answers','PUT');
    assert.equal(getLoadingSnapshot().requests,0);stopSave();
    const stopRead=beginRequest('/student/attempts/abc','GET');
    assert.equal(getLoadingSnapshot().requests,1);stopRead();
    assert.equal(getLoadingSnapshot().requests,0);
  } finally {globalThis.fetch=originalFetch;}
});
