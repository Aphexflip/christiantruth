# Myth Audit project instructions

## Mission
Build a fast, searchable, source-backed site that audits religious claims using the same evidentiary standard applied to any other claim.

The site may criticize religions, doctrines, scriptures, historical institutions, apologetic arguments, skeptical arguments, and political uses of religion. Do not target or demean people merely for belonging to a religion. Attack propositions and institutions, not protected classes of people.

## Product identity
The public experience should feel ominous, confrontational, dark, and memorable: an obsidian / blood-red evidence archive rather than a conventional blog. The atmosphere may be aggressive; the factual standard may not be.

Keep the visual language consistent with the current **Black Index / case-file / evidence-archive** direction unless intentionally redesigned:
- near-black surfaces;
- blood-red hierarchy and glows;
- severe condensed display typography;
- scanline / classified-file / warning treatments;
- restrained motion;
- excellent readability beneath the theatrical layer.

Do not let decorative horror styling interfere with accessibility, source legibility, mobile usability, or credibility.

## Homepage priority
The claim-audit database is the primary product and must remain above the fold. On an empty search, rank the feed by **Damning Score** so the highest-consequence evidence appears first.

Each claim card must open **inline in the feed first**. Do not make navigation to a standalone page the primary click behavior. Clicking the card opens a case dossier below it containing:
1. strongest reasonable defense / steelman;
2. core evidence audit;
3. apologetic defense tree with common follow-up arguments;
4. evidence response to each branch;
5. an "if they pivot" next-step response;
6. evidence bullets and sources;
7. secondary actions for copy/share/permanent standalone page.

Only one inline dossier should normally be open at a time to preserve the rapid-scroll experience.

Damning Score is an editorial 1–10 ranking of how strongly an audited claim challenges religious truth claims or moral authority. It should consider:
1. Severity of the implication.
2. Directness of the primary text or underlying evidence.
3. Evidential clarity / confidence.
4. Centrality to the religion's doctrine, history, or moral authority.

Do not present Damning Score as a scientific measurement. Keep evidence confidence separate from impact severity. Searching should prioritize query relevance first, using Damning Score as a secondary ranking signal.

## Editorial standard
Every important audit should include:
1. The exact claim.
2. A verdict: `supported`, `unsupported`, `misleading`, or `complex`.
3. A confidence level.
4. The strongest reasonable defense/steelman.
5. An evidence-based analysis that responds to that defense.
6. Concrete evidence bullets.
7. Primary or high-quality secondary sources.
8. Search aliases using language people actually type or say.
9. For high-priority claims, multiple rebuttal-tree branches representing real apologetic responses rather than invented weak arguments.

Defense-tree replies must steelman the real argument. Never fabricate foolish or deliberately weak Christian responses just to make rebuttal easy. Where a defense is genuinely strong or leaves uncertainty, say so.

Do not manufacture certainty. Distinguish:
- what a text says;
- what probably happened historically;
- what follows philosophically;
- what is a moral judgment;
- what remains disputed or unknown.

Correct weak skeptical arguments as aggressively as weak religious arguments. Credibility is a product feature.

## Architecture
- `index.html` — homepage and ranked/searchable inline audit feed.
- `data/claims.json` — canonical current claim database.
- `data/rebuttal-trees.json` — canonical mapped apologetic defenses and response branches for high-priority claims.
- `app.js` — homepage search/filter/ranking/render/inline-dossier behavior, including Damning Score.
- `claim.html` + `claim.js` — secondary permanent per-claim pages, including available defense trees.
- `vercel.json` — Vercel pretty `/claim/<slug>` routing.
- `_redirects` — compatibility routing for hosts that support it.
- `research/` — long-form evidence-first investigations.
- `styles.css` — shared Black Index visual system.
- Legacy root `claims.json` is not canonical and should not be used by new UI until intentionally migrated.

## Preserve
Do not remove or replace without explicit reason:
- Google AdSense client `ca-pub-1623067326733757`.
- Kit signup script `https://christiantruth-online.kit.com/33aacd08e9/index.js`.
- Existing research pages and sourced claims.

## Product rules
- Never generate fake duplicate claims to simulate infinite scroll.
- Prefer permanent shareable claim URLs as a secondary action.
- Search should match common paraphrases and aliases.
- Prefer sources users can open directly.
- Use primary sources, peer-reviewed work, major academic references, universities, museums, government science agencies, and reputable scholarly resources where possible.
- Bible quotations should link to the relevant passage; historical interpretation should also have independent scholarly support.
- Keep MYTH AUDIT as a working brand until domain/trademark clearance is intentionally completed.

## Deployment
Repository: `Aphexflip/christiantruth`
Default branch: `main`
Current rebrand branch: `agent/myth-audit-rebrand`
Current PR: #1
Vercel creates preview deployments from the PR branch. Do not assume a preview has been promoted to production.
