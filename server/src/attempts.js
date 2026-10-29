import {Attempt,Exam,Question,Course} from './models.js';
import {assert,grade,cleanAnswers,shuffle,canAccessExam,publicAttempt} from './domain.js';
export async function finalizeAttempt(attempt,answers=null) {
  if(attempt.status==='submitted')return attempt;
  const now=new Date();const finalAnswers=answers&&now<=attempt.deadline?cleanAnswers(answers,attempt.questions):attempt.answers;
  const result=grade(attempt.questions,finalAnswers,attempt.marksPerQuestion,attempt.passPercentage);
  return await Attempt.findOneAndUpdate({_id:attempt._id,status:'in_progress'},{$set:{...result,answers:finalAnswers,status:'submitted',submittedAt:now>attempt.deadline?attempt.deadline:now}},{new:true}) || await Attempt.findById(attempt._id);
}
export async function expireAttempts(filter={}) {const expired=await Attempt.find({...filter,status:'in_progress',deadline:{$lte:new Date()}});for(const a of expired)await finalizeAttempt(a);}
export async function studentExams(user,resultsVisible=true) {
  await expireAttempts({student:user._id});
  const exams=await Exam.find({status:'published',$or:[{course:{$in:user.courses}},{assignedStudents:user._id}]}).populate('course').sort({createdAt:-1}).lean();
  const attempts=await Attempt.find({student:user._id}).select('-questions -answers').lean();
  return exams.map(exam=>{const mine=attempts.filter(a=>String(a.exam)===String(exam._id));const done=mine.filter(a=>a.status==='submitted');return {...exam,assignedStudents:undefined,resultsVisible,completedAttempts:done.length,remainingAttempts:Math.max(0,exam.maxAttempts-done.length),bestScore:resultsVisible&&done.length?Math.max(...done.map(a=>a.percentage)):null,activeAttempt:mine.find(a=>a.status==='in_progress')?._id||null};});
}
export async function startAttempt(user,id) {
  const exam=await Exam.findById(id);assert(exam&&exam.status==='published'&&canAccessExam(user,exam),403,'This exam is not assigned to you or is unavailable.');
  await expireAttempts({student:user._id,exam:id});
  const current=await Attempt.findOne({student:user._id,exam:id,status:'in_progress'});if(current)return publicAttempt(current);
  const now=new Date();assert(!exam.startsAt||now>=exam.startsAt,400,'This exam has not started yet.');assert(!exam.endsAt||now<exam.endsAt,400,'This exam has closed.');
  const count=await Attempt.countDocuments({student:user._id,exam:id});assert(count<exam.maxAttempts,400,'You have used all attempts for this exam.');
  let bank=await Question.find({exam:id,course:exam.course}).sort({code:1}).lean();assert(bank.length>=exam.questionCount,409,'This exam does not have enough questions. Contact your administrator.');
  if(exam.shuffleQuestions)bank=shuffle(bank);const questions=bank.slice(0,exam.questionCount).map(q=>({questionId:String(q._id),text:q.text,options:q.options,correctAnswer:q.correctAnswer,explanation:q.explanation}));
  const deadline=new Date(Math.min(now.getTime()+exam.durationMinutes*60000,exam.endsAt?.getTime()||Infinity));const course=await Course.findById(exam.course);
  try {const a=await Attempt.create({student:user._id,exam:id,course:exam.course,attemptNumber:count+1,examTitle:exam.title,examCode:exam.code,courseTitle:course.title,courseCode:course.code,questions,startedAt:now,deadline,marksPerQuestion:exam.marksPerQuestion,passPercentage:exam.passPercentage});return publicAttempt(a);}
  catch(e){if(e.code===11000){const active=await Attempt.findOne({student:user._id,exam:id,status:'in_progress'});if(active)return publicAttempt(active);throw Object.assign(new Error('An attempt was just created. Refresh and try again.'),{status:409});}throw e;}
}
