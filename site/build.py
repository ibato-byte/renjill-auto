#!/usr/bin/env python3
"""「レンとジル」公式ページ（静的 HTML）を作る（依頼 #38）。投稿のたびに post.yml が実行する。AI は使わない。
入力：auto/schedule.json（回の情報・series）、auto/posted.json（YouTube の動画 ID）
出力：site/public/index.html・sitemap.xml・robots.txt（Cloudflare Pages の「ビルド出力ディレクトリ」に site/public を指定）
YouTube に出ている回（動画 ID がある回）だけを載せる。数字は載せない。"""
import datetime as dt, html, json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = pathlib.Path(__file__).resolve().parent / "public"
SITE = "https://renjill.pages.dev"  # Cloudflare Pages のプロジェクト名を renjill にした場合。違えば schedule.json の defaults.site.url で上書き
E = html.escape


def episodes(sch, posted):
    out = []
    for p in sch["posts"]:
        yt = (posted.get(f'{p["date"]}_{p["ep"]}') or {}).get("yt")
        if yt and yt != "manual": out.append({**p, "yt": yt})
    return sorted(out, key=lambda x: x["date"], reverse=True)


def links(d):
    s = d.get("site") or {}
    out = []
    if s.get("youtube"): out.append(("YouTube", s["youtube"]))
    out += [("Instagram", "https://www.instagram.com/renjill_office/"), ("TikTok", "https://www.tiktok.com/@renjill_office"),
            ("X", "https://x.com/renjill_office"), ("Facebook", "https://www.facebook.com/profile.php?id=1358515160686321")]
    if s.get("bluesky"): out.append(("Bluesky", s["bluesky"]))
    return out


def card(e):
    return (f'<article class="ep"><h3>EP.{e["no"]} {E(e["title"])}</h3><p lang="en">{E(e["caption_en"])}</p><p>{E(e["caption_ja"])}</p>'
            f'<div class="v"><iframe src="https://www.youtube-nocookie.com/embed/{E(e["yt"])}" title="{E(e["title"])}" loading="lazy" '
            f'allow="encrypted-media; picture-in-picture" allowfullscreen></iframe></div>'
            f'<p><a href="https://www.youtube.com/shorts/{E(e["yt"])}">YouTube で見る</a></p></article>')


def page(sch, eps):
    d = sch["defaults"]; url = (d.get("site") or {}).get("url", SITE)
    series = {}
    for e in eps: series.setdefault(e.get("series") or "すべてのエピソード", []).append(e)
    body = "".join(f'<section><h2>{E(name)}</h2><div class="g">{"".join(card(e) for e in lst)}</div></section>' for name, lst in series.items())
    if not eps: body = "<p>最初のエピソードを準備中です。</p>"
    ld = {"@context": "https://schema.org", "@type": "VideoGallery", "name": "レンとジル Ren & Jill",
          "description": "うさぎの課長レンと部下ジルのセリフなしオフィスコメディ。A wordless office comedy about two bunnies.",
          "url": url + "/", "hasPart": [{"@type": "VideoObject", "name": f'EP.{e["no"]} {e["title"]}', "description": e["caption_en"], "uploadDate": e["date"],
                                          "embedUrl": f'https://www.youtube.com/embed/{e["yt"]}', "thumbnailUrl": f'https://i.ytimg.com/vi/{e["yt"]}/hqdefault.jpg'} for e in eps]}
    ldj = json.dumps(ld, ensure_ascii=False).replace("</", "<\\/")
    sns = "".join(f'<li><a href="{E(u)}" rel="noopener">{E(n)}</a></li>' for n, u in links(d))
    return f'''<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>レンとジル Ren &amp; Jill｜セリフなしのオフィスコメディ</title>
<meta name="description" content="うさぎの課長レンと、しっかり者の部下ジル。セリフなしのオフィスコメディを全話まとめて見られます。A wordless office comedy about two bunnies.">
<link rel="canonical" href="{E(url)}/"><meta property="og:title" content="レンとジル Ren &amp; Jill"><meta property="og:type" content="website">
<script type="application/ld+json">{ldj}</script>
<style>
:root{{--bg:#fff7e8;--fg:#3b2a18;--ac:#355f86;--card:#fff}}
@media(prefers-color-scheme:dark){{:root{{--bg:#1d1812;--fg:#f4eadb;--ac:#9cc4ea;--card:#2a231a}}}}
body{{margin:0;background:var(--bg);color:var(--fg);font:16px/1.7 system-ui,"Noto Sans JP",sans-serif}}
main{{max-width:960px;margin:0 auto;padding:24px 16px 64px}} a{{color:var(--ac)}} h1{{font-size:1.8rem;margin:.2em 0}}
.g{{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}} .ep{{background:var(--card);border-radius:12px;padding:12px 16px}}
.v{{aspect-ratio:9/16;max-height:480px}} iframe{{width:100%;height:100%;border:0;border-radius:8px}} ul.sns{{display:flex;flex-wrap:wrap;gap:8px 20px;padding:0;list-style:none}}
</style></head><body><main>
<header><h1>レンとジル <small lang="en">Ren &amp; Jill</small></h1>
<p>うさぎの課長レン（たれ耳）と、しっかり者の部下ジル。セリフなしのオフィスコメディです。世界中どこからでも楽しめます。</p>
<p lang="en">A wordless office comedy about two bunnies: Ren, the absent-minded boss, and Jill, his sharp assistant.</p>
<h2>フォローはこちら / Follow</h2><ul class="sns">{sns}</ul></header>
{body}
<footer><p>運営：COANA TOKYO合同会社</p></footer></main></body></html>
'''


def main():
    sch = json.loads((ROOT / "auto" / "schedule.json").read_text())
    pj = ROOT / "auto" / "posted.json"
    posted = json.loads(pj.read_text()) if pj.exists() else {}
    eps = episodes(sch, posted)
    url = (sch["defaults"].get("site") or {}).get("url", SITE)
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "index.html").write_text(page(sch, eps), encoding="utf-8")
    last = max([e["date"] for e in eps], default=dt.date.today().isoformat())
    (OUT / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>{url}/</loc><lastmod>{last}</lastmod></url></urlset>\n')
    (OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {url}/sitemap.xml\n")
    print(f"[site] エピソード {len(eps)} 件 → {OUT}")


if __name__ == "__main__":
    main()
