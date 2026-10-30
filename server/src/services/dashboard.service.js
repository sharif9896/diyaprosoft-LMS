import {User,Course,Exam,Question,Attempt} from '../models/index.js';
import {expireAttempts,studentExams} from './attempts.service.js';

export async function adminDashboard() {
  await expireAttempts();
  const [students,courses,exams,questions,results,recent,courseStats]=await Promise.all([
    User.countDocuments({role:'student'}),Course.countDocuments(),Exam.countDocuments(),Question.countDocuments(),
    Attempt.find({status:'submitted'}).select('percentage passed submittedAt'),
    Attempt.find({status:'submitted'}).sort({submittedAt:-1}).limit(6).populate('student','name email studentId').select('-questions -answers'),
    Course.aggregate([{$lookup:{from:'users',localField:'_id',foreignField:'courses',as:'students'}},{$project:{title:1,code:1,count:{$size:'$students'}}},{$sort:{count:-1}},{$limit:5}])
  ]);
  const months=Array.from({length:6},(_,index)=>{
    const date=new Date();date.setUTCDate(1);date.setUTCMonth(date.getUTCMonth()-5+index);
    const key=date.toISOString().slice(0,7),items=results.filter(attempt=>attempt.submittedAt.toISOString().startsWith(key));
    return {month:date.toLocaleString('en',{month:'short',timeZone:'UTC'}),attempts:items.length,passed:items.filter(attempt=>attempt.passed).length};
  });
  return {students,courses,exams,questions,totalAttempts:results.length,
    passRate:results.length?Math.round(results.filter(attempt=>attempt.passed).length/results.length*100):0,
    averageScore:results.length?Math.round(results.reduce((sum,attempt)=>sum+attempt.percentage,0)/results.length):0,
    recent,courseStats,months};
}

export async function studentDashboard(user,resultsVisible) {
  const exams=await studentExams(user,resultsVisible);
  const [courses,results]=await Promise.all([
    Course.find({_id:{$in:user.courses}}).lean(),
    Attempt.find({student:user._id,status:'submitted'}).select('-questions -answers').sort({submittedAt:-1}).lean()
  ]);
  return {exams,courses,results};
}
