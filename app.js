const DATA_URL='/data/claims.json';
const PAGE_SIZE=10;
const STATUS_LABELS={unsupported:'Unsupported',misleading:'Misleading',complex:'More complicated',supported:'Supported'};
const CONFIDENCE_WEIGHT={high:3,medium:2,low:1};

// Editorial ranking: consequence to a religious truth/moral-authority claim if the audit holds.
// This is intentionally separate from evidence confidence.
const DAMNING_RULES=[
  {re:/slavery|slave|human ownership|property.*person|own.*forever/,score:10,label:'Extreme moral consequence'},
  {re:/killing of men women and children|kill.*children|children.*killed|amalek|jericho|genocide|total destruction|slaughter/,score:10,label:'Extreme moral consequence'},
  {re:/hell|eternal punishment|eternal torment|infinite punishment/,score:9.7,label:'Severe moral consequence'},
  {re:/women.*subordinate|women.*silent|women.*authority|misogyn|rape|sexual/,score:9.3,label:'Severe moral consequence'},
  {re:/conquest|canaan|exodus.*histor|joshua.*histor|promised land/,score:9.0,label:'Major historical + moral consequence'},
  {re:/prayer.*heal|healing.*prayer|intercessory prayer/,score:8.9,label:'Major testable claim'},
  {re:/resurrection/,score:8.8,label:'Central truth claim'},
  {re:/gospel.*eyewitness|eyewitness.*gospel|anonymous gospel/,score:8.7,label:'Central source-reliability claim'},
  {re:/global flood|noah.*flood|flood.*earth/,score:8.6,label:'Major historical claim'},
  {re:/prophecy|predicted.*future|fulfilled.*prophe/,score:8.4,label:'Major evidence claim'},
  {re:/young earth|six days|creationism|created exactly|adam and eve/,score:8.2,label:'Major science conflict'},
  {re:/bible.*contradict|perfectly consistent|inerrant|without error/,score:8.1,label:'Scriptural reliability claim'},
  {re:/morality|objective moral|atheists.*moral|without god.*moral/,score:7.9,label:'Major philosophical claim'},
  {re:/miracle|speaking in tongues|supernatural healing/,score:7.7,label:'Major supernatural claim'},
  {re:/fine tun|first cause|cosmological|everything.*creator|intelligent design/,score:7.5,label:'Major philosophical claim'},
  {re:/evolution|transitional fossil|thermodynamics/,score:7.4,label:'Science conflict'},
  {re:/constantine.*invent|nicaea.*canon|religion.*every war|all wars/,score:4.0,label:'Weak skeptical talking point'}
];

let allClaims=[];
let shown=PAGE_SIZE;
let activeStatus='all';
let scrollLock=false;

const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const norm=value=>String(value??'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();

function tokenize(value){return [...new Set(norm(value).split(' ').filter(w=>w.length>1))];}
function searchScore(item,q){
  if(!q)return 1;
  const query=norm(q); const words=tokenize(query);
  const claim=norm(item.claim); const aliases=norm((item.aliases||[]).join(' '));
  const verdict=norm(item.verdict); const analysis=norm(item.analysis); const evidence=norm((item.evidence||[]).join(' '));
  let score=0;
  if(claim===query)score+=200;
  if(claim.includes(query))score+=100;
  if(aliases.includes(query))score+=80;
  if(verdict.includes(query))score+=30;
  words.forEach(word=>{if(claim.includes(word))score+=12;if(aliases.includes(word))score+=9;if(verdict.includes(word))score+=4;if(analysis.includes(word))score+=2;if(evidence.includes(word))score+=2;});
  return score;
}
function damningMeta(item){
  const hay=norm(`${item.claim} ${(item.aliases||[]).join(' ')} ${item.analysis||''}`);
  const matched=DAMNING_RULES.find(rule=>rule.re.test(hay));
  if(matched)return matched;
  const base={supported:7.2,misleading:7.0,unsupported:6.8,complex:6.5}[item.status]||6.5;
  return {score:base,label:'Substantial claim'};
}
function confidenceWeight(item){return CONFIDENCE_WEIGHT[norm(item.confidence)]||0;}
function severityLabel(score){if(score>=9.5)return 'CRITICAL';if(score>=8.5)return 'SEVERE';if(score>=7.5)return 'HIGH';if(score>=6.5)return 'MAJOR';return 'LOWER';}
function filtered(){
  const q=$('searchInput')?.value||'';
  const cat=$('categoryFilter')?.value||'all';
  const sort=$('sortOrder')?.value||'damning';
  const results=allClaims.map(item=>{const dm=damningMeta(item);return {...item,_match:searchScore(item,q),_damning:dm.score,_damningLabel:dm.label};})
    .filter(item=>(!q||item._match>0)&&(cat==='all'||item.category===cat)&&(activeStatus==='all'||item.status===activeStatus));

  results.sort((a,b)=>{
    if(q && b._match!==a._match)return b._match-a._match;
    if(sort==='confidence')return confidenceWeight(b)-confidenceWeight(a)||b._damning-a._damning||a.id-b.id;
    if(sort==='alpha')return a.claim.localeCompare(b.claim);
    return b._damning-a._damning||confidenceWeight(b)-confidenceWeight(a)||a.id-b.id;
  });
  return results;
}
function sourceLinks(sources){return (sources||[]).map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a>`).join('');}
function card(item,rank){
  const url=`/claim/${encodeURIComponent(item.slug)}`;
  const score=Number(item._damning).toFixed(item._damning%1?1:0);
  return `<article class="claim-card ${item._damning>=9.5?'top-damning':''}">
    <div class="impact-row">
      <div class="rank-block"><span class="rank-no">#${rank}</span><span class="rank-label">ranked evidence</span></div>
      <div class="damning-score" title="Editorial Damning Score: severity + source directness + evidential clarity + doctrinal importance"><strong>${score}</strong><span>/10</span><em>${severityLabel(item._damning)}</em></div>
    </div>
    <div class="impact-caption">${esc(item._damningLabel)}</div>
    <div class="card-top"><div class="badges"><span class="badge ${esc(item.status)}">${esc(STATUS_LABELS[item.status]||item.status)}</span><span class="badge">${esc(item.category)}</span><span class="badge">${esc(item.confidence)} evidence confidence</span></div><span class="meta">Audit #${item.id}</span></div>
    <div class="claim-title">${esc(item.claim)}</div>
    <div class="verdict">${esc(item.verdict)}</div>
    <details><summary class="label audit-toggle">Open strongest defense + full audit</summary>
      <div class="label">Strongest defense</div><div class="details steelman">${esc(item.steelman)}</div>
      <div class="label">Evidence audit</div><div class="details audit">${esc(item.analysis)}</div>
      <div class="label">Evidence</div><ul class="evidence-list">${(item.evidence||[]).map(e=>`<li>${esc(e)}</li>`).join('')}</ul>
      <div class="label">Sources</div><div class="source-links">${sourceLinks(item.sources)}</div>
    </details>
    <div class="card-actions"><a href="${url}">Open permanent page</a><button type="button" data-copy="${esc(item.slug)}">Copy rebuttal</button><button type="button" data-share="${esc(item.slug)}">Share</button></div>
  </article>`;
}
function render(){
  const results=filtered(); const page=results.slice(0,shown);
  $('feed').innerHTML=page.map((item,index)=>card(item,index+1)).join('');
  $('emptyState').hidden=page.length!==0;
  $('claimCount').textContent=String(allClaims.length);
  const q=$('searchInput')?.value.trim();
  const sortLabel={damning:'Damning Score',confidence:'evidence confidence',alpha:'A–Z'}[$('sortOrder')?.value||'damning'];
  $('resultsText').textContent=results.length?(q?`${results.length} matches • best match first`:`${results.length} audits • ranked by ${sortLabel}`):'No matching audits yet';
  bindActions();
}
function bindActions(){
  document.querySelectorAll('[data-copy]').forEach(btn=>btn.onclick=()=>copyRebuttal(btn.dataset.copy));
  document.querySelectorAll('[data-share]').forEach(btn=>btn.onclick=()=>shareClaim(btn.dataset.share));
}
function bySlug(slug){return allClaims.find(c=>c.slug===slug);}
async function copyText(text){try{await navigator.clipboard.writeText(text);}catch{const t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();}}
async function copyRebuttal(slug){const item=bySlug(slug);if(!item)return;const dm=damningMeta(item);const text=`Claim: ${item.claim}\n\nVerdict: ${item.verdict}\nDamning Score: ${dm.score}/10 (${dm.label})\nEvidence confidence: ${item.confidence}\n\nStrongest defense: ${item.steelman}\n\nEvidence audit: ${item.analysis}\n\nSources: ${(item.sources||[]).map(s=>s.url).join(' | ')}\n\n${location.origin}/claim/${item.slug}`;await copyText(text);}
async function shareClaim(slug){const item=bySlug(slug);if(!item)return;const url=`${location.origin}/claim/${item.slug}`;if(navigator.share){try{return await navigator.share({title:`Myth Audit: ${item.claim}`,text:item.verdict,url});}catch{}}await copyText(url);}
function populateCategories(){const select=$('categoryFilter');const cats=[...new Set(allClaims.map(c=>c.category))].sort();select.innerHTML='<option value="all">All categories</option>'+cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');}
function syncQuery(){const q=new URLSearchParams(location.search).get('q');if(q)$('searchInput').value=q;}
async function init(){
  try{
    const res=await fetch(DATA_URL,{cache:'no-store'}); if(!res.ok)throw new Error(`HTTP ${res.status}`);
    allClaims=await res.json(); populateCategories(); syncQuery(); render();
    $('searchInput').addEventListener('input',()=>{shown=PAGE_SIZE;render();});
    $('categoryFilter').addEventListener('change',()=>{shown=PAGE_SIZE;render();});
    $('sortOrder').addEventListener('change',()=>{shown=PAGE_SIZE;render();});
    document.querySelectorAll('[data-status]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-status]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');activeStatus=btn.dataset.status;shown=PAGE_SIZE;render();}));
    window.addEventListener('scroll',()=>{if(scrollLock)return;const results=filtered();if(shown>=results.length)return;if(innerHeight+scrollY<document.body.offsetHeight-700)return;scrollLock=true;shown+=PAGE_SIZE;render();setTimeout(()=>scrollLock=false,180);});
  }catch(err){$('feed').innerHTML=`<div class="empty">Claim database failed to load. ${esc(err.message)}</div>`;console.error(err);}
}
init();
