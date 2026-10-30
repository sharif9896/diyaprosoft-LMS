import {parse,adminLoginSchema,studentLoginSchema} from '../validators/index.js';
import {signInAdmin,signInStudent} from '../services/auth.service.js';
import {publicUser,setSession,clearSession} from '../services/session.service.js';

export function createAuthController(cfg) {
  return {
    async adminLogin(req,res) {
      const user=await signInAdmin(parse(adminLoginSchema,req.body));
      setSession(res,user,cfg);res.json({user:publicUser(user)});
    },
    async studentLogin(req,res) {
      const user=await signInStudent(parse(studentLoginSchema,req.body));
      setSession(res,user,cfg);res.json({user:publicUser(user)});
    },
    logout(req,res) {
      clearSession(res,cfg);res.json({message:'Signed out.'});
    },
    currentUser(req,res) {
      res.json({user:publicUser(req.user)});
    }
  };
}
