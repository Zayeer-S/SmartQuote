import type { TicketPriorityId } from '../../database/types/ids.js';
import {
  TicketPriorityRulesDAO,
  TicketPriorityThresholdsDAO,
} from '../../daos/children/ticket.priority.dao.js';
import type { BertEmbedder } from '../../lib/nlp/bert-embedder.js';
import {
  SMARTQUOTE_CONFIG_KEYS,
  TICKET_DEADLINE_PROXIMITY_BUCKETS,
  TICKET_DEADLINE_PROXIMITY_HOURS,
} from '../../../shared/constants/index.js';
import { cosineSimilarity } from '../../lib/nlp/cosine-similarity.js';
import type {
  PriorityEngineInput,
  PriorityRule,
  PriorityThreshold,
} from './ticket.priority.engine.types.js';
import type { Knex } from 'knex';

// TODO
interface ConfigRow {
  key: string;
  value: string;
}

type RuleMap = Map<string, Map<string, number>>;

export class TicketPriorityEngine {
  private rulesDAO: TicketPriorityRulesDAO;
  private thresholdsDAO: TicketPriorityThresholdsDAO;
  private embedder: BertEmbedder | null;
  private db: Knex;

  constructor(
    rulesDAO: TicketPriorityRulesDAO,
    thresholdsDAO: TicketPriorityThresholdsDAO,
    embedder: BertEmbedder | null,
    db: Knex
  ) {
    this.rulesDAO = rulesDAO;
    this.thresholdsDAO = thresholdsDAO;
    this.embedder = embedder;
    this.db = db;
  }

  async calculatePriority(input: PriorityEngineInput): Promise<TicketPriorityId> {
    const [rules, thresholds, nlpWeight, usersTiers] = await Promise.all([
      this.rulesDAO.getAll({ includeInactive: false }),
      this.thresholdsDAO.getAll({ includeInactive: false }),
      this.getConfig(SMARTQUOTE_CONFIG_KEYS.TICKET_PRIORITY_NLP_WEIGHT),
      this.getConfig(SMARTQUOTE_CONFIG_KEYS.TICKET_PRIORITY_USERS_IMPACTED_TIERS),
    ]);

    const parsedNlpWeight = parseFloat(nlpWeight);
    const parsedTiers = JSON.parse(usersTiers) as number[];

    const ruleMap = this.buildRuleMap(rules);

    const baseScore =
      this.resolvePoints(ruleMap, 'severity', input.ticketSeverity) +
      this.resolvePoints(ruleMap, 'business_impact', input.businessImpact) +
      this.resolvePoints(
        ruleMap,
        'users_impacted',
        this.resolveUsersTierLabel(input.usersImpacted, parsedTiers)
      ) +
      this.resolvePoints(ruleMap, 'deadline_proximity', this.resolveDeadlineBucket(input.deadline));

    const nlpSignal = await this.computeNlpSignal(input.description);
    const finalScore = Math.round(baseScore + nlpSignal * parsedNlpWeight);

    return this.resolveThreshold(thresholds, finalScore);
  }

  private buildRuleMap(rules: PriorityRule[]): RuleMap {
    const map = new Map<string, Map<string, number>>();
    for (const rule of rules) {
      if (!map.has(rule.dimension)) map.set(rule.dimension, new Map());
      map.get(rule.dimension)?.set(rule.value_name, rule.points);
    }
    return map;
  }

  private resolvePoints(ruleMap: RuleMap, dimension: string, valueName: string): number {
    const points = ruleMap.get(dimension)?.get(valueName);
    if (points === undefined)
      throw new Error(
        `TicketPriorityEngine: no active rule for dimension "${dimension}" value "${valueName}"`
      );
    return points;
  }

  private resolveUsersTierLabel(usersImpacted: number, tiers: number[]): string {
    if (tiers.length < 3)
      throw new Error(
        `TicketPriorityEngine: PRIORITY_USERS_IMPACTED_TIERS must have at least 3 breakpoints, got ${String(tiers.length)}`
      );

    const [t1, t2, t3] = tiers;

    if (usersImpacted <= t1) return `1-${String(t1)}`;
    if (usersImpacted <= t2) return `${String(t1 + 1)}-${String(t2)}`;
    if (usersImpacted <= t3) return `${String(t2 + 1)}-${String(t3)}`;
    return `${String(t3 + 1)}+`;
  }

  private resolveDeadlineBucket(deadline: Date): string {
    const hoursUntilDeadline = (deadline.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilDeadline <= TICKET_DEADLINE_PROXIMITY_HOURS.UNDER_24H)
      return TICKET_DEADLINE_PROXIMITY_BUCKETS.UNDER_24H;
    if (hoursUntilDeadline <= TICKET_DEADLINE_PROXIMITY_HOURS.ONE_TO_THREE_DAYS)
      return TICKET_DEADLINE_PROXIMITY_BUCKETS.ONE_TO_THREE_DAYS;
    if (hoursUntilDeadline <= TICKET_DEADLINE_PROXIMITY_HOURS.THREE_TO_SEVEN_DAYS)
      return TICKET_DEADLINE_PROXIMITY_BUCKETS.THREE_TO_SEVEN_DAYS;
    return TICKET_DEADLINE_PROXIMITY_BUCKETS.OVER_SEVEN_DAYS;
  }

  private async computeNlpSignal(description: string): Promise<number> {
    if (!this.embedder) return 0;

    const anchorEmbeddings = this.embedder.getAnchorEmbeddings();
    if (anchorEmbeddings.size === 0) return 0;

    const descriptionEmbedding = await this.embedder.embed(description);

    let bestSimilarity = -Infinity;
    let bestUrgencyScore = 0;

    for (const { embedding, urgency_score } of anchorEmbeddings.values()) {
      const similarity = cosineSimilarity(descriptionEmbedding, embedding);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestUrgencyScore = urgency_score;
      }
    }

    return bestUrgencyScore;
  }

  private resolveThreshold(thresholds: PriorityThreshold[], score: number): TicketPriorityId {
    const match = thresholds.find((t) => score >= t.min_score && score <= t.max_score);

    if (!match)
      throw new Error(
        `TicketPriorityEngine: no threshold covers final score ${String(score)}. ` +
          `Check that ticket_priority_thresholds seed data covers the full score range.`
      );

    return match.ticket_priority_id as unknown as TicketPriorityId;
  }

  // TODO CONFIG DAO ConfigsDAO
  private async getConfig(key: string): Promise<string> {
    const row = await this.db<ConfigRow>('smartquote_configs').where({ key }).first();
    if (!row) throw new Error(`TicketPriorityEngine: missing config key "${key}"`);
    return row.value;
  }
}
