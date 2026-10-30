import mongoose from 'mongoose';

export function health(req,res) {
  res.json({status:mongoose.connection.readyState===1?'ok':'unavailable',service:'Diyaprosoft LMS'});
}
