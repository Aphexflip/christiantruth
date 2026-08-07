# Myth Audit project instructions

## Mission
Build a fast, searchable, source-backed site that audits religious claims using the same evidentiary standard applied to any other claim.

The site may criticize religions, doctrines, scriptures, historical institutions, apologetic arguments, skeptical arguments, and political uses of religion. Do not target or demean people merely for belonging to a religion. Attack propositions and institutions, not protected classes of people.

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

Do not manufacture certainty. Distinguish:
- what a text says;
- what probably happened historically;
- what follows philosophically;
- what is a moral judgment;
- what remains disputed or unknown.

Correct weak skeptical arguments as aggressively as weak religious arguments. Credibility is a product feature.

## Architecture
- `index.html` — homepage and searchable audit feed.
- `data/claims.json` — canonical current claim database.
- `app.js` — homepage search/filter/render behavior.
- `claim.html` + `claim.js` — permanent per-claim pages.
- `_redirects` — pretty `/claim/<slug>` routing.
- `research/` — long-form evidence-first investigations.
- `styles.css` — shared visual system.
- Legacy root `claims.json` is not canonical and should not be used by new UI until intentionally migrated.

## Preserve
Do not remove or replace without explicit reason:
- Google AdSense client `ca-pub-1623067326733757`.
- Kit signup script `https://christiantruth-online.kit.com/33aacd08e9/index.js`.
- Existing research pages and sourced claims.

## Product rules
- Never generate fake duplicate claims to simulate infinite scroll.
- Prefer permanent shareable claim URLs.
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
