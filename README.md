# renjill-auto — レンとジル 自動投稿リポジトリ

うさぎの課長レンと部下ジルの、セリフなしオフィスコメディ（COANA TOKYO）。
このリポジトリが毎日「今日の回」を描画し、Instagram / TikTok / YouTube / Facebook（リール）に投稿し、数値を記録します。

## 構成
- `rig/` … SVGリグ・エピソード台本（`ep/*.js`）・描画と音の生成
- `auto/schedule.json` … 投稿予定（Claudeの週次PDCAが更新）
- `auto/post.py` … 描画→投稿。`auto/posted.json` に結果を記録（同じSNSに二重投稿しない）
- `auto/facebook.py` … Facebook ページ「レンとジル」へのリール投稿（公式 Reels Publishing API）・権限確認・数値
- `tests/` … 単体テスト（`python -m unittest discover -s tests`。ネットワークに出ない）
- `auto/metrics.py` … 投稿済み動画の数値を `content/metrics.csv` に追記
- `.github/workflows/post.yml` … 12:00 / 18:00 / 19:00 JST に実行
- `.github/workflows/metrics.yml` … 毎朝 06:30 JST に実行
- `dist/` … 生成済み動画（`*_yt.mp4` エンドカード付き、`*_loop.mp4` ループ版）

## Secrets（Settings → Secrets and variables → Actions）
| 名前 | 取得元 |
|---|---|
| `IG_ACCESS_TOKEN` | Meta のシステムユーザー（ビジネスポートフォリオ renjill_office の renjill-auto）の期限なしトークン。Instagram と Facebook の両方に使う（[docs/setup/facebook-reels.md](docs/setup/facebook-reels.md)） |
| `IG_USER_ID` | 任意。Instagram の ID はページの `instagram_business_account` から毎回取る（トークンの期限チェックで一致を確認） |
| `MEDIA_TOKEN` | 公開リポジトリ renjill-media（Instagram が取りに来る動画・カバーの公開 URL）への書き込み |
| `TT_ACCESS_TOKEN` | TikTok for Developers（video.publish スコープ） |
| `YT_CLIENT_ID` / `YT_CLIENT_SECRET` / `YT_REFRESH_TOKEN` | Google Cloud（YouTube Data API v3 OAuth） |
| `FB_PAGE_ID` | 任意（使っていない。期限チェックで 1358515160686321 と一致するかを見るだけ）。`FB_PAGE_TOKEN` は使っていない（ページトークンは `IG_ACCESS_TOKEN` から毎回取る） |

## Instagram・Facebook は Meta Graph API で自動投稿（2026-10-21〜）
- GitHub Actions（`post.yml`）から投稿する。iMac・Chrome・Business Suite は使わない。
- Instagram リール：動画とサムネ（`dist/<ep>_thumb.jpg`）を公開リポジトリ renjill-media に置き（`MEDIA_TOKEN`）、`video_url`・`cover_url` で投稿。
- Facebook リール：ページ「レンとジル Ren & Jill」（ID 1358515160686321）のページトークンをシステムユーザーのトークンから取り、Reels Publishing API で投稿（サムネ付き）。
- 10/23・10/25・10/26・10/28・10/30 の Instagram・Facebook は Business Suite で予約済み（`posted.json` の `"bs-scheduled"`）なので API では出さない。
- 毎朝 6:00 の `tokens.yml` が `/debug_token` で有効か・期限・権限、ページと Instagram の ID を確認し、だめなら Hub で「エラー」＋メール。
- 接続テスト（読み取りのみ）：Actions → **check** → Run workflow（`date` を入れると投稿内容のドライラン）。
- 設定とトークンの作り直し：[docs/setup/facebook-reels.md](docs/setup/facebook-reels.md)。API が使えなくなったときの予備（Business Suite に手で予約）：[docs/setup/manual-mode.md](docs/setup/manual-mode.md)

## 公開までの前提
- Instagram：自分のアカウントなら審査不要で公開投稿できる。動画はファイルを直接送る（公開URL不要、リポジトリは非公開のまま）。
- YouTube：API準拠監査が通るまで、APIからの投稿は非公開になる。
- TikTok：監査が通るまで、APIからの投稿は本人のみ閲覧になる。またAPIでは文字入りのカバー画像を指定できない（動画の1コマのみ）ため、TikTokはTikTok Studioで文字入りカバーを付けて予約する運用にする。
監査が通るまでは、`schedule.json` の `platforms` を `["ig"]` にし、YouTube/TikTokは手動予約で運用する。
- Facebook（2026-10-20 追加）：自分のページへの投稿なので審査不要。Instagram と同じ loop 版の動画を、同じ時刻にリールとして公開する。キャプションは caption_en → caption_ja → コメントを誘う一言（`fb_cta`）→ ハッシュタグ3個以内（`fb_tag_sets`）。権限・設定がなければ Facebook だけ飛ばし、Automation Hub の「やること」に出す。失敗したら1回だけやり直す（公開の指示を送った後はやり直さない＝二重投稿しない）。
- 送る内容の確認だけ：`python auto/post.py --dry-run --date 2026-10-21 12:00`（または `DRY_RUN=1`）。API を呼ばず、posted.json も書かない。`--ignore-posted` を付けると投稿済みの SNS も表示する（ドライランだけ）。

## 週次PDCA（Claude）
毎週月曜 7:00 JST に `content/metrics.csv` と計測シート（Google スプレッドシート「レン＆ジル 計測シート」ID `1_BVp-ROGA8X6dwvSlc9QLlIVe4jkgX0uVpOHnssFN4c`。） を読み、`auto/schedule.json` と `rig/ep/` に次週分を追加する。
笑いの設計ルール：ゲームは1本に1つ／三段エスカレーション／引きと寄り／オチ前の間／オチの後のオチ。

## 品質ルール（2026-10-19 決定）
- **瞬間カット禁止**。寄り／引きは 0.35〜0.8 秒のなめらかなカメラ移動でつなぐ（`rig/ep/common.js` の `camMoveDur`）。QAが1フレームで画面が大きく変わる箇所を検出したら不合格。
- 投稿前に必ず `auto/qa.py` を通す（描画QA＋ファイルQA）。不合格の回は投稿しない。
- 毎朝06:00の preflight が3日以内の回を先に描画・QAし、NGなら Issue を立てる。
- 週次PDCAは `dist/<ep>_sheet.jpg` を目視で点検してから次週を確定する。
- **サムネの自動チェック（2026-10-20 追加）**：`rig/thumb.js` が毎回、①文字とチップがプロフィールのグリッド（中央3:4）に収まるか、②文字とチップが重ならないか、③グリッド内の文字の下に顔が写っているか、を測る。1つでもNGなら終了コード3/4で止まり、その回は投稿しない。
- **絵のチェック（2026-10-21 追加。NG なら schedule.json の thumb の t・cam・hook を変えて作り直す）**：
  - 終了コード6（THUMB_CUT_CHARACTER）：枠（1080x1920）の端で、体の一部だけが写って顔（鼻）が枠の内側にないキャラがいる（例：上の端に課長のあごとネクタイだけ）。
  - 終了コード7（THUMB_BUSY_BACKGROUND）：文字とチップを消した絵で、英語・日本語・チップそれぞれの範囲の背景の強いエッジ（机の天板の線など）が3%を超える。
  - 終了コード8（THUMB_NOT_ALIGNED）：作ったときの寸法（`dist/<ep>_thumb.json`）の直近6本の中央値と比べ、英語の見出しの幅（±8%）・高さ（0.55〜1.6倍）・位置（±60px）、チップの位置（±160px）が揃わない。
- **見出しの大きさをそろえる（2026-10-21 追加）**：文字数に関係なく、英語の見出しは枠の幅の約80%（860px。「CAMERA OFF」「APPROVED.」と同じくらい）、日本語の行は約50%（540px）になるよう文字の大きさを自動で合わせる（大きくするのは元の1.3倍まで）。1.3倍にしても英語の見出しが枠の幅の70%未満のときは終了コード5（THUMB_NARROW）で止まる → 見出しの言葉を少し長くする（例「5 PM!」→「IT'S 5 PM!」）。
- 手動で投稿・予約するときも、旧サムネを使い回さず、必ず `dist/<ep>_thumb.jpg`（チェック済み）を使う。

## 表記ルール
- 海外にも届くよう **英語を主、日本語を従**：サムネ上段は英語（12文字以内）、下段に日本語（10文字以内）。タイトル・キャプションも英語が先。
- **話数（EP.N）は載せない**（後で削除・順番変更しても矛盾しないように）。
- ハッシュタグは5個（Facebook は3個以内）。A/Bセットを交互に使い、2週連続で勝った方を標準にする。

## 名称
- 日本語表記は「レンとジル」（「＆」は使わない）。英語表記は「Ren & Jill」。
- バナー（X / YouTube / Facebook）は英語見出し「REN & JILL」＋日本語小見出し「レンとジル」（`rig/banners.html`、出力は `assets/`）。
- TikTokの表示名は 2026-10-26 以降に「レンとジル Ren & Jill」へ変更（7日に1回制限。リマインドをメールで送る）。

## 全自動のネタ作り→検査→ブラッシュアップ→投稿（2026-10-20 決定）
| いつ | だれが | なにを |
|---|---|---|
| 毎週月曜 7:00 | Claude（週次PDCA） | 振り返り → ネタ10案 → 採点で4本 → 台本 → `auto/brushup.py` で機械検査 → 24コマ表とサムネを目視 → 別のレビュー役が辛口チェック → 直す（最大3周）→ 合格分だけ schedule.json に登録 |
| 毎週木曜 7:00 | Claude（再検査） | 4日以内に出す回をもう一度 brushup → 目視 → 辛口チェック → 直す（最大2周）／差し替え／見送り |
| 毎朝 6:00 | GitHub Actions（preflight） | 3日以内の回を描画・QA・サムネQA。NGなら Issue とメール |
| 12:00 / 18:00 / 19:00 | GitHub Actions（post） | 直前にもう一度 QA。合格した回だけ投稿（Instagram・YouTube・Facebook。Instagram・Facebook は Meta Graph API） |
| 毎朝 6:30 | GitHub Actions（metrics） | 数値を集めて metrics.csv に追記 → 月曜の振り返りに使う（Business Suite で予約した回は投稿IDがないので計測なし） |

検査に落ちた回は出さない（枠が空いても、質の低い回は出さない）。

## トークンの警告と、出せなかった回の出し直し（2026-10-21 追加）
- **トークンの期限チェックは毎日 6:00**（`tokens.yml`）。期限が残り14日を切ったら Automation Hub で「要対応」、使えなくなったら「エラー」。
- **メール**：トークンが使えない・残り14日を切った・自動投稿や数値の収集がトークンのエラーで失敗した、のどれかがあると、Issue（ラベル `token-alert`）に @ibato-byte 付きで書き、GitHub の通知メールが届く（`auto/alerts.py`）。**同じ内容は1日1通まで**。
- **トークンが使えない間**：そのSNSだけ失敗（Facebook は見送り）し、ほかのSNSは投稿を続ける。出たSNSは `auto/posted.json` に記録される。
- **復旧後の出し直し**：Actions → post → Run workflow で `date`（例 `2026-10-23`）と `slot`（例 `18:00`）を入れる。その日の回のうち、`posted.json` にまだないSNSだけを出す（二重投稿しない）。
  - Instagram を手動で予約した回は `posted.json` で `"ig": "manual"` になっていて、自動では出さない。手動の予約が出なかった回を自動で出したいときは、その回の `"ig": "manual"` を消してから出し直す。
