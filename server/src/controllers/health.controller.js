import mongoose from 'mongoose';

export function health(req,res) {
  const ready=mongoose.connection.readyState===1;
  res.status(ready?200:503).json({status:ready?'ok':'unavailable',service:'Diyaprosoft LMS'});
}

export function serverStatus(req,res) {
  res.set('Cache-Control','no-store').type('text/plain').send('Server is running');
}
