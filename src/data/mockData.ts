import type {
  RuleVersion,
  SampleData,
  TestSet,
  TrialTask,
  TrialResult,
  EvaluationReport,
  TrialRecord
} from '../types';

export const mockRules: RuleVersion[] = [
  {
    id: 'rule_001',
    ruleName: '风控规则-交易限额',
    versionNumber: 'v2.1.0',
    status: 'published',
    configParams: {
      conditions: [
        { id: 'c1', field: 'amount', operator: '>', value: 1000, logic: 'AND' },
        { id: 'c2', field: 'amount', operator: '<=', value: 5000, logic: 'AND' },
        { id: 'c3', field: 'frequency', operator: '<=', value: 5, logic: 'AND' }
      ],
      actions: [
        { type: 'allow', priority: 1 }
      ],
      priority: 1,
      description: '交易金额在1000-5000之间，频率不超过5次/小时，允许通过'
    },
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-10T15:30:00Z'
  },
  {
    id: 'rule_002',
    ruleName: '风控规则-异常交易检测',
    versionNumber: 'v1.5.0',
    status: 'published',
    configParams: {
      conditions: [
        { id: 'c1', field: 'location_change', operator: '==', value: true, logic: 'AND' },
        { id: 'c2', field: 'time_gap', operator: '<', value: 30, logic: 'AND' }
      ],
      actions: [
        { type: 'review', priority: 2 }
      ],
      priority: 2,
      description: '位置突变且时间间隔小于30分钟，进入人工审核'
    },
    createdAt: '2026-05-15T09:00:00Z',
    updatedAt: '2026-06-08T11:20:00Z'
  },
  {
    id: 'rule_003',
    ruleName: '营销规则-新用户优惠',
    versionNumber: 'v1.0.0',
    status: 'draft',
    configParams: {
      conditions: [
        { id: 'c1', field: 'user_age', operator: '<=', value: 30, logic: 'AND' },
        { id: 'c2', field: 'is_new_user', operator: '==', value: true, logic: 'AND' }
      ],
      actions: [
        { type: 'allow', priority: 3 }
      ],
      priority: 3,
      description: '30岁以下新用户给予优惠'
    },
    createdAt: '2026-06-05T14:00:00Z',
    updatedAt: '2026-06-05T14:00:00Z'
  }
];

export const mockSamples: SampleData[] = [
  { id: 'sample_001', data: { userId: 'user_1001', amount: 2500, frequency: 3, channel: 'mobile', group: 'vip', location_change: false, time_gap: 120, user_age: 28, is_new_user: false }, groupTag: 'VIP用户', channel: 'mobile', timeRange: '2026-06-01', importedAt: '2026-06-10T08:00:00Z' },
  { id: 'sample_002', data: { userId: 'user_1002', amount: 800, frequency: 2, channel: 'web', group: 'normal', location_change: false, time_gap: 200, user_age: 35, is_new_user: false }, groupTag: '普通用户', channel: 'web', timeRange: '2026-06-01', importedAt: '2026-06-10T08:00:00Z' },
  { id: 'sample_003', data: { userId: 'user_1003', amount: 3500, frequency: 1, channel: 'mobile', group: 'vip', location_change: true, time_gap: 15, user_age: 25, is_new_user: true }, groupTag: 'VIP用户', channel: 'mobile', timeRange: '2026-06-02', importedAt: '2026-06-10T08:00:00Z' },
  { id: 'sample_004', data: { userId: 'user_1004', amount: 6000, frequency: 4, channel: 'app', group: 'normal', location_change: false, time_gap: 180, user_age: 42, is_new_user: false }, groupTag: '普通用户', channel: 'app', timeRange: '2026-06-02', importedAt: '2026-06-10T08:00:00Z' },
  { id: 'sample_005', data: { userId: 'user_1005', amount: 1500, frequency: 6, channel: 'web', group: 'high_risk', location_change: true, time_gap: 25, user_age: 32, is_new_user: false }, groupTag: '高风险用户', channel: 'web', timeRange: '2026-06-03', importedAt: '2026-06-10T08:00:00Z' },
  { id: 'sample_006', data: { userId: 'user_1006', amount: 4200, frequency: 2, channel: 'mobile', group: 'vip', location_change: false, time_gap: 240, user_age: 29, is_new_user: true }, groupTag: 'VIP用户', channel: 'mobile', timeRange: '2026-06-03', importedAt: '2026-06-10T08:00:00Z' },
  { id: 'sample_007', data: { userId: 'user_1007', amount: 1200, frequency: 1, channel: 'app', group: 'normal', location_change: false, time_gap: 300, user_age: 38, is_new_user: false }, groupTag: '普通用户', channel: 'app', timeRange: '2026-06-04', importedAt: '2026-06-10T08:00:00Z' },
  { id: 'sample_008', data: { userId: 'user_1008', amount: 2800, frequency: 3, channel: 'mobile', group: 'vip', location_change: true, time_gap: 45, user_age: 26, is_new_user: false }, groupTag: 'VIP用户', channel: 'mobile', timeRange: '2026-06-04', importedAt: '2026-06-10T08:00:00Z' },
  { id: 'sample_009', data: { userId: 'user_1009', amount: 900, frequency: 7, channel: 'web', group: 'high_risk', location_change: false, time_gap: 90, user_age: 45, is_new_user: false }, groupTag: '高风险用户', channel: 'web', timeRange: '2026-06-05', importedAt: '2026-06-10T08:00:00Z' },
  { id: 'sample_010', data: { userId: 'user_1010', amount: 3800, frequency: 2, channel: 'mobile', group: 'vip', location_change: false, time_gap: 150, user_age: 31, is_new_user: true }, groupTag: 'VIP用户', channel: 'mobile', timeRange: '2026-06-05', importedAt: '2026-06-10T08:00:00Z' }
];

export const mockTestSets: TestSet[] = [
  { id: 'ts_001', name: 'VIP用户测试集', description: '包含所有VIP用户的样本', sampleIds: ['sample_001', 'sample_003', 'sample_006', 'sample_008', 'sample_010'], createdAt: '2026-06-08T10:00:00Z', updatedAt: '2026-06-10T08:00:00Z' },
  { id: 'ts_002', name: '高风险用户测试集', description: '包含高风险用户的样本', sampleIds: ['sample_005', 'sample_009'], createdAt: '2026-06-08T11:00:00Z', updatedAt: '2026-06-09T09:00:00Z' },
  { id: 'ts_003', name: '新用户测试集', description: '新注册用户的样本', sampleIds: ['sample_003', 'sample_006', 'sample_010'], createdAt: '2026-06-09T14:00:00Z', updatedAt: '2026-06-09T14:00:00Z' }
];

export const mockTasks: TrialTask[] = [
  {
    id: 'task_001',
    ruleVersionId: 'rule_001',
    sampleIds: ['sample_001', 'sample_002', 'sample_003', 'sample_004', 'sample_005'],
    simulateParams: { startTime: '2026-06-01', endTime: '2026-06-10', environment: 'staging' },
    status: 'completed',
    createdAt: '2026-06-10T09:00:00Z',
    completedAt: '2026-06-10T09:00:05Z'
  },
  {
    id: 'task_002',
    ruleVersionId: 'rule_002',
    sampleIds: ['sample_003', 'sample_005', 'sample_008'],
    simulateParams: { startTime: '2026-06-01', endTime: '2026-06-10', environment: 'staging' },
    status: 'completed',
    createdAt: '2026-06-10T10:00:00Z',
    completedAt: '2026-06-10T10:00:03Z'
  }
];

export const mockResults: Record<string, TrialResult> = {
  'task_001': {
    id: 'result_001',
    taskId: 'task_001',
    statistics: { total: 5, hitCount: 4, missCount: 1, passRate: 80.0, avgExecutionTime: 125 },
    hitDetails: [
      { sampleId: 'sample_001', userId: 'user_1001', hit: true, hitRule: 'rule_001', hitCondition: 'amount > 1000 && amount <= 5000', action: 'allow', executionTime: 120, group: 'VIP用户', channel: 'mobile', timeRange: '2026-06-01' },
      { sampleId: 'sample_003', userId: 'user_1003', hit: true, hitRule: 'rule_001', hitCondition: 'amount > 1000 && amount <= 5000', action: 'allow', executionTime: 130, group: 'VIP用户', channel: 'mobile', timeRange: '2026-06-02' },
      { sampleId: 'sample_004', userId: 'user_1004', hit: false, hitRule: 'rule_001', hitCondition: 'amount > 5000', action: 'block', executionTime: 115, group: '普通用户', channel: 'app', timeRange: '2026-06-02' },
      { sampleId: 'sample_005', userId: 'user_1005', hit: true, hitRule: 'rule_001', hitCondition: 'amount > 1000 && amount <= 5000', action: 'allow', executionTime: 140, group: '高风险用户', channel: 'web', timeRange: '2026-06-03' }
    ],
    missDetails: [
      { sampleId: 'sample_002', userId: 'user_1002', hit: false, reason: 'amount <= 1000', suggestion: '低于最低交易限额', group: '普通用户', channel: 'web', timeRange: '2026-06-01' }
    ],
    ruleChain: [
      { nodeId: 'node_001', ruleName: '基础规则检查', status: 'passed', executionTime: 15, details: '通过基础验证' },
      { nodeId: 'node_002', ruleName: '交易限额检查', status: 'passed', executionTime: 45, details: '交易金额符合规则' },
      { nodeId: 'node_003', ruleName: '频率限制检查', status: 'passed', executionTime: 30, details: '频率在限制范围内' },
      { nodeId: 'node_004', ruleName: '最终决策', status: 'passed', executionTime: 35, details: '生成最终决策' }
    ],
    generatedAt: '2026-06-10T09:00:05Z'
  },
  'task_002': {
    id: 'result_002',
    taskId: 'task_002',
    statistics: { total: 3, hitCount: 3, missCount: 0, passRate: 100.0, avgExecutionTime: 98 },
    hitDetails: [
      { sampleId: 'sample_003', userId: 'user_1003', hit: true, hitRule: 'rule_002', hitCondition: 'location_change == true && time_gap < 30', action: 'review', executionTime: 95, group: 'VIP用户', channel: 'mobile', timeRange: '2026-06-02' },
      { sampleId: 'sample_005', userId: 'user_1005', hit: true, hitRule: 'rule_002', hitCondition: 'location_change == true && time_gap < 30', action: 'review', executionTime: 100, group: '高风险用户', channel: 'web', timeRange: '2026-06-03' },
      { sampleId: 'sample_008', userId: 'user_1008', hit: true, hitRule: 'rule_002', hitCondition: 'location_change == true && time_gap < 30', action: 'review', executionTime: 99, group: 'VIP用户', channel: 'mobile', timeRange: '2026-06-04' }
    ],
    missDetails: [],
    ruleChain: [
      { nodeId: 'node_001', ruleName: '位置变化检测', status: 'passed', executionTime: 20, details: '检测到位置变化' },
      { nodeId: 'node_002', ruleName: '时间间隔分析', status: 'passed', executionTime: 35, details: '间隔小于30分钟' },
      { nodeId: 'node_003', ruleName: '风险评估', status: 'passed', executionTime: 43, details: '标记为需审核' }
    ],
    generatedAt: '2026-06-10T10:00:03Z'
  }
};

export const mockReports: EvaluationReport[] = [
  {
    id: 'report_001',
    taskId: 'task_001',
    conclusion: '规则v2.1.0整体表现良好，通过率为80%。发现1条异常样本，建议调整最低交易限额至800元。',
    riskLevel: 'medium',
    suggestion: '建议先在10%流量上进行灰度测试，观察3天后若无异常再全量上线。',
    isApproved: false,
    createdAt: '2026-06-10T09:30:00Z',
    submittedAt: '2026-06-10T09:30:00Z'
  },
  {
    id: 'report_002',
    taskId: 'task_002',
    conclusion: '异常交易检测规则表现优秀，100%识别出位置突变的交易。建议继续保持现有规则配置。',
    riskLevel: 'low',
    suggestion: '风险较低，可以直接上线。建议持续监控识别率。',
    isApproved: true,
    createdAt: '2026-06-10T10:30:00Z',
    submittedAt: '2026-06-10T10:30:00Z'
  }
];

export const mockRecords: TrialRecord[] = [
  {
    id: 'record_001',
    taskId: 'task_001',
    taskSnapshot: mockTasks[0],
    fullChain: mockResults['task_001'],
    isArchived: false,
    createdAt: '2026-06-10T09:00:00Z'
  },
  {
    id: 'record_002',
    taskId: 'task_002',
    taskSnapshot: mockTasks[1],
    fullChain: mockResults['task_002'],
    isArchived: false,
    createdAt: '2026-06-10T10:00:00Z'
  }
];
