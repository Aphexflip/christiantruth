const STATUS_LABELS={unsupported:'Unsupported',misleading:'Misleading',complex:'More complicated',supported:'Supported'};
const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const slug=decodeURIComponent(location.pathname.split('/').filter(Boolean).pop()==='claim.html'?(new URLSearchParams(location.search).get('claim')||''):location.pathname.split('/').filter(Boolean).pop()||'');
const root=document.getElementById('claimRoot');
async function copyText(text){try{await navigator.clipboard.writeText(text);}catch{const t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();}}
function links(sources){return (sources||[]).map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a>`).join('');}
function treeHtml(item,trees){const branches=(trees&&trees[item.slug])||[{defense:item.steelman,response:item.analysis,followup:'This dossier currently includes the primary steelman. Additional defense branches are being mapped.'}];return `<div class="defense-tree"><div class="tree-title"><h3>Apologetic defense tree</h3><span>${branches.length} ${branches.length===1?'defense':'defenses'} mapped</span></div><div class="tree-list">${branches.map((b,i)=>`<section class="defense-node"><div class="branch-index">BRANCH ${String(i+1).padStart(2,'0')}</div><div class="micro-label">They say</div><div class="they-say">“${esc(b.defense)}”</div><div class="response-block"><strong>Evidence response</strong>${esc(b.response)}</div><div class="followup"><b>If they pivot:</b> ${esc(b.followup)}</div></section>`).join('')}</div></div>`;}
async function init(){
 try{
  const [claimsRes,treesRes]=await Promise.all([fetch('/data/claims.json',{cache:'no-store'}),fetch('/data/rebuttal-trees.json',{cache:'no-store'})]);
  if(!claimsRes.ok)throw new Error(`HTTP ${claimsRes.status}`);
  const claims=await claimsRes.json();const trees=treesRes.ok?await treesRes.json():{};const item=claims.find(c=>c.slug===slug);
  if(!item){root.innerHTML='<div class="loading">That case file does not exist yet. <a href="/#claims">Search the Black Index.</a></div>';return;}
  document.title=`${item.claim} | Myth Audit`;
  const desc=item.verdict.slice(0,155);let meta=document.querySelector('meta[name="description"]');if(meta)meta.setAttribute('content',desc);
  root.innerHTML=`<section class="deep"><a class="crumb" href="/#claims">← Return to the Black Index</a><div class="kicker" style="margin-top:24px">Standalone case file // Audit #${item.id}</div><div class="badges"><span class="badge ${esc(item.status)}">${esc(STATUS_LABELS[item.status]||item.status)}</span><span class="badge">${esc(item.category)}</span><span class="badge">${esc(item.confidence)} evidence confidence</span></div><h1>${esc(item.claim)}</h1><p class="lede">${esc(item.verdict)}</p><div class="sharebox"><button class="button primary" id="copyBtn">Copy complete case</button><button class="button" id="shareBtn">Share dossier</button></div></section>
  <section class="section"><div class="core-grid"><article class="core-box defense"><span class="micro-label">Strongest reasonable defense</span><p>${esc(item.steelman)}</p></article><article class="core-box audit"><span class="micro-label">Core evidence audit</span><p>${esc(item.analysis)}</p></article></div>${treeHtml(item,trees)}</section>
  <section class="section"><div class="evidence-zone"><article class="evidence-panel"><span class="micro-label">Evidence on record</span><ul class="evidence-list">${(item.evidence||[]).map(e=>`<li>${esc(e)}</li>`).join('')}</ul></article><article class="evidence-panel"><span class="micro-label">Open the sources yourself</span><div class="source-links">${links(item.sources)}</div><p class="meta" style="margin-top:15px">Confidence: <span class="confidence ${esc(item.confidence)}">${esc(item.confidence)}</span>. Verdicts describe the claim—not the intelligence or character of people who believe it.</p></article></div></section>
  <section class="section"><div class="notice"><strong>RULE OF ENGAGEMENT:</strong> Do not let a claim silently mutate after evidence is presented. If the defense changes, follow the new branch and audit that version too.</div></section>`;
  const branches=(trees&&trees[item.slug])||[];
  const treeText=branches.map((b,i)=>`Defense ${i+1}: ${b.defense}\nResponse: ${b.response}\nIf they pivot: ${b.followup}`).join('\n\n');
  const full=`MYTH AUDIT // STANDALONE CASE FILE\n\nClaim: ${item.claim}\n\nVerdict: ${item.verdict}\n\nStrongest defense: ${item.steelman}\n\nCore audit: ${item.analysis}\n\n${treeText?`DEFENSE TREE\n${treeText}\n\n`:''}Evidence:\n- ${(item.evidence||[]).join('\n- ')}\n\nSources:\n${(item.sources||[]).map(s=>`${s.label}: ${s.url}`).join('\n')}\n\n${location.href}`;
  document.getElementById('copyBtn').onclick=()=>copyText(full);
  document.getElementById('shareBtn').onclick=async()=>{if(navigator.share){try{return await navigator.share({title:`Myth Audit: ${item.claim}`,text:item.verdict,url:location.href});}catch{}}await copyText(location.href);};
 }catch(err){root.innerHTML=`<div class="loading">Could not open this case file: ${esc(err.message)}</div>`;console.error(err);}
}
init();
