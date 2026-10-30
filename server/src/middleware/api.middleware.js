import {AppError} from '../utils/domain.js';

export const apiRequestGuard=cfg=>(req,res,next)=>{
  res.set('Cache-Control','no-store');
  if(!['GET','HEAD','OPTIONS'].includes(req.method)&&req.get('origin')&&!cfg.origins.includes(req.get('origin'))){
    return next(new AppError(403,'Request origin is not permitted.'));
  }
  next();
};

export function apiNotFound(req,res) {
  res.status(404).json({message:'API route not found.'});
}
