"""FLOTO（MyKomon → Drive・freee 自動格納）の freee・Google の連携の状態を、トークンの期限チェックに載せる。

freee のリフレッシュトークンは使うたびに入れ替わるため、ここで直接使うと毎朝の格納（automation-hub の
floto-mykomon-sync）と取り合いになる。そこで、格納が毎回確かめて Hub の台帳に書く「Google 連携」「freee 連携」を
HUB_TOKEN（automation-hub の読み取り）で読み、その結果と新しさを確かめる。秘密の値は扱わない。
"""
import base64, datetime as dt, json

import requests

REGISTRY = "https://api.github.com/repos/ibato-byte/automation-hub/contents/registry/floto-mykomon-sync.json"
STALE_DAYS = 3  # 毎日動く。これより古い記録は「確認できていない」とみなす
FIX = {
    "Google 連携": "automation-hub の docs/setup/floto-mykomon-sync.md の2（サービスアカウントの鍵 GOOGLE_SA_KEY の作り直し、共有ドライブ「FLOTO」への追加）",
    "freee 連携": "automation-hub の docs/setup/floto-mykomon-sync.md の3（freee の認可コードを FREEE_AUTH_CODE に登録して Run workflow。リフレッシュトークンは自動で保存し直される）",
}
SHORT = {"Google 連携": "Google", "freee 連携": "freee"}


def fetch(hub_token, http=requests):
    """台帳を読む。読めなければ None"""
    r = http.get(REGISTRY, headers={"Authorization": f"Bearer {hub_token}", "Accept": "application/vnd.github+json"}, timeout=30)
    if r.status_code != 200:
        return None
    return json.loads(base64.b64decode(r.json()["content"]).decode())


def status(entry, now):
    """台帳から (kpis, actions, problems) を作る。kpis は "ラベル=値" の文字列"""
    if entry is None:
        return [f"{SHORT[k]}（FLOTO）=確認失敗" for k in FIX], ["FLOTO の台帳（automation-hub の registry/floto-mykomon-sync.json）を読めない。HUB_TOKEN の権限を確かめる"], ["FLOTO"]
    values = {k["label"]: str(k["value"]) for k in entry.get("kpis", []) if k.get("label") in FIX}
    last = (entry.get("last_run") or {}).get("at")
    age = (now - dt.datetime.fromisoformat(last.replace("Z", "+00:00"))).days if last else None
    kpis, actions, problems = [], [], []
    for label, fix in FIX.items():
        v = values.get(label)
        name = f"{SHORT[label]}（FLOTO）"
        if v is None or v == "未登録":
            kpis.append(f"{name}=初期設定待ち")  # やることは FLOTO のカードに出ている
        elif v != "OK":
            kpis.append(f"{name}={v}"); problems.append(name)
            actions.append(f"FLOTO の {SHORT[label]} 連携が使えない（{v}）。{fix}")
        elif age is None or age > STALE_DAYS:
            kpis.append(f"{name}=確認できず"); problems.append(name)
            actions.append(f"FLOTO の自動格納が{'' if age is None else f'{age}日'}動いていないため {SHORT[label]} 連携を確認できない。Automation Hub の「MyKomon → Drive・freee 自動格納」と Actions の実行履歴を確かめる")
        else:
            kpis.append(f"{name}=OK")
    return kpis, actions, problems
