import { lessons, questionMap } from '../data'
import { accuracy, dayComplete, type Answer } from '../lib/study'
import { useStudy } from '../lib/store'
import { Panel } from './Shared'

function groups(answers: Answer[], key: (answer: Answer) => string) {
  const records = new Map<string, Answer[]>()
  answers.forEach(answer => {
    const label = key(answer)
    records.set(label, [...(records.get(label) ?? []), answer])
  })
  return [...records].map(([label, items]) => ({ label, count: items.length, correct: items.filter(a => a.correct).length, rate: accuracy(items) }))
}
export default function Stats() {
  const { state } = useStudy()
  const answers = state.attempts.flatMap(attempt => attempt.answers)
  const byCategory = groups(answers, answer => questionMap.get(answer.questionId)!.category)
  const byDay = groups(answers, answer => new Date(answer.at).toLocaleDateString('ja-JP')).reverse()
  const notes = lessons.flatMap(lesson => lesson.sections.filter(section => !!state.notes[section.id]?.trim()).map(section => ({ ...section, day: lesson.day })))
  return <>
    <div className="page-intro"><p className="eyebrow">YOUR LEARNING RECORD</p><h1>学習のあしあと。</h1><p>完了した練習と復習の延べ回答を集計しています。</p></div>
    <div className="stat-grid"><Panel><div><span className="muted">正答率</span><p><strong>{answers.length ? accuracy(answers) + '%' : '—'}</strong></p></div></Panel><Panel><div><span className="muted">回答数</span><p><strong>{answers.length}</strong> 問</p></div></Panel><Panel><div><span className="muted">学習達成</span><p><strong>{lessons.filter(lesson => dayComplete(lesson, state)).length}</strong> / 14日</p></div></Panel></div>
    <div className="stats-layout"><Panel><h2>分野別の正答率</h2>{byCategory.length ? <div className="category-list">{byCategory.map(group => <div key={group.label}><p><strong>{group.label}</strong><span>{group.correct}/{group.count}問 · {group.rate}%</span></p><div className="progress" role="progressbar" aria-label={group.label} aria-valuenow={group.rate} aria-valuemin={0} aria-valuemax={100}><span style={{ width: group.rate + '%' }} /></div></div>)}</div> : <p className="empty-message">練習を完了すると表示されます。</p>}</Panel>
      <Panel><h2>日別の正答率</h2>{byDay.length ? <div className="daily-list">{byDay.map(group => <p key={group.label}><strong>{group.label}</strong><span>{group.correct}/{group.count}問 · {group.rate}%</span></p>)}</div> : <p className="empty-message">最初の練習を、今日から。</p>}</Panel>
    </div>
    <Panel><h2>学習履歴</h2>{state.attempts.length ? <div className="history-list">{[...state.attempts].reverse().map(attempt => <div key={attempt.id}><div><strong>{attempt.mode === 'review' ? '誤答の復習' : `Day ${attempt.day} の練習`}</strong><span className="small muted">{new Date(attempt.completedAt).toLocaleString('ja-JP')}</span></div><span>{attempt.answers.filter(a => a.correct).length}/{attempt.answers.length}問</span><strong>{accuracy(attempt.answers)}%</strong></div>)}</div> : <p className="empty-message">完了した練習がここに残ります。</p>}</Panel>
    <Panel><h2>保存したメモ</h2>{notes.length ? notes.map(note => <details className="saved-note" key={note.id}><summary>Day {note.day} · {note.title}</summary><p>{state.notes[note.id]}</p></details>) : <p className="empty-message">講義で書いたメモを振り返れます。</p>}</Panel>
    <p className="small muted">途中の入力は保存されていますが、成績は練習完了後に集計します。ここでの得点は本試験の合否・合格確率を表しません。</p>
  </>
}
