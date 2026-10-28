<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import tickets from '#lib/data/tickets-4471.json';
  import { splitTicket, tagAgrees, type Problem } from '#lib/kb/problems';
  import type { Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';

  let { ticket }: { ticket: number } = $props();

  type Filed = { issue: number; url: string; title: string; state: 'open' | 'closed'; outcome: string; why: string };
  const filed = tickets as Record<string, Filed>;
  const of = (p: Problem): Filed | undefined => filed[p];

  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const placed = $derived(split.groups.filter((g) => g.problem !== 'one-day'));
  const agree = $derived(tagAgrees(split.groups));
  const list = (n: Record<string, number>) =>
    Object.entries(n)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} ×${v}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{split.reports.length}</strong> reports merged into #{ticket}
  ({split.rows} rows in the export, {split.rows - split.reports.length} of them repeats) ·
  <strong>{split.groups.length}</strong>
  {split.groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>ticket</th><th>outcome</th><th>tenants</th><th>came in by</th><th>intake tagged as</th><th>seen</th></tr>
  </thead>
  <tbody>
    {#each split.groups as g (g.problem)}
      {@const t = of(g.problem)}
      <tr class:open={!t || t.state === 'open'}>
        <td><code>{g.problem}</code></td>
        <td><strong>{g.reports.length}</strong></td>
        <td>{#if t}<a href={t.url}>#{t.issue}</a> {t.state}{:else}no ticket{/if}</td>
        <td>{#if t}<b>{t.outcome}</b><span class="tags">: {t.why}</span>{/if}</td>
        <td>{g.tenants.length}{#if g.tenants.length <= 5}<span class="tags">: {g.tenants.join(', ')}</span>{/if}</td>
        <td class="tags">{list(g.channels)}</td>
        <td class="tags">{list(g.taggedAs)}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
      </tr>
    {/each}
  </tbody>
</table>

{#each split.groups as g (g.problem)}
  {#if g.alsoUnder}
    <p class="note">
      The {g.alsoUnder.count} <code>{g.problem}</code> reports are also counted under
      <code>{g.alsoUnder.problem}</code>, where the desk's view files them by tenant. The tenant
      causes alone place each report once: {placed.reduce((n, p) => n + p.reports.length, 0)} in all.
    </p>
  {/if}
{/each}

<p class="note">
  Intake guesses its tag from the reporter's browser. It names the tenant's cause in {agree} of
  {split.reports.length} reports and the other cause in {split.reports.length - agree}.
</p>

<style>
  .sum { font-size: 1.1rem; }
  .tags { color: var(--muted); font-size: 0.85em; }
  .note { color: var(--muted); font-size: 0.85em; }
  .open td { background: var(--warn-bg); }
</style>
