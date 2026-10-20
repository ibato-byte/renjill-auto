# Facebook リールの自動投稿：ページトークンの設定（オーナー作業）

レンとジルの Facebook ページに、Instagram と同じ動画を **Facebook リール** として自動投稿します（`auto/facebook.py`）。
投稿には、Facebook ログイン経由の **ページのアクセストークン** と、次の3つの権限が必要です（Meta の Reels Publishing API の要件）。

| 権限 | 用途 |
|---|---|
| `pages_show_list` | 自分が管理するページの一覧を見る |
| `pages_read_engagement` | ページの情報・反応を読む |
| `pages_manage_posts` | ページに投稿する（リールの公開） |

- トークンを作る人は、ページ「レンとジル」で **コンテンツを作成できる**（管理者など）こと。
- 自分のアプリ（renjill-auto）で自分のページに投稿するだけなので、アプリ審査（App Review）は不要です（開発モードのままで可）。
- 権限がない間は、**Facebook だけ飛ばして** Instagram・YouTube などは今までどおり投稿します。
- 毎週月曜 9:00 の「トークンの期限チェック」（`tokens` ワークフロー）が、権限と期限を確認して Automation Hub に出します。
- 値（トークン）は、チャット・メール・Issue に貼らないでください。GitHub の Secrets にだけ入れます。

## 手順（10分ほど）

### 1. ユーザートークンに権限を足す（グラフAPIエクスプローラ）
1. PC のブラウザで https://developers.facebook.com/tools/explorer/ を開く（Facebook にログインしている状態で）。
2. 右側の **「Meta App」** で `renjill-auto` を選ぶ。
3. **「ユーザーまたはページ」** で **「ユーザートークン」** を選ぶ。
4. **「許可を追加」**（Permissions）の欄に、次を追加する：
   `pages_show_list`、`pages_read_engagement`、`pages_manage_posts`
   - すでに入っている `instagram_basic`・`instagram_content_publish` などの Instagram の権限は **外さない**（Instagram の投稿が止まります）。
   - 数値の収集（再生数など）も取りたいときは `read_insights` も追加する（任意）。
5. **「Generate Access Token」** を押す。Facebook の確認画面が出たら：
   - 「現在のページのみ」または「すべてのページ」で **「レンとジル」にチェック** が入っていることを確認
   - 権限はすべて「はい」のまま **「保存」／「次へ」→「完了」**

### 2. 長期トークンにする（アクセストークンデバッガー）
1. エクスプローラ上部の「アクセストークン」欄の右にある **ⓘ（情報）** →「**アクセストークンツールで開く**」を押す
   （または https://developers.facebook.com/tools/debug/accesstoken/ にトークンを貼って「デバッグ」）。
2. 画面下の **「アクセストークンを延長」** を押す → 表示された長期トークンをコピー（どこにも保存・送信しない）。

### 3. ページトークンを取り出す
1. グラフAPIエクスプローラに戻り、「アクセストークン」欄に **2. の長期トークン** を貼る。
2. 上の入力欄に `me/accounts?fields=id,name,tasks,access_token` と入れて **「送信」**。
3. 結果の中の `"name": "レンとジル"`（または Ren & Jill）の行を見る：
   - `tasks` に `CREATE_CONTENT` が入っていること
   - `id` …ページID（**FB_PAGE_ID** に入れる）
   - `access_token` …ページトークン（**FB_PAGE_TOKEN** に入れる）。長期ユーザートークンから作ったページトークンは期限なしになります。
4. 念のため、そのページトークンを https://developers.facebook.com/tools/debug/accesstoken/ で「デバッグ」し、
   **タイプ＝Page**、**有効期限＝なし**、**スコープに上の3つ** があることを確認。

### 4. GitHub の Secrets に入れる
1. https://github.com/ibato-byte/renjill-auto/settings/secrets/actions を開く。
2. `FB_PAGE_TOKEN` の **鉛筆（Update）** を押して、3. のページトークンを貼り **「Update secret」**（なければ「New repository secret」で作る）。
3. `FB_PAGE_ID` も同じように、3. の `id` を入れる（なくても動きますが、別ページへの誤投稿を防ぐため入れてください）。

### 5. 確かめる（読み取りだけ・投稿はしない）
1. https://github.com/ibato-byte/renjill-auto/actions/workflows/tokens.yml を開き、**「Run workflow」→「Run workflow」**。
2. 1分ほどで Automation Hub の「トークンの期限チェック」に **Facebook=OK（期限なし）** と出れば完了。
   「権限・設定なし」のままなら、「やること」に足りないもの（例：`pages_manage_posts`）が出ます。

## 二重投稿を防ぐための確認（1回だけ）
Instagram アプリで「リールを Facebook にもシェア」が有効だと、Instagram に手動で予約した回が Facebook にも出て、自動投稿と二重になります。
Instagram アプリ → プロフィール → 右上の ≡ → **アカウントセンター** → **アカウント間でシェア** → Instagram → **Facebook へのリールの共有をオフ** にしてください。
（予約済みの投稿に個別で「Facebook にシェア」をオンにしている場合も、オフにしてください。）

## 参考（公式）
- Reels Publishing API: https://developers.facebook.com/docs/video-api/guides/reels-publishing
- 動画の公開（ページトークンと権限）: https://developers.facebook.com/docs/video-api/guides/publishing/
- アクセストークンデバッガー: https://developers.facebook.com/tools/debug/accesstoken/
