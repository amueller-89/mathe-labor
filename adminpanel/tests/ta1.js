const {chromium}=require('playwright');
const PAGES=process.env.MODE==='pages';
const B='http://localhost:8765/exec';
const U=(q)=>{ if(!PAGES) return B+q; const p=new URLSearchParams(q.slice(1)); if(p.has('admin')) return 'http://localhost:8765/site/admin/?admin='+p.get('admin'); return 'http://localhost:8765/site/'+p.get('lab')+'/'; };
const fmt=v=>String(v).replace('.',',').replace('-','−');
(async()=>{const b=await chromium.launch();
const errs=[];
const mk=async(fast=true)=>{const c=await b.newContext({viewport:{width:1366,height:950}}); const p=await c.newPage();
  p.on('pageerror',e=>errs.push(e.message));
  if(fast) await p.addInitScript(()=>{const si=window.setInterval;window.setInterval=(f,t)=>si(f,Math.min(t,1500));});
  return [c,p];};
const [ac,admin]=await mk(false);
await admin.goto(U('?admin=falsch'));await admin.waitForTimeout(800);
console.log('wrong key:',await admin.textContent('#err'));
await admin.goto(U('?admin=test123'));await admin.waitForTimeout(800);
console.log('admin main visible',await admin.isVisible('#main'),'url',await admin.textContent('#links'));

const [kc,kid]=await mk();
await kid.goto(U('?lab=geraden'));await kid.waitForTimeout(500);
await kid.screenshot({path:__dirname+'/a_login.png'});
await kid.fill('#gWer','x');await kid.click('#gGo');await kid.waitForTimeout(400);
console.log('short name err:',await kid.textContent('#gErr'));
await kid.fill('#gWer','  Mia  ');await kid.click('#gGo');await kid.waitForTimeout(800);
console.log('gate hidden',await kid.isHidden('#gate'),'who',await kid.textContent('#who'));
const vis=async()=>kid.$$eval('#mainTabs button',bs=>bs.filter(b=>!b.hidden).map(b=>b.dataset.tab).join(','));
console.log('tabs',await vis());
// admin unlocks pts + train
await admin.click('.tg:nth-child(2)');await admin.waitForTimeout(600);await admin.click('.tg:nth-child(3)');await admin.waitForTimeout(600);
await kid.waitForTimeout(2500);console.log('tabs after unlock',await vis());
// solve level 1 x3
await kid.click('#mainTabs [data-tab=train]');
for(let i=0;i<3;i++){const t=await kid.evaluate(()=>window.__lab.task.want);for(const k in t) await kid.fill(`[data-k=${k}]`,fmt(t[k]));
 if(i==0){await kid.fill('[data-k=m]','99');await kid.click('#trCheck');for(const k in t) await kid.fill(`[data-k=${k}]`,fmt(t[k]));}
 await kid.click('#trCheck');await kid.click('#trNext');}
await kid.waitForTimeout(3000);
await admin.waitForTimeout(500);await admin.evaluate(()=>0);
await admin.reload();await admin.waitForTimeout(1200);
console.log('admin row:',await admin.textContent('#rows'));
// second device, same name
const [kc2,kid2]=await mk();
await kid2.goto(U('?lab=geraden'));await kid2.waitForTimeout(500);
await kid2.fill('#gWer','mia');await kid2.click('#gGo');await kid2.waitForTimeout(800);
console.log('device2 prog',JSON.stringify(await kid2.evaluate(()=>window.__lab.prog())), 'name', await kid2.textContent('#whoName'));
await kc2.close();
// unlock pro, win trainer
await admin.click('.tg:nth-child(4)');await admin.waitForTimeout(600);await kid.waitForTimeout(2500);
console.log('pro tab before win (expect visible):',await kid.isVisible('#mainTabs [data-tab=pro]'));
await kid.click('#mainTabs [data-tab=pro]');await kid.waitForTimeout(300);
console.log('pro locked: tab shown',await kid.isVisible('#tab-pro'),'toast',await kid.isVisible('.proToast'),'class',await kid.getAttribute('#mainTabs [data-tab=pro]','class'));
await kid.click('#mainTabs [data-tab=train]');
for(let lv=1;lv<4;lv++){ await kid.click(`#levels button:nth-child(${lv+1})`); for(let i=0;i<3;i++){
  const t=await kid.evaluate(()=>window.__lab.task.want); for(const k in t) await kid.fill(`[data-k=${k}]`,fmt(t[k]));
  await kid.click('#trCheck'); if(!(lv===3&&i===2)) await kid.click('#trNext'); }}
await kid.waitForTimeout(1200);
console.log('win',await kid.isVisible('#win'),'winPro',await kid.isVisible('#winPro'));
await kid.click('#winPro');await kid.waitForTimeout(400);
// wrong answer in profi
const os=await kid.$$('#proOpts .opt');
for(const o of os){await o.click();await kid.waitForTimeout(150); if(await kid.isVisible('#proLock')) break; await kid.click('#proNext'); break;}
await kid.waitForTimeout(3500);
await admin.reload();await admin.waitForTimeout(1200);
console.log('admin row 2:',await admin.textContent('#rows'));
await admin.screenshot({path:__dirname+'/a_admin.png',fullPage:true});
// lock pts → kid loses tab
await admin.click('.tg:nth-child(2)');await admin.waitForTimeout(600);await kid.waitForTimeout(2500);
console.log('tabs after lock pts',await vis());
// delete kid
await admin.click('.del');await admin.click('.del');await admin.waitForTimeout(800);
await kid.waitForTimeout(3500);
console.log('kid bye',await kid.isVisible('#gBye'));
// reload same browser -> asks "Bist du"
await kid.reload();await kid.waitForTimeout(500);
console.log('again visible',await kid.isVisible('#gAgain'),'(name removed so expect login):',await kid.isVisible('#gLogin'));
// new kid, reload (F5) -> automatisch wieder drin, gleicher Tab
await kid.fill('#gWer','Ben');await kid.click('#gGo');await kid.waitForTimeout(800);
await kid.click('#mainTabs [data-tab=train]');await kid.waitForTimeout(200);
console.log('hash',await kid.evaluate(()=>location.hash));
await kid.reload();await kid.waitForTimeout(1500);
console.log('F5: gate hidden',await kid.isHidden('#gate'),'who',await kid.textContent('#whoName'),'tab',await kid.evaluate(()=>window.__lab2.current()));
// neuer Besuch (Sitzung weg) -> "Bist du"
await kid.evaluate(()=>sessionStorage.clear());await kid.reload();await kid.waitForTimeout(500);
console.log('gAgain',await kid.isVisible('#gAgain'),await kid.textContent('#gWho'));
await kid.screenshot({path:__dirname+'/a_again.png'});
await kid.click('#gYes');await kid.waitForTimeout(800);console.log('after yes gate hidden',await kid.isHidden('#gate'));
// all tabs locked -> wait screen
for(const t of await admin.$$('.tg[aria-pressed=true]')){}
const pressed=await admin.$$eval('.tg',bs=>bs.map(b=>b.getAttribute('aria-pressed')));
for(let i=0;i<pressed.length;i++) if(pressed[i]==='true'){await admin.click(`.tg:nth-child(${i+1})`);await admin.waitForTimeout(500);}
await kid.waitForTimeout(2500);console.log('wait gate',await kid.isVisible('#gWait'));
await admin.click('.tg:nth-child(1)');await admin.waitForTimeout(500);await kid.waitForTimeout(2500);
console.log('after reopen gate hidden',await kid.isHidden('#gate'),'tabs',await vis());
// parabel lab quick
const [pc,par]=await mk();await par.goto(U('?lab=parabel'));await par.waitForTimeout(400);
await par.fill('#gWer','Lena');await par.click('#gGo');await par.waitForTimeout(800);
console.log('parabel tabs',await par.$$eval('#mainTabs button',bs=>bs.filter(b=>!b.hidden).map(b=>b.dataset.tab).join(',')));
// alles freischalten fuer Lena
await admin.click('#labTabs button:nth-child(2)');await admin.waitForTimeout(1200);
await admin.click('.alle');await admin.waitForTimeout(1200);
console.log('admin alle btn',await admin.textContent('.alle'));
await par.waitForTimeout(2500);
console.log('alle: tabs',await par.$$eval('#mainTabs button',bs=>bs.filter(b=>!b.hidden).map(b=>b.dataset.tab).join(',')),'pro locked',await par.getAttribute('#mainTabs [data-tab=pro]','class'),'levels open',await par.$$eval('#levels button',bs=>bs.filter(b=>!b.disabled).length));
await par.click('#mainTabs [data-tab=pro]');await par.waitForTimeout(300);console.log('pro shown',await par.isVisible('#tab-pro'));
await admin.click('.alle');await admin.waitForTimeout(1200);await par.waitForTimeout(2500);
console.log('alle off: tabs',await par.$$eval('#mainTabs button',bs=>bs.filter(b=>!b.hidden).map(b=>b.dataset.tab).join(',')),'btn',await admin.textContent('.alle'));
await par.setViewportSize({width:390,height:844});console.log('parabel width',await par.evaluate(()=>document.documentElement.scrollWidth));
await admin.setViewportSize({width:390,height:844});console.log('admin width',await admin.evaluate(()=>document.documentElement.scrollWidth));
// Admin: optimistische Freigabe + Sammelknöpfe
await admin.setViewportSize({width:1366,height:950});
await admin.click('#labTabs button:nth-child(1)');await admin.waitForTimeout(1500);
const t0=Date.now();await admin.click('#bOpen');const pr=await admin.$$eval('.tg',bs=>bs.map(b=>b.getAttribute('aria-pressed')).join(','));
console.log('bOpen sofort:',pr,'ms',Date.now()-t0);
await admin.waitForTimeout(1200);await kid.waitForTimeout(2500);
await kid.click('#gYes').catch(()=>{});await kid.waitForTimeout(1500);
console.log('kid tabs after bOpen',await vis());
await admin.click('#bHide');await admin.waitForTimeout(1200);await kid.waitForTimeout(2500);
console.log('kid after bHide wait',await kid.isVisible('#gWait'));
await admin.click('#bOpen');await admin.waitForTimeout(1200);await kid.waitForTimeout(2500);
// Ben macht Fortschritt, dann alle zurücksetzen
await kid.click('#mainTabs [data-tab=train]');await kid.click('#levels button:nth-child(1)');
{const t=await kid.evaluate(()=>window.__lab.task.want);for(const k in t) await kid.fill(`[data-k=${k}]`,fmt(t[k]));await kid.click('#trCheck');}
await kid.waitForTimeout(3500);
console.log('Ben prog before reset',JSON.stringify(await kid.evaluate(()=>window.__lab.prog().c)));
await admin.click('#bReset');console.log('armed text',await admin.textContent('#bReset'));await admin.click('#bReset');await admin.waitForTimeout(1200);
console.log('admin after reset',await admin.textContent('#rows'));
await kid.waitForTimeout(4000);
console.log('Ben after reset: gate hidden',await kid.isHidden('#gate'),'prog',JSON.stringify(await kid.evaluate(()=>window.__lab.prog().c)),'who',await kid.textContent('#whoName'));
await admin.reload();await admin.waitForTimeout(1500);console.log('admin after reset+ping',await admin.textContent('#rows'));
// alle löschen
await admin.click('#bDel');await admin.click('#bDel');await admin.waitForTimeout(1200);
console.log('admin after delete all: empty',await admin.isVisible('#empty'));
await kid.waitForTimeout(3500);console.log('Ben after delete all: bye',await kid.isVisible('#gBye'));
// Musterbeispiel in der Admin-Version
const [mc,mk2]=await mk();await mk2.goto(U('?lab=geraden'));await mk2.waitForTimeout(400);await mk2.fill('#gWer','Zoe');await mk2.click('#gGo');await mk2.waitForTimeout(1200);
await mk2.click('#mainTabs [data-tab=train]');await mk2.click('#trEx');await mk2.waitForTimeout(200);console.log('example open',await mk2.isVisible('#exWin'),await mk2.textContent('#exLvl'));
console.log('errs',errs);await b.close();})();
