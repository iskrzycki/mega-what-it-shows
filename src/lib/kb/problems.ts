// Splits a ticket into the problems its reports hold, counted the way the desk's own view counts
// them: one report per id, placed by tenant (causes.ts). desk-notes.json lists the reports the desk
// read as a one-day move. A parser or a hint swaps day and month; neither moves a date by one day,
// so those reports are a problem of their own too. They stay counted where the desk files them.
import { groupByCause, uniqueById, type Cause, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = Cause | 'one-day' | 'unplaced';

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  tenants: string[];
  // How the reports came in: channel → count.
  channels: Record<string, number>;
  // What intake tagged them as: tag → count.
  taggedAs: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
  // Of these reports, how many the desk's view files under another problem.
  alsoUnder: { problem: Problem; count: number } | null;
};

const tally = (rs: Report[], key: (r: Report) => string) =>
  rs.reduce<Record<string, number>>((n, r) => ({ ...n, [key(r)]: (n[key(r)] ?? 0) + 1 }), {});

function group(problem: Problem, rs: Report[], alsoUnder: ProblemGroup['alsoUnder']): ProblemGroup {
  const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
  return {
    problem,
    reports: rs,
    tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
    channels: tally(rs, (r) => r.channel),
    taggedAs: tally(rs, (r) => r.meta.intakeTag),
    firstSeen: days[0],
    lastSeen: days[days.length - 1],
    alsoUnder,
  };
}

export function splitTicket(
  rows: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): { rows: number; reports: Report[]; groups: ProblemGroup[] } {
  const reports = uniqueById(rows).filter((r) => r.mergedInto === ticket);
  const byCause = groupByCause(reports, tenantOf);
  const groups = byCause.map((g) => group(g.cause, g.reports, null));
  const oneDay = reports.filter((r) => oneDayMove.includes(r.id));
  if (oneDay.length) {
    const filedUnder = byCause.find((g) => g.reports.some((r) => oneDayMove.includes(r.id)));
    groups.push(group('one-day', oneDay, filedUnder ? { problem: filedUnder.cause, count: oneDay.filter((r) => filedUnder.reports.includes(r)).length } : null));
  }
  return { rows: rows.filter((r) => r.mergedInto === ticket).length, reports, groups };
}

// Reports whose intake tag names the cause their tenant gives them.
export function tagAgrees(groups: ProblemGroup[]): number {
  return groups
    .filter((g) => g.problem === 'parser' || g.problem === 'hint')
    .reduce((n, g) => n + g.reports.filter((r) => r.meta.intakeTag === g.problem).length, 0);
}
