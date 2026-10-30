import jwt from 'jsonwebtoken';

export function publicUser(user) {
  const result=user.toObject?user.toObject():{...user};
  delete result.password;delete result.dateOfBirth;delete result.tokenVersion;
  return result;
}

export function setSession(res,user,cfg) {
  const token=jwt.sign({sub:String(user._id),version:user.tokenVersion||0},cfg.secret,{expiresIn:'8h',algorithm:'HS256'});
  res.cookie('lms_session',token,{httpOnly:true,secure:cfg.production,sameSite:'lax',maxAge:8*60*60*1000,path:'/'});
}

export function clearSession(res,cfg) {
  res.clearCookie('lms_session',{path:'/',httpOnly:true,sameSite:'lax',secure:cfg.production});
}
