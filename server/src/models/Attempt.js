import mongoose from 'mongoose';
import {ref,schemaOptions as opts} from './schema-options.js';
const {Schema}=mongoose;
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

export const Attempt=mongoose.model('Attempt',attempt);
