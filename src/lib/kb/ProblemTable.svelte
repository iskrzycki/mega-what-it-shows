<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import tickets from '#lib/data/tickets-4471.json';
  import { splitTicket, tagAgrees, type Problem } from '#lib/kb/problems';
  import type { Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';

  let { ticket }: { ticket: number } = $props();

  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const agree = $derived(tagAgrees(split.reports, tenantOf));
  const filed = tickets as Record<string, { issue: number; url: string; title: string }>;
  const list = (n: Record<string, number>) =>
    Object.entries(n)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} ×${v}`)
      .join(' · ');
  const of = (p: Problem) => filed[p];
</script>

<p class="sum">
  <strong>{split.reports.length}</strong> reports merged into #{ticket}
  ({split.rows} rows in the export, {split.rows - split.reports.length} of them repeats) ·
  <strong>{split.groups.length}</strong>
  {split.groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>ticket</th><th>tenants</th><th>came in by</th><th>intake tagged as</th><th>seen</th></tr>
  </thead>
  <tbody>
    {#each split.groups as g (g.problem)}
      <tr class:open={!of(g.problem)}>
        <td><code>{g.problem}</code></td>
        <td><strong>{g.reports.length}</strong></td>
        <td>
          {#if of(g.problem)}<a href={of(g.problem).url}>#{of(g.problem).issue}</a>{:else}no ticket yet{/if}
        </td>
        <td>{g.tenants.length}{#if g.tenants.length <= 5}<span class="tags">: {g.tenants.join(', ')}</span>{/if}</td>
        <td class="tags">{list(g.channels)}</td>
        <td class="tags">{list(g.taggedAs)}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
      </tr>
    {/each}
  </tbody>
</table>

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
