const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:2600,height:2700}});
await p.goto('file://'+__dirname+'/banners.html');await p.waitForTimeout(2500);
for(const [id,f] of [['x','renjill_x_header_1500x500.png'],['yt','renjill_youtube_banner_2560x1440.png'],['fb','renjill_facebook_cover_1640x624.png']]) await p.locator('#'+id).screenshot({path:'/mnt/user-data/outputs/'+f});
await b.close();})();
