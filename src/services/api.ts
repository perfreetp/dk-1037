import axios from 'axios';
import type {
  RuleVersion,
  SampleData,
  TestSet,
  TrialTask,
  TrialResult,
  EvaluationReport,
  TrialRecord,
  ComparisonData
} from '../types';
import {
  mockRules,
  mockSamples,
  mockTestSets,
  mockTasks,
  mockResults,
  mockReports,
  mockRecords
} from '../data/mockData';

const USE_MOCK = true;

let taskList = [...mockTasks];
let testSetList = [...mockTestSets];
let reportList = [...mockReports];
let sampleList = [...mockSamples];
export let resultCache: Record<string, TrialResult> = { ...mockResults };
let recordList = [...mockRecords];

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
});

if (!USE_MOCK) {
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
}

export const ruleApi = {
  getRules: async (): Promise<RuleVersion[]> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockRules;
    }
    const response = await api.get('/rules');
    return response.data.data;
  },

  getRuleById: async (id: string): Promise<RuleVersion> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 200));
      return mockRules.find(r => r.id === id) || mockRules[0];
    }
    const response = await api.get(`/rules/${id}`);
    return response.data.data;
  },

  getRuleVersions: async (ruleId: string): Promise<RuleVersion[]> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 250));
      return mockRules.filter(r => r.id === ruleId);
    }
    const response = await api.get(`/rules/${ruleId}/versions`);
    return response.data.data;
  }
};

export const sampleApi = {
  getSamples: async (): Promise<SampleData[]> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return sampleList;
    }
    const response = await api.get('/samples');
    return response.data.data;
  },

  importSamples: async (data: Partial<SampleData>[]): Promise<SampleData[]> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newSamples: SampleData[] = data.map((item, index) => ({
        id: `sample_new_${Date.now()}_${index}`,
        data: item.data || {},
        groupTag: item.groupTag || '未分组',
        channel: item.channel || 'unknown',
        timeRange: item.timeRange || new Date().toISOString().split('T')[0],
        importedAt: new Date().toISOString()
      }));
      sampleList = [...sampleList, ...newSamples];
      return newSamples;
    }
    const response = await api.post('/samples', { data });
    return response.data.data;
  },

  validateSamples: async (data: Partial<SampleData>[]): Promise<{ valid: boolean; errors: string[] }> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return { valid: true, errors: [] };
    }
    const response = await api.post('/samples/validate', { data });
    return response.data;
  }
};

export const testSetApi = {
  getTestSets: async (): Promise<TestSet[]> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 250));
      return testSetList;
    }
    const response = await api.get('/testsets');
    return response.data.data;
  },

  createTestSet: async (testSet: Partial<TestSet>): Promise<TestSet> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 400));
      const newTestSet: TestSet = {
        id: `ts_${Date.now()}`,
        name: testSet.name || '新测试集',
        description: testSet.description || '',
        sampleIds: testSet.sampleIds || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      testSetList = [...testSetList, newTestSet];
      return newTestSet;
    }
    const response = await api.post('/testsets', testSet);
    return response.data.data;
  },

  updateTestSet: async (id: string, testSet: Partial<TestSet>): Promise<TestSet> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 350));
      const index = testSetList.findIndex(ts => ts.id === id);
      if (index !== -1) {
        const updated = { ...testSetList[index], ...testSet, updatedAt: new Date().toISOString() };
        testSetList = [
          ...testSetList.slice(0, index),
          updated,
          ...testSetList.slice(index + 1)
        ];
        return updated;
      }
      return testSetList[0];
    }
    const response = await api.put(`/testsets/${id}`, testSet);
    return response.data.data;
  },

  deleteTestSet: async (id: string): Promise<void> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      testSetList = testSetList.filter(ts => ts.id !== id);
      return;
    }
    await api.delete(`/testsets/${id}`);
  }
};

export const taskApi = {
  getTasks: async (): Promise<TrialTask[]> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return taskList;
    }
    const response = await api.get('/tasks');
    return response.data.data;
  },

  createTask: async (task: Partial<TrialTask>): Promise<TrialTask> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newTask: TrialTask = {
        id: `task_${Date.now()}`,
        ruleVersionId: task.ruleVersionId || '',
        sampleIds: task.sampleIds || [],
        simulateParams: task.simulateParams || { startTime: '', endTime: '', environment: 'staging' },
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      taskList = [newTask, ...taskList];
      return newTask;
    }
    const response = await api.post('/tasks', task);
    return response.data.data;
  },

  getTaskById: async (id: string): Promise<TrialTask> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 200));
      return taskList.find(t => t.id === id) || taskList[0];
    }
    const response = await api.get(`/tasks/${id}`);
    return response.data.data;
  },

  executeTask: async (taskId: string): Promise<{ status: string; progress: number; task: TrialTask }> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const taskIndex = taskList.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        taskList[taskIndex] = {
          ...taskList[taskIndex],
          status: 'running'
        };

        await new Promise(resolve => setTimeout(resolve, 1000));

        const completedTask: TrialTask = {
          ...taskList[taskIndex],
          status: 'completed',
          completedAt: new Date().toISOString()
        };

        taskList[taskIndex] = completedTask;

        if (!resultCache[taskId]) {
          resultCache[taskId] = generateMockResult(completedTask);
        }
      }

      const task = taskList.find(t => t.id === taskId);
      return { status: 'completed', progress: 100, task: task! };
    }
    const response = await api.post(`/tasks/${taskId}/execute`);
    return response.data.data;
  }
};

function generateMockResult(task: TrialTask): TrialResult {
  const total = task.sampleIds.length;
  const hitCount = Math.floor(total * 0.8);
  
  const hitDetails = task.sampleIds.slice(0, hitCount).map((sampleId, idx) => {
    const sample = sampleList.find(s => s.id === sampleId);
    return {
      sampleId,
      userId: sample?.data?.userId || `user_${1001 + idx}`,
      hit: true,
      hitRule: task.ruleVersionId,
      hitCondition: 'amount > 1000',
      action: 'allow' as const,
      executionTime: 120 + idx * 5,
      group: sample?.groupTag || '未分组',
      channel: sample?.channel || 'unknown',
      timeRange: sample?.timeRange || new Date().toISOString().split('T')[0]
    };
  });

  const missDetails = task.sampleIds.slice(hitCount).map((sampleId, idx) => {
    const sample = sampleList.find(s => s.id === sampleId);
    return {
      sampleId,
      userId: sample?.data?.userId || `user_${1001 + hitCount + idx}`,
      hit: false,
      reason: 'amount <= 1000',
      suggestion: '低于最低交易限额',
      group: sample?.groupTag || '未分组',
      channel: sample?.channel || 'unknown',
      timeRange: sample?.timeRange || new Date().toISOString().split('T')[0]
    };
  });

  return {
    id: `result_${task.id}`,
    taskId: task.id,
    statistics: {
      total,
      hitCount,
      missCount: total - hitCount,
      passRate: (hitCount / total * 100),
      avgExecutionTime: 125
    },
    hitDetails,
    missDetails,
    ruleChain: [
      { nodeId: 'node_001', ruleName: '基础规则检查', status: 'passed' as const, executionTime: 15, details: '通过基础验证' },
      { nodeId: 'node_002', ruleName: '交易限额检查', status: 'passed' as const, executionTime: 45, details: '交易金额符合规则' },
      { nodeId: 'node_003', ruleName: '频率限制检查', status: 'passed' as const, executionTime: 30, details: '频率在限制范围内' },
      { nodeId: 'node_004', ruleName: '最终决策', status: 'passed' as const, executionTime: 35, details: '生成最终决策' }
    ],
    generatedAt: new Date().toISOString()
  };
}

export const resultApi = {
  getResult: async (taskId: string): Promise<TrialResult | null> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return resultCache[taskId] || null;
    }
    const response = await api.get(`/results/${taskId}`);
    return response.data.data;
  },

  getComparison: async (taskId: string, compareWithTaskId?: string): Promise<ComparisonData> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 400));
      const result = resultCache[taskId];
      return {
        oldVersion: 'v2.0.0',
        newVersion: 'v2.1.0',
        comparison: {
          oldPassRate: result ? result.statistics.passRate - 2.5 : 82.5,
          newPassRate: result ? result.statistics.passRate : 85.0,
          passRateChange: result ? 2.5 : 2.5,
          affectedSamples: [
            {
              sampleId: 'sample_003',
              oldResult: 'block' as const,
              newResult: 'allow' as const,
              reason: '规则条件调整'
            }
          ],
          statistics: {
            improved: 3,
            degraded: 1,
            unchanged: 6
          }
        }
      };
    }
    const response = await api.get(`/results/${taskId}/compare`, {
      params: { compareWithTaskId }
    });
    return response.data.data;
  },

  exportResult: async (taskId: string): Promise<Blob> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const result = resultCache[taskId];
      const csv = convertToCSV(result);
      return new Blob([csv], { type: 'text/csv' });
    }
    const response = await api.get(`/export/${taskId}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};

export const reportApi = {
  getReports: async (): Promise<EvaluationReport[]> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return reportList;
    }
    const response = await api.get('/reports');
    return response.data.data;
  },

  createReport: async (report: Partial<EvaluationReport>): Promise<EvaluationReport> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newReport: EvaluationReport = {
        id: `report_${Date.now()}`,
        taskId: report.taskId || '',
        conclusion: report.conclusion || '',
        riskLevel: report.riskLevel || 'medium',
        suggestion: report.suggestion || '',
        isApproved: false,
        createdAt: new Date().toISOString(),
        submittedAt: new Date().toISOString()
      };
      reportList = [newReport, ...reportList];
      return newReport;
    }
    const response = await api.post('/reports', report);
    return response.data.data;
  }
};

export const recordApi = {
  getRecords: async (): Promise<TrialRecord[]> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return recordList;
    }
    const response = await api.get('/records');
    return response.data.data;
  },

  getRecordById: async (id: string): Promise<TrialRecord> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 200));
      return recordList.find(r => r.id === id) || recordList[0];
    }
    const response = await api.get(`/records/${id}`);
    return response.data.data;
  },

  addRecord: (record: TrialRecord) => {
    if (USE_MOCK) {
      recordList = [record, ...recordList];
    }
  }
};

function convertToCSV(data: TrialResult | null): string {
  if (!data) return '';
  
  const headers = ['Sample ID', 'User ID', 'Hit', 'Action', 'Execution Time'];
  const rows = data.hitDetails.map(hit => [
    hit.sampleId,
    hit.userId,
    hit.hit ? 'Yes' : 'No',
    hit.action,
    hit.executionTime.toString()
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  return csvContent;
}

export default api;
