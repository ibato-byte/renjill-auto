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
- `auto/sns_policy.json` … SNS の多言語方針のスイッチ（YouTube の説明の公式サイトの行・TikTok だけの繁体字／韓国語ハッシュタグ・公式サイトの一覧 episodes.json）。項目を false にすると、その変更だけ止まる
- `auto/episodes_json.py` … 公式サイト（https://renjill.coana.co.jp/）のエピソード一覧 `renjill-media/episodes.json` を作る。題・一言は4言語（ja・en・zh・ko。zh・ko は予定表の回の `site_i18n`）、カバー・動画・YouTube の ID つき。投稿のあとに毎回、今のファイルとまとめて書き直す（前の ID や回は消さない。失敗しても投稿は止めない）。`python auto/episodes_json.py` で中身だけ表示
- `.github/workflows/post.yml` … 12:00 / 18:00 / 19:00 JST に実行
- `.github/workflows/metrics.yml` … 毎朝 06:30 JST に実行
- `dist/` … 生成済み動画（`*_yt.mp4` エンドカード付き、`*_loop.mp4` ループ版）

## SNS の多言語方針（2026-10-31 オーナー決定）
- アカウントは各SNSに1つのまま（言語別のアカウントは作らない）。キャプションは「日本語＋英語の一言」のまま（セリフのない作品なので十分）。
- YouTube だけタイトル・説明を多言語に（`auto/growth.py` の LOCALE_DESC：ja・ko・zh-Hant・es・pt。簡体字は入れない）。説明の冒頭に公式サイト https://renjill.coana.co.jp/ の行。
- TikTok だけ、キャプションの末尾に繁体字・韓国語のハッシュタグを合計3つまで（#兔子 #療癒 #토끼。文字数の上限を超えるなら足さない）。Instagram・Facebook・Threads は変えない。
- 投稿の曜日・時刻・素材・流れは変えない。確認は `DRY_RUN=1 python auto/post.py --date YYYY-MM-DD --slot HH:MM`（説明・キャプション・episodes.json の本数が出る）。

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
- Instagram・Facebook は全部 API で出す（2026-10-22 から Business Suite の予約は使わない。10/23・10/25・10/26・10/28・10/30 の `"bs-scheduled"` も外した）。Facebook は投稿直後に Graph API でカバーが付いたか確かめ、付いていなければ自動で付け直す。
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

## 作業用BGM（YouTube の長尺・横長。2026-11-13 追加）
ねらい：短尺（言葉なしのコメディ）で知ってもらい、長尺の作業用BGMで視聴時間を積み上げる（YouTube の収益化の条件は 2027-02 から「登録者1000人＋年8000時間」）。
- **いつ**：水・土の 20:23（`.github/workflows/bgm.yml`）。曜日・長さ・公開範囲は `auto/bgm_config.json`。AI を使わない・無料。1回 20〜30 分（リポジトリを非公開に戻すと月 200〜270 分ほど無料枠を使う）。
- **1本ごとに別の作品にする**（同じ型の量産にしない）：
  - 音楽＝`rig/bgm/music.py` がその回の seed（日付）で毎回あたらしく作る（調・速さ・コード進行・旋律・楽器）。数式で合成するので外の素材を使わない＝著作権の申し立てが来ない。
  - 絵＝`rig/bgm/scene.js`（キャラは本番の `rig.js`）。テーマ6種（時間帯×天気）を順番に、部屋の色も毎回変える。1時間を4章に分け、15分ごとに時計が進んで2匹のようすが変わる。章の切り替えは4秒かけて溶かす（瞬間カット禁止）。画面に文字は入れない。
  - 題名・説明・曲名の一覧（YouTube のチャプター）もその回のもの。
- **検査**（`auto/bgm_qa.py`。1つでも NG なら出さない）：音（長さ・音量 -15 LUFS・ピーク・無音・こもり／きんきん・左右）／曲のかぶり（回の中・前の回）／絵（大きさ・ループのつなぎ目・ちらつき・止まっていないか・明るさ・章ごとの違い）／表紙／題名・説明・チャプター／前の回と同じテーマでないか。結果は `content/bgm/<日付>_qa.json`、一覧の絵は `content/bgm/<日付>_sheet.jpg`。
- **機械で測れないこと**：「曲として心地よいか」は耳でしか分からない。1本目はオーナーが聞いて OK を出した（2026-11-14）ので、`privacy: public`（公開）で出す。限定公開で出した回を公開にするのは Actions → bgm → Run workflow の `publish=true`。週次PDCAは `content/bgm/` の一覧の絵と YouTube の数字（視聴維持・平均再生時間）を見て、`music.py`・`scene.js`・テーマを直す。
- **手で動かす**：Actions → bgm → Run workflow（`date`・`force=true`・`privacy`・`minutes`）。手元で試す：`python auto/bgm.py build --date 2026-11-14 --minutes 8 --keep`。
- **曲調（2026-11-14 追加。オーナー依頼：海・和・あげあげ・バラードなど、いろんなパターンを）**：テーマごとに `style` を持つ。lofi（ゆったり）／sea（海辺：ギターとマリンバ・波の音）／wa（和：琴・尺八ふう・平調子）／club（あげあげ：4つ打ち）／ballad（しっとり：ピアノとストリングス）。
  音楽（`music.py` の STYLES）だけでなく、絵も同じ曲調に合わせる（`scene.js`）：窓の外（海とヨット／もみじの庭と障子／ネオンの街／星空・冬は雪）、小物（トロピカルドリンク／湯のみと行灯／スピーカーとネオン／ろうそく）、衣装（麦わら帽子と花／鉢巻きとかんざし／ヘッドホンとサングラス／マフラー）、動き（ノリノリ・窓の外を見る）。
  キャラの顔と体つきは変えない（付け足すだけ）。あげあげの回も、光は強く点滅させない（色をゆっくり変える）。新しい曲調の1本目も、そのまま公開で出す（オーナー指示 2026-11-14。`new_style_privacy: public`。unlisted にすると1本目だけ限定公開になる）。新しい曲調を足すときは `music.py`・`scene.js`・`bgm.py`（THEMES・GENRE など）の3か所。試作：`python auto/bgm.py build --date 2026-11-21 --minutes 8 --keep --theme dance_night`。
- 公式サイト：公開した回は `renjill-media/bgm.json` と表紙 `bgm_<日付>_thumb.jpg` に書き出す（`media_sync`）。サイト側は 03 エピソードの下の「作業用BGMも、あります。」の欄に新しい順で4本まで出る（renjill-site PR #6、2026-11-14 反映）。
- 記録：`auto/bgm_state.json`（出した回・YouTube の ID・曲の指紋。同じ日は二重に出さない）。Hub の id は `renjill-bgm`。

