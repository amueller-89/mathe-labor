// Prüft, ob beim Bewegen der Regler ein „=“ in den Erkunden-Tabs springt. Aufruf: node adminpanel/tests/springen.js (im Repo-Ordner)
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();
for(const [file,tabs] of [['Geraden-Labor',['mb','pts']],['Parabel-Labor',['sp','forms','pq']],['Tangenten-Labor',['tan','kub']]]){
 const p=await b.newPage({viewport:{width:1512,height:982}});
 await p.goto('file://'+process.cwd()+'/labore/'+file+'.html#alle');await p.waitForTimeout(600);
 for(const t of tabs){
  await p.evaluate(t=>window.__lab.show(t),t);await p.waitForTimeout(200);
  const res=await p.evaluate(async(t)=>{
   const sec=document.getElementById('tab-'+t), rs=[...sec.querySelectorAll('input[type=range]')].filter(r=>r.offsetParent);
   const pos=()=>{const out={};let k=0;const w=document.createTreeWalker(sec,NodeFilter.SHOW_TEXT);let n;
     while(n=w.nextNode()){if(!n.parentElement.offsetParent)continue;const s=n.textContent;for(let i=0;i<s.length;i++)if(s[i]==='='){const r=document.createRange();r.setStart(n,i);r.setEnd(n,i+1);const bb=r.getBoundingClientRect();
       const host=n.parentElement.closest('[id]');const key=(host?host.id:'?')+'#'+(out[(host?host.id:'?')+'#c']=(out[(host?host.id:'?')+'#c']||0)+1);out[key]=[Math.round(bb.x),Math.round(bb.y)];}}
     return out;};
   const all=[];
   for(const r of rs){for(const f of [0,0.13,0.5,0.77,1]){const v=+r.min+f*(r.max-r.min);r.value=v;r.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(z=>setTimeout(z,30));all.push(pos());}}
   const mv={};for(const o of all)for(const k in o){if(k.endsWith('#c'))continue;mv[k]=mv[k]||{xs:new Set(),ys:new Set()};mv[k].xs.add(o[k][0]);mv[k].ys.add(o[k][1]);}
   return Object.entries(mv).filter(([k,v])=>v.xs.size>1||v.ys.size>1).map(([k,v])=>k+' dx='+(Math.max(...v.xs)-Math.min(...v.xs))+' dy='+(Math.max(...v.ys)-Math.min(...v.ys)));
  },t);
  console.log(file,t,res);
 }}
await b.close();})();
