const { chromium } = require('playwright');
const picks=[['meeting',4.2,'ep01_meeting'],['jil_morning',5.75,'ep02_jil_morning'],['stamp',8.8,'ep03_hanko'],['papers',5.6,'ep04_papers'],['mug',6.85,'ep05_mug'],['chime',3.4,'ep06_teiji_binky'],['camera_off',6.6,'ep07_camera_off'],['receipts',6.3,'ep08_receipts'],['deadline',4.0,'ep09_deadline'],['stamp2',9.2,'v2_hanko']];
(async()=>{const b=await chromium.launch();
for(const [ep,t,name] of picks){const p=await b.newPage({viewport:{width:1080,height:1920}});
await p.goto(`file://${__dirname}/ep.html?ep=${ep}&cam=1.35,650,1200`);await p.waitForTimeout(600);
await p.evaluate(t=>window.setFrame(t),t);await p.screenshot({path:`/mnt/user-data/outputs/covers/cover_${name}.jpg`,type:'jpeg',quality:90});await p.close();}
await b.close();})();
