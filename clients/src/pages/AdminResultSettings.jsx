import {useState} from 'react';
import {Eye,EyeOff,ShieldCheck} from 'lucide-react';
import {api} from '../api';
import {useToast} from '../main';
import {useData,Loading,ErrorState,Notice} from '../components';

export function AdminResultSettings() {
  const {data,loading,error}=useData('/admin/settings');
  const [saved,setSaved]=useState(null),[busy,setBusy]=useState(false),[failure,setFailure]=useState('');
  const toast=useToast();
  const visible=(saved||data)?.studentResultsVisible;
  async function toggle() {
    setBusy(true);setFailure('');
    try {
      const settings=await api('/admin/settings',{method:'PATCH',body:{studentResultsVisible:!visible}});
      setSaved(settings);
      toast(settings.studentResultsVisible?'Student scores and answer reviews are now visible.':'Student scores and answer reviews are now hidden.');
    } catch(e) {setFailure(e.message);} finally {setBusy(false);}
  }
  return <section className="panel result-policy-panel">
    <div className="panel-heading"><div><h3><ShieldCheck size={18}/>Student results visibility</h3><p>Choose when students can see their examination outcomes.</p></div></div>
    {loading?<Loading/>:error?<ErrorState error={error}/>:<div className="result-policy-body">
      {failure&&<Notice>{failure}</Notice>}
      <div className="result-policy-row"><div className={`policy-icon ${visible?'visible':''}`}>{visible?<Eye size={25}/>:<EyeOff size={25}/>}</div><div className="policy-description"><h4>{visible?'Results are visible to students':'Results are hidden from students'}</h4><p>{visible?'Students can view scores, pass or fail results, and their submitted answers with the correct answers.':'Students see a submission receipt. Scores, pass or fail results, and answer reviews are withheld.'}</p></div>
        <button type="button" className="btn primary result-policy-toggle" aria-pressed={visible} aria-label="Show student scores, results and answers" disabled={busy} onClick={toggle}><span className={`policy-switch ${visible?'on':''}`} aria-hidden="true"><i/></span>{busy?'Saving...':visible?'Turn off visibility':'Turn on visibility'}</button>
      </div><p className="field-hint">Applies to every student and all submitted exams, including past attempts, on their next page load or request. Admin reports and exports remain available. Correct answers are always hidden during an exam.</p>
    </div>}
  </section>;
}
