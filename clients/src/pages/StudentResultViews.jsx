import {Award,ArrowUpRight,ShieldCheck,CheckCircle2,XCircle} from 'lucide-react';
import {fmtDate,fmtDateTime} from '../api';
import {Badge,Empty,Modal,Loading,ErrorState,useData} from '../components';

export function ResultsTable({results,onDetail}) {
  const visible=results.every(r=>r.resultsVisible!==false);
  return results.length?<div className="table-scroll"><table><thead><tr><th>EXAMINATION</th><th>COURSE</th>{visible?<><th>SCORE</th><th>RESULT</th></>:<th>STATUS</th>}<th>COMPLETED</th>{onDetail&&<th/>}</tr></thead><tbody>{results.map(r=><tr key={r._id}><td><strong>{r.examTitle}</strong><small>{r.examCode} · Attempt {r.attemptNumber}</small></td><td><span className="code-chip">{r.courseCode}</span></td>{visible?<><td><strong>{r.percentage}%</strong><small>{r.score} / {r.maxScore} marks</small></td><td><Badge value={r.passed?'passed':'failed'}/></td></>:<td><span className="code-chip">Submitted · Results hidden</span></td>}<td>{fmtDate(r.submittedAt)}</td>{onDetail&&<td><button className="icon-btn" aria-label={`View ${r.examTitle} ${visible?'result':'submission'}`} onClick={()=>onDetail(r)}><ArrowUpRight size={18}/></button></td>}</tr>)}</tbody></table></div>:<Empty title="Your progress starts with a first step" text="Complete an examination to see your submissions here."/>;
}
export function ResultsWithheld() {
  return <div className="results-withheld" role="status"><ShieldCheck size={23}/><div><strong>Results are currently hidden</strong><p>Your submission is saved. Your administrator controls when scores, results and answer reviews become visible.</p></div></div>;
}
export function ResultSummary({result}) {
  if(result.resultsVisible===false)return <div className="modal-body result-summary submission-receipt"><div className="result-medal green"><CheckCircle2 size={37}/></div><span className="code-chip">Submission received</span><h2>Your answers have been saved.</h2><p>{result.examTitle}</p><ResultsWithheld/><p className="field-hint">Attempt {result.attemptNumber} · Submitted {fmtDateTime(result.submittedAt)}</p></div>;
  return <div className="modal-body result-summary"><div className={`result-medal ${result.passed?'green':'orange'}`}><Award size={37}/></div><Badge value={result.passed?'passed':'failed'}/><h2>{result.passed?'A milestone achieved.':'Every attempt is progress.'}</h2><p>{result.examTitle}</p><div className="result-big">{result.percentage}<span>%</span></div><div className="result-stat-row"><div><strong>{result.score} / {result.maxScore}</strong><span>Marks earned</span></div><div><strong>{result.correctCount}</strong><span>Correct answers</span></div><div><strong>{result.passPercentage}%</strong><span>Pass requirement</span></div></div><p className="field-hint">Attempt {result.attemptNumber} · Submitted {fmtDateTime(result.submittedAt)}</p></div>;
}
export function AnswerReview({result}) {
  if(result.status!=='submitted'||result.resultsVisible===false||!result.questions?.some(q=>q.correctAnswer))return null;
  return <section className="answer-review"><h3>Review your answers</h3><p className="muted">Compare your responses with the correct answers.</p>{result.questions.map((q,i)=>{
    const answer=result.answers?.[q.questionId],correct=answer===q.correctAnswer;
    return <details className="review-question" key={q.questionId}><summary><span className={`review-status ${correct?'correct':'incorrect'}`}>{correct?<CheckCircle2 size={18}/>:<XCircle size={18}/>}</span><span><strong>Question {i+1}</strong>{q.text}</span><span className="review-outcome">{correct?'Correct':answer?'Incorrect':'Unanswered'}</span></summary><div className="review-options">{Object.entries(q.options).map(([letter,text])=><div key={letter} className={`review-option ${letter===q.correctAnswer?'correct-option':''} ${letter===answer?'student-choice':''}`}><b>{letter}</b><span>{text}</span><small>{letter===q.correctAnswer?'Correct answer':''}{letter===q.correctAnswer&&letter===answer?' · ':''}{letter===answer?'Your answer':''}</small></div>)}{!answer&&<p className="field-hint">You did not answer this question.</p>}{q.explanation&&<div className="review-explanation"><strong>Explanation</strong><p>{q.explanation}</p></div>}</div></details>;
  })}</section>;
}
export function StudentResultDialog({id,onClose}) {
  const {data,loading,error}=useData(`/student/attempts/${id}`);
  return <Modal title="Your examination submission" wide onClose={onClose}>{loading?<Loading/>:error?<ErrorState error={error}/>:<><ResultSummary result={data.attempt}/><AnswerReview result={data.attempt}/></>}<div className="modal-footer"><button className="btn primary" onClick={onClose}>Keep learning</button></div></Modal>;
}
