# 手動予約モード（予備。2026-10-21 に解除）

最終更新：2026-10-21

**いまは使っていません。** Instagram・Facebook は GitHub Actions から Meta Graph API で投稿しています（設定と確認は [facebook-reels.md](facebook-reels.md)）。
Meta の API が長く使えなくなったときだけ、この予備のしくみで Business Suite に予約します。

## これまでの経緯
- 2026-10-21 午前：Meta の開発者機能を使えなかったため、Instagram・Facebook を「手動予約モード」にして、iMac の Chrome の Claude が Business Suite に予約していた。
- 2026-10-21 午後：ビジネスポートフォリオ renjill_office（1623311255865570）のシステムユーザー renjill-auto の期限なしトークンで、API 投稿に戻した（`auto/mode.json` の `manual_platforms` を `[]`）。
- 【2026-10-22】Business Suite の予約はやめました。10/23〜10/30 の5回の `"bs-scheduled"` は外してあり、API で出します。この文書は API が使えなくなったときの予備の手順です。

## 予備として使うとき
1. Claude に「Instagram・Facebook を手動予約モードにして」と伝える（`auto/mode.json` の `manual_platforms` に `"ig"`・`"facebook"` を入れる PR を作り、テスト合格でマージ）。
   - その SNS は API で投稿・計測・トークン確認をしません（エラー・メールにもしない）。
2. Actions → **manual** → **Run workflow**。その週（月曜 12:00〜次の月曜 11:59）の回の素材（`<回>.mp4`・`ig_<回>_cover.jpg`・`ig_<回>.txt`・`fb_<回>.txt`・`manifest.json`・`一覧.txt`）が、非公開の成果物 `manual-YYYYMMDD`（7日で消える）にできる。manifest に入れた回は `posted.json` に `bs-scheduled` と記録される。
3. 回ごとに Meta Business Suite で予約する（時刻は一覧のとおり）。
   - **Instagram**（リール）：動画 `<回>.mp4`、カバー `ig_<回>_cover.jpg`、投稿文は `ig_<回>.txt` の区切り線より下。
   - **Facebook**（ページ「レンとジル Ren & Jill」ID 1358515160686321 のリール）：同じ `<回>.mp4`、投稿文は `fb_<回>.txt` の区切り線より下。Instagram 側の予約に Facebook は足せないので、別に予約する。
4. 手で予約した回は、manual を `scheduled` に回の名前（スペース区切り）を入れて実行すると `posted.json` に `manual` と記録されます。
5. API に戻すときは `manual_platforms` を `[]` に戻す（Claude に伝える）。記録済みの回は API で二重に出しません。
