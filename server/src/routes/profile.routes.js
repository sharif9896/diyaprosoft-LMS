import {Router} from 'express';
import {createProfileController} from '../controllers/profile.controller.js';

export function createProfileRouter(cfg) {
  const router=Router(),controller=createProfileController(cfg);
  router.patch('/',controller.updateProfile);
  router.post('/password',controller.changePassword);
  return router;
}
