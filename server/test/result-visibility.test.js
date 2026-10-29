import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {createApp} from '../src/app.js';
import {connectDatabase,User,Course,Exam,Question,Attempt,PlatformSettings} from '../src/models.js';

test('admin release setting protects every student result response and persists across app instances', {timeout:240000},async()=>{
  let mongo;
  try {
    mongo=await MongoMemoryServer.create({instance:{launchTimeout:120000}});
    await connectDatabase(mongo.getUri());
    const cfg={secret:'result-visibility-test-secret-at-least-32-characters',production:false,origins:[]};
    const app=createApp(cfg),admin=request.agent(app),student=request.agent(app),other=request.agent(app);
    const password='DisposableTestPassword!123',hash=await bcrypt.hash(password,4);
    const course=await Course.create({code:'VIS101',title:'Visibility Course'});
    await User.create({name:'Admin',email:'admin@visibility.test',password:hash,role:'admin'});
    const user=await User.create({name:'Student',email:'student@visibility.test',studentId:'VIS-STUDENT',dateOfBirth:'2005-01-15',courses:[course._id]});
    await User.create({name:'Other',email:'other@visibility.test',studentId:'VIS-OTHER',dateOfBirth:'2005-01-15'});
    for(const [agent,email] of [[admin,'admin'],[student,'student'],[other,'other']])await agent.post(email==='admin'?'/api/auth/login':'/api/auth/student-login').send(email==='admin'?{email:`${email}@visibility.test`,password}:{registerNumber:`VIS-${email.toUpperCase()}`,dateOfBirth:'2005-01-15'}).expect(200);
    await request(app).get('/api/admin/settings').expect(401);
    await student.get('/api/admin/settings').expect(403);
    await student.patch('/api/admin/settings').send({studentResultsVisible:false}).expect(403);
    assert.deepEqual((await admin.get('/api/admin/settings').expect(200)).body,{studentResultsVisible:true});
    for(const body of [{},{studentResultsVisible:'false'},{studentResultsVisible:false,role:'admin'}])await admin.patch('/api/admin/settings').send(body).expect(400);
    const exam=await Exam.create({code:'VIS-EXAM',title:'Visibility Exam',course:course._id,durationMinutes:30,questionCount:1,maxAttempts:4,status:'published'});
    await Question.create({code:'Q1',exam:exam._id,course:course._id,text:'Choose A',options:{A:'Correct',B:'B',C:'C',D:'D'},correctAnswer:'A',explanation:'A is correct.'});
    const start=async()=>(await student.post(`/api/student/exams/${exam._id}/start`).expect(200)).body.attempt;
    const first=await start();
    assert.equal(first.questions[0].correctAnswer,undefined);
    assert.equal(first.questions[0].explanation,undefined);
    const answers={[first.questions[0].questionId]:'A'};
    const released=(await student.post(`/api/student/attempts/${first._id}/submit`).send({answers}).expect(200)).body.attempt;
    assert.equal(released.percentage,100);assert.equal(released.questions[0].correctAnswer,'A');assert.equal(released.questions[0].explanation,'A is correct.');
    await admin.patch('/api/admin/settings').send({studentResultsVisible:false}).expect(200);
    assert.equal((await PlatformSettings.findById('global')).studentResultsVisible,false);
    const assertReceipt=value=>{
      assert.equal(value.status,'submitted');assert.equal(value.resultsVisible,false);assert.ok(value.submittedAt);assert.ok(value.examTitle);
      for(const key of ['score','percentage','passed','maxScore','correctCount','questions','answers','answerRevision','passPercentage','marksPerQuestion'])assert.equal(key in value,false,`Hidden response leaked ${key}`);
    };
    assertReceipt((await student.get(`/api/student/attempts/${first._id}?resultsVisible=true`).expect(200)).body.attempt);
    assertReceipt((await student.post(`/api/student/attempts/${first._id}/submit`).send({answers:{},resultsVisible:true}).expect(200)).body.attempt);
    const dashboard=(await student.get('/api/student/dashboard').expect(200)).body;
    assert.equal(dashboard.resultsVisible,false);assertReceipt(dashboard.results[0]);assert.equal(dashboard.exams[0].bestScore,null);
    assert.equal((await student.get('/api/student/exams').expect(200)).body.records[0].bestScore,null);
    await other.get(`/api/student/attempts/${first._id}`).expect(404);
    // A normal new submission while hidden must also return only a receipt.
    const second=await start();assert.equal(second.questions[0].correctAnswer,undefined);
    assertReceipt((await student.post(`/api/student/attempts/${second._id}/submit`).send({answers}).expect(200)).body.attempt);
    // The deadline / late autosave response is an independent result delivery path.
    const third=await start();
    await Attempt.updateOne({_id:third._id},{$set:{deadline:new Date(Date.now()-1000),answers}});
    assertReceipt((await student.put(`/api/student/attempts/${third._id}/answers`).send({answers:{},revision:1}).expect(409)).body.attempt);
    const fourth=await start();
    await Attempt.updateOne({_id:fourth._id},{$set:{deadline:new Date(Date.now()-1000),answers}});
    assertReceipt((await student.get(`/api/student/attempts/${fourth._id}`).expect(200)).body.attempt);
    const report=(await admin.get('/api/admin/results').expect(200)).body.records;
    assert.equal(report.length,4);assert.equal(report[0].percentage,100);
    assert.match((await admin.get('/api/admin/results/export?format=csv').expect(200)).text,/percentage/);
    await admin.get('/api/admin/results/export?format=xlsx').expect(200);
    assert.equal((await Attempt.findById(first._id)).score,1);
    // Recreating Express does not reset the database-backed setting.
    const secondAdmin=request.agent(createApp(cfg));
    await secondAdmin.post('/api/auth/login').send({email:'admin@visibility.test',password}).expect(200);
    assert.equal((await secondAdmin.get('/api/admin/settings').expect(200)).body.studentResultsVisible,false);
    await secondAdmin.patch('/api/admin/settings').send({studentResultsVisible:true}).expect(200);
    const restored=(await student.get(`/api/student/attempts/${first._id}`).expect(200)).body.attempt;
    assert.equal(restored.percentage,100);assert.deepEqual(restored.answers,answers);assert.equal(restored.questions[0].correctAnswer,'A');
    const history=(await student.get('/api/student/dashboard').expect(200)).body;
    assert.equal(history.resultsVisible,true);assert.equal(history.results.length,4);assert.equal(history.results[0].percentage,100);assert.equal(history.exams[0].bestScore,100);
    assert.equal(await Attempt.countDocuments({student:user._id}),4);
  } finally {await mongoose.disconnect();if(mongo)await mongo.stop();}
});
