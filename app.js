const DATA_URL='/data/claims.json';
const TREE_URL='/data/rebuttal-trees.json';
const PAGE_SIZE=10;
const STATUS_LABELS={unsupported:'Unsupported',misleading:'Misleading',complex:'More complicated',supported:'Supported'};
const CONFIDENCE_WEIGHT={high:3,medium:2,low:1};

// Editorial consequence ranking. This is deliberately separate from evidence confidence.
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
let rebuttalTrees={};
let shown=PAGE_SIZE;
let activeStatus='all';
let openSlug=null;
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
    if(q&&b._match!==a._match)return b._match-a._match;
    if(sort==='confidence')return confidenceWeight(b)-confidenceWeight(a)||b._damning-a._damning||a.id-b.id;
    if(sort==='alpha')return a.claim.localeCompare(b.claim);
    return b._damning-a._damning||confidenceWeight(b)-confidenceWeight(a)||a.id-b.id;
  });
  return results;
}
function sourceLinks(sources){return (sources||[]).map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a>`).join('');}
function treeFor(item){
  const branches=rebuttalTrees[item.slug];
  if(Array.isArray(branches)&&branches.length)return branches;
  return [{
    defense:item.steelman,
    response:item.analysis,
    followup:'This file currently has the primary steelman loaded. Additional apologetic branches are being added as the database expands.'
  }];
}
function defenseTree(item){
  const branches=treeFor(item);
  return `<div class="defense-tree">
    <div class="tree-title"><h3>Apologetic defense tree</h3><span>${branches.length} ${branches.length===1?'defense':'defenses'} mapped</span></div>
    <div class="tree-list">${branches.map((branch,index)=>`<section class="defense-node">
      <div class="branch-index">BRANCH ${String(index+1).padStart(2,'0')}</div>
      <div class="micro-label">They say</div>
      <div class="they-say">“${esc(branch.defense)}”</div>
      <div class="response-block"><strong>Evidence response</strong>${esc(branch.response)}</div>
      <div class="followup"><b>If they pivot:</b> ${esc(branch.followup)}</div>
    </section>`).join('')}</div>
  </div>`;
}
function dossier(item){
  return `<div class="inline-dossier" id="dossier-${esc(item.slug)}">
    <div class="dossier-head"><strong>CASE OPEN // ${esc(item.slug.replaceAll('-',' ').toUpperCase())}</strong><span>follow every pivot</span></div>
    <div class="core-grid">
      <section class="core-box defense"><span class="micro-label">Strongest reasonable defense</span><p>${esc(item.steelman)}</p></section>
      <section class="core-box audit"><span class="micro-label">Core evidence audit</span><p>${esc(item.analysis)}</p></section>
    </div>
    ${defenseTree(item)}
    <div class="evidence-zone">
      <section class="evidence-panel"><span class="micro-label">Evidence on record</span><ul class="evidence-list">${(item.evidence||[]).map(e=>`<li>${esc(e)}</li>`).join('')}</ul></section>
      <section class="evidence-panel"><span class="micro-label">Open the sources yourself</span><div class="source-links">${sourceLinks(item.sources)}</div></section>
    </div>
    <div class="card-actions"><a href="/claim/${encodeURIComponent(item.slug)}">Open standalone dossier</a><button type="button" data-copy="${esc(item.slug)}">Copy full rebuttal</button><button type="button" data-share="${esc(item.slug)}">Share case</button></div>
  </div>`;
}
function card(item,rank){
  const score=Number(item._damning).toFixed(item._damning%1?1:0);
  const isOpen=openSlug===item.slug;
  return `<article class="claim-card ${item._damning>=9.5?'top-damning':''} ${isOpen?'open':''}" data-card="${esc(item.slug)}">
    <button class="claim-hit" type="button" data-expand="${esc(item.slug)}" aria-expanded="${isOpen}">
      <span class="impact-row">
        <span class="rank-block"><span class="rank-no">#${rank}</span><span class="rank-label">ranked case</span></span>
        <span class="damning-score" title="Editorial Damning Score: consequence + source directness + evidential clarity + doctrinal importance"><strong>${score}</strong><span>/10</span><em>${severityLabel(item._damning)}</em></span>
      </span>
      <span class="impact-caption">${esc(item._damningLabel)}</span>
      <span class="card-top"><span class="badges"><span class="badge ${esc(item.status)}">${esc(STATUS_LABELS[item.status]||item.status)}</span><span class="badge">${esc(item.category)}</span><span class="badge">${esc(item.confidence)} evidence confidence</span></span><span class="meta">Audit #${item.id}</span></span>
      <span class="claim-title">${esc(item.claim)}</span>
      <span class="verdict">${esc(item.verdict)}</span>
      <span class="open-prompt">${isOpen?'Close case file':'Open case + defense tree'}</span>
    </button>
    ${isOpen?dossier(item):''}
  </article>`;
}
function render(){
  const results=filtered(); const page=results.slice(0,shown);
  $('feed').innerHTML=page.map((item,index)=>card(item,index+1)).join('');
  $('emptyState').hidden=page.length!==0;
  $('claimCount').textContent=String(allClaims.length);
  $('treeCount').textContent=`${Object.keys(rebuttalTrees).length} loaded`;
  const q=$('searchInput')?.value.trim();
  const sortLabel={damning:'Damning Score',confidence:'evidence confidence',alpha:'A–Z'}[$('sortOrder')?.value||'damning'];
  $('resultsText').textContent=results.length?(q?`${results.length} matches // best match first`:`${results.length} case files // ranked by ${sortLabel}`):'No matching case files';
  bindActions();
}
function bindActions(){
  document.querySelectorAll('[data-expand]').forEach(btn=>btn.onclick=()=>toggleClaim(btn.dataset.expand));
  document.querySelectorAll('[data-copy]').forEach(btn=>btn.onclick=e=>{e.stopPropagation();copyRebuttal(btn.dataset.copy);});
  document.querySelectorAll('[data-share]').forEach(btn=>btn.onclick=e=>{e.stopPropagation();shareClaim(btn.dataset.share);});
}
function toggleClaim(slug){openSlug=openSlug===slug?null:slug;render();}
function bySlug(slug){return allClaims.find(c=>c.slug===slug);}
async function copyText(text){try{await navigator.clipboard.writeText(text);}catch{const t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();}}
async function copyRebuttal(slug){
  const item=bySlug(slug);if(!item)return;
  const dm=damningMeta(item);const branches=treeFor(item);
  const treeText=branches.map((b,i)=>`Defense ${i+1}: ${b.defense}\nResponse: ${b.response}\nIf they pivot: ${b.followup}`).join('\n\n');
  const text=`MYTH AUDIT // CASE FILE\n\nClaim: ${item.claim}\nVerdict: ${item.verdict}\nDamning Score: ${dm.score}/10 (${dm.label})\nEvidence confidence: ${item.confidence}\n\nStrongest defense: ${item.steelman}\n\nCore audit: ${item.analysis}\n\nCOMMON DEFENSES\n${treeText}\n\nSources: ${(item.sources||[]).map(s=>s.url).join(' | ')}\n\n${location.origin}/claim/${item.slug}`;
  await copyText(text);
}
async function shareClaim(slug){const item=bySlug(slug);if(!item)return;const url=`${location.origin}/claim/${item.slug}`;if(navigator.share){try{return await navigator.share({title:`Myth Audit: ${item.claim}`,text:item.verdict,url});}catch{}}await copyText(url);}
function populateCategories(){const select=$('categoryFilter');const cats=[...new Set(allClaims.map(c=>c.category))].sort();select.innerHTML='<option value="all">All categories</option>'+cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');}
function syncQuery(){const q=new URLSearchParams(location.search).get('q');if(q)$('searchInput').value=q;}
async function init(){
  try{
    const [claimsRes,treesRes]=await Promise.all([fetch(DATA_URL,{cache:'no-store'}),fetch(TREE_URL,{cache:'no-store'})]);
    if(!claimsRes.ok)throw new Error(`Claims HTTP ${claimsRes.status}`);
    allClaims=await claimsRes.json();
    rebuttalTrees=treesRes.ok?await treesRes.json():{};
    populateCategories();syncQuery();render();
    $('searchInput').addEventListener('input',()=>{shown=PAGE_SIZE;openSlug=null;render();});
    $('categoryFilter').addEventListener('change',()=>{shown=PAGE_SIZE;openSlug=null;render();});
    $('sortOrder').addEventListener('change',()=>{shown=PAGE_SIZE;openSlug=null;render();});
    document.querySelectorAll('[data-status]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-status]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');activeStatus=btn.dataset.status;shown=PAGE_SIZE;openSlug=null;render();}));
    window.addEventListener('scroll',()=>{if(scrollLock)return;const results=filtered();if(shown>=results.length)return;if(innerHeight+scrollY<document.body.offsetHeight-700)return;scrollLock=true;shown+=PAGE_SIZE;render();setTimeout(()=>scrollLock=false,180);});
  }catch(err){$('feed').innerHTML=`<div class="empty">Evidence archive failed to load. ${esc(err.message)}</div>`;console.error(err);}
}
init();
