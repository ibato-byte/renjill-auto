# X（@renjill_office）への投稿（2026-11-15 から）

- X の自動投稿の仕組み（API）は有料なので使わない。Claude が翔太さんの Chrome から手で出す（無料）。オーナー了承済み（2026-11-15）。
- 説明文は `post.x_caption(p, defaults)`（X の数え方で 280 以内。英語・日本語の一言＋タグ 2 個＋ゲームの案内）。手で書かない。試験 tests/test_x_caption.py。
- 動画は renjill-media の `<日付8桁>_<ep>.mp4`。上げる前に `flicker.find()` で、ちかちかが無いことを確かめる。
- 手順：X のタブで https://x.com/compose/post を開く → 動画は「タブからタブへ直接送る」（プロジェクトの資料「TikTokの投稿のやり方」の B）で `input[data-testid="fileInput"]` に入れる → 説明文を入れる → Post → プロフィールで確かめる。
- 出したら `auto/posted.json` のその回に `"x": "<投稿の番号>"`・`"x_at"` を書く（出たかどうかの記録）。
- 過去の回は、1 日に何本も出すと迷惑な投稿に見えるので、毎日の新作＋過去 1 本ずつ。
