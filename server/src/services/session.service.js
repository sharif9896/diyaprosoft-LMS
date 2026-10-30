import jwt from 'jsonwebtoken';

export function publicUser(user) {
  const result=user.toObject?user.toObject():{...user};
  delete result.password;delete result.dateOfBirth;delete result.tokenVersion;
  return result;
}

export function setSession(res,user,cfg) {
  const token=jwt.sign({sub:String(user._id),version:user.tokenVersion||0},cfg.secret,{expiresIn:'8h',algorithm:'HS256'});
  res.cookie('lms_session',token,{...sessionCookieOptions(cfg),maxAge:8*60*60*1000});
}

export function clearSession(res,cfg) {
  res.clearCookie('lms_session',sessionCookieOptions(cfg));
}

function sessionCookieOptions(cfg) {
  const sameSite=cfg.cookieSameSite||'lax';
  return {path:'/',httpOnly:true,sameSite,secure:cfg.production||sameSite==='none'};
}
