import mongoose from 'mongoose';
import {ref,schemaOptions as opts} from './schema-options.js';
const {Schema}=mongoose;
const user = new Schema({
  name: {type:String, required:true, trim:true, maxlength:100}, email:{type:String, required:true, lowercase:true, trim:true, unique:true},
  password:{type:String, required:function(){return this.role==='admin';}, select:false}, role:{type:String, enum:['student','admin'], default:'student'},
  dateOfBirth:{type:String,select:false},
  studentId:{type:String, unique:true, sparse:true}, phone:{type:String, default:''}, department:{type:String, default:''}, bio:{type:String, default:''},
  status:{type:String, enum:['active','inactive'], default:'active'}, courses:[ref('Course')], tokenVersion:{type:Number, default:0, select:false},
  preferences:{emailNotifications:{type:Boolean,default:true},timezone:{type:String,default:'Asia/Kolkata'}}
}, opts);

export const User=mongoose.model('User',user);
