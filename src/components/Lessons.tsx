import { Check, PencilLine } from 'lucide-react'
import { lessons } from '../data'
import { useStudy } from '../lib/store'
import type { Page } from '../lib/study'
import { Guide, Panel, Progress, ReadBadge, ReferenceLinks } from './Shared'

export default function Lessons({ go }: { go: (page: Page) => void }) {
  const { state, update } = useStudy()
  const lesson = lessons[state.selectedDay - 1]
  const index = state.positions[lesson.id] ?? 0
  const section = lesson.sections[index]
  const read = lesson.sections.filter(section => state.readSections.includes(section.id)).length
  const move = (position: number) => {
    update(current => ({ ...current, positions: { ...current.positions, [lesson.id]: position } }))
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  const mark = () => {
    update(current => ({ ...current,
      readSections: [...new Set([...current.readSections, section.id])],
      positions: { ...current.positions, [lesson.id]: Math.min(index + 1, lesson.sections.length - 1) }
    }))
    if (index === lesson.sections.length - 1) go('quiz')
    else window.scrollTo({ top: 0, behavior: 'instant' })
  }
  return <>
    <div className="page-intro"><p className="eyebrow">LESSON NOTE</p><h1>ひとつずつ、理解する。</h1>
      <label className="day-select">学習する日<select value={lesson.day} onChange={event => update(current => ({ ...current, selectedDay: Number(event.target.value), lastAttemptId: null }))}>
        {lessons.map(item => <option value={item.day} key={item.id}>Day {item.day} · {item.title}</option>)}
      </select></label>
    </div>
    <div className="lesson-layout">
      <aside className="panel chapter-nav"><p className="eyebrow">DAY {String(lesson.day).padStart(2, '0')}</p><h2>{lesson.title}</h2>
        <p className="small muted">{read}/{lesson.sections.length}節 読了</p><Progress value={read / lesson.sections.length * 100} label="講義の読了率" />
        <nav aria-label="講義の節">{lesson.sections.map((item, position) => <button className={index === position ? 'active' : ''} key={item.id} onClick={() => move(position)} aria-current={index === position ? 'step' : undefined}>
          <span>{state.readSections.includes(item.id) ? <Check size={17} /> : String(position + 1).padStart(2, '0')}</span>{item.title}
        </button>)}</nav>
        <button className="text-button" onClick={() => go('quiz')}>この日の練習へ</button>
      </aside>
      <Panel className="lesson-article">
        <div className="article-top"><span className="eyebrow">SECTION {index + 1}/{lesson.sections.length}</span><ReadBadge read={state.readSections.includes(section.id)} /></div>
        <h2>{section.title}</h2>
        {index === 0 && <div className="objectives"><strong>この日の学習目標</strong><ul>{lesson.goals.map(goal => <li key={goal}>{goal}</li>)}</ul></div>}
        <div className="prose">{section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>
        {section.code && <pre className="code-block"><code>{section.code}</code></pre>}
        {section.diagram && <figure className="concept-diagram"><figcaption>{section.diagram.title}</figcaption><div>{section.diagram.items.map(item => <section key={item.label}><strong>{item.label}</strong><p>{item.detail}</p></section>)}</div><p>{section.diagram.description}</p></figure>}
        <Guide>{section.keyPoint}</Guide>
        <label className="note-label"><span><PencilLine size={16} />自分の言葉でメモ</span>
          <textarea rows={3} maxLength={10000} placeholder="分かったこと、もう一度確認したいこと"
            value={state.notes[section.id] ?? ''} onChange={event => { const note = event.target.value; update(current => ({ ...current, notes: { ...current.notes, [section.id]: note } })) }} />
        </label>
        <div className="article-actions"><button className="button secondary" disabled={index === 0} onClick={() => move(index - 1)}>前の節</button><button className="button" onClick={mark}>{index === lesson.sections.length - 1 ? '読了して練習へ' : '読了して次の節へ'}</button></div>
        <ReferenceLinks ids={section.referenceIds} />
      </Panel>
    </div>
  </>
}
