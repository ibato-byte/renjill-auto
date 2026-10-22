"""手動予約モードの設定（auto/mode.json）。ここにある SNS は API で投稿・計測・トークン確認をしない。
テストなどでは環境変数 MANUAL_PLATFORMS（スペース区切り。空なら手動なし）で上書きできる。"""
import json, os, pathlib

FILE = pathlib.Path(__file__).resolve().parent / "mode.json"
NAMES = {"ig": "Instagram", "facebook": "Facebook", "yt": "YouTube", "tt": "TikTok", "ig_story": "Instagram ストーリーズ", "fb_story": "Facebook ストーリーズ", "yt_playlist": "YouTube 再生リスト", "ig_carousel": "Instagram カルーセル", "threads": "Threads"}


def manual_platforms():
    if "MANUAL_PLATFORMS" in os.environ:
        return set(os.environ["MANUAL_PLATFORMS"].split())
    try:
        return set(json.loads(FILE.read_text()).get("manual_platforms") or [])
    except FileNotFoundError:
        return set()


def is_manual(platform):
    return platform in manual_platforms()
