import { BookOpen, Check, RotateCcw, Target, Workflow } from 'lucide-react'
import { config, lessons, questions } from '../data'
import { accuracy, dayComplete, type Page } from '../lib/study'
import { useStudy } from '../lib/store'
import { Guide, Panel, Progress } from './Shared'

export default function Home({ go, openLesson }: { go: (page: Page) => void; openLesson: (day: number) => void }) {
  const { state } = useStudy()
  const completed = lessons.filter(lesson => dayComplete(lesson, state))
  const next = lessons.find(lesson => !dayComplete(lesson, state)) ?? lessons[13]
  const active = lessons.find(lesson => lesson.day === state.selectedDay) ?? next
  const hasRead = state.readSections.some(id => active.sections.some(section => section.id === id))
  const resume = !!state.draft || hasRead
  const hero = resume ? active : next
  const answers = state.attempts.flatMap(attempt => attempt.answers)
  const wrong = questions.filter(question => state.latestAnswers[question.id]?.correct === false)
  return <>
    <div className="page-intro"><p className="eyebrow">MY LEARNING NOTE</p><h1>毎日の学びを、一つずつ。</h1><p>{config.tagline}</p></div>
    <section className="hero">
      <div><span className="hero-kicker">{config.qualName} · DAY {String(state.draft?.day ?? hero.day).padStart(2, '0')}</span>
        <h2>{state.draft ? '途中の練習から再開' : hero.title}</h2>
        <p>{state.draft ? `全${state.draft.questionIds.length}問の${state.draft.index + 1}問目を開きます。` : `講義 ${hero.sections.length}節・練習 ${hero.questions.length}問`}</p>
        <button className="button hero-button" onClick={() => state.draft ? go('quiz') : openLesson(hero.day)}>{resume ? '続きから学習する' : '今日の学習をはじめる'}</button>
      </div>
      <div className="hero-mark" aria-label={`14日のうち${completed.length}日達成`}><BookOpen size={35} /><p><strong>{String(completed.length).padStart(2, '0')}</strong><span>/ 14</span></p><span>学習を分ける14のステップ</span></div>
    </section>
    <div className="stat-grid">
      <Panel><span className="stat-icon"><BookOpen size={20} /></span><div><span className="muted">学習達成</span><p><strong>{completed.length}</strong> / 14日</p></div></Panel>
      <Panel><span className="stat-icon amber"><Target size={20} /></span><div><span className="muted">練習の正答率</span><p><strong>{answers.length ? accuracy(answers) + '%' : '—'}</strong></p></div></Panel>
      <Panel><span className="stat-icon"><RotateCcw size={20} /></span><div><span className="muted">復習待ち</span><p><strong>{wrong.length}</strong> 問</p></div></Panel>
    </div>
    <div className="home-layout"><div>
      <Panel><div className="section-head"><div><p className="eyebrow">LEARNING PLAN</p><h2>14日の学習ノート</h2></div><span className="tag">{completed.length}/14 達成</span></div>
        <Progress value={completed.length / 14 * 100} label="14日の学習達成" />
        <div className="day-grid">{lessons.map(lesson => <button key={lesson.id}
          className={dayComplete(lesson, state) ? 'done' : lesson.day === next.day ? 'current' : ''}
          onClick={() => openLesson(lesson.day)} aria-label={`Day${lesson.day} ${lesson.title}`}>
          <span>DAY</span><strong>{dayComplete(lesson, state) ? <Check size={21} /> : String(lesson.day).padStart(2, '0')}</strong><span>{dayComplete(lesson, state) ? '達成' : '開く'}</span>
        </button>)}</div>
        <p className="small muted">全節読了と通常練習80%以上で学習達成。すべての日を自由に選べます。</p>
        <details className="lesson-list"><summary>学習テーマを一覧で見る</summary>{lessons.map(lesson => <button key={lesson.id} onClick={() => openLesson(lesson.day)}><span>Day {lesson.day}</span><strong>{lesson.title}</strong></button>)}</details>
      </Panel>
      <button className="flow-link panel" onClick={() => go('flow')}><span className="stat-icon"><Workflow size={24} /></span><div><strong>図解で関係をつかむ</strong><p>言葉・構造・手順を、図で確かめる。</p></div></button>
    </div><aside className="home-aside">
      <Guide>{config.guideMessage}</Guide>
      <Panel><p className="eyebrow">REVIEW</p><h2>つまずいた問題を、もう一度。</h2><p className="review-number">{wrong.length}<span>問</span></p><button className="button secondary wide" onClick={() => go('review')}>誤答を復習する</button></Panel>
      <div className="course-note"><strong>{config.positioning}</strong><p>対象 {config.targetVersion}</p><p>{config.notice}</p><button className="text-button" onClick={() => go('sources')}>収録範囲と出典を見る</button></div>
    </aside></div>
  </>
}
