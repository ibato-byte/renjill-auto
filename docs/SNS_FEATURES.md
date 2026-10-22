# SNS の機能を API で使う（調査メモ）

作成: 2026-10-22（依頼 #34）。**ここに書いた制限は、検索で確かめた範囲。実装する前に、週次PDCAが公式の最新ドキュメントで再確認すること**（この調査時は Meta の公式サイトを直接開けず、検索結果の要約で確認した）。

| 機能 | 状況 | 出典・メモ |
|---|---|---|
| Facebook ページのストーリーズ（写真） | API で可能。写真を `published=false` で `/page_id/photos` に上げ、その photo_id を `/page_id/photo_stories` へ | https://developers.facebook.com/docs/page-stories-api |
| Facebook ページのストーリーズ（動画） | **実装済み（依頼 #35）**。API で可能。`/page_id/video_stories` で開始→アップロード→完了の3段階。解像度は540p以上と報告あり | 同上。権限は pages_manage_posts など（今のリール投稿と同じトークンで足りるか要確認） |
| Instagram カルーセル（写真・動画の複数枚） | **実装済み（依頼 #35）。月2本まで**。写真2〜10枚。回の `platforms` に `ig_carousel` と `carousel.images` を入れたときだけ動く（絵がまだないので、今は出ない） | https://developers.facebook.com/docs/instagram-platform/content-publishing |
| Instagram ストーリーズ | **できる（2026-10-22 に依頼 #35 で確定・実装済み）**。コンテンツ公開 API で `media_type=STORIES` のコンテナを作り `media_publish`（2023-05 から。プロアカウント限定）。ステッカー（アンケート等）は API で付けられないので、動画の最後の画像に「どっち派？コメントで」を入れる。Meta の公式ページは当環境から開けず、依頼者が示した出典（https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/content-publishing ／ https://developers.facebook.com/blog/post/2023/05/16/introducing-stories-publishing-to-the-content-publishing-api-on-instagram/ ）に従った。最初の1回の結果は Hub の「ストーリーズ」の欄で確かめる | `auto/stories.py` の `post_ig_story` |
| Instagram 投稿の上限 | 資料により25件・50件・100件と割れている（24時間の移動窓）。**数字は信じず、投稿の直前に `GET /<IG_ID>/content_publishing_limit` で残りを見る**。残りが「出す件数＋5」より少なければ、ストーリーズ・カルーセルは見送る（リールを優先）。読めないときも見送る | `stories.ig_check_quota` |
| Instagram トライアルリール | Meta 公式の API には見つからなかった（外部サービスは対応をうたうが、公式は未確認）。**API 投稿は不可とみなし**、代わりに「新しい型は少数のハッシュタグを変えて通常投稿し、数字で比べる」で代用。公式に載ったら採用 | |
| Instagram の固定コメント・投票スタンプ | API にない（確認できた範囲）。コメントの投稿自体はできるが、固定はアプリのみ | 代替：キャプションに問いかけを入れる |
| YouTube 再生リスト（シリーズ別） | **実装済み（依頼 #35）**。回に `series` を書くと、その名前の再生リストに自動追加（なければ作る。いまの YouTube のトークンの権限で足りないときは失敗して続行＝本編は止めない）。API で可能（playlists.insert／playlistItems.insert。各50ポイント、1日の枠は初期1万） | https://developers.google.com/youtube/v3/determine_quota_cost |
| YouTube 固定コメント | コメント投稿は可能。**固定する API は見つからなかった**。代替：概要欄に同じ文を入れる | |
| YouTube コメントの読み取り | commentThreads.list（1ポイント）で可能 | 反省の自動化(C)に使う |

## 自動投稿への組み込み（2026-10-22、依頼 #35）
- 本編を出した回に、おまけを自動で付ける（`auto/stories.py`、`auto/post.py` の `post_extra`）。**失敗しても本編は止めず、失敗にも数えない**（Hub の結果に「ストーリーズ＝見送り／失敗」と出る）。
- ストーリーズ（Instagram・Facebook 同時）：その回の見どころ（冒頭〜オチ手前の3〜6秒。回の `story: {"start":秒,"dur":秒,"poll":"文"}` で変えられる）＋「続きはリールで／どっち派？コメントで」の画像（2秒）を1本の縦9:16の動画にして出す。`story: false` で出さない。
- 二重投稿の防止：出せたら `posted.json` に `ig_story`・`fb_story`・`yt_playlist`・`ig_carousel` の ID を残し、次からは飛ばす。本編が手動予約（`manual`・`bs-scheduled`）の回には付けない。
- Instagram の上限：出す前に `content_publishing_limit` で残りを確認（上の表）。
- 新しい投稿先を足すときも、同じ決まり（posted.json に記録・失敗しても本編を止めない・テストを書く）に従う。

## このあとの順番（週次PDCAが1つずつ）
1. ストーリーズの最初の1回の結果を確かめる（動画の見え方・上限の読み取り）。うまく出なければ原因を直す。
2. カルーセル用の絵（あるある4コマ・名場面集）を作り、月2本まで。
3. トライアルリール・固定コメントは API にないので代替（上の表）のまま。公式に載ったら採用。

各機能は、`auto/post.py --dry-run` で内容を確かめ、テストを書き、main 向けの PR にして週1件の承認にまとめる。
