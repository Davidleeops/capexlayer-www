'use strict';
const storageKey = 'capexlayer-security-start-v1';
const $ = id => document.getElementById(id);
const boxes = [...document.querySelectorAll('[data-step]')];
const notes = [...document.querySelectorAll('textarea')];
const steps = [...document.querySelectorAll('.step')];
const navLinks = [...document.querySelectorAll('nav a')];
const ids = steps.map(s => s.id);
const names = ['Inventory', 'Access', 'Updates', 'Claude Red', 'Retest', 'Review brief'];
let saved = {}, findings = [], active = 0;
try { const v = JSON.parse(localStorage.getItem(storageKey) || '{}'); if(v && typeof v === 'object') saved = v; } catch {}
for (const b of boxes) b.checked = Array.isArray(saved.steps) && saved.steps.includes(b.dataset.step);
for (const n of notes) n.value = typeof saved.notes?.[n.id] === 'string' ? saved.notes[n.id] : '';
findings = Array.isArray(saved.findings) ? saved.findings.filter(f => f && typeof f.title === 'string').map(f => ({...f, id: String(f.id || crypto.randomUUID())})) : [];
for(const id of ['situation','review-path']) if([...$(id).options].some(o=>o.value===saved[id])) $(id).value=saved[id];
function snapshot() { return {steps: boxes.filter(b => b.checked).map(b => b.dataset.step), notes: Object.fromEntries(notes.map(n => [n.id,n.value])), findings, situation:$('situation').value, 'review-path':$('review-path').value}; }
function update() {
 const state=snapshot(); $('progress').textContent=`${state.steps.length} of 6 steps reviewed`; $('rail-count').textContent=`${state.steps.length} / 6`;
 try { localStorage.setItem(storageKey,JSON.stringify(state)); $('save-status').textContent='Saved in this browser'; } catch { $('save-status').textContent='Storage unavailable. Download your brief to keep it.'; }
 navLinks.forEach((a,i)=>a.classList.toggle('reviewed',boxes[i].checked));
}
function activate(id, move=false) {
 const found=ids.indexOf(id); if(found<0)return; active=found;
 steps.forEach((s,i)=>s.hidden=i!==active);
 navLinks.forEach((a,i)=>{if(i===active)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});
 $('current-step').textContent=`${String(active+1).padStart(2,'0')} / ${names[active]}`;
 $('step-position').textContent=`Step ${active+1} of 6`; $('previous-step').disabled=active===0; $('next-step').disabled=active===5;
 if(move) $('workspace').scrollIntoView({block:'start'});
}
function hashRoute(){const id=location.hash.slice(1);if(ids.includes(id))activate(id);}
window.addEventListener('hashchange',hashRoute);
$('previous-step').addEventListener('click',()=>{location.hash=ids[active-1];activate(ids[active-1],true);});
$('next-step').addEventListener('click',()=>{location.hash=ids[active+1];activate(ids[active+1],true);});
navLinks.forEach(a=>a.addEventListener('click',()=>activate(a.hash.slice(1),true)));
const moves={warning:['Record the affected product and version. Match the warning to your installation before changing it.','updates','Check software and versions ↗'],access:['Identify the exact access path and the role using it. Ask the system owner to verify the intended permission before changing access.','access','Review access paths ↗'],incident:['Preserve logs and contact your provider or incident responder. Record what happened and when. A normal checklist does not establish the scope of a breach.','handoff','Record evidence and an owner ↗']};
function situate(){const [text,id,label]=moves[$('situation').value];$('first-move').textContent=text;$('first-link').href='#'+id;$('first-link').textContent=label;update();}
$('situation').addEventListener('change',situate);
const advice={owner:'Start with your provider dashboard. You can complete this review without running a command.',code:'Identify the application folder, lockfile and live deployment. Keep source checks separate from live verification.',unsure:'Start with the domain registrar and hosting bill. Ask the provider who manages the runtime, database and backups.'};
$('review-path').addEventListener('change',()=>{$('path-advice').textContent=advice[$('review-path').value];update();});
$('path-advice').textContent=advice[$('review-path').value];
for(const b of boxes)b.addEventListener('change',update);
for(const n of notes)n.addEventListener('input',update);
$('reset').addEventListener('click',()=>{if(!confirm('Clear this browser workbook, notes and recorded findings? Download your brief first if you need to keep it.'))return;boxes.forEach(b=>b.checked=false);notes.forEach(n=>n.value='');findings=[];renderFindings();update();});
$('print').addEventListener('click',()=>window.print());
$('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(document.querySelector('#prompt code').textContent);$('copy-status').textContent='Review request copied.';}catch{$('copy-status').textContent='Select the request above and copy it manually.';}});
function field(parent,f,key,label,type='text',options){
 const wrap=document.createElement('div');wrap.className='field';const l=document.createElement('label');l.htmlFor=f.id+'-'+key;l.textContent=label;
 const el=document.createElement(options?'select':type==='textarea'?'textarea':'input');el.id=l.htmlFor;
 if(options){for(const [v,t] of options){const o=document.createElement('option');o.value=v;o.textContent=t;el.append(o);}}
 else if(type!=='textarea')el.type=type;
 el.value=typeof f[key]==='string'?f[key]:'';if(type==='textarea')el.rows=3;
 el.addEventListener('input',()=>{f[key]=el.value;update();summarizeFindings();});wrap.append(l,el);parent.append(wrap);
}
function summarizeFindings(){const pending=findings.filter(f=>f.status!=='verified').length;$('finding-summary').textContent=findings.length?`${findings.length} recorded finding${findings.length===1?'':'s'}. ${pending} still need${pending===1?'s':''} verification.`:'No findings recorded. This does not establish that the system is secure.';}
function renderFindings(){
 const host=$('findings');host.replaceChildren();
 for(const f of findings){const card=document.createElement('article');card.className='finding-card';const top=document.createElement('div');top.className='finding-top';const h=document.createElement('h4');h.textContent=f.title;const remove=document.createElement('button');remove.className='text-button';remove.textContent='Remove finding';remove.addEventListener('click',()=>{if(!confirm('Remove this finding from the local workbook?'))return;findings=findings.filter(x=>x.id!==f.id);renderFindings();update();});top.append(h,remove);card.append(top);const grid=document.createElement('div');grid.className='finding-grid';
 field(grid,f,'system','System or application');field(grid,f,'owner','Accountable owner');field(grid,f,'priority','Working priority','text',[['assess','Needs assessment'],['urgent','Urgent: suspected incident'],['high','High: exposed privilege or relevant critical advisory'],['planned','Planned maintenance']]);field(grid,f,'status','Verification status','text',[['unknown','Not verified'],['confirmed','Confirmed, fix pending'],['changed','Changed, retest pending'],['verified','Fix verified']]);field(grid,f,'evidence','Evidence and source, redacted','textarea');field(grid,f,'retest','Next safe verification','textarea');field(grid,f,'due','Next review date','date');card.append(grid);host.append(card);
 }summarizeFindings();
}
$('finding-form').addEventListener('submit',e=>{e.preventDefault();const title=$('finding-title').value.trim();if(!title)return;findings.push({id:crypto.randomUUID(),title,priority:'assess',status:'unknown',system:'',owner:'',evidence:'',retest:'',due:''});$('finding-title').value='';renderFindings();update();});
function download(name,text,type){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function textBrief(){const s=snapshot();return ['Website security review brief','Guide: https://capexlayer.com/security-start/','Prepared: '+new Date().toISOString().slice(0,10),'','REVIEWED STEPS',...boxes.map(b=>`${b.checked?'[x]':'[ ]'} ${b.parentElement.textContent.trim()}`),'','INVENTORY',s.notes['inventory-notes'],'','NEXT ACTION',s.notes['next-action'],'','FINDINGS',...findings.flatMap((f,i)=>[`${i+1}. ${f.title}`,`System: ${f.system||'Unassigned'} | Owner: ${f.owner||'Unassigned'}`,`Priority: ${{assess:'Needs assessment',urgent:'Urgent: suspected incident',high:'High: exposed privilege or relevant critical advisory',planned:'Planned maintenance'}[f.priority]||'Needs assessment'} | Status: ${{unknown:'Not verified',confirmed:'Confirmed, fix pending',changed:'Changed, retest pending',verified:'Fix verified'}[f.status]||'Not verified'} | Next review: ${f.due||'Unassigned'}`,`Evidence: ${f.evidence||'Not recorded'}`,`Next verification: ${f.retest||'Not recorded'}`,'']),'This is a user-entered review record. Completion does not prove a system secure.'].join('\n');}
$('export').addEventListener('click',()=>download('website-security-checklist.txt',textBrief(),'text/plain;charset=utf-8'));
$('export-json').addEventListener('click',()=>download('website-security-workbook.json',JSON.stringify({version:2,...snapshot()},null,2),'application/json'));
$('report').addEventListener('click',()=>{
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const tokenNames=['bg','bg-nearblack','card','text-primary','text-body','gold','cream','font-sans','font-serif'];
 const tokens=tokenNames.map(n=>`--${n}:${getComputedStyle(document.documentElement).getPropertyValue('--'+n).trim()}`).join(';');
 const body=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Website security review brief</title><style>:root{${tokens}}body{font:16px var(--font-sans);line-height:1.65;max-width:850px;margin:50px auto;padding:28px;background:var(--bg);color:var(--text-primary)}h1{font:42px var(--font-serif);color:var(--cream)}pre{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere}a{color:inherit}button{padding:12px 18px;background:var(--gold);color:var(--bg-nearblack);border:0;border-radius:5px;cursor:pointer}@media print{button{display:none}body{margin:0;padding:0;background:var(--cream);color:var(--bg)}h1{color:var(--bg)}}</style><p>CapexLayer / WEBSITE SECURITY FIELDBOOK</p><h1>Your review brief.</h1><p>User-entered evidence, ownership and next verification.</p><button onclick="window.print()">Print or save as PDF</button><pre>${esc(textBrief())}</pre><p><a href="https://capexlayer.com/security-start/">capexlayer.com/security-start/</a></p></html>`;
 download('website-security-review-brief.html',body,'text/html;charset=utf-8');
});
renderFindings();situate();activate(ids.includes(location.hash.slice(1))?location.hash.slice(1):ids[0]);update();
