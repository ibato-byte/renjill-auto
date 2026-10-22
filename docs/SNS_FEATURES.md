# SNS の機能を API で使う（調査メモ）

作成: 2026-10-22（依頼 #34）。**ここに書いた制限は、検索で確かめた範囲。実装する前に、週次PDCAが公式の最新ドキュメントで再確認すること**（この調査時は Meta の公式サイトを直接開けず、検索結果の要約で確認した）。

| 機能 | 状況 | 出典・メモ |
|---|---|---|
| Facebook ページのストーリーズ（写真） | API で可能。写真を `published=false` で `/page_id/photos` に上げ、その photo_id を `/page_id/photo_stories` へ | https://developers.facebook.com/docs/page-stories-api |
| Facebook ページのストーリーズ（動画） | API で可能。`/page_id/video_stories` で開始→アップロード→完了の3段階。解像度は540p以上と報告あり | 同上。権限は pages_manage_posts など（今のリール投稿と同じトークンで足りるか要確認） |
| Instagram カルーセル（写真・動画の複数枚） | API で可能。最大10枚。1投稿として数える | https://developers.facebook.com/docs/instagram-platform/content-publishing |
| Instagram ストーリーズ | 資料により書き方が割れている（ガイドは「非対応」、リファレンスは story のコンテナを作れると記載）。**実装前に、公式の最新版と試しの1回で確認** | 同上、IG User Media リファレンス |
| Instagram 投稿の上限 | 24時間で100件（古い資料は50）。いまの運用（1日数件）では問題なし | 同上 |
| Instagram トライアルリール | Meta 公式の API には見つからなかった（外部サービスは対応をうたうが、公式は未確認）。**API 投稿は不可とみなし**、代わりに「新しい型は少数のハッシュタグを変えて通常投稿し、数字で比べる」で代用。公式に載ったら採用 | |
| Instagram の固定コメント・投票スタンプ | API にない（確認できた範囲）。コメントの投稿自体はできるが、固定はアプリのみ | 代替：キャプションに問いかけを入れる |
| YouTube 再生リスト（シリーズ別） | API で可能（playlists.insert／playlistItems.insert。各50ポイント、1日の枠は初期1万） | https://developers.google.com/youtube/v3/determine_quota_cost |
| YouTube 固定コメント | コメント投稿は可能。**固定する API は見つからなかった**。代替：概要欄に同じ文を入れる | |
| YouTube コメントの読み取り | commentThreads.list（1ポイント）で可能 | 反省の自動化(C)に使う |

## 導入の順番（週次PDCAが1つずつ。1回の実行で足すのは1機能まで）
1. YouTube 再生リスト（影響が小さく、公開の見え方を壊さない）
2. Instagram カルーセル（あるある集・4コマ）
3. Facebook ストーリーズ（本編の告知）
4. Instagram ストーリーズ（試しの1回で対応を確認してから）

各機能は、`auto/post.py` の dry-run で内容を確かめ、テストを書き、main 向けの PR にして週1件の承認にまとめる。使えなかったものはこの表に理由を書く。
