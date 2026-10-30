import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Clock3,ClipboardList,Award,Play,ShieldCheck} from 'lucide-react';
import {api,fmtDateTime} from '../api';
import {Modal,Notice} from '../components';

export function ExamInstructions({exam,onClose}) {
  const navigate=useNavigate();
  const [accepted,setAccepted]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const resume=Boolean(exam.activeAttempt);
  async function start() {
    if(!accepted||busy)return;
    setBusy(true);setError('');
    try {
      const {attempt}=await api(`/student/exams/${exam._id}/start`,{method:'POST'});
      navigate(`/student/attempts/${attempt._id}`);
    } catch(e) {setError(e.message);} finally {setBusy(false);}
  }
  return <Modal title="Examination instructions" eyebrow={resume?'CONTINUE YOUR EXAM':'BEFORE YOU BEGIN'} onClose={()=>!busy&&onClose()} className="instructions-dialog">
    <div className="modal-body">{error&&<Notice>{error}</Notice>}<div className="instructions-title"><ShieldCheck size={24}/><div><h3>{exam.title}</h3><p className="muted">{exam.course?.title}</p></div></div>
      <div className="start-stats"><div><Clock3/><strong>{exam.durationMinutes} min</strong><span>Time limit</span></div><div><ClipboardList/><strong>{exam.questionCount}</strong><span>Questions</span></div><div><Award/><strong>{exam.passPercentage}%</strong><span>To pass</span></div></div>
      <ol className="exam-instructions"><li>Choose one option per question. Each correct answer earns {exam.marksPerQuestion} mark{exam.marksPerQuestion===1?'':'s'}. Unanswered and incorrect responses earn zero marks; there is no negative marking.</li><li>Your answers save automatically while connected. Check the save indicator, and use Save answers to retry if saving fails.</li><li>Mark questions for review and move between them before submitting.</li><li>The timer starts when you start the exam and continues if you leave. Resume before your deadline; resuming does not use another attempt.</li><li>When time runs out, your saved answers are submitted automatically. A submitted attempt cannot be changed.</li>{exam.endsAt&&<li>This exam closes at {fmtDateTime(exam.endsAt)}. That closing time takes priority over your remaining minutes.</li>}<li>{exam.resultsVisible===false?'Your administrator has hidden scores and answer reviews. You will receive a submission receipt.':'Your score and answer review will be available after submission, unless your administrator changes the visibility setting.'}</li></ol>
      <div className="info-callout">{resume?'Your existing timer is still running. Continue as soon as you are ready.':`You have ${exam.remainingAttempts} of ${exam.maxAttempts} attempts remaining. Starting creates an attempt. Check your connection and allow enough uninterrupted time.`}</div>
      <label className="instructions-ack"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)} disabled={busy}/><span>I have read the instructions and am ready to {resume?'continue':'start'}.</span></label>
    </div><div className="modal-footer"><button className="btn" onClick={onClose} disabled={busy}>Not yet</button><button className="btn primary" onClick={start} disabled={busy||!accepted}>{busy?'Preparing your exam...':resume?'Resume examination':'Start examination'}<Play size={16}/></button></div>
  </Modal>;
}
