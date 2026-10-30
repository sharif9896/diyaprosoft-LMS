import {getSettings} from '../services/settings.service.js';
import {publicAttempt} from '../utils/domain.js';

export async function studentResultPolicy(req,res,next) {
  const settings=await getSettings();
  req.resultsVisible=settings.studentResultsVisible;
  req.studentAttempt=attempt=>publicAttempt(attempt,{resultsVisible:req.resultsVisible,reviewAnswers:true});
  next();
}
