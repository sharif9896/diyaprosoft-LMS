import {Router} from 'express';
import {health} from '../controllers/health.controller.js';
import {authenticate,adminOnly} from '../middleware/auth.middleware.js';
import {createAuthRouter} from './auth.routes.js';
import {createProfileRouter} from './profile.routes.js';
import {createAdminRouter} from './admin.routes.js';
import {createStudentRouter} from './student.routes.js';

export function createApiRouter(cfg) {
  const router=Router();
  router.get('/health',health);
  router.use('/auth',createAuthRouter(cfg));
  router.use(authenticate(cfg));
  router.use('/profile',createProfileRouter(cfg));
  router.use('/admin',adminOnly,createAdminRouter());
  router.use('/student',createStudentRouter());
  return router;
}
