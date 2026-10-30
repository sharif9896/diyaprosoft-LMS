import jwt from 'jsonwebtoken';
import {User} from '../models/index.js';
import {AppError} from '../utils/domain.js';

export const authenticate=cfg=>async(req,res,next)=>{
  try {
    const raw=req.headers.cookie?.split(';').map(value=>value.trim()).find(value=>value.startsWith('lms_session='))?.slice(12);
    if(!raw)throw new AppError(401,'Please sign in to continue.');
    let payload;
    try {payload=jwt.verify(decodeURIComponent(raw),cfg.secret,{algorithms:['HS256']});}
    catch {throw new AppError(401,'Your session expired. Please sign in again.');}
    const user=await User.findById(payload.sub).select('+tokenVersion');
    if(!user||user.status!=='active'||user.tokenVersion!==payload.version)throw new AppError(401,'Your session is no longer active. Please sign in again.');
    req.user=user;next();
  } catch(error) {next(error);}
};

export function adminOnly(req,res,next) {
  if(req.user.role!=='admin')return next(new AppError(403,'Administrator access required.'));
  next();
}
