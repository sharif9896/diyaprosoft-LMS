import {studentDashboard} from '../services/dashboard.service.js';
import {studentExams,startAttempt,readStudentAttempt,saveStudentAnswers,submitStudentAttempt} from '../services/attempts.service.js';

export async function dashboard(req,res) {
  const data=await studentDashboard(req.user,req.resultsVisible);
  res.json({...data,resultsVisible:req.resultsVisible,results:data.results.map(req.studentAttempt)});
}
export async function exams(req,res) {
  res.json({resultsVisible:req.resultsVisible,records:await studentExams(req.user,req.resultsVisible)});
}
export async function start(req,res) {
  res.json({attempt:req.studentAttempt(await startAttempt(req.user,req.params.id))});
}
export async function attempt(req,res) {
  res.json({attempt:req.studentAttempt(await readStudentAttempt(req.user,req.params.id))});
}
export async function saveAnswers(req,res) {
  const result=await saveStudentAnswers(req.user,req.params.id,req.body);
  if(result.expiredAttempt)return res.status(409).json({message:'Time is up. Your saved answers were submitted.',attempt:req.studentAttempt(result.expiredAttempt)});
  res.json(result);
}
export async function submit(req,res) {
  res.json({attempt:req.studentAttempt(await submitStudentAttempt(req.user,req.params.id,req.body.answers))});
}
