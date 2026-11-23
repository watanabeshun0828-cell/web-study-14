import { useState } from 'react'
import { BookOpen, Check, CircleCheck, CircleX, RotateCcw, Trophy } from 'lucide-react'
import { lessons, formatNumber, questionMap, questions } from '../data'
import { assess } from '../lib/grading'
import { accuracy, advance, createDraft, recordAnswer, setResponse, type Draft, type Page } from '../lib/study'
import { useStudy } from '../lib/store'
import type { Question } from '../lib/schema'
import AnswerForm from './AnswerForm'
import { Dialog, Panel, Progress, ReferenceLinks } from './Shared'

function CorrectAnswer({ question }: { question: Question }) {
  if (question.format === 'numeric') return <dl className="correct-values">{question.fields.map(field => <div key={field.id}><dt>{field.label}</dt><dd>{formatNumber(field.expected)} {field.unit}</dd></div>)}</dl>
  return <p className="correct-choice">{question.choices.find(choice => choice.id === question.correctChoiceId)!.text}</p>
}

export function useStart(go: (page: Page) => void) {
  const { state, update } = useStudy()
  const [pending, setPending] = useState<Draft | null>(null)
  const begin = (draft: Draft) => {
    update(current => ({ ...current, draft, selectedDay: draft.day, lastAttemptId: null }))
    setPending(null)
    go('quiz')
  }
  const start = (mode: Draft['mode'], day = state.selectedDay) => {
    const chosen = mode === 'test' ? lessons[day - 1].questions : questions.filter(q => state.latestAnswers[q.id]?.correct === false)
    if (!chosen.length) return
    const draft = createDraft(mode, day, chosen, state.shuffleChoices)
    if (state.draft) setPending(draft)
    else begin(draft)
  }
  return { start, confirmation: pending && <Dialog title="途中の練習があります" close={() => setPending(null)}>
    <p>新しく始めると、途中の入力と進行位置を置き換えます。確定済みの解答と履歴は保存されています。</p>
    <div className="dialog-actions"><button className="button" onClick={() => { setPending(null); go('quiz') }}>途中の練習を再開</button>
      <button className="button secondary" onClick={() => begin(pending)}>置き換えて新しく開始</button></div>
  </Dialog> }
}

export default function Quiz({ go }: { go: (page: Page) => void }) {
  const { state, update } = useStudy()
  const { start, confirmation } = useStart(go)
  const [switching, setSwitching] = useState(false)
  const [chosenDay, setChosenDay] = useState(state.selectedDay)
  const draft = state.draft
  const question = draft ? questionMap.get(draft.questionIds[draft.index]) : undefined
  const lesson = lessons[state.selectedDay - 1]
  const last = state.attempts.find(attempt => attempt.id === state.lastAttemptId)
  const answer = draft?.answers.find(answer => answer.questionId === question?.id)
  const related = () => {
    if (!question) return
    const source = lessons.find(lesson => lesson.questions.some(item => item.id === question.id))!
    const index = source.sections.findIndex(section => section.id === question.sectionId)
    update(current => ({ ...current, selectedDay: source.day, positions: { ...current.positions, [source.id]: index } }))
    go('lessons')
  }
  return <>
    <div className="page-intro"><p className="eyebrow">{draft?.mode === 'review' ? 'REVIEW SESSION' : 'PRACTICE NOTE'}</p>
      <h1>{draft ? draft.mode === 'review' ? '間違えた問題の復習' : `Day ${draft.day} の練習` : '手を動かして、確かめる。'}</h1>
      {!draft && <label className="day-select">練習する日<select value={lesson.day} onChange={event => update(current => ({ ...current, selectedDay: Number(event.target.value), lastAttemptId: null }))}>
        {lessons.map(item => <option key={item.id} value={item.day}>Day {item.day} · {item.title}</option>)}
      </select></label>}
    </div>
    {draft && <div className="quiz-navigation"><button className="text-button" onClick={() => { setChosenDay(state.selectedDay); setSwitching(true) }}>別の日の練習を選ぶ</button></div>}
    {switching && <Dialog title="練習する日を選び直す" close={() => setSwitching(false)}>
      <p>今の入力は、新しく開始することを確認するまで保たれます。</p>
      <label className="day-select">新しく練習する日<select value={chosenDay} onChange={event => setChosenDay(Number(event.target.value))}>
        {lessons.map(item => <option key={item.id} value={item.day}>Day {item.day} · {item.title}</option>)}
      </select></label>
      <div className="dialog-actions"><button className="button secondary" onClick={() => setSwitching(false)}>キャンセル</button>
        <button className="button" onClick={() => { setSwitching(false); start('test', chosenDay) }}>選んだ日の練習を始める</button></div>
    </Dialog>}
    {draft && question ? <Panel className="quiz-panel">
      <div className="quiz-head"><span className="tag">{question.category}</span><span>{draft.index + 1} / {draft.questionIds.length} 問</span></div>
      <Progress value={(draft.index + (answer ? 1 : 0)) / draft.questionIds.length * 100} label="練習の進行" />
      <h2 className="question-prompt">{question.prompt}</h2>
      <details className="assumptions"><summary>この問題の前提</summary><p>{question.assumptions}</p></details>
      {question.code && <pre className="code-block"><code>{question.code}</code></pre>}
      <AnswerForm question={question} draft={draft} disabled={!!answer} change={response => update(current => setResponse(current, response))} />
      {!answer && <p className="input-feedback" role="status">{assess(question, draft.response).message}</p>}
      {answer && <section className={`answer-explanation ${answer.correct ? 'correct' : 'incorrect'}`} role="status">
        <h3>{answer.correct ? <CircleCheck size={22} /> : <CircleX size={22} />}{answer.correct ? '正解です' : '解説を読んで確認しましょう'}</h3>
        <h4>正しい解答</h4><CorrectAnswer question={question} /><p>{question.explanation}</p>
        {!!question.calculations.length && <details><summary>計算式・単位・検算</summary><ul>{question.calculations.map((calculation, index) => <li key={index}>{calculation.expression}<br /><span className="small">単位 {calculation.unit} · {({none:'端数処理なし',floor:'切り捨て',ceil:'切り上げ',round:'四捨五入'} as const)[calculation.rounding]} · 検算 {formatNumber(calculation.result)} {calculation.unit}</span></li>)}</ul></details>}
        <button className="text-button" onClick={related}><BookOpen size={15} />関連する講義へ</button>
      </section>}
      <div className="quiz-actions">{answer ? <button className="button" onClick={() => {
        update(advance); window.scrollTo({ top: 0, behavior: 'instant' })
      }}>{draft.index === draft.questionIds.length - 1 ? '結果を見る' : '次の問題へ'}</button> :
        <button className="button" disabled={!assess(question, draft.response).ready} onClick={() => update(current => recordAnswer(current, question))}>回答を確定する<Check size={16} /></button>}
      </div>
      <ReferenceLinks ids={question.referenceIds} />
    </Panel> : last ? <Panel className="result-panel">
      <span className="result-icon"><Trophy size={34} /></span><p className="eyebrow">PRACTICE COMPLETE</p><h2>今日の練習、おつかれさまでした。</h2>
      <p className="result-score">{accuracy(last.answers)}<span>%</span></p><p>{last.answers.filter(a => a.correct).length}/{last.answers.length}問 正解</p>
      <p className="small muted">アプリ内の練習結果です。本試験の合否や合格確率を示す数値ではありません。</p>
      <div className="result-list">{last.answers.map((item, index) => <details key={item.questionId}>
        <summary>{item.correct ? <CircleCheck size={16} /> : <CircleX size={16} />}問{index + 1} · {item.correct ? '正解' : '復習'}<span>{questionMap.get(item.questionId)!.prompt}</span></summary>
        <p>{questionMap.get(item.questionId)!.explanation}</p>
      </details>)}</div>
      <div className="result-actions"><button className="button" onClick={() => go('review')}>間違えた問題を復習<RotateCcw size={16} /></button>
        <button className="button secondary" onClick={() => go('stats')}>成績と履歴を見る</button>
        <button className="text-button" onClick={() => start('test')}>この日をもう一度練習する</button></div>
    </Panel> : <Panel className="quiz-lobby">
      <span className="eyebrow">DAY {String(lesson.day).padStart(2, '0')}</span><h2>{lesson.title}</h2>
      <p>全{lesson.questions.length}問。条件を読み、選択肢や数値で確かめましょう。<br />途中の入力も、この端末に保存します。</p>
      <label className="check-label"><input type="checkbox" checked={state.shuffleChoices} onChange={event => {
        const shuffleChoices = event.target.checked; update(current => ({ ...current, shuffleChoices }))
      }} />4択の選択肢を並べ替える</label>
      <button className="button" onClick={() => start('test')}>練習をはじめる</button>
      <button className="text-button" onClick={() => go('lessons')}>先に講義を読む</button>
    </Panel>}
    {confirmation}
  </>
}

export function Review({ go }: { go: (page: Page) => void }) {
  const { state } = useStudy()
  const { start, confirmation } = useStart(go)
  const wrong = questions.filter(question => state.latestAnswers[question.id]?.correct === false)
  return <>
    <div className="page-intro"><p className="eyebrow">MAKE IT CLEAR</p><h1>つまずきを、理解に変える。</h1><p>最新の確定回答が不正解の問題を集めています。</p></div>
    <Panel><h2>復習待ち {wrong.length}問</h2><p>{wrong.length ? '正解すると、この一覧から外れます。' : Object.keys(state.latestAnswers).length ? 'いまの復習待ちはありません。' : '練習で間違えた問題が、ここに集まります。'}</p>
      <button className="button" onClick={() => wrong.length ? start('review') : go('quiz')}>{wrong.length ? '復習をはじめる' : '練習へ'}</button>
    </Panel>
    {!!wrong.length && <Panel className="review-list">{wrong.map(question => <article key={question.id}><span className="tag">{question.category}</span><h3>{question.prompt}</h3>
    </article>)}</Panel>}
    {state.draft && <button className="text-button" onClick={() => go('quiz')}>途中の練習を再開</button>}
    {confirmation}
  </>
}
