import {parse,profileSchema,passwordSchema} from '../validators/index.js';
import {changeAdminPassword} from '../services/auth.service.js';
import {publicUser,setSession} from '../services/session.service.js';
import {assert} from '../utils/domain.js';

export function createProfileController(cfg) {
  return {
    async updateProfile(req,res) {
      req.user.set(parse(profileSchema,req.body));
      await req.user.save();res.json({user:publicUser(req.user)});
    },
    async changePassword(req,res) {
      assert(req.user.role==='admin',403,'Your administrator manages student sign-in details.');
      const user=await changeAdminPassword(req.user._id,parse(passwordSchema,req.body));
      setSession(res,user,cfg);
      res.json({message:'Password updated. Other sessions have been signed out.'});
    }
  };
}
