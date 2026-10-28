# The page as the desk sees it

- `kb-incidents-4471-problems.png`: full-page screenshot of `/kb/incidents/4471/problems`, served from the build below.
- `site/`: the static build of the whole kb (`npm install && npm run build`, adapter-static). The page is `site/kb/incidents/4471/problems.html`.

Source of the page: `src/routes/kb/incidents/4471/problems/+page.svx`. Its numbers come from `src/lib/kb/problems.ts` and `src/lib/kb/ProblemTable.svelte`, built from `src/lib/data/` at render time.
