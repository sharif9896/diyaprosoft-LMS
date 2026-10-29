import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import fs from 'node:fs';
import mongoose from 'mongoose';
import {z} from 'zod';
import {serverDir} from './config.js';
import {User,Course,Exam,Question,Attempt} from './models.js';
import {authenticate,adminOnly,setSession,publicUser} from './auth.js';
import {assert,AppError,cleanAnswers,publicAttempt} from './domain.js';
import {parse,profileSchema,studentLoginSchema} from './validation.js';
import {models,saveRecord,flattenRecord,deleteRecord} from './records.js';
import {exportFile,readImport,samples} from './transfers.js';
import {startAttempt,studentExams,expireAttempts,finalizeAttempt} from './attempts.js';
import {getSettings,saveSettings} from './settings.js';
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:2*1024*1024,files:1}});
export function createApp(cfg) {
  const app=express();app.disable('x-powered-by');
  app.use(helmet({contentSecurityPolicy:{directives:{defaultSrc:["'self'"],scriptSrc:["'self'"],styleSrc:["'self'","'unsafe-inline'"],imgSrc:["'self'",'data:'],connectSrc:["'self'"],fontSrc:["'self'"],objectSrc:["'none'"],upgradeInsecureRequests:cfg.production?[]:null}},crossOriginEmbedderPolicy:false}));
  app.use(cors({origin:cfg.origins,credentials:true}));app.use(express.json({limit:'100kb'}));
  app.use('/api',(req,res,next)=>{res.set('Cache-Control','no-store');if(!['GET','HEAD','OPTIONS'].includes(req.method)&&req.get('origin')&&!cfg.origins.includes(req.get('origin')))return next(new AppError(403,'Request origin is not permitted.'));next();});
  app.get('/api/health',(req,res)=>res.json({status:mongoose.connection.readyState===1?'ok':'unavailable',service:'Diyaprosoft LMS'}));
  const loginLimit=rateLimit({windowMs:15*60000,limit:30,standardHeaders:'draft-8',legacyHeaders:false,message:{message:'Too many sign-in attempts. Please try again in 15 minutes.'}});
  app.post('/api/auth/login',loginLimit,async(req,res)=>{
    const {email,password}=parse(z.object({email:z.string().email().toLowerCase(),password:z.string().min(1).max(128)}),req.body);
    const user=await User.findOne({email,role:'admin'}).select('+password +tokenVersion');
    const valid=await bcrypt.compare(password,user?.password||'$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW');
    assert(user&&valid&&user.status==='active',401,'Email or password is incorrect, or your account is inactive.');setSession(res,user,cfg);res.json({user:publicUser(user)});
  });
  app.post('/api/auth/student-login',loginLimit,async(req,res)=>{
    const {registerNumber,dateOfBirth}=parse(studentLoginSchema,req.body);
    const user=await User.findOne({studentId:registerNumber,role:'student'}).select('+dateOfBirth +tokenVersion');
    assert(user&&user.dateOfBirth===dateOfBirth&&user.status==='active',401,'Register number or date of birth is incorrect, or your account is inactive.');
    setSession(res,user,cfg);res.json({user:publicUser(user)});
  });
  app.post('/api/auth/logout',(req,res)=>{res.clearCookie('lms_session',{path:'/',httpOnly:true,sameSite:'lax',secure:cfg.production});res.json({message:'Signed out.'});});
  app.use('/api',authenticate(cfg));
  app.get('/api/auth/me',(req,res)=>res.json({user:publicUser(req.user)}));
  app.patch('/api/profile',async(req,res)=>{const data=parse(profileSchema,req.body);req.user.set(data);await req.user.save();res.json({user:publicUser(req.user)});});
  app.post('/api/profile/password',async(req,res)=>{
    assert(req.user.role==='admin',403,'Your administrator manages student sign-in details.');
    const data=parse(z.object({currentPassword:z.string().min(1).max(128),newPassword:z.string().min(12).max(128)}),req.body);const user=await User.findById(req.user._id).select('+password +tokenVersion');
    assert(await bcrypt.compare(data.currentPassword,user.password),400,'The current password is incorrect.');user.password=await bcrypt.hash(data.newPassword,12);user.tokenVersion+=1;await user.save();setSession(res,user,cfg);res.json({message:'Password updated. Other sessions have been signed out.'});
  });
  app.use('/api/admin',adminOnly);
  app.get('/api/admin/settings',async(req,res)=>res.json(await getSettings()));
  app.patch('/api/admin/settings',async(req,res)=>{
    const settings=parse(z.object({studentResultsVisible:z.boolean()}).strict(),req.body);
    res.json(await saveSettings(settings));
  });
  app.get('/api/admin/dashboard',async(req,res)=>{
    await expireAttempts();const [students,courses,exams,questions,results,recent,courseStats]=await Promise.all([
      User.countDocuments({role:'student'}),Course.countDocuments(),Exam.countDocuments(),Question.countDocuments(),Attempt.find({status:'submitted'}).select('percentage passed submittedAt'),
      Attempt.find({status:'submitted'}).sort({submittedAt:-1}).limit(6).populate('student','name email studentId').select('-questions -answers'),
      Course.aggregate([{$lookup:{from:'users',localField:'_id',foreignField:'courses',as:'students'}},{$project:{title:1,code:1,count:{$size:'$students'}}},{$sort:{count:-1}},{$limit:5}])
    ]);
    const months=Array.from({length:6},(_,i)=>{const date=new Date();date.setUTCDate(1);date.setUTCMonth(date.getUTCMonth()-5+i);const key=date.toISOString().slice(0,7);const items=results.filter(a=>a.submittedAt.toISOString().startsWith(key));return {month:date.toLocaleString('en',{month:'short',timeZone:'UTC'}),attempts:items.length,passed:items.filter(a=>a.passed).length};});
    res.json({students,courses,exams,questions,totalAttempts:results.length,passRate:results.length?Math.round(results.filter(a=>a.passed).length/results.length*100):0,averageScore:results.length?Math.round(results.reduce((sum,a)=>sum+a.percentage,0)/results.length):0,recent,courseStats,months});
  });
  app.get('/api/admin/results',async(req,res)=>{await expireAttempts();let records=await Attempt.find({status:'submitted'}).populate('student','name email studentId').select('-questions -answers').sort({submittedAt:-1}).lean();const q=String(req.query.search||'').toLowerCase();if(q)records=records.filter(r=>[r.student?.name,r.student?.email,r.examTitle,r.courseCode].join(' ').toLowerCase().includes(q));res.json({records});});
  app.get('/api/admin/results/export',async(req,res)=>{
    await expireAttempts();const attempts=await Attempt.find({status:'submitted'}).populate('student','name email studentId').sort({submittedAt:-1});const q=String(req.query.search||'').toLowerCase();
    const rows=attempts.filter(a=>!q||[a.student?.name,a.student?.email,a.examTitle,a.courseCode].join(' ').toLowerCase().includes(q)).map(a=>({studentId:a.student?.studentId,studentName:a.student?.name,email:a.student?.email,courseCode:a.courseCode,examCode:a.examCode,examTitle:a.examTitle,attemptNumber:a.attemptNumber,score:a.score,maxScore:a.maxScore,percentage:a.percentage,passed:a.passed,startedAt:a.startedAt.toISOString(),submittedAt:a.submittedAt.toISOString()}));await exportFile(res,'results',rows,req.query.format||'csv');
  });
  app.param('entity',(req,res,next,entity)=>{if(!models[entity])return next(new AppError(404,'Unknown resource.'));next();});
  app.get('/api/admin/:entity/template',async(req,res)=>exportFile(res,req.params.entity,[samples[req.params.entity]],req.query.format||'csv',true));
  app.get('/api/admin/:entity/export',async(req,res)=>{const entity=req.params.entity;const docs=await models[entity].find(entity==='students'?{role:'student'}:{}).select(entity==='students'?'+dateOfBirth':'').sort({createdAt:-1});const rows=await Promise.all(docs.map(d=>flattenRecord(entity,d)));await exportFile(res,entity,rows,req.query.format||'csv');});
  app.post('/api/admin/:entity/import',upload.single('file'),async(req,res)=>{
    const entity=req.params.entity;let rows;try{rows=await readImport(req.file,entity);}catch(e){throw new AppError(400,e.message||'Cannot read this file. Use a valid CSV or XLSX template.');}const report={total:rows.length,created:0,updated:0,failed:0,errors:[]};
    for(let i=0;i<rows.length;i++){try{const {action}=await saveRecord(entity,rows[i],null,{upsert:true});report[action]++;}catch(e){report.failed++;report.errors.push({row:i+2,message:e.code===11000?'A unique identifier is already used by a different record.':e.message});}}
    res.json(report);
  });
  app.get('/api/admin/:entity',async(req,res)=>{
    const entity=req.params.entity;const docs=await models[entity].find(entity==='students'?{role:'student'}:{}).select(entity==='students'?'+dateOfBirth':'').sort({createdAt:-1});let records=await Promise.all(docs.map(d=>flattenRecord(entity,d)));const q=String(req.query.search||'').toLowerCase();if(q)records=records.filter(r=>Object.entries(r).filter(([k])=>!['_id','password','dateOfBirth'].includes(k)).some(([,v])=>String(v||'').toLowerCase().includes(q)));res.json({records});
  });
  app.post('/api/admin/:entity',async(req,res)=>{const {record}=await saveRecord(req.params.entity,req.body);res.status(201).json({record:await flattenRecord(req.params.entity,record)});});
  app.put('/api/admin/:entity/:id',async(req,res)=>{const {record}=await saveRecord(req.params.entity,req.body,req.params.id);res.json({record:await flattenRecord(req.params.entity,record)});});
  app.delete('/api/admin/:entity/:id',async(req,res)=>{await deleteRecord(req.params.entity,req.params.id);res.json({message:'Record deleted.'});});
  app.use('/api/student',async(req,res,next)=>{
    const settings=await getSettings();
    req.resultsVisible=settings.studentResultsVisible;
    req.studentAttempt=a=>publicAttempt(a,{resultsVisible:req.resultsVisible,reviewAnswers:true});
    next();
  });
  app.get('/api/student/dashboard',async(req,res)=>{
    const exams=await studentExams(req.user,req.resultsVisible);const [courses,results]=await Promise.all([Course.find({_id:{$in:req.user.courses}}).lean(),Attempt.find({student:req.user._id,status:'submitted'}).select('-questions -answers').sort({submittedAt:-1}).lean()]);res.json({resultsVisible:req.resultsVisible,exams,courses,results:results.map(req.studentAttempt)});
  });
  app.get('/api/student/exams',async(req,res)=>res.json({resultsVisible:req.resultsVisible,records:await studentExams(req.user,req.resultsVisible)}));
  app.post('/api/student/exams/:id/start',async(req,res)=>res.json({attempt:req.studentAttempt(await startAttempt(req.user,req.params.id))}));
  app.get('/api/student/attempts/:id',async(req,res)=>{let a=await Attempt.findOne({_id:req.params.id,student:req.user._id});assert(a,404,'Attempt not found.');if(a.status==='in_progress'&&a.deadline<=new Date())a=await finalizeAttempt(a);res.json({attempt:req.studentAttempt(a)});});
  app.put('/api/student/attempts/:id/answers',async(req,res)=>{
    const a=await Attempt.findOne({_id:req.params.id,student:req.user._id});assert(a,404,'Attempt not found.');assert(a.status==='in_progress',409,'This attempt has already been submitted.');
    if(a.deadline<=new Date()){const done=await finalizeAttempt(a);return res.status(409).json({message:'Time is up. Your saved answers were submitted.',attempt:req.studentAttempt(done)});}
    const revision=parse(z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),req.body.revision);
    const answers=cleanAnswers(req.body.answers,a.questions);const updated=await Attempt.findOneAndUpdate({_id:a._id,status:'in_progress',deadline:{$gt:new Date()},answerRevision:{$lt:revision}},{$set:{answers,answerRevision:revision}},{new:true});assert(updated,409,'Newer answers were saved or this attempt has ended. Refresh to continue.');res.json({savedAt:new Date(),answered:Object.keys(answers).length,revision});
  });
  app.post('/api/student/attempts/:id/submit',async(req,res)=>{const a=await Attempt.findOne({_id:req.params.id,student:req.user._id});assert(a,404,'Attempt not found.');res.json({attempt:req.studentAttempt(await finalizeAttempt(a,req.body.answers??null))});});
  app.use('/api',(req,res)=>res.status(404).json({message:'API route not found.'}));
  const dist=path.resolve(serverDir,'../client/dist');if(fs.existsSync(dist)){app.use(express.static(dist));app.get('/{*path}',(req,res)=>res.sendFile(path.join(dist,'index.html')));}
  app.use((err,req,res,next)=>{
    if(res.headersSent)return next(err);let status=err.status||500,message=err.message||'Unexpected server error.';
    if(err.code===11000){status=409;message='A record with this unique identifier already exists.';}
    if(err.name==='CastError'){status=400;message='Invalid record identifier.';}
    if(err.name==='ValidationError'){status=400;}
    if(err instanceof multer.MulterError){status=400;message=err.code==='LIMIT_FILE_SIZE'?'Maximum file size is 2 MB.':err.message;}
    if(status===500){console.error(err);message='An unexpected error occurred. Please try again.';}
    res.status(status).json({message,...(err.details?{details:err.details}:{})});
  });
  return app;
}
