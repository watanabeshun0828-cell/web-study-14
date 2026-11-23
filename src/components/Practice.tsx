import {useState} from 'react'
import {config,works} from '../data'
import {useStudy} from '../lib/store'
import {contrast,hslToRGB,hueAngle} from '../lib/color'
import {safePreview} from '../lib/sandbox'
import {Panel,ReferenceLinks} from './Shared'
export default function Practice(){
 const {state,update}=useStudy()
 const [selected,setSelected]=useState(works[0].id)
 const [answer,setAnswer]=useState(false)
 const work=works.find(w=>w.id===selected)!
 const record=state.workRecords[work.id]??{checks:[],note:'',settings:{}}
 const settings={...work.initial,...record.settings}
 const change=(patch:Partial<typeof record>)=>update(s=>({...s,workRecords:{...s.workRecords,[work.id]:{...record,...patch}}}))
 const setSetting=(key:string,value:number)=>change({settings:{...record.settings,[key]:value}})
 const h=settings.h??210,s=settings.s??60,l=settings.l??40,bgH=settings.bgH??0,bgS=settings.bgS??0,bgL=settings.bgL??100,accentH=settings.accentH??30,area=settings.area??10
 const ratio=contrast(hslToRGB(h,s,l),hslToRGB(bgH,bgS,bgL))
 const metrics:Record<string,number>={...settings,angle:hueAngle(h,accentH),contrast:ratio}
 return <><div className="page-intro"><p className="eyebrow">PRACTICE IN CONTEXT</p><h1>{config.kind==='color'?'色を動かして、理由を考える。':'知識を、操作につなげる。'}</h1><p>{config.practiceNotice}</p><label className="day-select">実践課題を選ぶ<select value={work.id} onChange={e=>{setSelected(e.target.value);setAnswer(false)}}>{works.map(w=><option key={w.id} value={w.id}>Day {w.day} · {w.title}</option>)}</select></label></div>
 <Panel><span className="tag">独自の練習用課題</span><h2 className="work-title">{work.title}</h2><p>{work.intro}</p><ol>{work.instructions.map(item=><li key={item}>{item}</li>)}</ol>
 {(work.starterUrl||work.answerUrl)&&<div className="backup-actions">{work.starterUrl&&<a className="button" download href={import.meta.env.BASE_URL+work.starterUrl}>開始用をダウンロード</a>}{work.answerUrl&&<a className="button secondary" download href={import.meta.env.BASE_URL+work.answerUrl}>完成例をダウンロード</a>}</div>}{work.fileLabel&&<p className="small muted">対象：{work.fileLabel}</p>}
 {work.kind==='web'&&work.starterHTML&&<><div className="preview-toggle"><button className="button secondary" aria-pressed={!answer} onClick={()=>setAnswer(false)}>開始例を見る</button><button className="button secondary" aria-pressed={answer} onClick={()=>setAnswer(true)}>完成例を見る</button></div><iframe title="静的な制作見本" sandbox="" referrerPolicy="no-referrer" className="practice-frame" srcDoc={safePreview(answer?work.answerHTML??'':work.starterHTML,work.css??'')}/><details><summary>HTMLを読む</summary><pre className="code-block"><code>{answer?work.answerHTML:work.starterHTML}</code></pre></details><p className="small muted">これは隔離した静的見本です。手元のファイルの操作履歴を取得・自動採点していません。</p></>}
 {work.kind==='color'&&<><p className="notice">独自のHSL/sRGB近似配色です。PCCSの公式色票ではありません。HSLのL・Sは知覚的な明度・彩度と同じ尺度ではありません。</p><div className="color-lab"><div className="palette-preview" style={{color:`hsl(${h} ${s}% ${l}%)`,background:`hsl(${bgH} ${bgS}% ${bgL}%)`}}><div style={{background:`hsl(${accentH} 70% 48%)`,width:area+'%',minHeight:12}}/><h3>こもれびの週末マーケット</h3><p>伝えたいことを、読みやすい配色で。</p></div><div className="color-controls">{[['h','文字のH（色相角）',360],['s','文字のS（HSLの割合）',100],['l','文字のL（HSLの割合）',100],['bgH','背景のH',360],['bgS','背景のS',100],['bgL','背景のL',100],['accentH','アクセントのH',360],['area','アクセントの面積率（%）',50]].map(([key,label,max])=><label key={key}>{label}<output>{settings[String(key)]??({h,s,l,bgH,bgS,bgL,accentH,area} as Record<string,number>)[key]}</output><input aria-label={String(label)} type="range" min="0" max={max} value={settings[String(key)]??({h,s,l,bgH,bgS,bgL,accentH,area} as Record<string,number>)[key]} onChange={e=>setSetting(String(key),Number(e.target.value))}/></label>)}</div></div><div className="palette-comparison"><div style={{background:'#162d3b'}}><span style={{background:`hsl(${h} ${s}% ${l}%)`}}/></div><div style={{background:'#eee'}}><span style={{background:`hsl(${h} ${s}% ${l}%)`}}/></div></div><p className="small">中央の色の値は同じです。周囲の色を変えて、見え方を観察します。</p><p>文字と背景のコントラスト比：{ratio.toFixed(2)}:1（Web実務補足）</p><ul className="rule-results">{work.rules?.map(rule=>{const value=metrics[rule.key];const passed=rule.op==='eq'?Math.abs(value-rule.value)<1e-6:rule.op==='gte'?value>=rule.value:value<=rule.value;return <li key={rule.label}>{passed?'条件を満たす':'条件を確認'}：{rule.label}</li>})}</ul><p className="small muted">指定された数値条件だけの確認です。好み・印象・表現意図を自動採点しません。端末や照明で色の見え方が変わります。</p></>}
 <h3 className="work-subtitle">自分で確かめる</h3><p className="small muted">PCでの実操作や、作品の意味・見た目は自己確認です。</p>{work.checks.map(check=><label className="check-label" key={check.id}><input type="checkbox" checked={record.checks.includes(check.id)} onChange={e=>change({checks:e.target.checked?[...record.checks,check.id]:record.checks.filter(id=>id!==check.id)})}/>{check.label}</label>)}<label className="note-label"><span>{work.prompt}</span><textarea rows={4} maxLength={10000} value={record.note} onChange={e=>change({note:e.target.value})}/></label><ReferenceLinks ids={work.referenceIds}/>
 </Panel></>
}
