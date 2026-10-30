import {Router} from 'express';
import * as admin from '../controllers/admin.controller.js';
import * as records from '../controllers/records.controller.js';
import {models} from '../services/records.service.js';
import {AppError} from '../utils/domain.js';
import {upload} from '../middleware/upload.middleware.js';

export function createAdminRouter() {
  const router=Router();
  router.get('/settings',admin.settings);
  router.patch('/settings',admin.updateSettings);
  router.get('/dashboard',admin.dashboard);
  router.get('/results',admin.results);
  router.get('/results/export',admin.exportResults);
  router.param('entity',(req,res,next,entity)=>{
    if(!models[entity])return next(new AppError(404,'Unknown resource.'));
    next();
  });
  router.get('/:entity/template',records.template);
  router.get('/:entity/export',records.exportRecords);
  router.post('/:entity/import',upload.single('file'),records.importSpreadsheet);
  router.get('/:entity',records.index);
  router.post('/:entity',records.create);
  router.put('/:entity/:id',records.update);
  router.delete('/:entity/:id',records.destroy);
  return router;
}
