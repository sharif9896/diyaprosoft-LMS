import {Router} from 'express';
import rateLimit from 'express-rate-limit';
import {createAuthController} from '../controllers/auth.controller.js';
import {authenticate} from '../middleware/auth.middleware.js';

export function createAuthRouter(cfg) {
  const router=Router(),controller=createAuthController(cfg);
  const loginLimit=rateLimit({windowMs:15*60000,limit:30,standardHeaders:'draft-8',legacyHeaders:false,message:{message:'Too many sign-in attempts. Please try again in 15 minutes.'}});
  router.post('/login',loginLimit,controller.adminLogin);
  router.post('/student-login',loginLimit,controller.studentLogin);
  router.post('/logout',controller.logout);
  router.get('/me',authenticate(cfg),controller.currentUser);
  return router;
}
