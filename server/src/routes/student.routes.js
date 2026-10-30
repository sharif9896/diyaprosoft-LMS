import {Router} from 'express';
import * as student from '../controllers/student.controller.js';
import {studentResultPolicy} from '../middleware/student-results.middleware.js';

export function createStudentRouter() {
  const router=Router();
  router.use(studentResultPolicy);
  router.get('/dashboard',student.dashboard);
  router.get('/exams',student.exams);
  router.post('/exams/:id/start',student.start);
  router.get('/attempts/:id',student.attempt);
  router.put('/attempts/:id/answers',student.saveAnswers);
  router.post('/attempts/:id/submit',student.submit);
  return router;
}
