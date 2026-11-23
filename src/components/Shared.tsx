import {useEffect,useRef,type ReactNode} from 'react'
import {X,Check,ExternalLink} from 'lucide-react'
import {config,sourceMap} from '../data'
export function Panel({children,className=''}:{children:ReactNode;className?:string}){return <section className={'panel '+className}>{children}</section>}
export function Progress({value,label}:{value:number;label:string}){return <div className="progress" role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}><span style={{width:value+'%'}}/></div>}
export function Guide({children}:{children:ReactNode}){return <aside className="guide"><img src={import.meta.env.BASE_URL+config.guideCharacterUrl} alt="" width="90" height="90"/><div><span className="guide-name">副業のススメくん</span><p>{children}</p></div></aside>}
export function Dialog({title,children,close}:{title:string;children:ReactNode;close:()=>void}){
 const ref=useRef<HTMLDialogElement>(null)
 useEffect(()=>{const d=ref.current;d?.showModal();return()=>d?.close()},[])
 return <dialog ref={ref} className="dialog" aria-labelledby="dialog-title" onCancel={close} onClick={e=>{if(e.target===e.currentTarget)close()}}><div className="dialog-head"><h2 id="dialog-title">{title}</h2><button className="icon-button" aria-label="閉じる" onClick={close}><X size={20}/></button></div>{children}</dialog>
}
export function ReferenceLinks({ids}:{ids:string[]}){return <details className="references"><summary>この内容の出典・前提</summary><ul>{[...new Set(ids)].map(id=>{const s=sourceMap.get(id);return s?<li key={id}>{s.url?<a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}<ExternalLink size={12}/></a>:<strong>{s.title}</strong>}<p>{s.location}</p><span>{s.role} · 確認日 {s.checkedAt}</span></li>:null})}</ul></details>}
export function ReadBadge({read}:{read:boolean}){return <span className={'tag '+(read?'success':'')}>{read&&<Check size={12}/ >}{read?'読了':'未読'}</span>}
