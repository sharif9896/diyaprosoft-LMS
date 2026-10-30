import multer from 'multer';

export function errorHandler(error,req,res,next) {
  if(res.headersSent)return next(error);
  let status=error.status||500,message=error.message||'Unexpected server error.';
  if(error.code===11000){status=409;message='A record with this unique identifier already exists.';}
  if(error.name==='CastError'){status=400;message='Invalid record identifier.';}
  if(error.name==='ValidationError')status=400;
  if(error instanceof multer.MulterError){status=400;message=error.code==='LIMIT_FILE_SIZE'?'Maximum file size is 2 MB.':error.message;}
  if(status===500){console.error(error);message='An unexpected error occurred. Please try again.';}
  res.status(status).json({message,...(error.details?{details:error.details}:{})});
}
