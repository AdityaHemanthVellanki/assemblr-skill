import { prisma } from '@assemblr/shared';
import { randomUUID } from 'node:crypto';

interface SeqItem { source: string; eventType: string }

interface CompiledNode {
  id: string;
  label: string;
  source: string;
  eventType: string;
  isOptional: boolean;
  parallelGroup: string | null;
  position: { x: number; y: number };
  metadata: Record<string, unknown>;
}

interface CompiledEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  conditionId: string | null;
}

interface CompiledCondition {
  id: string;
  field: string;
  operator: string;
  value: unknown;
}

export async function compileSkill(orgId: string, clusterId: string, name?: string) {
  const cluster = await prisma.workflowCluster.findUniqueOrThrow({ where: { id: clusterId } });
  if (cluster.orgId !== orgId) throw new Error('Cluster not in org');

  const sequence = cluster.eventSequence as SeqItem[];

  const trigger = {
    source: cluster.anchorSource,
    eventType: cluster.anchorEventType,
    conditions: {},
  };

  // Build nodes
  const nodes: CompiledNode[] = sequence.map((step, i) => ({
    id: randomUUID(),
    label: `${step.source}: ${step.eventType}`,
    source: step.source,
    eventType: step.eventType,
    isOptional: sequence.length > 5 && cluster.frequency < 5,
    parallelGroup: null,
    position: { x: 300, y: 100 + i * 120 },
    metadata: {},
  }));

  // Detect parallel groups (same-time cross-source steps)
  for (let i = 0; i < nodes.length - 1; i++) {
    if (nodes[i].source !== nodes[i + 1].source) {
      const groupId = randomUUID().slice(0, 8);
      nodes[i].parallelGroup = groupId;
      nodes[i + 1].parallelGroup = groupId;
    }
  }

  // Build edges (sequential, skip within same parallel group)
  const edges: CompiledEdge[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    if (nodes[i].parallelGroup && nodes[i].parallelGroup === nodes[i + 1].parallelGroup) continue;
    edges.push({
      id: randomUUID(),
      sourceNodeId: nodes[i].id,
      targetNodeId: nodes[i + 1].id,
      conditionId: null,
    });
  }

  // Infer conditions from event types
  const conditions: CompiledCondition[] = [];
  for (const step of sequence) {
    if (step.eventType.includes('P1') || step.eventType.includes('priority')) {
      conditions.push({ id: randomUUID(), field: 'priority', operator: 'eq', value: 'P1' });
    }
  }

  // Create Skill + first SkillVersion in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const skill = await tx.skill.create({
      data: {
        orgId,
        name: name || `Workflow: ${cluster.anchorSource}.${cluster.anchorEventType}`,
        description: `Auto-compiled from cluster (frequency: ${cluster.frequency}, confidence: ${cluster.confidenceScore.toFixed(2)})`,
        clusterId,
        status: 'draft',
      },
    });

    const version = await tx.skillVersion.create({
      data: {
        skillId: skill.id,
        version: 1,
        isLatest: true,
        trigger: trigger as any,
        nodes: nodes as any,
        edges: edges as any,
        conditions: conditions as any,
      },
    });

    await tx.workflowCluster.update({
      where: { id: clusterId },
      data: { status: 'compiled' },
    });

    return { skillId: skill.id, versionId: version.id, nodesCreated: nodes.length, edgesCreated: edges.length };
  });

  return result;
}

export async function createNewVersion(orgId: string, skillId: string): Promise<string> {
  const skill = await prisma.skill.findUniqueOrThrow({ where: { id: skillId } });
  if (skill.orgId !== orgId) throw new Error('Skill not in org');

  const current = await prisma.skillVersion.findFirst({
    where: { skillId, isLatest: true },
    orderBy: { version: 'desc' },
  });

  if (!current) throw new Error('No current version');

  const [, newVersion] = await prisma.$transaction([
    prisma.skillVersion.update({ where: { id: current.id }, data: { isLatest: false } }),
    prisma.skillVersion.create({
      data: {
        skillId,
        version: current.version + 1,
        isLatest: true,
        trigger: current.trigger as any,
        nodes: current.nodes as any,
        edges: current.edges as any,
        conditions: current.conditions as any,
        metadata: current.metadata as any,
      },
    }),
  ]);

  return newVersion.id;
}
