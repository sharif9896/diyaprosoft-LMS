import mongoose from 'mongoose';
import {ref,schemaOptions as opts} from './schema-options.js';
const {Schema}=mongoose;
export const PlatformSettings = mongoose.model('PlatformSettings',new Schema({
  _id:{type:String,default:'global'},studentResultsVisible:{type:Boolean,default:true}
},opts));
