import { describe, it, expect } from 'vitest'
import 'fake-indexeddb/auto'
import { lessons, sources, works, config } from '../data'
import { assess, calculate, parseNumber, emptyResponse, type Response } from './grading'
import { createDraft, initialState, recordAnswer, advance, setResponse, migrateState, dayComplete } from './study'
import { importBackup, exportBackup } from './backup'
import { loadState, saveState, DB_NAME } from './db'
import { contrast, hslToRGB, hueAngle } from './color'
import { safePreview } from './sandbox'
function answer(q:typeof lessons[number]['questions'][number]):Response { return q.format==='choice'?{values:{},choiceId:q.correctChoiceId}:{values:Object.fromEntries(q.fields.map(f=>[f.id,String(f.expected)])),choiceId:''} }
describe('教材の根拠・採点・計算',()=>{
 it('14日120問の参照IDと式・単位・入力正解を検算する',()=>{
  expect(lessons).toHaveLength(14);expect(lessons.flatMap(l=>l.questions)).toHaveLength(120)
  const ids=new Set(sources.map(s=>s.id)); const prompts=new Set<string>()
  for(const l of lessons){expect(l.sections.length).toBeGreaterThanOrEqual(2);for(const q of l.questions){expect(prompts.has(q.prompt)).toBe(false);prompts.add(q.prompt);expect(q.referenceIds.every(id=>ids.has(id))).toBe(true);expect(assess(q,answer(q))).toMatchObject({ready:true,correct:true});for(const c of q.calculations) expect(calculate(c)).toBeCloseTo(c.result,7);if(q.format==='numeric')for(const f of q.fields){expect(f.expected).toBeCloseTo(q.calculations[f.calculationIndex].result,7);expect(f.unit).toBe(q.calculations[f.calculationIndex].unit)}}}
 })
 it('全角・負数・小数を扱い、部分文字列や単位混入を勝手に数値化しない',()=>{
  expect(parseNumber(' １２，３４５ ')).toBe(12345);expect(parseNumber('−１２.５')).toBe(-12.5)
  for(const text of ['','12円','1,2','1e3','Infinity','--2','0x10'])expect(parseNumber(text)).toBeNull()
 })
 it('選択肢の表示順を変えてもIDで採点し、誤答は正解と区別する',()=>{
  const q=lessons[0].questions.find(q=>q.format==='choice')!;if(q.format!=='choice')throw Error()
  expect(assess({...q,choices:[...q.choices].reverse()},answer(q)).correct).toBe(true)
  expect(assess(q,{values:{},choiceId:q.choices.find(c=>c.id!==q.correctChoiceId)!.id}).correct).toBe(false)
  expect(assess(q,emptyResponse()).ready).toBe(false)
 })
})
describe('途中再開・復習・バックアップ',()=>{
 it('確定済み回答を上書きせず、一回だけ完了履歴へ保存する',()=>{
  const lesson=lessons[0];let s={...structuredClone(initialState),readSections:lesson.sections.map(x=>x.id),draft:createDraft('test',1,lesson.questions,true)}
  for(const q of lesson.questions){s=setResponse(s,answer(q)) as typeof s;s=recordAnswer(s,q) as typeof s;const fixed=s;s=recordAnswer(s,q) as typeof s;expect(s).toBe(fixed);expect(setResponse(s,emptyResponse())).toBe(s);s=advance(s) as typeof s}
  expect(s.attempts).toHaveLength(1);expect(s.draft).toBeNull();expect(dayComplete(lesson,s)).toBe(true);expect(advance(s)).toBe(s);expect(importBackup(exportBackup(s),lessons)).toEqual(s)
 })
 it('最新の正誤が復習対象を更新する',()=>{
  const q=lessons[0].questions[0];let s={...structuredClone(initialState),draft:createDraft('review',1,[q],false)}
  const wrong=answer(q);if(q.format==='choice')wrong.choiceId=q.choices.find(c=>c.id!==q.correctChoiceId)!.id;else wrong.values[q.fields[0].id]=String(q.fields[0].expected+1)
  s=recordAnswer(setResponse(s,wrong),q) as typeof s;expect(s.latestAnswers[q.id].correct).toBe(false);s=advance(s) as typeof s;s={...s,draft:createDraft('review',1,[q],false)};s=recordAnswer(setResponse(s,answer(q)),q) as typeof s;expect(s.latestAnswers[q.id].correct).toBe(true)
 })
 it('異なるアプリ・版・ID・壊れた採点を拒否し、元の状態を変更しない',()=>{
  const q=lessons[0].questions[0];const s=recordAnswer(setResponse({...structuredClone(initialState),draft:createDraft('test',1,lessons[0].questions,true)},answer(q)),q)
  const original=exportBackup(s)
  for(const alter of [(b:any)=>b.app='other-app',(b:any)=>b.contentVersion='future',(b:any)=>b.state.version=999,(b:any)=>b.state.notes={'unknown':'memo'},(b:any)=>b.state.draft.index=999,(b:any)=>b.state.latestAnswers[q.id].correct=false,(b:any)=>b.state.draft.choiceOrder[q.id]=['unknown']]){const b=JSON.parse(original);alter(b);expect(()=>importBackup(JSON.stringify(b),lessons)).toThrow();expect(exportBackup(s).replace(/"exportedAt": "[^"]+"/,'' )).toBe(original.replace(/"exportedAt": "[^"]+"/,''))}
  expect(()=>migrateState({version:999})).toThrow()
 })
 it('実践課題のメモ・チェック・設定を復元し、未知の項目を拒否する',()=>{
  const w=works[0];const s={...structuredClone(initialState),workRecords:{[w.id]:{note:'根拠を説明する',checks:[w.checks[0].id],settings:w.initial??{}}}}
  expect(importBackup(exportBackup(s),lessons)).toEqual(s)
  s.workRecords[w.id].checks=['unknown'];expect(()=>importBackup(exportBackup(s),lessons)).toThrow()
 })
 it('アプリ固有のIndexedDBに連続保存し、最後の途中状態を開く',async()=>{
  expect(DB_NAME).toBe(config.appId);const first={...structuredClone(initialState),selectedDay:3};const second={...first,selectedDay:14,notes:{[lessons[0].sections[0].id]:'最後のメモ'}};await Promise.all([saveState(first),saveState(second)]);expect(await loadState()).toEqual(second)
 })
})
describe('実践用の表示・数値',()=>{
 it('HSLの基準色・循環角とWCAG比の基準値を検算する',()=>{
  expect(hslToRGB(0,100,50)).toEqual([255,0,0]);expect(hslToRGB(120,100,50)).toEqual([0,255,0]);expect(hslToRGB(240,100,50)).toEqual([0,0,255]);expect(hslToRGB(360,100,50)).toEqual([255,0,0]);expect(hueAngle(350,10)).toBe(20);expect(contrast([0,0,0],[255,255,255])).toBe(21);expect(contrast([21,80,33],[21,80,33])).toBe(1);expect(contrast([119,119,119],[255,255,255])).toBeLessThan(4.5)
 })
 it('HTML見本の意味と埋め込みCSSを保ち、スクリプト・イベント・外部送信を隔離する',()=>{
  const html=safePreview('<head><style>h1{color:teal}@import "https://example.invalid/a";</style></head><body><h1 onclick="alert(1)">見出し</h1><script>alert(2)</script><img src="https://example.invalid/p"><a href="javascript:alert(3)">リンク</a><iframe src="https://example.invalid/"></iframe></body>','p{background:url(https://example.invalid/a)}')
  const doc=new DOMParser().parseFromString(html,'text/html');expect(doc.querySelector('h1')?.textContent).toBe('見出し');expect(doc.querySelector('h1')?.hasAttribute('onclick')).toBe(false);expect(doc.querySelector('script,iframe')).toBeNull();expect(doc.querySelector('img')?.hasAttribute('src')).toBe(false);expect(doc.querySelector('a')?.hasAttribute('href')).toBe(false);expect(doc.querySelector('style')?.textContent).toContain('h1{color:teal}');expect(doc.querySelector('style')?.textContent).not.toContain('example.invalid');expect(doc.querySelector('meta[http-equiv]')?.getAttribute('content')).toContain("connect-src 'none'")
 })
})
