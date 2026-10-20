# 手動予約モード（Instagram・Facebook）と、完全自動に戻す手順

最終更新：2026-10-21

## いまの状態（2026-10-21〜）

- オーナーの個人 Facebook「衣鳩翔太」を削除しました（30日後に完全削除）。そのため、古い Facebook ページ・古いビジネスポートフォリオ・Meta のアプリ renjill-auto も使えなくなります。
- 新しいもの：
  - 仕事用アカウント「Ibato Shota」
  - ビジネスポートフォリオ「Shota Ibato丨衣鳩 翔太」（business_id `825871460529757`）
  - Facebook ページ「レンとジル Ren & Jill」（ID `1386940331166810`）
  - Instagram @renjill_office をこのポートフォリオに入れ、新しいページとつないでいます。
- 仕事用アカウントでは Meta の開発者機能を使えません。そのため、**Instagram と Facebook は API で投稿しない「手動予約モード」** にしています（`auto/mode.json` の `manual_platforms`）。
- TikTok・YouTube など、ほかの SNS は今までどおり自動です。

| | 手動予約モード中の動き |
| --- | --- |
| 自動投稿（`post.yml`） | Instagram・Facebook には API で出さない（失敗にもしない）。ほかの SNS は自動 |
| 素材づくり（`manual.yml`） | 週次PDCA が `auto/schedule.json` を push したときと、月曜 9:30（保険）に、その週（月曜 12:00〜次の月曜 11:59）の回の素材と `manifest.json` を作り、非公開の成果物 **manual-YYYYMMDD**（7日で消える）にする。manifest に入れた回は `posted.json` に `bs-scheduled` と記録する |
| 予約（Chrome） | オーナーの iMac の Chrome で動く Claude のスケジュールタスク「レンとジル Business Suite 自動予約（Instagram・Facebook）」（月・火 10:47／16:47）が、最新の manual-YYYYMMDD の manifest.json を読んで Business Suite に予約する。見張り：「レンとジル 自動予約のリマインドと見張り」（日・月・火 20:33） |
| 数値の収集（`metrics.yml`） | Instagram・Facebook は API で取らない（「手動予約モード中」で正常終了）。数字は Chrome の Claude が Drive の CSV「レンとジル_BusinessSuite週次_YYYYMMDD」（列 date,platform,metric,value,post_title）に毎週書く |
| トークンの期限チェック（`tokens.yml`） | Instagram・Facebook は「手動予約モード中」と表示し、エラーにもメールの対象にもしない |

## manifest.json（Chrome 側が読む）

```json
{
  "week_start": "2026-10-26T12:00:00+09:00", "week_end": "2026-11-02T11:59:00+09:00",
  "artifact": "manual-20261026", "run_url": "https://github.com/ibato-byte/renjill-auto/actions/runs/…",
  "posts": [
    {"datetime_jst": "2026-10-27T12:00:00+09:00", "ep": "…", "title": "…", "video": "….mp4", "cover_ig": "ig_…_cover.jpg",
     "platforms": ["ig", "facebook"], "caption_ig": "caption_en→caption_ja→コメントを誘う一言→ハッシュタグ", "caption_fb": "fb_*.txt と同じ"}
  ],
  "excluded": [{"ep": "…", "reason": "QA など不合格（予約しない）"}]
}
```

- `platforms` は、手動予約モードの SNS のうち、`posted.json` で `manual`（手で予約済み）や投稿ID がないもの。
- 同じ週に作り直しても中身は同じです（`bs-scheduled` の回も残る）。**Chrome 側は、Business Suite の予約一覧で同じ回がすでにあれば予約しない**。
- 週の途中で回の中身（動画・キャプション）を直しても、すでに予約した Business Suite の投稿は変わりません。差し替えが必要なときは、見張りのタスクかオーナーが Business Suite で入れ替えます。

## 手で予約するとき（Chrome が使えないときなど）

1. Actions → **manual** の最新の実行ページを開き、いちばん下の **Artifacts** から `manual-YYYYMMDD` をダウンロードして展開する。
2. `一覧.txt` を見て、回ごとに Meta Business Suite で予約する（時刻は一覧のとおり）。
   - **Instagram**（リール）：動画は `<回>.mp4`、カバー画像は `ig_<回>_cover.jpg`、投稿文は `ig_<回>.txt` の区切り線より下。
   - **Facebook**（ページ「レンとジル Ren & Jill」のリール）：動画は同じ `<回>.mp4`、投稿文は `fb_<回>.txt` の区切り線より下。
   - Business Suite では、Instagram 側で予約したリールに Facebook を足せません。**Facebook は別に予約する**。
3. 予約が済んだら記録する。GitHub の renjill-auto → **Actions** → **manual** → **Run workflow** → `scheduled` に回の名前を入れて（スペース区切り。例 `papers2 mug2`）実行する。Claude に「予約した」と伝えるだけでもかまいません。
   - `auto/posted.json` に `manual` と記録されるので、完全自動に戻したあとも、同じ回を二重に投稿しません。

## 完全自動に戻す手順（目安：個人 Facebook の完全削除から30日後）

> Meta の画面の名前や場所は変わることがあります。見つからないときは、その画面のスクリーンショットを Claude に送ってください。
> Claude はパスワードの入力・規約への同意・本人確認はしません（オーナーが行います）。

1. **新しい個人の Facebook アカウントで、開発者として登録する**
   - https://developers.facebook.com/ にログイン → **始める**（開発者として登録）→ 電話番号・メールの確認。
2. **アプリを作り、ポートフォリオ 825871460529757 に入れる**
   - **マイアプリ** → **アプリを作成** → ユースケースは「その他」→ 種類は **ビジネス** → アプリ名（例 `renjill-auto-2`）→ ビジネスポートフォリオで **Shota Ibato丨衣鳩 翔太** を選ぶ → 作成。
   - アプリの **プロダクトを追加** で **Instagram**（Instagram API with Facebook Login）と **Facebook ログイン** を追加する。
   - ビジネス設定（https://business.facebook.com/settings/ ）→ **アカウント** → **アプリ** に、そのアプリが入っていることを確かめる。
3. **システムユーザーを作り、ページと Instagram の長期トークンを発行する**
   - ビジネス設定 → **ユーザー** → **システムユーザー** → **追加**（名前 `renjill-bot`、役割は **管理者**）。
   - そのシステムユーザーで **アセットを割り当てる** → ページ **レンとジル Ren & Jill**（ID 1386940331166810）と Instagram アカウント **@renjill_office** に、フルコントロール（コンテンツの作成・管理）を付ける。アプリ（手順2）にも割り当てる。
   - **新しいトークンを生成** → アプリを選ぶ → 有効期限は **なし（期限なし）** → 権限：
     `pages_show_list`・`pages_read_engagement`・`pages_manage_posts`・`instagram_basic`・`instagram_content_publish`・`instagram_manage_insights`・`read_insights`・`business_management`
   - できたトークン（システムユーザーのトークン）は、画面を閉じると二度と見られません。下の手順4ですぐに使います。
   - **ページのトークン**：グラフAPIエクスプローラ（https://developers.facebook.com/tools/explorer/ ）で、アクセストークンの欄にシステムユーザーのトークンを貼る → `1386940331166810?fields=access_token,name` を **送信** → 結果の `access_token` がページトークン（期限なし）。
   - **Instagram の ID**：同じく `1386940331166810?fields=instagram_business_account` を送信 → `instagram_business_account.id`（17841… で始まる数字。Instagram の設定画面でも確認できる）。
4. **GitHub の Secrets を差し替える**（renjill-auto → **Settings** → **Secrets and variables** → **Actions**）
   | Name | 入れる値 |
   | --- | --- |
   | `IG_ACCESS_TOKEN` | システムユーザーのトークン（手順3） |
   | `IG_USER_ID` | Instagram の ID（17841…） |
   | `FB_PAGE_TOKEN` | ページのトークン（手順3） |
   | `FB_PAGE_ID` | `1386940331166810` |
5. **確かめる**：Actions → **tokens** → **Run workflow**。Automation Hub の「トークンの期限チェック」で、Instagram が「期限 なし」、Facebook が「OK」になることを確かめる（この時点ではまだ手動予約モードなので、「手動予約モード中」と出ます。その場合は先に手順6をして、もう一度実行）。
6. **手動予約モードを解除する**：Claude に「手動予約モードを解除して」と伝える（`auto/mode.json` の `manual_platforms` を `[]` にする PR を作り、テスト合格でマージします）。
   - 解除したあとは、Instagram・Facebook も今までどおり自動で投稿され、数値も集まります。
   - すでに手動で予約した回（`posted.json` で `manual`）は自動では出さないので、二重投稿にはなりません。
   - 解除したら、Hub の「レンとジル 手動予約の素材」は台帳から外してかまいません（Claude がやります）。
