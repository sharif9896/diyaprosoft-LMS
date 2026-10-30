import mongoose from 'mongoose';
export const schemaOptions={timestamps:true,versionKey:false};
export const ref=(model,required=false)=>({type:mongoose.Schema.Types.ObjectId,ref:model,required});
