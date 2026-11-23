import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { config, lessons } from '../data'
import { importBackup, validateState } from './backup'
import { loadState, saveState } from './db'
import { initialState, type StudyState } from './study'

type Update = (change: (state: StudyState) => StudyState) => void
const Context = createContext<{
  state: StudyState; update: Update; status: 'saved' | 'saving' | 'error'; retry: () => void
} | null>(null)

export function StudyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialState)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [recovery, setRecovery] = useState<StudyState | null>(null)
  const [recoveryMessage, setRecoveryMessage] = useState('')
  const [status, setStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const current = useRef(state)
  const sequence = useRef(0)
  const mounted = useRef(true)
  const hydrate = () => {
    setLoadError(false)
    loadState().then(saved => {
      const checked = validateState(saved, lessons)
      if (mounted.current) { current.current = checked; setState(checked); setLoaded(true) }
    }).catch(() => { if (mounted.current) setLoadError(true) })
  }
  useEffect(() => {
    mounted.current = true
    hydrate()
    return () => { mounted.current = false }
  }, [])
  const persist = (next: StudyState) => {
    const id = ++sequence.current
    setStatus('saving')
    saveState(next).then(() => {
      if (mounted.current && sequence.current === id) setStatus('saved')
    }).catch(() => {
      if (mounted.current && sequence.current === id) setStatus('error')
    })
  }
  const update: Update = change => {
    const next = change(current.current)
    if (next === current.current) return
    current.current = next
    setState(next)
    persist(next)
  }
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (status !== 'saved') { event.preventDefault(); event.returnValue = '' }
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [status])
  if (loadError) return <main className="loading"><h1>学習記録を開けませんでした</h1><p>保存領域やデータ形式を確認してください。元の記録は上書きしていません。</p><button className="button" onClick={hydrate}>もう一度読み込む</button>
    <p>この版のバックアップがある場合は、検証してから記録を置き換えられます。</p>
    <label>復旧するバックアップJSON<input type="file" accept=".json,application/json" onChange={async event => {
      const file = event.target.files?.[0]; event.target.value = ''; setRecovery(null); setRecoveryMessage('')
      if (!file) return
      try {
        if (file.size > 20 * 1024 * 1024) throw new Error('20MB以下のJSONを選んでください。')
        setRecovery(importBackup(await file.text(), lessons))
      } catch { setRecoveryMessage('読み込めませんでした。形式・版・IDを確認してください。') }
    }} /></label>
    {recovery && <section className="notice"><p>バックアップを検証しました。元の記録をこの内容で置き換えます。</p>
      <button onClick={() => {
        saveState(recovery).then(() => { current.current = recovery; setState(recovery); setLoaded(true); setLoadError(false); setStatus('saved'); setRecovery(null) })
          .catch(() => setRecoveryMessage('保存できませんでした。保存領域とブラウザーの設定を確認してください。'))
      }}>バックアップで復旧する</button><button onClick={() => setRecovery(null)}>キャンセル</button>
    </section>}{recoveryMessage && <p role="alert">{recoveryMessage}</p>}
  </main>
  if (!loaded) return <main className="loading"><span className="loading-logo">{config.word[0]}</span><p>学習ノートを開いています…</p></main>
  return <Context.Provider value={{ state, update, status, retry: () => persist(current.current) }}>{children}</Context.Provider>
}
export function useStudy() {
  const context = useContext(Context)
  if (!context) throw new Error('StudyProvider is required')
  return context
}
