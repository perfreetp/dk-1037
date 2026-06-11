export interface RuleVersion {
  id: string;
  ruleName: string;
  versionNumber: string;
  status: 'draft' | 'published' | 'archived';
  configParams: RuleConfig;
  createdAt: string;
  updatedAt: string;
}

export interface RuleConfig {
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number;
  description: string;
}

export interface RuleCondition {
  id: string;
  field: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=' | 'in' | 'contains';
  value: any;
  logic?: 'AND' | 'OR';
}

export interface RuleAction {
  type: 'allow' | 'block' | 'review' | 'flag';
  priority: number;
}

export interface SampleData {
  id: string;
  testSetId?: string;
  data: Record<string, any>;
  groupTag: string;
  channel: string;
  timeRange: string;
  importedAt: string;
}

export interface TestSet {
  id: string;
  name: string;
  description: string;
  sampleIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TrialTask {
  id: string;
  ruleVersionId: string;
  sampleIds: string[];
  simulateParams: SimulateParams;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
}

export interface SimulateParams {
  startTime: string;
  endTime: string;
  environment: string;
}

export interface TrialResult {
  id: string;
  taskId: string;
  statistics: ResultStatistics;
  hitDetails: HitDetail[];
  missDetails: MissDetail[];
  ruleChain: RuleChainNode[];
  generatedAt: string;
}

export interface ResultStatistics {
  total: number;
  hitCount: number;
  missCount: number;
  passRate: number;
  avgExecutionTime: number;
}

export interface HitDetail {
  sampleId: string;
  userId: string;
  hit: boolean;
  hitRule: string;
  hitCondition: string;
  action: 'allow' | 'block' | 'review' | 'flag';
  executionTime: number;
  group?: string;
  channel?: string;
  timeRange?: string;
}

export interface MissDetail {
  sampleId: string;
  userId: string;
  hit: boolean;
  reason: string;
  suggestion: string;
  group?: string;
  channel?: string;
  timeRange?: string;
}

export interface RuleChainNode {
  nodeId: string;
  ruleName: string;
  status: 'passed' | 'failed' | 'skipped';
  executionTime: number;
  details?: string;
}

export interface AnomalyMark {
  id: string;
  resultId: string;
  sampleId: string;
  anomalyType: 'suspicious' | 'error' | 'unusual' | 'flagged';
  remark: string;
  markedAt: string;
}

export interface EvaluationReport {
  id: string;
  taskId: string;
  conclusion: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  suggestion: string;
  isApproved: boolean;
  createdAt: string;
  submittedAt?: string;
}

export interface TrialRecord {
  id: string;
  taskId: string;
  taskSnapshot: TrialTask;
  fullChain: any;
  isArchived: boolean;
  createdAt: string;
}

export interface ComparisonData {
  oldVersion: string;
  newVersion: string;
  comparison: {
    oldPassRate: number;
    newPassRate: number;
    passRateChange: number;
    affectedSamples: AffectedSample[];
    statistics: {
      improved: number;
      degraded: number;
      unchanged: number;
    };
  };
}

export interface AffectedSample {
  sampleId: string;
  oldResult: 'allow' | 'block' | 'review' | 'flag';
  newResult: 'allow' | 'block' | 'review' | 'flag';
  reason: string;
}

export interface GroupedData {
  dimension: string;
  groups: {
    name: string;
    count: number;
    passRate: number;
  }[];
}
