"""旧名（2026-11-22 に改名）を新しい名前にする置き換え。公開済みの投稿の題・説明を直すとき（auto/rebrand_posts.py）に使う。
旧名の一覧はこの下の RULES（この説明の行は「旧名」を含むので、置き換えの道具は書き換えない）。
レン→モチ・ジル→ユズ・ポム→クリ、ブランド→東京うさぎオフィス、SNS の ID→@tokyo_usagi_office（X は @tokyo_usagi_ofc）、公式サイト→usagi.coana.co.jp
"""
import re

# 名前ではない言葉（先に退避して、あとで戻す）
PROTECT = ['アドベントカレンダー', 'カレンダー', 'チャレンジ', 'インターナショナルオレンジ', 'オレンジ', 'レンズ', 'レンガ',  # 旧名
           'バレンタイン', 'レンダリング', 'トレンド',  # 旧名
           '질주', '질문', '간질간질', '질하며']  # 旧名
PROTECT_RE = [
    r'\bPOM\.[A-Za-z]\w*',            # 色の表 POM.pink など  # 旧名
    r'\b(?:ELV|TM|BR)\.(?:REN|POM|JILL)\b',  # 旧名
    r'\bconst (?:REN|JILL|POM)\b',  # 旧名
    r'\b(?:REN|JILL|POM)_[A-Z_]+',    # POM_DAY など（\b では元々当たらないが念のため）  # 旧名
    r'https?://[^\s"\'<>）)]+',        # URL の中は触らない
    r'[\w.+-]+@[\w.-]+',              # メールアドレス
]

CHAR_NEXT = r'(?=が|は|も|には|へ|とポム|とクリ|の間|の足|のとなり|の色|のなかよし|の移動|の体|の顔|の2人|の二人|、ポム|・ポム)'  # 旧名

RULES = [
    # ---- 日本語：2人を指す所（キャラクター）
    (r'うさぎのレンとジル', 'うさぎのモチとユズ'),  # 旧名
    (r'レンとジル' + CHAR_NEXT, 'モチとユズ'),  # 旧名
    # ---- 日本語：ブランド
    (r'レン(?:と|＆|&|&amp;|アンド)ジル', '東京うさぎオフィス'),  # 旧名
    (r'レン', 'モチ'), (r'ジル', 'ユズ'), (r'ポム', 'クリ'),  # 旧名
    # ---- 英語：2人を指す所
    (r"Ren (&amp;|&) Jill(?='s buddies| are | to Buddies| both | run | dash )", r'Mochi \1 Yuzu'),  # 旧名
    (r'Ren and Jill', 'Mochi and Yuzu'),  # 旧名
    # ---- 英語：ブランド
    (r'RenAndJill', 'TokyoUsagiOffice'), (r'RenJill\b', 'TokyoUsagiOffice'),  # 旧名
    (r'Ren (?:&amp;|&) Jill', 'Tokyo Usagi Office'),  # 旧名
    (r'REN (?:&amp;|&) JILL', 'TOKYO USAGI OFFICE'),  # 旧名
    (r'Ren 與 Jill', '東京兔子辦公室'), (r'Ren과 Jill', 'Mochi와 Yuzu'),  # 旧名
    # ---- 中国語・韓国語（文字の名前）
    (r'蓮與吉兒', '東京兔子辦公室'), (r'吉兒', '柚子'), (r'波姆', '栗子'), (r'小蓮', '麻糬'),  # 旧名
    (r'렌과 질(?=은|이|도|을|의 사이|과)', '모찌와 유자'),  # 旧名
    (r'렌과 질', '도쿄 토끼 오피스'),  # 旧名
    (r'(?<![가-힣])렌(?=[은는도과와이가을를의에로,.·()\[\]\s"”」：:]|$)', '모찌'),  # 旧名
    (r'(?<![가-힣])질(?=[은는도과와이가을를의에로,.·()\[\]\s"”」：:]|$)', '유자'),  # 旧名
    (r'(?<![가-힣])폼(?=[은는도과와이가을를의에로,.·()\[\]\s"”」：:]|$)', '쿠리'),  # 旧名
    # ---- 英字の名前（1人ずつ）
    (r"(?<![A-Za-z0-9_.$-])Ren(?![A-Za-z0-9_-])", 'Mochi'), (r"(?<![A-Za-z0-9_.$-])Jill(?![A-Za-z0-9_-])", 'Yuzu'), (r"(?<![A-Za-z0-9_.$-])Pom(?![A-Za-z0-9_-])", 'Kuri'),  # 旧名
    (r"(?<![A-Za-z0-9_.$-])REN(?![A-Za-z0-9_-])", 'MOCHI'), (r"(?<![A-Za-z0-9_.$-])JILL(?![A-Za-z0-9_-])", 'YUZU'), (r"(?<![A-Za-z0-9_.$-])POM(?![A-Za-z0-9_-])", 'KURI'),  # 旧名
    # ---- 韓国語の助詞（新しい名前は母音で終わる）
    (r'(모찌|유자|쿠리|Mochi|Yuzu|Kuri)과', r'\1와'), (r'(모찌|유자|쿠리|Mochi|Yuzu|Kuri)은', r'\1는'),
    (r'(모찌|유자|쿠리|Mochi|Yuzu|Kuri)이(?=[ ,.]|$)', r'\1가'), (r'(모찌|유자|쿠리|Mochi|Yuzu|Kuri)을', r'\1를'),
    (r'(모찌|유자|쿠리|Mochi|Yuzu|Kuri)으로', r'\1로'), (r'(모찌|유자|쿠리|Mochi|Yuzu|Kuri)이에요', r'\1예요'),
    (r'도쿄 토끼 오피스과', '도쿄 토끼 오피스와'), (r'도쿄 토끼 오피스은', '도쿄 토끼 오피스는'), (r'도쿄 토끼 오피스이(?=[ ,.]|$)', '도쿄 토끼 오피스가'),
]
RULES = [(re.compile(a, re.M), b) for a, b in RULES]
P_RE = re.compile('|'.join([re.escape(w) for w in PROTECT] + PROTECT_RE))


def convert(text):
    # 「旧名」と書いた行（旧名を見張る検査や改名の記録）は書き換えない。2026-11-22：2回目の実行で見張りの検査まで新しい名前に変わった
    if '旧名' in text:
        return '\n'.join(l if '旧名' in l else convert(l) for l in text.split('\n'))
    saved = []
    def stash(m):
        saved.append(m.group(0)); return '\x00%d\x01' % (len(saved) - 1)
    t = P_RE.sub(stash, text)
    for rx, rep in RULES:
        t = rx.sub(rep, t)
    return re.sub('\x00(\\d+)\x01', lambda m: saved[int(m.group(1))], t)



ID_RULES = [  # 旧名・旧ID
    (re.compile(r'(?:x|twitter)\.com/renjill_office'), 'x.com/tokyo_usagi_ofc'),  # 旧ID
    (re.compile(r'renjill_office'), 'tokyo_usagi_office'),  # 旧ID
    (re.compile(r'renjill\.coana\.co\.jp'), 'usagi.coana.co.jp'),  # 旧アドレス
]


def rebrand(text):
    """投稿の題・説明の旧名・旧ID・旧アドレスを新しい物にする（何度かけても同じ結果）"""
    if not text: return text
    for rx, rep in ID_RULES: text = rx.sub(rep, text)
    return convert(text)
