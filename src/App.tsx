import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { BookOpen, Check, CircleHelp, FileText, Home as HomeIcon, Library, ListChecks, Moon, RotateCcw, Settings, Sun, TrendingUp, WifiOff, Workflow } from 'lucide-react'
import { useStudy } from './lib/store'
import type { Page } from './lib/study'
import Home from './components/Home'
import Lessons from './components/Lessons'
import Quiz, { Review } from './components/Quiz'
import Diagrams from './components/Diagrams'
import Practice from './components/Practice'
import AppLinks from './components/AppLinks'
import { config } from './data'
import Stats from './components/Stats'
import { Glossary, Help, Sources } from './components/Resources'
import { Dialog } from './components/Shared'

const navigation = [
  { id: 'home', title: 'ホーム', icon: HomeIcon }, { id: 'lessons', title: '講義', icon: BookOpen },
  { id: 'quiz', title: '練習', icon: ListChecks }, { id: 'review', title: '復習', icon: RotateCcw },
  { id: 'stats', title: '成績', icon: TrendingUp }, { id: 'flow', title: '図解', icon: Workflow }, { id: 'practice', title: '実践', icon: BookOpen },
  { id: 'glossary', title: '用語集', icon: Library }, { id: 'sources', title: '出典', icon: FileText },
  { id: 'help', title: '使い方・保存', icon: CircleHelp }, { id: 'apps', title: 'アプリ一覧', icon: HomeIcon }
] as const
function readPage(): Page {
  const hash = window.location.hash.slice(2)
  return navigation.some(item => item.id === hash) ? hash as Page : 'home'
}
export default function App() {
  const { state, update, status, retry } = useStudy()
  const [page, setPage] = useState<Page>(readPage)
  const [settings, setSettings] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)
  const [offlineReady, setOfflineReady] = useState(false)
  const [updateError, setUpdateError] = useState(false)
  const { needRefresh: [refresh, setRefresh], updateServiceWorker } = useRegisterSW({
    onOfflineReady: () => setOfflineReady(true),
    onRegisteredSW: (_url, registration) => { if (registration?.active && navigator.serviceWorker.controller) setOfflineReady(true) }
  })
  useEffect(() => {
    const change = () => { setPage(readPage()); window.scrollTo({ top: 0, behavior: 'instant' }) }
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('hashchange', change); window.addEventListener('online', on); window.addEventListener('offline', off)
    return () => { window.removeEventListener('hashchange', change); window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)')
    const apply = () => { document.documentElement.dataset.theme = state.theme === 'system' ? media.matches ? 'dark' : 'light' : state.theme }
    apply(); media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [state.theme])
  const go = (next: Page) => {
    setPage(next); window.location.hash = '/' + next; window.scrollTo({ top: 0, behavior: 'instant' })
  }
  const openLesson = (day: number) => {
    update(current => ({ ...current, selectedDay: day, lastAttemptId: current.selectedDay === day ? current.lastAttemptId : null }))
    go('lessons')
  }
  return <div className="app-shell">
    <a className="skip-link" href="#main" onClick={event => { event.preventDefault(); document.getElementById('main')?.focus() }}>本文へ移動</a>
    <aside className="sidebar">
      <a className="brand" href="#/home"><span className="brand-icon"><BookOpen size={25} /></span><span><strong>{config.word} STUDY <i>14</i></strong><small>副業のススメ</small></span></a>
      <span className="nav-heading">MY LEARNING NOTE</span>
      <nav aria-label="メインメニュー">{navigation.map(({ id, title, icon: Icon }) => <a href={'#/' + id} key={id} className={page === id ? 'active' : ''} aria-current={page === id ? 'page' : undefined}><Icon size={19} />{title}</a>)}</nav>
      <div className="sidebar-footer"><p>{config.qualName}<br />非公式の学習補助教材</p><button onClick={() => setSettings(true)}><Settings size={16} />表示設定</button><span>Ver.1.0 · 重点学習教材</span></div>
    </aside>
    <div className="workspace">
      <header className="topbar"><a className="mobile-brand" href="#/home"><span className="brand-icon"><BookOpen size={22} /></span><strong>{config.word} STUDY <i>14</i></strong></a>
        <div className="breadcrumb">マイ学習ノート<span>/</span><strong>{navigation.find(item => item.id === page)?.title}</strong></div>
        <div className="top-actions"><span className="connection">{!online ? <WifiOff size={16} /> : <Check size={15} />}<span>{!online ? 'オフライン' : offlineReady ? 'オフライン利用OK' : '端末に学習を保存'}</span></span><button className="icon-button" aria-label="表示設定" onClick={() => setSettings(true)}>{document.documentElement.dataset.theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}</button></div>
      </header>
      <main id="main" tabIndex={-1}>
        <nav className="quick-links" aria-label="学習の補助メニュー">{navigation.slice(5).map(({ id, title, icon: Icon }) => <a href={'#/' + id} className={page === id ? 'active' : ''} key={id}><Icon size={15} />{title}</a>)}</nav>
        {status === 'error' && <div className="notice error" role="alert">学習記録を保存できませんでした。空き容量や設定を確認してください。<button onClick={retry}>保存を再試行</button></div>}
        {!online && <p className="notice" role="status">オフラインで学習中です。外部の出典ページはオンラインで開いてください。</p>}
        {page === 'home' ? <Home go={go} openLesson={openLesson} /> : page === 'lessons' ? <Lessons go={go} /> :
          page === 'quiz' ? <Quiz go={go} /> : page === 'review' ? <Review go={go} /> : page === 'flow' ? <Diagrams /> : page === 'practice' ? <Practice /> : page === 'apps' ? <AppLinks /> :
          page === 'stats' ? <Stats /> : page === 'glossary' ? <Glossary /> : page === 'sources' ? <Sources /> : <Help />}
        <footer className="page-footer"><span>副業のススメ · {config.title}</span><span role="status">{status === 'saved' && <Check size={12} />}{status === 'saved' ? 'この端末に保存済み' : status === 'saving' ? '保存中…' : '保存を確認してください'}</span></footer>
      </main>
    </div>
    <nav className="bottom-nav" aria-label="モバイルメニュー">{navigation.slice(0, 5).map(({ id, title, icon: Icon }) => <a href={'#/' + id} className={page === id ? 'active' : ''} aria-current={page === id ? 'page' : undefined} key={id}><Icon size={21} /><span>{title}</span></a>)}</nav>
    {refresh && <div className="update-toast" role="status"><p>教材・アプリの更新があります。{updateError && '更新できませんでした。接続を確認してください。'}</p><button disabled={status !== 'saved'} onClick={() => updateServiceWorker(true).catch(() => setUpdateError(true))}>保存して更新</button><button onClick={() => setRefresh(false)}>あとで</button></div>}
    {settings && <Dialog title="表示設定" close={() => setSettings(false)}>
      <p>カラーテーマ</p><div className="theme-options">{(['light', 'dark', 'system'] as const).map((theme, index) => <button key={theme} aria-pressed={state.theme === theme} onClick={() => update(current => ({ ...current, theme }))}>{['ライト', 'ダーク', '端末に合わせる'][index]}</button>)}</div>
      <button className="button secondary wide" onClick={() => { setSettings(false); go('help') }}>使い方とバックアップへ</button>
    </Dialog>}
  </div>
}
