import {z} from 'zod'
import rawSources from './sources.json'
import rawWorks from './works.json'
import rawGlossary from './glossary.json'
import config from './config.json'
import {lessonSchema,sourceSchema,workSchema,glossarySchema} from '../lib/schema'
export const sources=z.array(sourceSchema).parse(rawSources)
export const sourceMap=new Map(sources.map(s=>[s.id,s]))
export const works=z.array(workSchema).parse(rawWorks)
export const glossary=glossarySchema.parse(rawGlossary)
export const lessons=Object.values(import.meta.glob('./day*.json',{eager:true,import:'default'})).map(raw=>lessonSchema.parse(raw)).sort((a,b)=>a.day-b.day)
export const questions=lessons.flatMap(l=>l.questions)
export const questionMap=new Map(questions.map(q=>[q.id,q]))
export const sectionIds=new Set(lessons.flatMap(l=>l.sections.map(s=>s.id)))
export const formatNumber=(v:number)=>v.toLocaleString('ja-JP',{maximumFractionDigits:8})
export {config}
