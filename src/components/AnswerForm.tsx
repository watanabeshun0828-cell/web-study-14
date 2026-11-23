import type {Question} from '../lib/schema'
import type {Response} from '../lib/grading'
import type {Draft} from '../lib/study'
export default function AnswerForm({question,draft,disabled,change}:{question:Question;draft:Draft;disabled:boolean;change:(r:Response)=>void}){
 const response=draft.response
 if(question.format==='choice')return <fieldset className="choices" disabled={disabled}><legend>正しいものを1つ選んでください</legend>{(draft.choiceOrder[question.id]??question.choices.map(c=>c.id)).map((id,i)=>{
  const choice=question.choices.find(c=>c.id===id)!
  return <label key={id} className={response.choiceId===id?'selected':''}><input type="radio" name="choice" checked={response.choiceId===id} onChange={()=>change({...response,choiceId:id})}/><span className="choice-letter">{String.fromCharCode(65+i)}</span><span>{choice.text}</span></label>
 })}</fieldset>
 return <fieldset className="numeric-fields" disabled={disabled}><legend>単位・端数の指定を確認して入力してください</legend>{question.fields.map(field=><label key={field.id}>{field.label}<span><input type="text" inputMode="decimal" autoComplete="off" value={response.values[field.id]??''} onChange={e=>change({...response,values:{...response.values,[field.id]:e.target.value}})}/><span>{field.unit}</span><button type="button" className="sign-button" aria-label={field.label+'の正負を切り替える'} onClick={()=>{const v=(response.values[field.id]??'').normalize('NFKC');change({...response,values:{...response.values,[field.id]:v.startsWith('-')?v.slice(1):'-'+v}})}}>±</button></span></label>)}</fieldset>
}
