# WEB STUDY 14

ウェブデザイン技能検定3級向けの非公式学習補助PWA・重点学習教材。副業のススメ。

公開URL: https://watanabeshun0828-cell.github.io/web-study-14/

14単位・28節・独自問題120問（13日×8問＋最終日16問）。8本の実践課題、用語集、図解、誤答復習、日別・分野別成績、途中再開、章メモを収録。14日は学習の分割単位で、標準学習時間・必要期間ではありません。合格・受注・収益・学習効果を保証しません。公式団体の提供・公認・監修教材ではなく、人の専門家による監修は未実施です。

## 起動・検証

Node.js 22.12以上（CIは24）、npmを使用。

```sh
npm ci
npm run dev -- --port 4291
```

ローカルURL: http://127.0.0.1:4291/ 。Mac内のURLです。

```sh
npm run validate:content
npm test
npm run schema
npm run licenses
VITE_BASE_PATH=/web-study-14/ npm run build
npx playwright install chromium
VITE_BASE_PATH=/web-study-14/ npm run test:e2e
npm run preview -- --port 4191
```

本番ビルドの確認URL: http://127.0.0.1:4191/web-study-14/ 。ルート配信はVITE_BASE_PATH=/、任意サブディレクトリは先頭・末尾/付きの値でビルドします。ハッシュルーターを使用します。

## iPhone・オフライン

公開HTTPS URLをSafariで開き、共有メニューから「ホーム画面に追加」。初回はオンラインで「オフライン利用OK」になるまで待ってください。収録教材、画像、実践配布ファイル、学習記録はオフラインで使えます。外部の出典ページと他アプリへはオンラインで移動します。更新通知の「保存して更新」で更新し、IndexedDBの記録を引き継ぎます。iPhone実機の確認は未実施で、ChromiumでのiPhone相当表示と区別しています。

## 保存とバックアップ

専用DB名 `web-study-14` / DB構造版1 / 教材版2026.1。記録は端末内のIndexedDBに保存。自動同期・アカウント・広告・課金・生成AI API・外部への学習記録送信はありません。サイトデータ削除や端末の容量制限で消える可能性があります。「使い方・保存」でJSONを書き出して保管してください。読み込みではアプリ、版、ID、採点、途中位置、実践設定を検証し、確認後に全体を置き換えます。別アプリや未知の版は受け入れず、保存された未知の版は上書きせず復旧画面で保護します。

## 対象・収録範囲

確認日: 2026-11-23。適用: 2026年度第3回の要項・2025年掲載の試験細目。

制作課題8本はHTML/CSSの基礎が中心です。画像編集ソフトの全操作、マルチメディア制作、OSの全ファイル操作、機材・安全衛生の実地作業、指定環境での時間を計った制作はアプリ外で必要です。プレビューは隔離した静的見本で、提出ファイルの自動採点や本試験環境の再現ではありません。

## 教材の追加・更新

- `src/data/day01.json`〜`day14.json`: 講義・問題・計算記録。
- `src/data/works.json`: 実践と自己確認項目。`public/practice/`: 配布課題。
- `src/data/glossary.json` / `sources.json`: 用語と出典、各referenceIdsの対応。
- `src/data/config.json`: タイトル・対象版・専用アプリID。
- `docs/course.schema.json`: 教材スキーマ。`npm run schema`で再出力。
- `docs/coverage.md` / `content-provenance.md`: 対応範囲・生成経緯・未確認点。

既存の問題・章・実践IDは変更しないでください。意味が変わる教材版やID変更では、旧版を保持したうえで`study.ts`と`backup.ts`に明示的な移行処理とテストを追加します。現在は初版のみを受け入れます。

## 公開とライセンス

`.github/workflows/deploy.yml`はmainへのpushまたは手動実行で、教材検証、単体テスト、本番ビルド、ブラウザーテストを通してGitHub Pagesへ配信します。リポジトリのSettings → Pages → SourceをGitHub Actionsに設定します。ビルドbaseはconfigure-pagesのbase_pathから設定するためリポジトリ名変更にも対応します。

自動生成した`public/THIRD_PARTY_NOTICES.txt`は配布物にも含みます。`docs/licenses.json`にはインストールされた実際の版と確認結果を記録します。ライブラリのライセンスは各表示に従います。本アプリのソース・独自教材・ユーザー提供画像への第三者向け利用許諾をライブラリのライセンスから推測しないでください。キャラクターの来歴は`docs/content-provenance.md`、ファイル情報は`docs/assets.json`を参照してください。
