const DATA_URL='/data/claims.json';
const PAGE_SIZE=10;
const STATUS_LABELS={unsupported:'Unsupported',misleading:'Misleading',complex:'More complicated',supported:'Supported'};
let allClaims=[];
let shown=PAGE_SIZE;
let activeStatus='all';
let scrollLock=false;

const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const norm=value=>String(value??'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();

function tokenize(value){return [...new Set(norm(value).split(' ').filter(w=>w.length>1))];}
function scoreClaim(item,q){
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
function filtered(){
  const q=$('searchInput')?.value||'';
  const cat=$('categoryFilter')?.value||'all';
  return allClaims.map(item=>({...item,_score:scoreClaim(item,q)}))
    .filter(item=>(!q||item._score>0)&&(cat==='all'||item.category===cat)&&(activeStatus==='all'||item.status===activeStatus))
    .sort((a,b)=>b._score-a._score||a.id-b.id);
}
function sourceLinks(sources){return (sources||[]).map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a>`).join('');}
function card(item){
  const url=`/claim/${encodeURIComponent(item.slug)}`;
  return `<article class="claim-card">
    <div class="card-top"><div class="badges"><span class="badge ${esc(item.status)}">${esc(STATUS_LABELS[item.status]||item.status)}</span><span class="badge">${esc(item.category)}</span><span class="badge">${esc(item.confidence)} confidence</span></div><span class="meta">#${item.id}</span></div>
    <div class="claim-title">${esc(item.claim)}</div>
    <div class="verdict">${esc(item.verdict)}</div>
    <details><summary class="label" style="cursor:pointer">Show the strongest defense + audit</summary>
      <div class="label">Best defense</div><div class="details steelman">${esc(item.steelman)}</div>
      <div class="label">Audit</div><div class="details audit">${esc(item.analysis)}</div>
      <div class="label">Evidence</div><ul class="evidence-list">${(item.evidence||[]).map(e=>`<li>${esc(e)}</li>`).join('')}</ul>
      <div class="label">Sources</div><div class="source-links">${sourceLinks(item.sources)}</div>
    </details>
    <div class="card-actions"><a href="${url}">Open permanent page</a><button type="button" data-copy="${esc(item.slug)}">Copy rebuttal</button><button type="button" data-share="${esc(item.slug)}">Share</button></div>
  </article>`;
}
function render(){
  const results=filtered(); const page=results.slice(0,shown);
  $('feed').innerHTML=page.map(card).join('');
  $('emptyState').hidden=page.length!==0;
  $('claimCount').textContent=String(allClaims.length);
  $('resultsText').textContent=results.length?`Showing ${page.length} of ${results.length} matching audits`:'No matching audits yet';
  bindActions();
}
function bindActions(){
  document.querySelectorAll('[data-copy]').forEach(btn=>btn.onclick=()=>copyRebuttal(btn.dataset.copy));
  document.querySelectorAll('[data-share]').forEach(btn=>btn.onclick=()=>shareClaim(btn.dataset.share));
}
function bySlug(slug){return allClaims.find(c=>c.slug===slug);}
async function copyText(text){try{await navigator.clipboard.writeText(text);}catch{const t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();}}
async function copyRebuttal(slug){const item=bySlug(slug);if(!item)return;const text=`Claim: ${item.claim}\n\nVerdict: ${item.verdict}\n\nBest defense: ${item.steelman}\n\nEvidence audit: ${item.analysis}\n\nSources: ${(item.sources||[]).map(s=>s.url).join(' | ')}\n\n${location.origin}/claim/${item.slug}`;await copyText(text);}
async function shareClaim(slug){const item=bySlug(slug);if(!item)return;const url=`${location.origin}/claim/${item.slug}`;if(navigator.share){try{return await navigator.share({title:`Myth Audit: ${item.claim}`,text:item.verdict,url});}catch{}}await copyText(url);}
function populateCategories(){const select=$('categoryFilter');const cats=[...new Set(allClaims.map(c=>c.category))].sort();select.innerHTML='<option value="all">All categories</option>'+cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');}
function syncQuery(){const q=new URLSearchParams(location.search).get('q');if(q)$('searchInput').value=q;}
async function init(){
  try{
    const res=await fetch(DATA_URL,{cache:'no-store'}); if(!res.ok)throw new Error(`HTTP ${res.status}`);
    allClaims=await res.json(); populateCategories(); syncQuery(); render();
    $('searchInput').addEventListener('input',()=>{shown=PAGE_SIZE;render();});
    $('categoryFilter').addEventListener('change',()=>{shown=PAGE_SIZE;render();});
    document.querySelectorAll('[data-status]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-status]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');activeStatus=btn.dataset.status;shown=PAGE_SIZE;render();}));
    window.addEventListener('scroll',()=>{if(scrollLock)return;const results=filtered();if(shown>=results.length)return;if(innerHeight+scrollY<document.body.offsetHeight-700)return;scrollLock=true;shown+=PAGE_SIZE;render();setTimeout(()=>scrollLock=false,180);});
  }catch(err){$('feed').innerHTML=`<div class="empty">Claim database failed to load. ${esc(err.message)}</div>`;console.error(err);}
}
init();
