import { z } from 'zod'
import { assess, emptyResponse, type Response } from './grading'
import type { Lesson, Question } from './schema'

export type Page = 'home' | 'lessons' | 'flow' | 'quiz' | 'review' | 'stats' | 'glossary' | 'sources' | 'help' | 'practice' | 'apps'
const responseSchema = z.object({
  values: z.record(z.string(), z.string().max(30)), choiceId: z.string()
})
export const answerSchema = z.object({
  questionId: z.string(), response: responseSchema, correct: z.boolean(), at: z.string().datetime()
})
export const draftSchema = z.object({
  id: z.string(), mode: z.enum(['test', 'review']), day: z.number().int().min(1).max(14),
  questionIds: z.array(z.string()).min(1).max(120), index: z.number().int().min(0),
  response: responseSchema, answers: z.array(answerSchema).max(120),
  choiceOrder: z.record(z.string(), z.array(z.string()))
})
const commonState = z.object({
  theme: z.enum(['light', 'dark', 'system']), selectedDay: z.number().int().min(1).max(14),
  readSections: z.array(z.string()), positions: z.record(z.string(), z.number().int().min(0)),
  latestAnswers: z.record(z.string(), answerSchema),
  attempts: z.array(z.object({
    id: z.string(), day: z.number().int().min(1).max(14), mode: z.enum(['test', 'review']),
    answers: z.array(answerSchema).min(1).max(120), completedAt: z.string().datetime()
  })),
  draft: draftSchema.nullable(), lastAttemptId: z.string().nullable(),
  shuffleChoices: z.boolean()
})
export const stateSchema = commonState.extend({
  version: z.literal(1), workRecords: z.record(z.string(), z.object({ checks: z.array(z.string()), note: z.string().max(10000), settings: z.record(z.string(), z.number().finite()) })), notes: z.record(z.string(), z.string().max(10000))
})
export type StudyState = z.infer<typeof stateSchema>
export type Answer = z.infer<typeof answerSchema>
export type Draft = z.infer<typeof draftSchema>
export const initialState: StudyState = {
  version: 1, workRecords: {}, theme: 'system', selectedDay: 1, readSections: [], positions: {},
  latestAnswers: {}, attempts: [], draft: null, lastAttemptId: null, shuffleChoices: true, notes: {}
}
export function migrateState(raw: unknown): StudyState { return stateSchema.parse(raw) }
export const accuracy = (answers: Answer[]) => answers.length ? Math.round(answers.filter(a => a.correct).length / answers.length * 100) : 0
export function dayComplete(lesson: Lesson, state: StudyState) {
  return lesson.sections.every(section => state.readSections.includes(section.id)) &&
    state.attempts.some(attempt => attempt.mode === 'test' && attempt.day === lesson.day &&
      lesson.questions.every(question => attempt.answers.some(answer => answer.questionId === question.id)) &&
      accuracy(attempt.answers) >= 80)
}
export function createDraft(mode: Draft['mode'], day: number, questions: Question[], shuffle: boolean): Draft {
  const choiceOrder: Draft['choiceOrder'] = {}
  for (const question of questions) {
    if (question.format !== 'choice') continue
    const order = question.choices.map(choice => choice.id)
    if (shuffle) for (let index = order.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1))
      ;[order[index], order[other]] = [order[other], order[index]]
    }
    choiceOrder[question.id] = order
  }
  return { id: crypto.randomUUID(), mode, day, questionIds: questions.map(q => q.id), index: 0,
    response: emptyResponse(), answers: [], choiceOrder }
}
export function recordAnswer(state: StudyState, question: Question, now = new Date().toISOString()): StudyState {
  const draft = state.draft
  if (!draft || draft.questionIds[draft.index] !== question.id || draft.answers.some(a => a.questionId === question.id)) return state
  const assessment = assess(question, draft.response)
  if (!assessment.ready) return state
  const answer = { questionId: question.id, response: structuredClone(draft.response), correct: assessment.correct, at: now }
  return { ...state, draft: { ...draft, answers: [...draft.answers, answer] },
    latestAnswers: { ...state.latestAnswers, [question.id]: answer } }
}
export function advance(state: StudyState): StudyState {
  const draft = state.draft
  if (!draft || !draft.answers.some(a => a.questionId === draft.questionIds[draft.index])) return state
  if (draft.index < draft.questionIds.length - 1) {
    return { ...state, draft: { ...draft, index: draft.index + 1, response: emptyResponse() } }
  }
  const attempt = { id: draft.id, mode: draft.mode, day: draft.day, answers: draft.answers, completedAt: new Date().toISOString() }
  return { ...state, draft: null, lastAttemptId: attempt.id,
    attempts: state.attempts.some(a => a.id === attempt.id) ? state.attempts : [...state.attempts, attempt] }
}
export function setResponse(state: StudyState, response: Response): StudyState {
  if (!state.draft || state.draft.answers.some(a => a.questionId === state.draft!.questionIds[state.draft!.index])) return state
  return { ...state, draft: { ...state.draft, response } }
}
