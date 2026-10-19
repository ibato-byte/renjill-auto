const { chromium } = require('playwright'); const fs=require('fs');
const ep=process.argv[2], fps=24;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('file://'+__dirname+'/ep.html?ep='+ep);await p.waitForTimeout(800);
const meta=await p.evaluate(()=>({dur:EP.dur,sfx:EP.sfx,bgmHolds:EP.bgmHolds||null}));
const dir=`${__dirname}/out/${ep}`; fs.mkdirSync(dir,{recursive:true}); fs.writeFileSync(dir+'/meta.json',JSON.stringify(meta));
const N=Math.round(fps*meta.dur);
for(let i=0;i<N;i++){await p.evaluate(t=>window.setFrame(t),i/fps);await p.screenshot({path:`${dir}/f${String(i).padStart(4,'0')}.jpg`,type:'jpeg',quality:92});}
await b.close();console.log(ep,'frames',N);})();
