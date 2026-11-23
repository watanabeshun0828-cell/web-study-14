import {readdir,readFile,access} from 'node:fs/promises'
import {z} from 'zod'
import {lessonSchema,sourceSchema,workSchema,glossarySchema} from '../src/lib/schema.ts'
import {calculate} from '../src/lib/grading.ts'
const root=new URL('../src/data/',import.meta.url)
const read=async(name:string)=>JSON.parse(await readFile(new URL(name,root),'utf8'))
const config=await read('config.json')
const sources=z.array(sourceSchema).parse(await read('sources.json'))
const works=z.array(workSchema).parse(await read('works.json'))
const glossary=glossarySchema.parse(await read('glossary.json'))
const files=(await readdir(root)).filter(n=>/^day\d{2}\.json$/.test(n)).sort()
const lessons=await Promise.all(files.map(async f=>lessonSchema.parse(await read(f))))
const questions=lessons.flatMap(l=>l.questions)
const known=new Set(sources.map(s=>s.id))
const ids=[...sources.map(s=>s.id),...lessons.map(l=>l.id),...lessons.flatMap(l=>l.sections.map(s=>s.id)),...questions.map(q=>q.id),...works.map(w=>w.id),...glossary.map(g=>g.id)]
if(new Set(ids).size!==ids.length)throw Error('IDが重複しています。')
if(lessons.length!==14||lessons.some((l,i)=>l.day!==i+1||l.questions.length!==(l.day===14?16:8)))throw Error('14日・120問の構成が不正です。')
if(new Set(questions.map(q=>q.prompt)).size!==questions.length)throw Error('設問が重複しています。')
const refs=(values:string[])=>{if(values.some(id=>!known.has(id)))throw Error('不明な出典ID: '+values.filter(id=>!known.has(id)).join(','))}
const positions=[0,0,0,0]
for(const lesson of lessons){
 refs(lesson.referenceIds)
 lesson.sections.forEach(s=>refs(s.referenceIds))
 for(const q of lesson.questions){
  refs(q.referenceIds)
  if(!lesson.sections.some(s=>s.id===q.sectionId))throw Error('章の参照不正: '+q.id)
  q.calculations.forEach(c=>{if(!Number.isFinite(calculate(c))||Math.abs(calculate(c)-c.result)>1e-9)throw Error('計算不一致: '+q.id)})
  if(q.format==='choice'){
   const index=q.choices.findIndex(c=>c.id===q.correctChoiceId)
   if(index<0||new Set(q.choices.map(c=>c.id)).size!==4||new Set(q.choices.map(c=>c.text)).size!==4)throw Error('選択肢不正: '+q.id)
   positions[index]++
  }else{
   if(!q.calculations.length||new Set(q.fields.map(f=>f.id)).size!==q.fields.length)throw Error('数値入力不正: '+q.id)
   q.fields.forEach(f=>{const c=q.calculations[f.calculationIndex];if(!c||Math.abs(c.result-f.expected)>1e-9||c.unit!==f.unit)throw Error('単位・検算不一致: '+q.id)})
  }
 }
}
if(Math.max(...positions)-Math.min(...positions)>1)throw Error('正答位置の偏り')
glossary.forEach(g=>refs(g.referenceIds))
for(const work of works){
 refs(work.referenceIds)
 if(new Set(work.checks.map(c=>c.id)).size!==work.checks.length)throw Error('確認項目の重複')
 for(const url of [work.starterUrl,work.answerUrl].filter(Boolean) as string[]){if(url.includes('..')||/^https?:/.test(url))throw Error('教材の相対パス不正');await access(new URL('../public/'+url,import.meta.url))}
}
const required=config.kind==='excel'?12:config.kind==='web'?8:14
if(works.length<required)throw Error('実践課題が不足しています。')
console.log(JSON.stringify({app:config.appId,days:lessons.length,sections:lessons.reduce((n,l)=>n+l.sections.length,0),questions:questions.length,numeric:questions.filter(q=>q.format==='numeric').length,choicePositions:positions,works:works.length,glossary:glossary.length,sources:sources.length},null,2))
