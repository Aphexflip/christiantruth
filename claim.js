const STATUS_LABELS={unsupported:'Unsupported',misleading:'Misleading',complex:'More complicated',supported:'Supported'};
const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const slug=decodeURIComponent(location.pathname.split('/').filter(Boolean).pop()==='claim.html'?(new URLSearchParams(location.search).get('claim')||''):location.pathname.split('/').filter(Boolean).pop()||'');
const root=document.getElementById('claimRoot');
async function copyText(text){try{await navigator.clipboard.writeText(text);}catch{const t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();}}
function links(sources){return (sources||[]).map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a>`).join('');}
async function init(){
 try{
  const res=await fetch('/data/claims.json',{cache:'no-store'});if(!res.ok)throw new Error(`HTTP ${res.status}`);const claims=await res.json();const item=claims.find(c=>c.slug===slug);
  if(!item){root.innerHTML='<div class="loading">That audit does not exist yet. <a href="/#claims">Search all claims.</a></div>';return;}
  document.title=`${item.claim} | Myth Audit`;
  const desc=item.verdict.slice(0,155);let meta=document.querySelector('meta[name="description"]');if(meta)meta.setAttribute('content',desc);
  root.innerHTML=`<section class="deep"><a class="crumb" href="/#claims">← All claim audits</a><div style="margin-top:22px" class="badges"><span class="badge ${esc(item.status)}">${esc(STATUS_LABELS[item.status]||item.status)}</span><span class="badge">${esc(item.category)}</span><span class="badge">${esc(item.confidence)} confidence</span></div><h1>${esc(item.claim)}</h1><p class="lede">${esc(item.verdict)}</p><div class="sharebox"><button class="button primary" id="copyBtn">Copy full rebuttal</button><button class="button" id="shareBtn">Share this audit</button></div></section>
  <section class="section"><div class="deep-grid"><article class="panel"><div class="label">Strongest defense</div><div class="steelman details">${esc(item.steelman)}</div></article><article class="panel"><div class="label">Evidence audit</div><div class="audit details">${esc(item.analysis)}</div></article></div></section>
  <section class="section"><article class="panel"><h2>What the evidence actually gives us</h2><ul class="evidence-list">${(item.evidence||[]).map(e=>`<li>${esc(e)}</li>`).join('')}</ul><div class="label">Sources</div><div class="source-links">${links(item.sources)}</div><p class="meta" style="margin-top:18px">Confidence: <span class="confidence ${esc(item.confidence)}">${esc(item.confidence)}</span>. Verdicts describe the specific claim above, not the intelligence or character of people who believe it.</p></article></section>
  <section class="section"><div class="notice"><strong>Debate rule:</strong> Do not replace this claim with an easier one. If a defender offers a stronger formulation or better evidence, audit that version instead. The point is to test the best case, not win against a strawman.</div></section>`;
  const full=`Claim: ${item.claim}\n\nVerdict: ${item.verdict}\n\nStrongest defense: ${item.steelman}\n\nAudit: ${item.analysis}\n\nEvidence:\n- ${(item.evidence||[]).join('\n- ')}\n\nSources:\n${(item.sources||[]).map(s=>`${s.label}: ${s.url}`).join('\n')}\n\n${location.href}`;
  document.getElementById('copyBtn').onclick=()=>copyText(full);
  document.getElementById('shareBtn').onclick=async()=>{if(navigator.share){try{return await navigator.share({title:`Myth Audit: ${item.claim}`,text:item.verdict,url:location.href});}catch{}}await copyText(location.href);};
 }catch(err){root.innerHTML=`<div class="loading">Could not load this audit: ${esc(err.message)}</div>`;console.error(err);}
}
init();
