# concurrent-arakoshi-world

## 0. 既存 concrnt-world 側で、使うべき“既にある骨格”

- リポジトリは pnpm workspace（`app`, `client`, `cfm`）で動いている。開発は `pnpm i` → `pnpm dev` が基本である。([GitHub](https://github.com/concrnt/concrnt-world "GitHub - concrnt/concrnt-world: Concrnt is a next-gen decentralized social network platform designed to make your world richer."))

- Watch（ウォッチ）は既に実装があり、`client.api.subscribe/unsubscribe` で「タイムライン → サブスクリプション（リスト）」へ出し入れしている。([GitHub](https://raw.githubusercontent.com/concrnt/concrnt-world/develop/app/src/components/WatchButton.tsx "https://raw.githubusercontent.com/concrnt/concrnt-world/develop/app/src/components/WatchButton.tsx"))

- Ack（連絡先/フォロー相当）も既にあり、`user.Ack()/user.UnAck()` でオンオフしている。([GitHub](https://raw.githubusercontent.com/concrnt/concrnt-world/develop/app/src/components/AckButton.tsx "https://raw.githubusercontent.com/concrnt/concrnt-world/develop/app/src/components/AckButton.tsx"))

- 投稿エディタ（`CCPostEditor`）は現状単一の下書きを `usePersistent('draft', ...)` で永続化している。ここを拡張すれば「複数下書き」「予約投稿」へ繋がる。([GitHub](https://raw.githubusercontent.com/concrnt/concrnt-world/develop/app/src/components/Editor/CCPostEditor.tsx "https://raw.githubusercontent.com/concrnt/concrnt-world/develop/app/src/components/Editor/CCPostEditor.tsx"))

- 設定（Preference）は `client.api.writeKV('world.concurrent.preference', ...)` でサーバ側 KV に保存する作りである。つまり「ローカルのみ」か「同期する」かを機能ごとに選べる。([GitHub](https://raw.githubusercontent.com/concrnt/concrnt-world/develop/app/src/context/PreferenceContext.tsx "https://raw.githubusercontent.com/concrnt/concrnt-world/develop/app/src/context/PreferenceContext.tsx"))

この時点で見える要点は単純。  
改造は **(1) Keep/Bookmark の永続ストア** と **(2) 既存 Watch/Ack/Message 描画への差し込み** の二本柱で成立する。

---

## 1. Keep と Bookmark を“同じ器”に載せる

Keep 画面とブックマーク機能を分けると破綻しやすい。  
内部モデルを **Library（保管庫）** として一本化し、UI 名称だけ「Keep」「Bookmark」を使い分ける。

### Library に入る対象（3種）

- **User**（ユーザー：`ccid@hint` を保持）
- **Community**（コミュニティ：実体は timeline。`timeline.fqid` を保持）
- **Message**（メッセージ：`author + messageID` を保持）

### LibraryItem が持つ属性（Keep/Mark/Pin/タグ/フォルダ/メモ）

```ts
type ItemKind = 'user' | 'timeline' | 'message'

type UserRef = { ccid: string; hint?: string }
type TimelineRef = { fqid: string }
type MessageRef = { author: string; messageId: string; hint?: string }

type DisplayRule = 'normal' | 'blur' | 'omit' | 'hide'

type WatchTarget = { fqid: string; subId: string }

type Managed = {
  watchTargets?: WatchTarget[]
  ack?: boolean
}

type LibraryItem = {
  id: string
  kind: ItemKind
  ref: UserRef | TimelineRef | MessageRef
  keptAt: number
  updatedAt: number
  pinned?: boolean
  marked?: boolean
  folderId?: string | null
  tags?: string[]
  memo?: string
  display?: DisplayRule
  managed?: Managed
}
```

これで「Keep」「Mark」「ピン」「タグ/フォルダ/メモ」が一つのデータに宿る。  
ブックマークはこの器を「編集できる UI」として提供するだけでよい。

---

## 2. 情報の流れ：Keep を起点に Watch/Ack を従属させる

**コミュニティやユーザーをキープから外した場合はウォッチや Ack が外れる**。  
ただし `Keep` 開始前に手動で Watch していた対象を消さないために、`Keep が原因で付与した Watch/Ack` だけを外す。  
`managed` 記録が要件。

### Keep 操作のデフォルト

- **Community / User**
  - Keep と同時に Watch のワンアクションを主ボタンに
  - User の場合は Ack 追加導線を併設可能
- **Message**
  - Keep のみを基本
  - 希望あれば Watch を選択可能  
    - 投稿者 home timeline を Watch  
    - 投稿先コミュニティ（postedTimelines）を Watch（複数選択可）

### Unkeep

- `LibraryItem.managed.watchTargets` があれば `unsubscribe`
- `LibraryItem.managed.ack === true` なら `user.UnAck()`

この managed 記録がある限り、Keep 外しても手動 Watch/Ack は残る。

---

## 3. 画面設計：concrnt-world のルーティングへ落とす

`App.tsx` にルートを追加するのが最短。

### 3.1 Keep 画面（必須）

- ルート例：`/library`（旧要件 `/keep` の表現）
- タブ：**Users / Communities / Messages**
- 表示：`pinned` 上位 → `marked` → 更新順/作成順
- 各行アクション：
  - Keep 解除
  - Watch トグル（User/Community）
  - Ack トグル（User）
  - Mark
  - Pin
  - 編集（タグ/フォルダ/メモ）

### 3.2 ホーム画面の扱い（Watch の表示）

既存構造と整合するため、まずは `ListPage` を「ホーム（Watch）」として語彙を寄せる。

### 3.3 コミュニティ画面

`TimelineHeader` の `secondaryAction`/`useRawSecondaryAction` に Watch を追加。

### 3.4 ピン留めを全画面へ

`LibraryItem.pinned` に集約し、全画面で同等仕様にする。  
User/Community/Message/Draft の Pin は「Keep + Pin」へ紐付く。

---

## 4. ブックマーク機能：タグ/フォルダ/メモ と一括 Watch/Ack

- タグ、フォルダ、メモを Keep 対象に付与
- 未分類は `folderId === null`
- タグ/フォルダ単位で Home TL / コミュニティをリスト add/remove
- タグで表示制御（blur/omit/hide）へ反映

```ts
type Folder = { id: string; name: string; order: number; pinned?: boolean }
type TagRule = { tag: string; display?: DisplayRule }
```

---

## 5. メッセージ表示：既存部品で省略/展開

`OneLineMessageView` を利用して省略表示を作る。  
描画時は `message.author` と `message.postedTimelines` から表示ルールを決定し、`MessageContainer` 側で `MessageViewBase` へ切替。

`MessageActions` に Keep/Bookmark のメニューを追加。

---

## 6. 下書き：複数化と表示（実装済み — 案B採用）

- `CCPostEditor` に `draftKey?: string` プロップを追加
- `draftKey` 指定時は localStorage キーが `concurrent-arakoshi-draft:{id}` / `concurrent-arakoshi-draftEmojis:{id}` / `concurrent-arakoshi-draftMedias:{id}` にプレフィックスされる
- 未指定時は従来の `'draft'`/`'draftEmojis'`/`'draftMedias'` キーを使用（後方互換）
- `useDraftIndex()` フック（`app/src/hooks/useDraftIndex.ts`）で DraftMeta[] を管理: id/title/createdAt/updatedAt/pinned/destination
- `EditorModal.open({ draftKey: id })` でモーダルから特定下書きを開く
- `DraftList` コンポーネント（`app/src/components/DraftList.tsx`）で一覧表示・Edit/Delete/Pin 操作
- 宛先メタ（`destination.timelineIDs`）を Chip で表示

## 6.1 下書きページインライン保存（ホーム同等）（未実装）

- `/drafts` 画面にホーム画面と同等の `CCPostEditor` を追加し、モーダルを経由せずその場で下書き保存できる経路を追加する。
- 下書き保存/編集体験はホーム側の `showEditorOnTop` / `showEditorOnTopMobile` 設定を共有し、使い勝手を揃える。
- エディタは `draftKey` 単位で状態を保持し、保存時に `DraftContext` エントリと localStorage が更新されるようにする。
- `streamPickerInitial` / `streamPickerOptions` / `defaultPostHome` はホーム側実装を流用して、投稿先の初期値を一貫化する。

---

## 7. 予約投稿

- `ScheduledPost` をローカル保存
- 起動時に期限切れを順次投稿
- 運用中は `setInterval` で定期チェック
- 投稿本体は `CCPostEditor` の既存ロジックを再利用

---

## 8. 永続化ポリシー

- Library は同期前提なら `client.api.writeKV`（キー分離を検討）
- Draft / ScheduledPost はまずローカル（localStorage/IndexedDB）前提

---

## 9. 実装順（推奨）

1. LibraryContext（データモデル＋永続化）
2. Keep 画面（/library）とメニュー追加
3. User/Community/Message への Keep 導線
4. Keep→Watch/Ack 同時操作 + managed 記録
5. Unkeep→managed のみ解除
6. タグ/フォルダ一括操作
7. 表示制御を MessageContainer に適用
8. Drafts + Scheduled posts

---

## 10. 事故りやすい罠

- managed なしで Keep 解除時に Watch/Ack を全解除すると事故る
- 表示制御は Message 描画ホットパスなので Map 参照で O(1) を維持
- KV 連打は重いため debounce / 差分更新を徹底する

## 11. 上流衝突回避原則

- フォーク固有実装は原則「最小差分」を優先する
- 既存本家挙動を壊す変更は避け、必要時は feature flag（設定）で安全に切替できる構造にする
- ルーティング・メニュー・設定の差分は専用キーや独立フローで分離し、将来の cherry-pick/meld を容易にする
- マイグレーション対象データは、既存キーと `concurrent-arakoshi` 系で分離し、衝突を防止する

## 12. 追加実装方針（最新メモ）

### 12.1 投稿エディタ切替（実装済み）

- `Preference.postEditorVariant`: `'original' | 'arakoshi'`（デフォルト: `'arakoshi'`）
- Settings > Basic に Select UI を追加
- `PostEditorSwitch`（`app/src/components/Editor/PostEditorSwitch.tsx`）が variant に応じて CCPostEditor を描画
- `EditorModal` は `PostEditorSwitch` 経由でエディタを表示（desktop/mobile 両方）
- 現時点では両 variant が同じ CCPostEditor を描画。将来の分岐ポイントとして確立

### 12.2 下書き導線の統合（実装済み）

- `EditorModal.open({ draftKey: id })` でモーダルから特定下書きを開く
- `DraftList` コンポーネントで一覧表示、Edit ボタンでモーダル起動
- 宛先コミュニティは `DraftMeta.destination.timelineIDs` に保持し、一覧で Chip 表示
- `CCPostEditor` が `draftKey` 指定時に `concurrent-arakoshi-draftDest:{key}` へ destTimelines を保存/復元

### 12.3 下書きコミュニティモード（設定のみ実装済み）

- `Preference.draftCommunity?: string` — 草稿コミュニティのタイムライン ID を設定可能
- Settings > Basic に TextField を追加（メタデータのみ、Watch/購読は行わない）
- 実際の下書き保存/送信フローとの統合は未実装（次フェーズ）
