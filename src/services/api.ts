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
      return mockSamples;
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
      return mockTestSets;
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
      return newTestSet;
    }
    const response = await api.post('/testsets', testSet);
    return response.data.data;
  },

  updateTestSet: async (id: string, testSet: Partial<TestSet>): Promise<TestSet> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 350));
      const existing = mockTestSets.find(ts => ts.id === id);
      return existing ? { ...existing, ...testSet, updatedAt: new Date().toISOString() } : mockTestSets[0];
    }
    const response = await api.put(`/testsets/${id}`, testSet);
    return response.data.data;
  },

  deleteTestSet: async (id: string): Promise<void> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return;
    }
    await api.delete(`/testsets/${id}`);
  }
};

export const taskApi = {
  getTasks: async (): Promise<TrialTask[]> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockTasks;
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
      return newTask;
    }
    const response = await api.post('/tasks', task);
    return response.data.data;
  },

  getTaskById: async (id: string): Promise<TrialTask> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 200));
      return mockTasks.find(t => t.id === id) || mockTasks[0];
    }
    const response = await api.get(`/tasks/${id}`);
    return response.data.data;
  },

  executeTask: async (taskId: string): Promise<{ status: string; progress: number }> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { status: 'running', progress: 100 };
    }
    const response = await api.post(`/tasks/${taskId}/execute`);
    return response.data.data;
  }
};

export const resultApi = {
  getResult: async (taskId: string): Promise<TrialResult | null> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockResults[taskId] || null;
    }
    const response = await api.get(`/results/${taskId}`);
    return response.data.data;
  },

  getComparison: async (taskId: string, compareWithTaskId?: string): Promise<ComparisonData> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 400));
      const result = mockResults[taskId];
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
      const result = mockResults[taskId];
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
      return mockReports;
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
      return mockRecords;
    }
    const response = await api.get('/records');
    return response.data.data;
  },

  getRecordById: async (id: string): Promise<TrialRecord> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 200));
      return mockRecords.find(r => r.id === id) || mockRecords[0];
    }
    const response = await api.get(`/records/${id}`);
    return response.data.data;
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
