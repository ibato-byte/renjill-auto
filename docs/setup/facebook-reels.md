# Instagram・Facebook の自動投稿（Meta Graph API）：トークンの設定と確認

最終更新：2026-10-21（Business Suite の予約をやめ、GitHub Actions から API で投稿する形に戻した）

Instagram リールと Facebook リールは、GitHub Actions（`post.yml`、12:00／18:00／19:00）から **Meta Graph API** で投稿します。iMac・Chrome は使いません。

| | いまの設定 |
| --- | --- |
| Meta アプリ | renjill-auto（ID 1107271625215495） |
| ビジネスポートフォリオ | renjill_office（ID 1623311255865570） |
| システムユーザー | renjill-auto（ページ・Instagram・アプリにフルアクセスで割り当て済み） |
| Facebook ページ | 「レンとジル Ren & Jill」（ID **1358515160686321**。コードの `auto/facebook.py` の `PAGE_ID`） |
| Instagram | @renjill_office（ID はページの `instagram_business_account` から毎回取る） |
| トークン | システムユーザーの **期限なし** トークン → Secrets の `IG_ACCESS_TOKEN`（Instagram と Facebook の両方に使う） |

※ 以前のページ 1386940331166810 は重複していたため削除済み。Secrets の `FB_PAGE_TOKEN` は使っていません（消してもかまいません）。`FB_PAGE_ID`・`IG_USER_ID` は「トークンの期限チェック」で一致するかを見るだけです（違っていても、コードの値・ページから取った値で投稿します）。

## 必要な権限（システムユーザーのトークン）

| 権限 | 用途 |
|---|---|
| `pages_show_list`・`pages_read_engagement`・`pages_manage_posts` | Facebook ページのトークンを取り、リールを公開する |
| `business_management` | ビジネスポートフォリオのページ・Instagram を扱う |
| `instagram_basic`・`instagram_content_publish` | Instagram のリールを公開する |
| `instagram_manage_insights` | Instagram の数値を取る |

## 投稿のしかた（自動）

- **Instagram リール**：動画（`dist/<ep>_loop.mp4`）とサムネ（`dist/<ep>_thumb.jpg`、チェック済み）を公開リポジトリ `ibato-byte/renjill-media` に置き（`MEDIA_TOKEN`）、その公開 URL を `video_url`・`cover_url` に入れて `/{IG の ID}/media`（`media_type=REELS`）→ `/media_publish`。
- **Facebook リール**：`GET /1358515160686321?fields=access_token` でページトークンを取り、Reels Publishing API（start → アップロード → サムネ `/{video_id}/thumbnails`（`is_preferred=true`）→ finish）で公開。サムネを付けられなかったときは公開後にもう一度試し、それでもだめなら Automation Hub の「やること」に出します（動画は公開済み）。
- `auto/posted.json` に投稿 ID を記録し、同じ SNS に二度出しません。`"bs-scheduled"`（Business Suite で予約済み）・`"manual"`（手で予約済み）も「出した」とみなします。
- 投稿のたびに Automation Hub の「レンとジル 自動投稿」に、回・SNS ごとの結果を記録します。
- トークン・権限がだめなときは、その SNS だけ飛ばして他の SNS は続け、オーナーにメール（GitHub の通知。1日1通まで）を送ります。

## 毎日のトークンチェック（`tokens.yml`、毎朝 6:00）

`/debug_token` で次を確かめ、Automation Hub の「トークンの期限チェック」に出します（読み取りのみ。値は出しません）。

- 有効か（だめなら「エラー」＋メール）
- 期限（期限なしなら `Meta トークン=期限なし`。残り14日以下なら「要対応」＋メール）
- 上の7つの権限がそろっているか（足りなければ「エラー」＋メール）
- ページ 1358515160686321 のページトークンが取れるか、Instagram の ID が取れるか（Secrets の値と一致するかも表示）

## トークンを作り直すとき（オーナー作業）

> Claude はパスワードの入力・規約への同意・本人確認はしません。トークンの値はチャット・メール・Issue に貼らず、GitHub の Secrets にだけ入れてください。

1. https://business.facebook.com/settings/ → ビジネスポートフォリオ **renjill_office** → **ユーザー** → **システムユーザー** → **renjill-auto**。
2. **アセットを割り当てる** で、ページ「レンとジル Ren & Jill」・Instagram @renjill_office・アプリ renjill-auto がフルアクセスになっていることを確かめる。
3. **新しいトークンを生成** → アプリ **renjill-auto** → 有効期限 **なし** → 上の7つの権限にチェック → 生成。
4. https://github.com/ibato-byte/renjill-auto/settings/secrets/actions → `IG_ACCESS_TOKEN` の鉛筆（Update）→ 貼り付けて **Update secret**。
5. Actions → **tokens** → **Run workflow**。Hub の「トークンの期限チェック」が `Meta トークン=期限なし`・`Meta 権限=すべてOK` になれば完了。

## 接続テスト（読み取りのみ・投稿しない）

Actions → **check** → **Run workflow**（`date` に日付を入れると、その日の回の投稿内容をドライランで表示。API で投稿はしない）。トークンの種類・期限・権限、ページ、Instagram の ID と投稿の上限、`renjill-media` への書き込み権限を確かめます。

## 二重投稿を防ぐための確認（1回だけ）

Instagram アプリで「リールを Facebook にもシェア」が有効だと、Instagram の投稿が Facebook にも出て、Facebook の自動投稿と二重になります。
Instagram アプリ → プロフィール → ≡ → **アカウントセンター** → **アカウント間でシェア** → Instagram → **Facebook へのリールの共有をオフ**。

## 参考（公式）
- Reels Publishing API: https://developers.facebook.com/docs/video-api/guides/reels-publishing
- Instagram のリール公開（`cover_url`）: https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media
- アクセストークンデバッガー: https://developers.facebook.com/tools/debug/accesstoken/
