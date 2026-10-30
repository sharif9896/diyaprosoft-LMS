import {Attempt} from '../models/index.js';
import {expireAttempts} from './attempts.service.js';

export async function listResults(search='') {
  await expireAttempts();
  const records=await Attempt.find({status:'submitted'}).populate('student','name email studentId').select('-questions -answers').sort({submittedAt:-1}).lean();
  const query=String(search||'').toLowerCase();
  return query?records.filter(record=>[record.student?.name,record.student?.email,record.examTitle,record.courseCode].join(' ').toLowerCase().includes(query)):records;
}

export async function resultExportRows(search='') {
  await expireAttempts();
  const attempts=await Attempt.find({status:'submitted'}).populate('student','name email studentId').sort({submittedAt:-1});
  const query=String(search||'').toLowerCase();
  return attempts.filter(attempt=>!query||[attempt.student?.name,attempt.student?.email,attempt.examTitle,attempt.courseCode].join(' ').toLowerCase().includes(query)).map(attempt=>({
    studentId:attempt.student?.studentId,studentName:attempt.student?.name,email:attempt.student?.email,
    courseCode:attempt.courseCode,examCode:attempt.examCode,examTitle:attempt.examTitle,attemptNumber:attempt.attemptNumber,
    score:attempt.score,maxScore:attempt.maxScore,percentage:attempt.percentage,passed:attempt.passed,
    startedAt:attempt.startedAt.toISOString(),submittedAt:attempt.submittedAt.toISOString()
  }));
}
