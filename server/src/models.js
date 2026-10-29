import mongoose from 'mongoose';
const { Schema } = mongoose;
const ref = (model, required = false) => ({ type: Schema.Types.ObjectId, ref: model, required });
const opts = { timestamps: true, versionKey: false };
const user = new Schema({
  name: {type:String, required:true, trim:true, maxlength:100}, email:{type:String, required:true, lowercase:true, trim:true, unique:true},
  password:{type:String, required:function(){return this.role==='admin';}, select:false}, role:{type:String, enum:['student','admin'], default:'student'},
  dateOfBirth:{type:String,select:false},
  studentId:{type:String, unique:true, sparse:true}, phone:{type:String, default:''}, department:{type:String, default:''}, bio:{type:String, default:''},
  status:{type:String, enum:['active','inactive'], default:'active'}, courses:[ref('Course')], tokenVersion:{type:Number, default:0, select:false},
  preferences:{emailNotifications:{type:Boolean,default:true},timezone:{type:String,default:'Asia/Kolkata'}}
}, opts);
const course = new Schema({code:{type:String,required:true,unique:true,uppercase:true,trim:true},title:{type:String,required:true},description:{type:String,default:''},instructor:{type:String,default:''},status:{type:String,enum:['active','archived'],default:'active'}},opts);
const exam = new Schema({
  code:{type:String,required:true,unique:true,uppercase:true}, title:{type:String,required:true},course:ref('Course',true),
  durationMinutes:{type:Number,required:true,min:1,max:240},questionCount:{type:Number,required:true,min:1,max:200},marksPerQuestion:{type:Number,default:1,min:1,max:100},
  passPercentage:{type:Number,default:50,min:0,max:100},maxAttempts:{type:Number,default:1,min:1,max:10},startsAt:{type:Date,default:null},endsAt:{type:Date,default:null},
  status:{type:String,enum:['draft','published','archived'],default:'draft'},assignedStudents:[ref('User')],shuffleQuestions:{type:Boolean,default:true}
},opts);
const question = new Schema({code:{type:String,required:true,uppercase:true},exam:ref('Exam',true),course:ref('Course',true),text:{type:String,required:true},options:{A:{type:String,required:true},B:{type:String,required:true},C:{type:String,required:true},D:{type:String,required:true}},correctAnswer:{type:String,enum:['A','B','C','D'],required:true},explanation:{type:String,default:''}},opts);
question.index({exam:1,code:1},{unique:true});
const snapshot = new Schema({questionId:{type:String,required:true},text:String,options:{A:String,B:String,C:String,D:String},correctAnswer:String,explanation:String},{_id:false});
const attempt = new Schema({
  student:ref('User',true),exam:ref('Exam',true),course:ref('Course',true),attemptNumber:{type:Number,required:true},
  examTitle:String,examCode:String,courseTitle:String,courseCode:String,
  status:{type:String,enum:['in_progress','submitted'],default:'in_progress'},questions:[snapshot],answers:{type:Schema.Types.Mixed,default:()=>({})},answerRevision:{type:Number,default:0},
  startedAt:{type:Date,default:Date.now},deadline:{type:Date,required:true},submittedAt:Date,
  marksPerQuestion:Number,passPercentage:Number,correctCount:Number,score:Number,maxScore:Number,percentage:Number,passed:Boolean
},opts);
attempt.index({student:1,exam:1,attemptNumber:1},{unique:true});
attempt.index({student:1,exam:1},{unique:true,partialFilterExpression:{status:'in_progress'}});
export const User = mongoose.model('User',user);
export const Course = mongoose.model('Course',course);
export const Exam = mongoose.model('Exam',exam);
export const Question = mongoose.model('Question',question);
export const Attempt = mongoose.model('Attempt',attempt);
export const PlatformSettings = mongoose.model('PlatformSettings',new Schema({
  _id:{type:String,default:'global'},studentResultsVisible:{type:Boolean,default:true}
},opts));
export async function connectDatabase(uri) { await mongoose.connect(uri); await Promise.all([User.init(),Course.init(),Exam.init(),Question.init(),Attempt.init(),PlatformSettings.init()]); }
