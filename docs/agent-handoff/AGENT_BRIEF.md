# AGENT_BRIEF（最短実行版）

この文書は、担当エージェントへ渡す最短の運用要件です。

## ポリシー（固定ルール）

- **namespace 分離**: `world.concurrent.arakoshi.*` のみ使用。localStorage / IndexedDB は `concurrent-arakoshi-*` 系で分離
- **upstream 書き戻し禁止**: 逆方向同期は保留
- **上流衝突回避**: 追加は最小差分。既存本家挙動を壊さない。feature flag（設定）で分岐
- **i18n**: ハードコード文字列禁止。全文言は `translation.json`（6言語）で管理
- **エラーハンドリング**: Keep 解除時の Watch/Ack 解除は部分失敗許容。`cleanupFailed` フラグで再試行可能に保持

## 実装ステータス

| 機能 | ファイル | ステータス |
|------|---------|-----------|
| `postEditorVariant` + `PostEditorSwitch` | `app/src/components/Editor/PostEditorSwitch.tsx` | [実装済み]（分岐ポイントのみ・機能分岐なし） |
| `useDraftIndex` + `resolveEditorStorageKeys` | `app/src/hooks/useDraftIndex.ts` | [実装済み] |
| `CCPostEditor.draftKey` | `app/src/components/Editor/CCPostEditor.tsx` | [実装済み] |
| `EditorModal.draftKey` + ライフサイクル接続 | `app/src/components/EditorModal.tsx` | [実装済み] |
| `DraftList` | `app/src/components/DraftList.tsx` | [実装済み（未接続）] ← ルート/画面への組み込みなし |
| `draftCommunity` 設定 | Settings > Basic | [実装済み（未接続）] ← 送信フロー未統合 |
| `/drafts` ルート・ページ | — | [未実装] |
| 予約投稿 | — | [未実装] |

## 既定動作（Keep/Library 関連）

- User Keep: Ack は Watch と独立して実行する（subId 未解決時でも Ack は発火）
- Timeline Keep: Watch を managed として記録する
- Message Keep: Keep 後に Watch Author snackbar を表示。Watch 実行時は message アイテムの `managed.watchTargets` に記録し、Unkeep cleanup 対象とする
- `watchManaged` は既存アイテムの managed 更新のみ行い、不要な timeline エントリの自動生成は行わない
- Unkeep で外すのは `managed` に起因した Watch/Ack のみとする

## 次フェーズ

- `/drafts` ページ: ホーム同等のインライン `CCPostEditor` を追加し、`draftKey` 起点のその場保存を実装
- `DraftList` のルート組み込み: `/drafts` ページまたはサイドバーへの接続
- `draftCommunity` の送信フロー統合
- 予約投稿: ローカル保存 + 次回起動時再実行
- manual-acceptance: 実体ファイルなし・未再実施（次フェーズで再設計が必要）
