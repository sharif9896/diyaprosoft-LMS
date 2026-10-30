import mongoose from 'mongoose';
import {ref,schemaOptions as opts} from './schema-options.js';
const {Schema}=mongoose;
const exam = new Schema({
  code:{type:String,required:true,unique:true,uppercase:true}, title:{type:String,required:true},course:ref('Course',true),
  durationMinutes:{type:Number,required:true,min:1,max:240},questionCount:{type:Number,required:true,min:1,max:200},marksPerQuestion:{type:Number,default:1,min:1,max:100},
  passPercentage:{type:Number,default:50,min:0,max:100},maxAttempts:{type:Number,default:1,min:1,max:10},startsAt:{type:Date,default:null},endsAt:{type:Date,default:null},
  status:{type:String,enum:['draft','published','archived'],default:'draft'},assignedStudents:[ref('User')],shuffleQuestions:{type:Boolean,default:true}
},opts);

export const Exam=mongoose.model('Exam',exam);
