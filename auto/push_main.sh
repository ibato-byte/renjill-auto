#!/usr/bin/env bash
# 保存した結果を main に push する。ほかの処理が先に保存していたら、追いついてからやり直す（最大5回）。
# auto/posted.json がぶつかったら、両方の記録を合わせる（union）。投稿済みの記録を失わないため。
set -u
for i in 1 2 3 4 5; do
  git push origin HEAD:main && exit 0
  echo "push に失敗（$i/5 回目）。main に追いついてやり直します"
  git fetch -q origin main || { sleep $((i * 3)); continue; }
  if ! git rebase -q origin/main; then
    # 衝突したファイルを解決する（ours＝main 側、theirs＝今回保存した側）
    for f in $(git diff --name-only --diff-filter=U); do
      if [ "$f" = "auto/posted.json" ]; then
        git show ":2:$f" > "$RUNNER_TEMP/posted_main.json"
        git show ":3:$f" > "$RUNNER_TEMP/posted_mine.json"
        python3 auto/merge_posted.py "$RUNNER_TEMP/posted_main.json" "$RUNNER_TEMP/posted_mine.json" "$f" || { git rebase --abort; exit 1; }
        git add "$f"
      else
        git checkout --theirs -- "$f" && git add "$f" || { git rebase --abort; exit 1; }
      fi
    done
    GIT_EDITOR=true git rebase --continue || { git rebase --abort; exit 1; }
  fi
  sleep $((i * 2))
done
echo "5回やり直しても push できませんでした"
exit 1
