import {User,Course,Exam,Question,Attempt} from '../models/index.js';
import {assert,AppError} from '../utils/domain.js';
import {schemas,parse} from '../validators/index.js';
import {readImport} from './transfers.service.js';
export const models={students:User,courses:Course,exams:Exam,questions:Question};
export async function recordExportRows(entity) {
  const records=await models[entity].find(entity==='students'?{role:'student'}:{}).select(entity==='students'?'+dateOfBirth':'').sort({createdAt:-1});
  return Promise.all(records.map(record=>flattenRecord(entity,record)));
}
export async function listRecords(entity,search='') {
  const records=await recordExportRows(entity),query=String(search||'').toLowerCase();
  return query?records.filter(record=>Object.entries(record).filter(([key])=>!['_id','password','dateOfBirth'].includes(key)).some(([,value])=>String(value||'').toLowerCase().includes(query))):records;
}
export async function importRecords(entity,file) {
  let rows;
  try {rows=await readImport(file,entity);}
  catch(error) {throw new AppError(400,error.message||'Cannot read this file. Use a valid CSV or XLSX template.');}
  const report={total:rows.length,created:0,updated:0,failed:0,errors:[]};
  for(let index=0;index<rows.length;index++){
    try {const {action}=await saveRecord(entity,rows[index],null,{upsert:true});report[action]++;}
    catch(error) {report.failed++;report.errors.push({row:index+2,message:error.code===11000?'A unique identifier is already used by a different record.':error.message});}
  }
  return report;
}
export async function saveRecord(entity,input,id=null,{upsert=false}={}) {
  const data=parse(schemas[entity],input), Model=models[entity];
  let existing=id?await Model.findById(id).select(entity==='students'?'+tokenVersion +dateOfBirth':''):null;
  if(id)assert(existing && (entity!=='students'||existing.role==='student'),404,'Record not found.');
  let filter;
  if(entity==='students')filter={studentId:data.studentId,role:'student'};
  else if(entity==='questions'){
    const exam=await Exam.findOne({code:data.examCode});assert(exam,400,`Unknown exam: ${data.examCode}`);filter={code:data.code,exam:exam._id};
  }else filter={code:data.code};
  if(!existing && upsert)existing=await Model.findOne(filter).select(entity==='students'?'+tokenVersion +dateOfBirth':'');
  if(entity==='students') {
    assert(!existing||existing.role==='student',400,'This account belongs to an administrator.');
    const courses=await Course.find({code:{$in:data.courseCodes}});assert(courses.length===new Set(data.courseCodes).size,400,'One or more course codes do not exist.');
    delete data.courseCodes;data.courses=courses.map(c=>c._id);data.role='student';
    if(existing&&(existing.studentId!==data.studentId||existing.dateOfBirth!==data.dateOfBirth))data.tokenVersion=(existing.tokenVersion||0)+1;
  }
  if(entity==='exams') {
    const course=await Course.findOne({code:data.courseCode});assert(course,400,`Unknown course: ${data.courseCode}`);
    const students=await User.find({email:{$in:data.assignedStudentEmails},role:'student'});assert(students.length===new Set(data.assignedStudentEmails).size,400,'One or more assigned student emails do not exist.');
    if(existing && await Attempt.exists({exam:existing._id})) {
      const original=await flattenRecord('exams',existing);
      const changed=Object.keys(data).filter(key=>key!=='status' && JSON.stringify(data[key] instanceof Date?data[key].toISOString():data[key])!==JSON.stringify(original[key]));
      assert(changed.length===0,409,'This exam has attempts. Only its status can be changed; duplicate it for a new test.');
    }
    if(data.status==='published')assert(existing&&await Question.countDocuments({exam:existing._id,course:course._id})>=data.questionCount,400,'Save as draft, add enough questions, then publish the exam.');
    if(existing && String(existing.course)!==String(course._id))assert(!await Question.exists({exam:existing._id}),409,'Remove this exam’s questions before changing its course.');
    data.course=course._id;data.assignedStudents=students.map(s=>s._id);delete data.courseCode;delete data.assignedStudentEmails;
  }
  if(entity==='questions') {
    const [exam,course]=await Promise.all([Exam.findOne({code:data.examCode}),Course.findOne({code:data.courseCode})]);
    assert(exam&&course,400,'Exam or course code not found.');assert(String(exam.course)===String(course._id),400,'The question’s course must match its exam’s course.');
    const affected=existing?[exam._id,existing.exam]:[exam._id];
    assert(!await Attempt.exists({exam:{$in:affected}}),409,'Question content is locked after the first exam attempt.');
    data.exam=exam._id;data.course=course._id;data.options={A:data.optionA,B:data.optionB,C:data.optionC,D:data.optionD};
    for(const key of ['examCode','courseCode','optionA','optionB','optionC','optionD'])delete data[key];
  }
  if(existing){existing.set(data);await existing.save();return {record:existing,action:'updated'};}
  return {record:await Model.create(data),action:'created'};
}
export async function flattenRecord(entity,doc) {
  const d=doc.toObject?doc.toObject():doc;
  if(entity==='students'){const courses=await Course.find({_id:{$in:d.courses}});return {_id:d._id,studentId:d.studentId,dateOfBirth:d.dateOfBirth||'',name:d.name,email:d.email,phone:d.phone,department:d.department,status:d.status,courseCodes:courses.map(c=>c.code)};}
  if(entity==='courses')return {_id:d._id,code:d.code,title:d.title,description:d.description,instructor:d.instructor,status:d.status};
  if(entity==='exams'){const [c,users,count]=await Promise.all([Course.findById(d.course),User.find({_id:{$in:d.assignedStudents}}),Question.countDocuments({exam:d._id})]);return {_id:d._id,code:d.code,title:d.title,courseCode:c?.code||'',courseTitle:c?.title||'',durationMinutes:d.durationMinutes,questionCount:d.questionCount,availableQuestions:count,marksPerQuestion:d.marksPerQuestion,passPercentage:d.passPercentage,maxAttempts:d.maxAttempts,startsAt:d.startsAt?.toISOString()||null,endsAt:d.endsAt?.toISOString()||null,status:d.status,assignedStudentEmails:users.map(u=>u.email),shuffleQuestions:d.shuffleQuestions};}
  const [e,c]=await Promise.all([Exam.findById(d.exam),Course.findById(d.course)]);return {_id:d._id,code:d.code,examCode:e?.code,courseCode:c?.code,text:d.text,optionA:d.options.A,optionB:d.options.B,optionC:d.options.C,optionD:d.options.D,correctAnswer:d.correctAnswer,explanation:d.explanation};
}
export async function deleteRecord(entity,id) {
  const Model=models[entity],doc=await Model.findById(id);assert(doc&&(entity!=='students'||doc.role==='student'),404,'Record not found.');
  if(entity==='students')assert(!await Attempt.exists({student:id}),409,'This student has exam history. Set the account to inactive instead.');
  if(entity==='courses')assert(!await Exam.exists({course:id})&&!await User.exists({courses:id}),409,'This course is assigned to students or exams. Archive it instead.');
  if(entity==='exams'){assert(!await Attempt.exists({exam:id}),409,'This exam has attempts. Archive it instead.');await Question.deleteMany({exam:id});}
  if(entity==='questions'){
    assert(!await Attempt.exists({exam:doc.exam}),409,'Questions are locked after the first exam attempt.');
    const exam=await Exam.findById(doc.exam);if(exam?.status==='published')assert(await Question.countDocuments({exam:doc.exam})>exam.questionCount,409,'Set the exam to draft before removing a required question.');
  }
  await doc.deleteOne();
}
