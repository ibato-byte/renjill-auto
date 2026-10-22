# 無料で自動投稿できる他の場所の調査（依頼 #38-3、2026-10-22）

方針：お金がかかることは今はやらない（オーナー決定 2026-10-22）。X（旧Twitter）の有料 API は使わない。

| 場所 | 無料か | 自動投稿の条件 | 判断 |
|---|---|---|---|
| Threads | 無料（動画 MP4・24時間で250件まで） | Threads の権限（threads_content_publish）つきトークン | **追加済み**（auto/growth.py。Secrets `THREADS_ACCESS_TOKEN` を登録すると動く（ユーザー ID は `/me` から自動で取る。`THREADS_USER_ID` は任意）。未登録の間は見送るだけ） |
| Pinterest | 無料 | アプリの審査（Trial → Standard。画面録画つき）が通るまで、作ったピンは自分にしか見えない（[公式](https://developers.pinterest.com/docs/key-concepts/access-tiers/)） | **見送り**：審査が人手で数週間かかることがあり、通るまで効果がない。あとで必要になったら審査の申請から |
| Bluesky | 利用は無料。動画の上限は資料により違う（3分・100MB、または10分・300MB。公式の上限確認 API で毎回確かめられる） | アプリパスワード（または OAuth）、メール認証済みアカウント | **追加済み**（PR #23。YouTube に出した回のリンクカードを投稿。Secrets `BSKY_HANDLE`・`BSKY_APP_PASSWORD` がなければ見送るだけ） |
| X（旧Twitter） | 新規の無料枠なし（有料の従量課金） | — | **やらない**（お金がかかる） |
