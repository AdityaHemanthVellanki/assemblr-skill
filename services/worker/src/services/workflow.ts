import { prisma } from '@assemblr/shared';

interface SeqItem { source: string; eventType: string }

interface AnchorConfig { source: string; eventType: string }

const DEFAULT_ANCHORS: AnchorConfig[] = [
  { source: 'JIRA', eventType: 'issue.priority_changed' },
  { source: 'JIRA', eventType: 'issue.status_changed' },
  { source: 'JIRA', eventType: 'issue.created' },
  { source: 'HUBSPOT', eventType: 'deal.stage_changed' },
  { source: 'GITHUB', eventType: 'release.created' },
  { source: 'GITHUB', eventType: 'pull_request.merged' },
  { source: 'SLACK', eventType: 'message.sent' },
];

const MIN_FREQUENCY = 3;
const WINDOW_HOURS = 24;

export async function detectWorkflows(orgId: string): Promise<number> {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  let clustersCreated = 0;

  for (const anchor of DEFAULT_ANCHORS) {
    const anchorEvents = await prisma.universalEvent.findMany({
      where: { orgId, source: anchor.source as any, eventType: anchor.eventType, timestamp: { gte: ninetyDaysAgo } },
      orderBy: { timestamp: 'asc' },
    });

    if (anchorEvents.length === 0) continue;

    const sequences: SeqItem[][] = [];

    for (const evt of anchorEvents) {
      const windowEnd = new Date(evt.timestamp.getTime() + WINDOW_HOURS * 3600_000);
      const following = await prisma.universalEvent.findMany({
        where: { orgId, timestamp: { gte: evt.timestamp, lte: windowEnd }, id: { not: evt.id } },
        orderBy: { timestamp: 'asc' },
        take: 50,
      });

      const seq: SeqItem[] = following.map((e) => ({ source: e.source, eventType: e.eventType }));
      if (seq.length >= 2) sequences.push(seq);
    }

    const clusters = clusterSequences(sequences);

    for (const cluster of clusters) {
      if (cluster.frequency >= MIN_FREQUENCY) {
        await prisma.workflowCluster.create({
          data: {
            orgId,
            anchorEventType: anchor.eventType,
            anchorSource: anchor.source,
            eventSequence: cluster.sequence as any,
            frequency: cluster.frequency,
            entropyScore: cluster.entropy,
            confidenceScore: cluster.confidence,
            status: 'candidate',
          },
        });
        clustersCreated++;
      }
    }
  }

  return clustersCreated;
}

function clusterSequences(sequences: SeqItem[][]): Array<{ sequence: SeqItem[]; frequency: number; entropy: number; confidence: number }> {
  if (sequences.length === 0) return [];

  // Group by signature
  const groups = new Map<string, { seqs: SeqItem[][]; canonical: SeqItem[] }>();
  for (const seq of sequences) {
    const sig = seq.slice(0, 10).map((s) => `${s.source}:${s.eventType}`).join('|');
    const g = groups.get(sig);
    if (g) g.seqs.push(seq);
    else groups.set(sig, { seqs: [seq], canonical: seq });
  }

  // Merge similar clusters (Jaccard >= 0.6)
  const entries = Array.from(groups.values());
  const merged: typeof entries = [];
  const used = new Set<number>();

  for (let i = 0; i < entries.length; i++) {
    if (used.has(i)) continue;
    const cur = { ...entries[i], seqs: [...entries[i].seqs] };
    for (let j = i + 1; j < entries.length; j++) {
      if (used.has(j)) continue;
      if (jaccard(cur.canonical, entries[j].canonical) >= 0.6) {
        cur.seqs.push(...entries[j].seqs);
        used.add(j);
      }
    }
    merged.push(cur);
  }

  return merged.map((c) => {
    const freq = c.seqs.length;
    const ent = entropy(c.seqs);
    const conf = (Math.min(freq / Math.max(sequences.length, 1), 1)) * 0.6 + (1 - Math.min(ent / 5, 1)) * 0.4;
    return { sequence: c.canonical, frequency: freq, entropy: ent, confidence: conf };
  }).sort((a, b) => b.confidence - a.confidence);
}

function jaccard(a: SeqItem[], b: SeqItem[]): number {
  const sa = new Set(a.map((s) => `${s.source}:${s.eventType}`));
  const sb = new Set(b.map((s) => `${s.source}:${s.eventType}`));
  const inter = new Set([...sa].filter((x) => sb.has(x)));
  const union = new Set([...sa, ...sb]);
  return union.size === 0 ? 0 : inter.size / union.size;
}

function entropy(sequences: SeqItem[][]): number {
  const counts = new Map<string, number>();
  let total = 0;
  for (const seq of sequences) for (const s of seq) {
    const k = `${s.source}:${s.eventType}`;
    counts.set(k, (counts.get(k) || 0) + 1);
    total++;
  }
  let e = 0;
  for (const c of counts.values()) { const p = c / total; if (p > 0) e -= p * Math.log2(p); }
  return e;
}
