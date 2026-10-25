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
  camera_off2: { start: 1.6, speed: 1.25, hook: 'NAP TIME/カメラオフの正体' }
};
