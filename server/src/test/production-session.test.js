import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import {MongoMemoryServer} from 'mongodb-memory-server';
import request from 'supertest';
import {createApp} from '../app.js';
import {connectDatabase} from '../config/database.js';
import {User} from '../models/index.js';

let mongo;
const origin='https://diyaprosoft-lms-exams.vercel.app',password='DisposableSessionPassword!2026';
before(async()=>{
  mongo=await MongoMemoryServer.create({instance:{launchTimeout:120000}});
  await connectDatabase(mongo.getUri());
  await User.create({name:'Production Test Admin',role:'admin',email:'production-admin@test.example',password:await bcrypt.hash(password,4)});
  await User.create({name:'Production Test Student',role:'student',email:'production-student@test.example',studentId:'000901',dateOfBirth:'2005-01-15'});
},{timeout:240000});
after(async()=>{await mongoose.disconnect();if(mongo)await mongo.stop();});

test('production sessions support both roles, secure proxy cookies, direct cross-site cookies, exports and logout',async()=>{
  for(const sameSite of ['lax','none']){
    const app=createApp({secret:'production-session-test-secret-at-least-32-characters',production:true,serveClient:false,trustProxy:1,cookieSameSite:sameSite,origins:[origin]});
    await request(app).get('/api/health').expect(200);
    for(const role of ['admin','student']){
      const login=await request(app).post(role==='admin'?'/api/auth/login':'/api/auth/student-login')
        .set('Origin',origin).set('X-Forwarded-Proto','https').set('X-Forwarded-For','203.0.113.15')
        .send(role==='admin'?{email:'production-admin@test.example',password}:{registerNumber:'000901',dateOfBirth:'2005-01-15'}).expect(200);
      assert.equal(login.headers['access-control-allow-origin'],origin);
      assert.equal(login.headers['cache-control'],'no-store');
      const issued=login.headers['set-cookie'][0];
      for(const attribute of ['HttpOnly','Secure','Path=/','SameSite='+ (sameSite==='lax'?'Lax':'None')])assert.ok(issued.includes(attribute),attribute);
      // No Domain binds the cookie to the public Vercel host when sent through /api.
      assert.doesNotMatch(issued,/Domain=/i);
      const cookie=issued.split(';')[0];
      const current=await request(app).get('/api/auth/me').set('Cookie',cookie).set('Origin',origin).expect(200);
      assert.equal(current.body.user.role,role);
      assert.equal('dateOfBirth' in current.body.user,false);
      if(role==='admin'){
        const exported=await request(app).get('/api/admin/students/export?format=csv').set('Cookie',cookie).set('Origin',origin).expect(200);
        assert.match(exported.headers['content-disposition'],/\.csv/);
        assert.match(exported.headers['access-control-expose-headers'],/Content-Disposition/i);
        assert.match(exported.text,/000901/);
      } else await request(app).get('/api/admin/students').set('Cookie',cookie).expect(403);
      const logout=await request(app).post('/api/auth/logout').set('Cookie',cookie).set('Origin',origin).expect(200);
      const cleared=logout.headers['set-cookie'][0];
      assert.match(cleared,/^lms_session=;/);
      for(const attribute of ['HttpOnly','Secure','Path=/','SameSite='+ (sameSite==='lax'?'Lax':'None')])assert.ok(cleared.includes(attribute),attribute);
      assert.match(cleared,/Expires=Thu, 01 Jan 1970/);
      await request(app).get('/api/auth/me').expect(401);
    }
  }
});
