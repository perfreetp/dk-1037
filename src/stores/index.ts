import { create } from 'zustand';
import type {
  RuleVersion,
  SampleData,
  TestSet,
  TrialTask,
  TrialResult,
  EvaluationReport,
  AnomalyMark,
  TrialRecord,
  ComparisonData
} from '../types';

interface AppState {
  rules: RuleVersion[];
  selectedRule: RuleVersion | null;
  samples: SampleData[];
  testSets: TestSet[];
  selectedSamples: string[];
  tasks: TrialTask[];
  currentTask: TrialTask | null;
  currentResult: TrialResult | null;
  comparisonData: ComparisonData | null;
  reports: EvaluationReport[];
  currentReport: EvaluationReport | null;
  anomalyMarks: AnomalyMark[];
  records: TrialRecord[];
  loading: boolean;
  error: string | null;
  prefillReport: {
    taskId?: string;
    passRate?: number;
    hitCount?: number;
    missCount?: number;
    suspiciousCount?: number;
    suspiciousRemarks?: string[];
  } | null;
  setRules: (rules: RuleVersion[]) => void;
  setSelectedRule: (rule: RuleVersion | null) => void;
  setSamples: (samples: SampleData[]) => void;
  setTestSets: (testSets: TestSet[]) => void;
  setSelectedSamples: (sampleIds: string[]) => void;
  addSamples: (samples: SampleData[]) => void;
  setTasks: (tasks: TrialTask[]) => void;
  setCurrentTask: (task: TrialTask | null) => void;
  setCurrentResult: (result: TrialResult | null) => void;
  setComparisonData: (data: ComparisonData | null) => void;
  setReports: (reports: EvaluationReport[]) => void;
  setCurrentReport: (report: EvaluationReport | null) => void;
  setAnomalyMarks: (marks: AnomalyMark[]) => void;
  addAnomalyMark: (mark: AnomalyMark) => void;
  removeAnomalyMark: (markId: string) => void;
  setRecords: (records: TrialRecord[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPrefillReport: (data: any) => void;
}

export const useStore = create<AppState>((set) => ({
  rules: [],
  selectedRule: null,
  samples: [],
  testSets: [],
  selectedSamples: [],
  tasks: [],
  currentTask: null,
  currentResult: null,
  comparisonData: null,
  reports: [],
  currentReport: null,
  anomalyMarks: [],
  records: [],
  loading: false,
  error: null,
  prefillReport: null,

  setRules: (rules) => set({ rules }),
  setSelectedRule: (selectedRule) => set({ selectedRule }),
  setSamples: (samples) => set({ samples }),
  setTestSets: (testSets) => set({ testSets }),
  setSelectedSamples: (selectedSamples) => set({ selectedSamples }),
  addSamples: (newSamples) => set((state) => ({ 
    samples: [...state.samples, ...newSamples] 
  })),
  setTasks: (tasks) => set({ tasks }),
  setCurrentTask: (currentTask) => set({ currentTask }),
  setCurrentResult: (currentResult) => set({ currentResult }),
  setComparisonData: (comparisonData) => set({ comparisonData }),
  setReports: (reports) => set({ reports }),
  setCurrentReport: (currentReport) => set({ currentReport }),
  setAnomalyMarks: (anomalyMarks) => set({ anomalyMarks }),
  addAnomalyMark: (mark) => set((state) => ({ 
    anomalyMarks: [...state.anomalyMarks, mark] 
  })),
  removeAnomalyMark: (markId) => set((state) => ({ 
    anomalyMarks: state.anomalyMarks.filter(m => m.id !== markId) 
  })),
  setRecords: (records) => set({ records }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setPrefillReport: (data) => set({ prefillReport: data }),
}));
