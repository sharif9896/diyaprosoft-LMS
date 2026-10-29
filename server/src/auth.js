import jwt from 'jsonwebtoken';
import { User } from './models.js';
import { AppError } from './domain.js';
export function publicUser(user) {const u=user.toObject?user.toObject():{...user};delete u.password;delete u.dateOfBirth;delete u.tokenVersion;return u;}
export function setSession(res,user,cfg) {res.cookie('lms_session',jwt.sign({sub:String(user._id),version:user.tokenVersion||0},cfg.secret,{expiresIn:'8h',algorithm:'HS256'}),{httpOnly:true,secure:cfg.production,sameSite:'lax',maxAge:8*60*60*1000,path:'/'});}
export const authenticate=cfg=>async(req,res,next)=>{
  try {
    const raw=req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith('lms_session='))?.slice(12);
    if(!raw)throw new AppError(401,'Please sign in to continue.');
    let payload;try{payload=jwt.verify(decodeURIComponent(raw),cfg.secret,{algorithms:['HS256']});}catch{throw new AppError(401,'Your session expired. Please sign in again.');}
    const user=await User.findById(payload.sub).select('+tokenVersion');
    if(!user||user.status!=='active'||user.tokenVersion!==payload.version)throw new AppError(401,'Your session is no longer active. Please sign in again.');
    req.user=user;next();
  }catch(e){next(e);}
};
export function adminOnly(req,res,next){if(req.user.role!=='admin')return next(new AppError(403,'Administrator access required.'));next();}
