import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import {config} from '../config/env.js';
import {createApp} from '../app.js';

const environment={
  JWT_SECRET:'disposable-deployment-test-secret-at-least-32-characters',
  NODE_ENV:'production',RENDER:'true',
  RENDER_EXTERNAL_URL:'https://diyaprosoft-lms-4.onrender.com',
  CLIENT_ORIGIN:'https://diyaprosoft-lms.vercel.app/login,https://diyaprosoft-lms.vercel.app/'
};

test('Render configuration uses the assigned port, public host, exact origins and API-only hosting',()=>{
  const cfg=config({...environment,PORT:'10000'});
  assert.equal(cfg.port,10000);
  assert.equal(cfg.host,'0.0.0.0');
  assert.equal(cfg.serveClient,false);
  assert.equal(cfg.trustProxy,1);
  assert.equal(cfg.cookieSameSite,'lax');
  assert.deepEqual(cfg.origins,['https://diyaprosoft-lms.vercel.app','https://diyaprosoft-lms-4.onrender.com']);
  const local=config({JWT_SECRET:environment.JWT_SECRET});
  assert.equal(local.serveClient,true);
  assert.equal(local.trustProxy,0);
  assert.equal(config({...environment,SERVE_CLIENT:'true',TRUST_PROXY:'2',COOKIE_SAME_SITE:'none'}).cookieSameSite,'none');
  assert.equal(config({...environment,TRUST_PROXY:'2'}).trustProxy,2);
});

test('deployment settings reject wildcard origins and ambiguous proxy/cookie configuration',()=>{
  assert.throws(()=>config({...environment,CLIENT_ORIGIN:'*'}),/CLIENT_ORIGIN/);
  assert.throws(()=>config({...environment,CLIENT_ORIGIN:'https://user:password@example.com'}),/without credentials/);
  assert.throws(()=>config({...environment,TRUST_PROXY:'true'}),/TRUST_PROXY/);
  assert.throws(()=>config({...environment,COOKIE_SAME_SITE:'anything'}),/COOKIE_SAME_SITE/);
});

test('API-only root reports liveness independently of database readiness or an existing client build',async()=>{
  const app=createApp(config(environment));
  const root=await request(app).get('/').expect(200);
  assert.equal(root.text,'Server is running');
  assert.match(root.headers['content-type'],/text\/plain/);
  assert.equal(root.headers['cache-control'],'no-store');
  const readiness=await request(app).get('/api/health').expect(503);
  assert.equal(readiness.body.status,'unavailable');
  assert.equal(readiness.headers['cache-control'],'no-store');
  assert.equal(readiness.headers['x-vercel-enable-rewrite-caching'],'0');
  await request(app).get('/login').expect(404);
});

test('production CORS permits the configured frontend and rejects mutations from other origins',async()=>{
  const app=createApp(config(environment)),origin='https://diyaprosoft-lms.vercel.app';
  const preflight=await request(app).options('/api/auth/login').set('Origin',origin)
    .set('Access-Control-Request-Method','POST').set('Access-Control-Request-Headers','content-type').expect(204);
  assert.equal(preflight.headers['access-control-allow-origin'],origin);
  assert.equal(preflight.headers['access-control-allow-credentials'],'true');
  const read=await request(app).get('/api/health').set('Origin',origin).expect(503);
  assert.match(read.headers['access-control-expose-headers'],/Content-Disposition/i);
  const denied=await request(app).post('/api/auth/logout').set('Origin','https://untrusted.example').expect(403);
  assert.equal(denied.headers['access-control-allow-origin'],undefined);
  assert.match(denied.body.message,/origin is not permitted/);
  await request(app).post('/api/auth/logout').set('Origin',origin).expect(200);
});
