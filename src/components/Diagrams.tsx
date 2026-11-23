import {useState} from 'react'
import {lessons} from '../data'
import {Panel,ReferenceLinks} from './Shared'
export default function Diagrams(){
 const [day,setDay]=useState(1)
 const lesson=lessons[day-1]
 return <><div className="page-intro"><p className="eyebrow">SEE THE CONNECTION</p><h1>図で、関係をつかむ。</h1><p>見方や手順を切り替え、言葉のつながりを確認します。</p><label className="day-select">図解する日<select value={day} onChange={e=>setDay(Number(e.target.value))}>{lessons.map(l=><option key={l.id} value={l.day}>Day {l.day} · {l.title}</option>)}</select></label></div>{lesson.sections.map(section=><Panel key={section.id}><h2>{section.title}</h2>{section.diagram?<figure className="concept-diagram"><figcaption>{section.diagram.title}</figcaption><div>{section.diagram.items.map((item,i)=><section key={item.label}><span className="diagram-step">{i+1}</span><strong>{item.label}</strong><p>{item.detail}</p></section>)}</div><p>{section.diagram.description}</p></figure>:<p>{section.keyPoint}</p>}<ReferenceLinks ids={section.referenceIds}/></Panel>)}</>
}
