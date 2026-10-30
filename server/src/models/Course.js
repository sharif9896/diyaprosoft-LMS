import mongoose from 'mongoose';
import {ref,schemaOptions as opts} from './schema-options.js';
const {Schema}=mongoose;
const course = new Schema({code:{type:String,required:true,unique:true,uppercase:true,trim:true},title:{type:String,required:true},description:{type:String,default:''},instructor:{type:String,default:''},status:{type:String,enum:['active','archived'],default:'active'}},opts);

export const Course=mongoose.model('Course',course);
