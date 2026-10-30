import { randomInt } from 'node:crypto';
export class AppError extends Error { constructor(status,message,details) { super(message); this.status=status; this.details=details; } }
export const assert = (condition,status,message) => { if(!condition) throw new AppError(status,message); };
export function grade(questions,answers,marksPerQuestion,passPercentage) {
  const correctCount = questions.filter(q=>answers[q.questionId]===q.correctAnswer).length;
  const score=correctCount*marksPerQuestion, maxScore=questions.length*marksPerQuestion;
  const rawPercentage=maxScore ? score/maxScore*100 : 0;
  return {correctCount,score,maxScore,percentage:Math.round(rawPercentage*100)/100,passed:rawPercentage>=passPercentage};
}
export function cleanAnswers(value,questions) {
  assert(value && typeof value==='object' && !Array.isArray(value),400,'Answers must be an object.');
  const allowed=new Set(questions.map(q=>q.questionId));
  const result={};
  for(const [key,val] of Object.entries(value)) {
    assert(allowed.has(key),400,'Answer contains an unknown question.');
    assert(['A','B','C','D'].includes(val),400,'Answers must be A, B, C or D.'); result[key]=val;
  }
  return result;
}
export function shuffle(items) {const result=[...items];for(let i=result.length-1;i>0;i--){const j=randomInt(i+1);[result[i],result[j]]=[result[j],result[i]];}return result;}
export function safeCell(value) {const s=String(value??'');return /^[=+\-@\t\r]/.test(s)?`'${s}`:s;}
export function canAccessExam(user,exam) { return exam.assignedStudents.some(id=>String(id)===String(user._id)) || user.courses.some(id=>String(id)===String(exam.course?._id||exam.course)); }
export function publicAttempt(attempt,{resultsVisible=true,reviewAnswers=false}={}) {
  const a=attempt.toObject?attempt.toObject():attempt;
  const {questions,...rest}=a;
  if(a.status==='submitted'&&!resultsVisible) {
    // A receipt is an allowlist: new grading fields cannot leak by accident.
    const receipt={};
    for(const key of ['_id','exam','course','attemptNumber','examTitle','examCode','courseTitle','courseCode','status','startedAt','deadline','submittedAt'])receipt[key]=a[key];
    return {...receipt,resultsVisible:false,serverTime:new Date().toISOString()};
  }
  return {...rest,resultsVisible,questions:(questions||[]).map(({questionId,text,options,correctAnswer,explanation})=>({
    questionId,text,options,...(a.status==='submitted'&&reviewAnswers?{correctAnswer,explanation}:{})
  })),serverTime:new Date().toISOString()};
}
