// 冒頭のつかみと長さの設定（依頼 #97）。話ごとに：
//  start … 動画の頭から削る秒数（元の台本の時間。静かな導入を飛ばす）
//  speed … 再生の速さ（1.4＝1.4倍。ため・オチ後の余韻も詰めて、全体を短くする）
//  hook  … 冒頭に大きく出す英語の一言／日本語の補足（サムネと同じ文字。schedule.json の thumb.hook と揃える）
// 画面に出る時間（秒）＝ (台本の時間 − start) ÷ speed。音（効果音・BGMの「間」）も同じ換算で合わせる（render-ep.js）。
// 投稿済みの回（papers2・mug2・chime2）は古い作りのまま出ているので、ここには入れない（完走率の換算が狂う）。
window.PACE_ALL = {
  jil_morning2:{ start: 0.0, speed: 1.25, hook: 'GLASSES ON./スイッチが入る' },
  receipts2:   { start: 0.9, speed: 1.25, hook: 'EXPENSES: HAY/経費はぜんぶ牧草' },
  deadline2:   { start: 0.8, speed: 1.25, hook: 'DEADLINE? NO./見なければ来ない' },
  pom_debut:   { start: 0.0, speed: 1.25, hook: 'NEW HIRE/新人のポム' },
  meeting2:    { start: 1.8, speed: 1.25, hook: '5 MIN LEFT/会議の5分前' },
  stamp2:      { start: 0.9, speed: 1.25, hook: 'STAMP IT/鼻でハンコ' },
  camera_off2: { start: 1.6, speed: 1.25, hook: 'NAP TIME/カメラオフの正体' },
  update99:    { start: 0.0, speed: 1.0, hook: 'STUCK AT 99%/99%で止まる' }
};
window.PACE_ALL.replyall = { start: 0.0, speed: 1.0, hook: 'REPLY ALL?!/全員に返信' };
window.PACE_ALL.thumbsup = { start: 0.0, speed: 1.0, hook: 'THUMBS UP./了解です' };
window.PACE_ALL.vending = { start: 0.0, speed: 1.0, hook: 'NO CARROT?!/にんじん出ない' };
window.PACE_ALL.lastsheet = { start: 0.0, speed: 1.0, hook: 'LAST SHEET/最後の1枚' };
window.PACE_ALL.sticky = { start: 0.0, speed: 1.0, hook: 'STICKY NOTES/付箋だらけ' };
window.PACE_ALL.watercooler = { start: 0.0, speed: 1.0, hook: 'WATER COOLER/水がおさまらない' };
// v2 絵（rig/v2/lib.js）の回。冒頭の一言は英語を大きく・日本語を小さく。「誰が・どんな状況か」を必ず書く（ラベルだけにしない。docs/CLARITY.md）
window.PACE_ALL.nenmatsu = { start: 0.0, speed: 1.0, hook: 'BOSS VS. TAXES/年末調整の書類を前にした上司' };
window.PACE_ALL.teiji = { start: 0.0, speed: 1.0, hook: 'BOSS AT 17:59/定時1分前に仕事を持ってくる上司' };
window.PACE_ALL.bonus = { start: 0.0, speed: 1.0, hook: 'BONUS DAY/ボーナスの日、上司と部下' };
window.PACE_ALL.monday = { start: 0.0, speed: 1.0, hook: 'MONDAY 7:00 AM/月曜の朝、上司の目覚まし' };
window.PACE_ALL.meeting = { start: 0.0, speed: 1.0, hook: '"JUST 10 MIN"/10分だけの会議' };
window.PACE_ALL.elevator = { start: 0.0, speed: 1.0, hook: 'BOSS. ELEVATOR./エレベーターで上司と2人きり' };
window.PACE_ALL.printer = { start: 0.0, speed: 1.0, hook: 'PRINT: 1 PAGE/「1枚だけ印刷」の上司' };
window.PACE_ALL.osouji = { start: 0.0, speed: 1.0, hook: 'CLEANING DAY/大掃除、上司の机' };
window.PACE_ALL.wifi = { start: 0.0, speed: 1.0, hook: 'WI-FI: OFF/オンライン会議で上司が固まった' };
window.PACE_ALL.bonenkai = { start: 0.0, speed: 1.0, hook: 'PARTY PLANNER/忘年会の幹事はジル' };
window.PACE_ALL.lunchbox = { start: 0.0, speed: 1.0, hook: 'LUNCH SWAP/お弁当が入れ替わった' };
window.PACE_ALL.aircon = { start: 0.0, speed: 1.0, hook: 'AIRCON WAR/エアコンの温度、上司と部下' };
window.PACE_ALL.holiday = { start: 0.0, speed: 1.0, hook: 'DAY OFF. 9:00/祝日に出社した上司' };
window.PACE_ALL.hanko = { start: 0.0, speed: 1.0, hook: 'STAMP 8: NO INK/ハンコ8個、朱肉が切れた' };
window.PACE_ALL.mute = { start: 0.0, speed: 1.0, hook: 'STILL MUTED/ミュートのまま熱弁する上司' };
window.PACE_ALL.rain = { start: 0.0, speed: 1.0, hook: 'RAINY DAY/傘を忘れた上司' };
window.PACE_ALL.donuts = { start: 0.0, speed: 1.0, hook: '6 HAY RINGS/差し入れの牧草リング、上司と2秒' };
window.PACE_ALL.yukyu = { start: 0.0, speed: 1.0, hook: 'LEAVE: APPROVED/有給、見ずに承認した上司' };
window.PACE_ALL.noodle = { start: 0.0, speed: 1.0, hook: 'OVERTIME 21:00/残業の夜食、上司の3分' };
window.PACE_ALL.plant = { start: 0.0, speed: 1.0, hook: 'DESK PLANT/上司の植物、水やりはコーヒー' };
window.PACE_ALL.deadline = { start: 0.0, speed: 1.0, hook: 'DEADLINE 9:00/締め切り前夜、上司と部下' };
window.PACE_ALL.kotatsu = { start: 0.0, speed: 1.0, hook: 'KOTATSU DAY/会社にこたつ、上司が出てこない' };
window.PACE_ALL.tree = { start: 0.0, speed: 1.0, hook: 'OFFICE TREE/オフィスのツリー、上司の飾り' };
window.PACE_ALL.santa = { start: 0.0, speed: 1.0, hook: 'SECRET SANTA/プレゼント交換、上司と部下' };
window.PACE_ALL.scarf = { start: 0.0, speed: 1.0, hook: 'HAND-KNIT SCARF/ジルの手編み、上司に5周' };
window.PACE_ALL.snow = { start: 0.0, speed: 1.0, hook: 'WINDOW: 3 SEC/上司が窓を3秒開けた' };
window.PACE_ALL.photo = { start: 0.0, speed: 1.0, hook: 'SAY CHEESE/年賀状の写真、上司は目をつぶる' };
window.PACE_ALL.advent = { start: 0.0, speed: 1.0, hook: 'ADVENT: DAY 1/アドベントカレンダー、上司と24日分' };
window.PACE_ALL.nengajo = { start: 0.0, speed: 1.0, hook: '100 CARDS/年賀状100枚、上司と部下' };
window.PACE_ALL.mikan = { start: 0.0, speed: 1.0, hook: 'MIKAN: 5 TO 0/みかん5個、上司のほっぺに' };
window.PACE_ALL.kairo = { start: 0.0, speed: 1.0, hook: '10 HEAT PACKS/カイロ10個、上司が全部' };
window.PACE_ALL.oseibo = { start: 0.0, speed: 1.0, hook: 'GIFT BOX x5/お歳暮の箱、中身は' };
window.PACE_ALL.kashitsu = { start: 0.0, speed: 1.0, hook: 'HUMIDIFIER: MAX/加湿器MAX、上司と部下' };
window.PACE_ALL.shred = { start: 0.0, speed: 1.0, hook: 'SHREDDER DAY/シュレッダーの紙くず、上司が' };
window.PACE_ALL.himekuri = { start: 0.0, speed: 1.0, hook: 'DEC 15 TO 28/日めくり、上司だけ仕事納め' };
window.PACE_ALL.wreath = { start: 0.0, speed: 1.0, hook: 'XMAS WREATH/クリスマスリース、上司が' };
window.PACE_ALL.katazuke = { start: 0.0, speed: 1.0, hook: 'CLEAN DESK/年末の片付け、上司は3秒' };
window.PACE_ALL.tegami = { start: 0.0, speed: 1.0, hook: 'DEAR SANTA/サンタへの手紙、上司は3メートル' };
window.PACE_ALL.present = { start: 0.0, speed: 1.0, hook: 'GIFT EXCHANGE/プレゼント交換、中身は' };
window.PACE_ALL.lights = { start: 0.0, speed: 1.0, hook: 'XMAS LIGHTS/電飾、光ったのは上司' };
window.PACE_ALL.hat = { start: 0.0, speed: 1.0, hook: 'SANTA HAT XXL/サンタ帽、上司は特大' };
window.PACE_ALL.kakurenbo = { start: 0.0, speed: 1.0, hook: 'HIDE AND SEEK/かくれんぼ、上司はペンの後ろ' };
window.PACE_ALL.kutsushita = { start: 0.0, speed: 1.0, hook: 'XXL STOCKING/くつした特大、中身は' };
window.PACE_ALL.tonakai = { start: 0.0, speed: 1.0, hook: 'REINDEER/サンタは上司、トナカイは' };
window.PACE_ALL.korokoro = { start: 0.0, speed: 1.0, hook: 'LINT ROLLER/コロコロ、上司の毛で' };
window.PACE_ALL.kagami = { start: 0.0, speed: 1.0, hook: 'KAGAMI MOCHI/鏡もち、上司のは牧草製' };
window.PACE_ALL.fukubiki = { start: 0.0, speed: 1.0, hook: 'LUCKY DRAW/福引き、上司は金の玉' };
window.PACE_ALL.osechi = { start: 0.0, speed: 1.0, hook: 'OSECHI: HAY x3/おせち、上司の重箱は' };
window.PACE_ALL.nimotsu = { start: 0.0, speed: 1.0, hook: 'PACKING/帰省の荷造り、上司は牧草だけ' };
window.PACE_ALL.countdown = { start: 0.0, speed: 1.0, hook: 'COUNTDOWN/年越し、上司は寝てた' };
window.PACE_ALL.aisatsu = { start: 0.0, speed: 1.0, hook: 'NEW YEAR BOW/新年のごあいさつ、上司は' };
window.PACE_ALL.omikuji = { start: 0.0, speed: 1.0, hook: 'FORTUNE/おみくじ、上司は' };
