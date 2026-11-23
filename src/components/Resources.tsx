import { useState, type ChangeEvent } from 'react'
import { Download, ExternalLink, Upload } from 'lucide-react'
import glossary from '../data/glossary.json'
import { config, lessons, sources } from '../data'
import { exportBackup, importBackup } from '../lib/backup'
import { useStudy } from '../lib/store'
import type { StudyState } from '../lib/study'
import { Dialog, Panel } from './Shared'

export function Glossary() {
  const [query, setQuery] = useState('')
  const items = glossary
  const search = query.normalize('NFKC').toLowerCase().trim()
  const matching = items.filter(item => (item.term + item.description).normalize('NFKC').toLowerCase().includes(search))
  return <>
    <div className="page-intro"><p className="eyebrow">SMALL DICTIONARY</p><h1>用語を、すぐ確認。</h1><p>講義に出てくる専門語を、短い説明で確認できます。</p></div>
    <label className="search-label">用語・説明を検索<input type="search" placeholder="知りたい用語を入力" value={query} onChange={event => setQuery(event.target.value)} /></label>
    <p className="small muted" role="status">{matching.length}件</p>
    <div className="glossary-list">{matching.map(item => <Panel key={item.id}><h2>{item.term}</h2><p>{item.description}</p></Panel>)}</div>
    {!matching.length && <Panel><p>一致する用語がありません。別の言葉で検索してください。</p></Panel>}
  </>
}
export function Sources() {
  return <><div className="page-intro"><p className="eyebrow">SOURCES & COVERAGE</p><h1>出典と、この教材の範囲。</h1><p>確認日 {config.checkedAt} · {config.targetVersion}</p></div>
    <Panel><h2>非公式の学習補助教材・重点学習教材</h2><p>講義・設問・解説・図・架空事例は本制作で作成したものです。AI作成で、人の専門家による監修は未実施です。</p><p className="notice">{config.scopeNotice}</p><p>{config.practiceNotice}</p><p>14日は分割単位です。合格・受注・収益・学習効果を保証しません。公式過去問・市販問題・非公開問題は収録していません。</p></Panel>
    <div className="source-list">{sources.map(source=><Panel key={source.id}><span className="tag">{source.role}</span><h2>{source.title}</h2><dl><div><dt>確認日</dt><dd>{source.checkedAt}</dd></div><div><dt>適用版</dt><dd>{source.appliesTo}</dd></div><div><dt>参照箇所</dt><dd>{source.location}</dd></div></dl><p>{source.notes}</p>{source.url&&<a className="source-link" href={source.url} target="_blank" rel="noopener noreferrer">資料を開く<ExternalLink size={14}/></a>}</Panel>)}</div>
    <Panel><h2>素材とライセンス</h2><p>案内役はユーザーの制作資料に付属した「ミニススメくん」の元PNGです。再生成や絵の加工は行っていません。画像の来歴と確認範囲は配布ソースのdocs/content-provenance.mdに記録しています。</p><p>図は独自に作成し、UIアイコンにはLucide（ISCライセンス）を使用しています。公式ロゴや資格バッジは使っていません。</p><a className="source-link" href={import.meta.env.BASE_URL+'THIRD_PARTY_NOTICES.txt'} target="_blank" rel="noopener noreferrer">ライブラリの版・ライセンス表示<ExternalLink size={14}/></a></Panel>
  </>
}
export function Help() {
  const { state, update, status } = useStudy()
  const [pending, setPending] = useState<StudyState | null>(null)
  const [message, setMessage] = useState('')
  const download = () => {
    const blob = new Blob([exportBackup(state)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = config.appId + '-' + new Date().toISOString().slice(0, 10) + '.json'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMessage('バックアップをダウンロードしました。保存先のファイルを確認してください。')
  }
  const read = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setMessage('')
    try {
      if (file.size > 20 * 1024 * 1024) throw new Error('20MB以下のファイルを選んでください。')
      const imported = importBackup(await file.text(), lessons)
      setPending(imported)
    } catch (error) {
      setMessage(error instanceof Error && !('issues' in error) ? error.message : 'このアプリの対応する版のバックアップではありません。形式・版・IDを確認してください。')
    }
  }
  return <>
    <div className="page-intro"><p className="eyebrow">HOW TO USE</p><h1>使い方と、学習記録の保存。</h1><p>学習は、登録なしでこの端末から。</p></div>
    <Panel><h2>基本の使い方</h2><ol><li>ホームで学習する日を選び、講義を読みます。すべての日を自由に選び直せます。</li><li>練習では条件を読み、選択肢または数値を入力します。実践課題にはPC操作や自己確認もあります。</li><li>回答を確定すると解説が開きます。数値の前提や端数処理も確認します。</li><li>間違えた問題は復習へ集まります。正解すれば復習待ちから外れます。</li><li>図解と実践課題で、講義と仕事の場面のつながりを確認します。</li></ol>
      <p>14日は学習を分ける単位です。合格・受注・収益・学習効果を保証するものではありません。</p>
    </Panel>
    <Panel><h2>iPhoneのホーム画面で使う</h2><p>このアプリのHTTPS URLをSafariで開き、共有メニューの「ホーム画面に追加」を選びます。最初はオンラインで開き、画面上の「オフライン利用OK」を確認してください。</p>
      <p>保存済みの教材と進捗はオフラインで使えます。出典の外部サイトはオンラインで開きます。更新の通知が出たら、学習記録の保存完了後に「保存して更新」を選びます。</p>
      <p className="small muted">GitHub Pagesの公開URLを利用します。Macの127.0.0.1はMac内の確認用で、iPhoneから同じURLには接続できません。</p>
    </Panel>
    <Panel><h2>学習記録のバックアップ</h2>
      <p>途中回答・誤答・履歴・メモ・表示設定をJSONで書き出せます。読み込みでは、アプリ名、形式の版、教材の版、問題・章・実践課題のIDを検証します。</p>
      <p className="small">書き出したJSONは端末のファイルとして保管してください。読み込みは現在の学習記録全体を置き換えます。</p>
      <div className="backup-actions"><button className="button" disabled={status !== 'saved'} onClick={download}><Download size={17} />JSONを書き出す</button>
        <label className={`button secondary file-button ${status !== 'saved' ? 'disabled' : ''}`}><Upload size={17} />JSONを読み込む<input type="file" accept=".json,application/json" disabled={status !== 'saved'} onChange={read} aria-label="バックアップJSONを選択" /></label></div>
      {message && <p className="notice" role="status">{message}</p>}
    </Panel>
    <Panel><h2>保存と取り扱い</h2><p>記録はこのアプリ専用のIndexedDBに保存します。端末間の自動同期はありません。サイトデータの削除、保存領域の制限、ブラウザやOSによる回収で失われる可能性があるため、必要に応じてバックアップしてください。</p><p>メモには学習内容を書き、実物の請求書や個人情報は入力しないでください。実践課題は練習用の架空データで行います。</p></Panel>
    {pending && <Dialog title="バックアップを読み込みますか" close={() => setPending(null)}>
      <p>現在の記録を、検証済みのバックアップ全体で置き換えます。</p>
      <p>読了 {pending.readSections.length}節 · 完了した練習 {pending.attempts.length}回 · メモ {Object.values(pending.notes).filter(Boolean).length}件</p>
      <div className="dialog-actions"><button className="button secondary" onClick={() => setPending(null)}>キャンセル</button><button className="button" onClick={() => {
        update(() => pending); setPending(null); setMessage('バックアップを読み込みました。')
      }}>検証済みの記録で置き換える</button></div>
    </Dialog>}
  </>
}
