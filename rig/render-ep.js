const { chromium } = require('playwright'); const fs=require('fs');
const ep=process.argv[2], fps=24;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('file://'+__dirname+'/ep.html?ep='+ep);await p.waitForTimeout(800);
// 画面に出る時間（秒）＝(台本の時間−start)÷speed。効果音・BGMの「間」も同じ換算にして、頭を削っても速くしても音と絵がずれないようにする（依頼 #97）
const meta=await p.evaluate(()=>{const {start,speed}=window.PACE,f=t=>Math.round((t-start)/speed*1000)/1000;
  return {dur:Math.round(outDur()*1000)/1000,
    sfx:EP.sfx.filter(s=>s.t>=start).map(s=>Object.assign({},s,{t:f(s.t)})),
    bgmHolds:EP.bgmHolds?EP.bgmHolds.split(',').map(h=>h.split('-').map(Number)).filter(([a,c])=>c>start).map(([a,c])=>Math.max(0,f(a))+'-'+f(c)).join(',')||null:null,
    pace:window.PACE}});
const dir=`${__dirname}/out/${ep}`; fs.mkdirSync(dir,{recursive:true}); fs.writeFileSync(dir+'/meta.json',JSON.stringify(meta));
const N=Math.round(fps*meta.dur);
for(let i=0;i<N;i++){await p.evaluate(t=>window.setOut(t),i/fps);await p.screenshot({path:`${dir}/f${String(i).padStart(4,'0')}.jpg`,type:'jpeg',quality:92});}
await b.close();console.log(ep,'frames',N,'dur',meta.dur);})();
