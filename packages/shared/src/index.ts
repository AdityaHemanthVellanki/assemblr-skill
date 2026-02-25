export { prisma } from './db';
export type { PrismaClient } from './db';

export {
  QUEUE_NAME,
  enqueueJob,
  createWorkerConnection,
  type JobType,
  type JobPayload,
  type BackfillPayload,
  type NormalizePayload,
  type WorkflowClusterPayload,
  type SkillCompilePayload,
  type NightlyPayload,
} from './queue';

// ─── Shared types ───

export type Source = 'SLACK' | 'GITHUB' | 'HUBSPOT' | 'JIRA' | 'NOTION' | 'GOOGLE';

export type EntityType =
  | 'message' | 'channel' | 'reaction'
  | 'pull_request' | 'issue' | 'commit' | 'release' | 'repository'
  | 'deal' | 'contact' | 'company' | 'ticket'
  | 'task' | 'sprint' | 'board'
  | 'page' | 'database' | 'block'
  | 'email' | 'document' | 'calendar_event' | 'file'
  | 'unknown';

export interface UniversalEventInput {
  orgId: string;
  source: Source;
  eventType: string;
  actorId: string | null;
  entityType: EntityType;
  entityId: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
  rawEventId: string;
}

export interface SkillGraphExport {
  id: string;
  skillId: string;
  version: number;
  trigger: { source: string; eventType: string; conditions: Record<string, unknown> };
  nodes: SkillNodeExport[];
  edges: SkillEdgeExport[];
  conditions: SkillConditionExport[];
  toolBindings: ToolBindingExport[];
}

export interface SkillNodeExport {
  id: string;
  label: string;
  source: string;
  eventType: string;
  isOptional: boolean;
  parallelGroup: string | null;
  position: { x: number; y: number };
  metadata: Record<string, unknown>;
}

export interface SkillEdgeExport {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  conditionId: string | null;
}

export interface SkillConditionExport {
  id: string;
  field: string;
  operator: string;
  value: unknown;
}

export interface ToolBindingExport {
  nodeId: string;
  tool: string;
  source: string;
  action: string;
  parameters: Record<string, unknown>;
}

// ─── Encryption ───

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';

function deriveKey(salt: Buffer): Buffer {
  return scryptSync(process.env.ENCRYPTION_KEY!, salt, 32);
}

export function encrypt(plaintext: string): string {
  const salt = randomBytes(16);
  const key = deriveKey(salt);
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return [salt.toString('hex'), iv.toString('hex'), tag.toString('hex'), encrypted].join(':');
}

export function decrypt(ciphertext: string): string {
  const [saltHex, ivHex, tagHex, encrypted] = ciphertext.split(':');
  const salt = Buffer.from(saltHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const key = deriveKey(salt);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
