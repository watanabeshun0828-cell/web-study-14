import { z } from 'zod'
import { migrateState, type Answer, type StudyState } from './study'
import { assess } from './grading'
import type { Lesson } from './schema'

import config from '../data/config.json'
import { works } from '../data'
export const APP_ID = config.appId
export const CONTENT_VERSION = '2026.1'
const envelopeSchema = z.object({
  app: z.literal(APP_ID), formatVersion: z.literal(1), contentVersion: z.literal(CONTENT_VERSION),
  exportedAt: z.string().datetime(), state: z.unknown()
})
export function validateState(state: StudyState, lessons: Lesson[]) {
  const lessonMap = new Map(lessons.map(lesson => [lesson.id, lesson]))
  const sectionIds = new Set(lessons.flatMap(lesson => lesson.sections.map(section => section.id)))
  const questionMap = new Map(lessons.flatMap(lesson => lesson.questions.map(question => [question.id, question] as const)))
  const assert = (condition: boolean, message: string) => { if (!condition) throw new Error(message) }
  assert(state.readSections.every(id => sectionIds.has(id)), '未登録の章IDが含まれます。')
  assert(Object.keys(state.notes).every(id => sectionIds.has(id)), 'メモの章IDを確認してください。')
  for (const [id, position] of Object.entries(state.positions)) {
    assert(lessonMap.has(id) && position < lessonMap.get(id)!.sections.length, '講義位置が範囲外です。')
  }
  const validateResponse = (questionId: string, response: Answer['response']) => {
    const question = questionMap.get(questionId)
    assert(!!question, '未登録の問題IDが含まれます。')
    if (question?.format !== 'choice') assert(response.choiceId === '', 'この形式では選択肢IDを使用しません。')
    if (question?.format !== 'numeric') assert(Object.keys(response.values).length === 0, 'この形式では数値入力欄IDを使用しません。')
    if (question?.format === 'choice') assert(!response.choiceId || question.choices.some(c => c.id === response.choiceId), '選択肢IDが不正です。')
    if (question?.format === 'numeric') assert(Object.keys(response.values).every(id => question.fields.some(field => field.id === id)), '数値入力欄IDが不正です。')
  }
  const validateAnswer = (answer: Answer) => {
    validateResponse(answer.questionId, answer.response)
    const result = assess(questionMap.get(answer.questionId)!, answer.response)
    assert(result.ready && result.correct === answer.correct, '解答と採点結果が一致しません。')
  }
  Object.entries(state.latestAnswers).forEach(([id, answer]) => {
    assert(id === answer.questionId, '最新解答の問題IDが一致しません。')
    validateAnswer(answer)
  })
  const attemptIds = new Set<string>()
  state.attempts.forEach(attempt => {
    assert(!attemptIds.has(attempt.id), '履歴IDが重複しています。')
    attemptIds.add(attempt.id)
    assert(new Set(attempt.answers.map(a => a.questionId)).size === attempt.answers.length, '履歴内に同じ問題が重複しています。')
    attempt.answers.forEach(validateAnswer)
    if (attempt.mode === 'test') {
      const lesson = lessons.find(lesson => lesson.day === attempt.day)!
      assert(attempt.answers.length === lesson.questions.length && attempt.answers.every(a => lesson.questions.some(q => q.id === a.questionId)), '通常テストと日程が一致しません。')
    }
  })
  assert(state.lastAttemptId === null || attemptIds.has(state.lastAttemptId), '結果表示の履歴IDがありません。')
  if (state.draft) {
    const draft = state.draft
    assert(draft.index < draft.questionIds.length && new Set(draft.questionIds).size === draft.questionIds.length, '途中テストの位置や問題IDが不正です。')
    draft.questionIds.forEach(id => assert(questionMap.has(id), '途中テストに未登録の問題IDがあります。'))
    if (draft.mode === 'test') {
      const lesson = lessons.find(lesson => lesson.day === draft.day)!
      assert(draft.questionIds.length === lesson.questions.length &&
        draft.questionIds.every(id => lesson.questions.some(q => q.id === id)), '途中テストの日程が一致しません。')
    }
    assert(draft.answers.length === draft.index || draft.answers.length === draft.index + 1, '確定回答と進行位置が一致しません。')
    draft.answers.forEach((answer, index) => {
      assert(answer.questionId === draft.questionIds[index], '確定回答の順序が一致しません。')
      validateAnswer(answer)
    })
    validateResponse(draft.questionIds[draft.index], draft.response)
    if (draft.answers.length === draft.index + 1) assert(
      JSON.stringify(draft.response) === JSON.stringify(draft.answers[draft.index].response), '確定済みの入力が解答と一致しません。')
    for (const [id, order] of Object.entries(draft.choiceOrder)) {
      const question = questionMap.get(id)
      assert(question?.format === 'choice' && draft.questionIds.includes(id), '選択肢の問題IDが不正です。')
      if (question?.format === 'choice') assert(order.length === question.choices.length &&
        new Set(order).size === order.length && order.every(value => question.choices.some(c => c.id === value)), '選択肢の並び順が不正です。')
    }
  }
  for (const [id, record] of Object.entries(state.workRecords)) {
    const work = works.find(item => item.id === id)
    assert(!!work, '未登録の実践課題IDです。')
    assert(record.checks.every(id => work!.checks.some(check => check.id === id)), '確認項目IDが不正です。')
    assert(Object.entries(record.settings).every(([key, value]) => key in (work!.initial ?? {}) && value >= 0 && value <= (['h','bgH','accentH'].includes(key)?360:key==='area'?50:100)), '操作設定が範囲外です。')
  }
  return state
}
export function exportBackup(state: StudyState) {
  return JSON.stringify({ app: APP_ID, formatVersion: 1, contentVersion: CONTENT_VERSION, exportedAt: new Date().toISOString(), state }, null, 2)
}
export function importBackup(text: string, lessons: Lesson[]) {
  if (new TextEncoder().encode(text).length > 20 * 1024 * 1024) throw new Error('20MB以下のJSONファイルを選んでください。')
  const envelope = envelopeSchema.parse(JSON.parse(text))
  return validateState(migrateState(envelope.state), lessons)
}
