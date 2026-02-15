# AGENT_BRIEF（最短実行版）

この文書は、担当エージェントへ渡す最短の運用要件です。

## 守ること（固定）

- `world.concurrent.arakoshi.*` namespaceのみを使用する  
- localStorage / IndexedDB のキーも `concurrent-arakoshi` 系で分離する  
- `upstream` への書き戻しは行わない（逆方向同期は保留）

## 各対象種別の既定動作

- User Keep: Ack は Watch と独立して実行する（subId 未解決時でも Ack は発火）
- Timeline Keep: Watch を managed として記録する
- Message Keep: Keep 後に Watch Author snackbar を表示。Watch 実行時は message アイテムの `managed.watchTargets` に記録し、Unkeep cleanup 対象とする
- `watchManaged` は既存アイテムの managed 更新のみ行い、不要な timeline エントリの自動生成は行わない
- Unkeep で外すのは `managed` に起因した Watch/Ack のみとする

## 画面追加

- `/library`（実装上のルート名）を追加（User / Community / Message のタブ切替）
- 旧要件では `/keep` 表記のため、`/library` を実体として扱う
- Message は「省略・展開」表示を必須とする

## 下書き・予約投稿

- 下書きは複数管理
- Pin をサポート
- 作成日・更新日ソート
- 予約投稿は次回起動時再実行を行う
- /drafts 画面にホーム同等のインライン `CCPostEditor` を追加（その場で下書き保存）
- インライン投稿は同一ページ上で完結し、送信ボタンは下書きの新規作成/更新として扱う
- 保存時は既存エントリと連動して `draftKey` ベースで永続化し、入力欄は保存後に初期化して連続入力しやすくする
- Draft 削除時は `draftKey` 単位の localStorage キー（draft/draftEmojis/draftMedias）を全て破棄する
- 予約投稿は `inFlightRef` で重複送信を防止する

## エラーハンドリング

- Keep解除時の Watch/Ack 解除は部分失敗を許容
- 失敗分は `cleanupFailed` フラグ付きでアイテムを保持し、再試行可能な状態で残す

## i18n

- Keep/Unkeep スナックバー文言は全て `ui.messageActions` 配下の i18n キーで管理する（6 言語対応済み）
- ハードコード文字列は残さない

## 上流衝突回避ルール（本家再導入時）

- 追加・変更は「分離層」と「フォーク固有層」を明確に分ける
- 既定機能は本家 https://github.com/concrnt/concrnt-world に近い状態を維持し、フォーク固有変更は最小差分で追加する
- フィーチャートグル（設定/フラグ）で挙動分岐し、将来の差し戻しを容易にする
- 差分の衝突が懸念される場合は、`app/src` より `docs` で承認フローを明文化してから作業する

## Phase 11 完了条件

- watchSubs → watchTargets マイグレーションが起動時に再現的にログ出力される
- 主要シナリオで二重購読・欠損購読がないこと（manual-acceptance 20 項目 Pass）
- `world.concurrent.arakoshi.*` namespace 以外への KV 書き込みがないこと

## 下書き・投稿エディタ方針（再整理）

- 投稿エディタは「original」と「arakoshi」の2系統を切替可能にし、デフォルトは arakoshi 現状の挙動を維持する
- 下書きは、ホーム/リストの「その場編集」導線と投稿モーダル導線を両立させる
  - `/drafts` から編集しても `postModal` 経由で同一編集体験を使う
  - ホーム画面から投稿モーダル経由で下書き呼び出しできることを優先する
  - インライン一覧では保存済み下書きを即時開けること
- 下書きには「宛先（コミュニティ）」メタを保持する
  - 下書き保存時に投稿先コミュニティを保持し、表示時に見えるようにする
  - 設定モード（草稿コミュニティ）であっても本番コミュニティに直接紐づけない
  - 実投稿時のみ本来の投稿先を解決して送信する
- 既存公開ルートと衝突しないように、`draftKey`・`draftDestination` は `concurrent-arakoshi` 名前空間で管理
- 下書きコミュニティは任意で作成/選択できるが、保存・表示・送信パラメータ拡張を明示的に分離する

## 実装済みコンポーネント

### `postEditorVariant` 設定と `PostEditorSwitch`

- `Preference.postEditorVariant`: `'original' | 'arakoshi'`（デフォルト: `'arakoshi'`）
- Settings > Basic に Select UI を追加済み
- `app/src/components/Editor/PostEditorSwitch.tsx`: variant を読み取り CCPostEditor を描画するラッパー
- `EditorModal` は `PostEditorSwitch` 経由でエディタを表示（desktop/mobile 両方）

### 下書きシステム: `DraftMeta` / `useDraftIndex()`

- `app/src/hooks/useDraftIndex.ts`:
  - `DraftMeta` 型: `{ id, title, createdAt, updatedAt, pinned, destination?: { timelineIDs } }`
  - `draftStorageKeys(draftKey)`: prefixed key 名を返す（draft / draftEmojis / draftMedias / destination）
  - `useDraftIndex()`: CRUD フック（`createDraft`, `updateDraft`, `deleteDraft`）
  - `generateDraftId()`: `Date.now()-<random>` 形式
- localStorage キー:
  - `concurrent-arakoshi-drafts-index` — DraftMeta[] インデックス
  - `concurrent-arakoshi-draft:{id}` — 本文
  - `concurrent-arakoshi-draftEmojis:{id}` — 絵文字辞書
  - `concurrent-arakoshi-draftMedias:{id}` — メディア配列
  - `concurrent-arakoshi-draftDest:{id}` — 宛先タイムライン ID 配列

### `CCPostEditor.draftKey` プロップ

- `draftKey?: string` を追加。指定時は localStorage キーが `concurrent-arakoshi-*` namespace にプレフィックスされる
- 未指定時は従来の `'draft'`/`'draftEmojis'`/`'draftMedias'` キーを使用（後方互換）
- `draftKey` 指定時は `destTimelines` の保存/復元 (`concurrent-arakoshi-draftDest:{key}`) も有効化

### `EditorModal.OpenOptions.draftKey`

- `EditorModal.open({ draftKey: 'xxx' })` で特定下書きをモーダルに読み込み可能
- `PostEditorSwitch` に `key={draftKey}` を付与し、draftKey 変更時にクリーンリマウントを保証

### `draftCommunity` 設定

- `Preference.draftCommunity?: string` — 草稿コミュニティのタイムライン ID（メタデータのみ、Watch/購読は行わない）
- Settings > Basic に TextField を追加済み

### `DraftList` コンポーネント

- `app/src/components/DraftList.tsx`: 下書き一覧表示
- ソート: pinned → updatedAt desc
- アクション: Edit（モーダル起動）/ Delete / Pin toggle
- 宛先タイムライン ID を Chip で表示

## 次フェーズ追加条件（提案）

- `/drafts` にホーム同等のエディタを追加し、`draftKey` 起点のその場保存（下書き追加/更新）を実装
- `Case 21`（DraftsPage インライン投稿）を manual-acceptance に追加・合格
