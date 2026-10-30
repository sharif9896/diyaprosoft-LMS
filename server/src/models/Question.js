import mongoose from 'mongoose';
import {ref,schemaOptions as opts} from './schema-options.js';
const {Schema}=mongoose;
const question = new Schema({code:{type:String,required:true,uppercase:true},exam:ref('Exam',true),course:ref('Course',true),text:{type:String,required:true},options:{A:{type:String,required:true},B:{type:String,required:true},C:{type:String,required:true},D:{type:String,required:true}},correctAnswer:{type:String,enum:['A','B','C','D'],required:true},explanation:{type:String,default:''}},opts);
question.index({exam:1,code:1},{unique:true});

export const Question=mongoose.model('Question',question);
