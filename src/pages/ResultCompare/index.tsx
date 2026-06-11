import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  GitCompare,
  BarChart3,
  Clock,
  Download,
  Flag,
  Eye,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  AlertTriangle,
  MessageSquare,
  Filter
} from 'lucide-react';
import { useStore } from '../../stores';
import { resultApi, taskApi } from '../../services/api';
import type { TrialResult, ComparisonData, GroupedData, AnomalyMark } from '../../types';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import StatCard from '../../components/common/StatCard';
import { clsx } from 'clsx';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function ResultCompare() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { currentResult, setCurrentResult, comparisonData, setComparisonData, anomalyMarks, addAnomalyMark, removeAnomalyMark } = useStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'hit' | 'miss' | 'suspicious' | 'chain' | 'compare'>('hit');
  const [groupDimension, setGroupDimension] = useState<'group' | 'channel' | 'timeRange'>('group');
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [selectedSample, setSelectedSample] = useState<string | null>(null);
  const [markRemark, setMarkRemark] = useState('');
  const [suspiciousFilter, setSuspiciousFilter] = useState<'all' | 'hit' | 'miss'>('all');

  useEffect(() => {
    if (taskId) {
      loadResults();
    }
  }, [taskId]);

  const loadResults = async () => {
    try {
      setLoading(true);
      const [result, comparison] = await Promise.all([
        resultApi.getResult(taskId || ''),
        resultApi.getComparison(taskId || '')
      ]);
      setCurrentResult(result);
      setComparisonData(comparison);
    } catch (err) {
      console.error('加载结果失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkSample = (sampleId: string) => {
    setSelectedSample(sampleId);
    setShowMarkModal(true);
  };

  const handleSubmitMark = () => {
    if (!selectedSample || !markRemark.trim()) {
      alert('请填写备注信息');
      return;
    }
    
    const mark: AnomalyMark = {
      id: `mark_${Date.now()}`,
      resultId: currentResult?.id || '',
      sampleId: selectedSample,
      anomalyType: 'suspicious',
      remark: markRemark,
      markedAt: new Date().toISOString()
    };
    
    addAnomalyMark(mark);
    setShowMarkModal(false);
    setMarkRemark('');
    setSelectedSample(null);
    alert('样本标记成功');
  };

  const handleRemoveMark = (markId: string) => {
    removeAnomalyMark(markId);
    alert('标记已移除');
  };

  const handleExport = async () => {
    try {
      const blob = await resultApi.exportResult(taskId || '');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trial_result_${taskId}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('导出失败', err);
    }
  };

  const handleGenerateReport = () => {
    if (!currentResult || !taskId) return;

    const suspiciousRemarks = currentTaskSuspiciousMarks.map(m => `${m.sampleId}: ${m.remark}`);

    setPrefillReport({
      taskId,
      passRate: currentResult.statistics.passRate,
      hitCount: currentResult.statistics.hitCount,
      missCount: currentResult.statistics.missCount,
      suspiciousCount: currentTaskSuspiciousMarks.length,
      suspiciousRemarks
    });

    navigate('/reports?action=create');
  };

  const getMarkForSample = (sampleId: string) => {
    return anomalyMarks.find(m => m.sampleId === sampleId);
  };

  const suspiciousCount = anomalyMarks.length;

  // Filter suspicious samples for current task
  const getCurrentTaskSuspiciousMarks = () => {
    const currentResultId = currentResult?.id;
    if (!currentResultId) return [];

    return anomalyMarks.filter(mark => {
      const hitSample = currentResult?.hitDetails.find(h => h.sampleId === mark.sampleId);
      const missSample = currentResult?.missDetails.find(m => m.sampleId === mark.sampleId);
      return hitSample || missSample;
    });
  };

  const currentTaskSuspiciousMarks = getCurrentTaskSuspiciousMarks();

  // Filter by hit/miss status
  const getFilteredSuspiciousMarks = () => {
    if (suspiciousFilter === 'all') {
      return currentTaskSuspiciousMarks;
    }

    return currentTaskSuspiciousMarks.filter(mark => {
      const hitSample = currentResult?.hitDetails.find(h => h.sampleId === mark.sampleId);
      if (suspiciousFilter === 'hit' && hitSample) return true;
      if (suspiciousFilter === 'miss' && !hitSample) return true;
      return false;
    });
  };

  const filteredSuspiciousMarks = getFilteredSuspiciousMarks();

  if (loading || !currentResult) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">加载试算结果...</p>
        </div>
      </div>
    );
  }

  const { statistics, hitDetails, missDetails, ruleChain } = currentResult;
  const { comparison } = comparisonData || {
    comparison: { oldPassRate: 0, newPassRate: 0, passRateChange: 0, statistics: { improved: 0, degraded: 0, unchanged: 0 } }
  };

  const getGroupedData = (): GroupedData => {
    const groups: Record<string, { total: number; hit: number }> = {};
    
    const allDetails = [...hitDetails, ...missDetails];
    
    allDetails.forEach((detail: any) => {
      let groupKey = '未分组';
      
      if (groupDimension === 'group') {
        groupKey = detail.group || detail.groupTag || '未分组';
      } else if (groupDimension === 'channel') {
        groupKey = detail.channel || '未知渠道';
      } else if (groupDimension === 'timeRange') {
        groupKey = detail.timeRange || detail.date || '未知时间段';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = { total: 0, hit: 0 };
      }
      groups[groupKey].total++;
      if (detail.hit) groups[groupKey].hit++;
    });

    return {
      dimension: groupDimension,
      groups: Object.entries(groups).map(([name, data]) => ({
        name,
        count: data.total,
        passRate: data.total > 0 ? parseFloat((data.hit / data.total * 100).toFixed(1)) : 0
      }))
    };
  };

  const groupedData = getGroupedData();

  const passRateData = [
    { name: '旧版本', passRate: comparison.oldPassRate },
    { name: '新版本', passRate: comparison.newPassRate }
  ];

  const actionDistribution = [
    { name: '允许通过', value: hitDetails.filter(h => h.action === 'allow').length, color: '#10b981' },
    { name: '阻止交易', value: hitDetails.filter(h => h.action === 'block').length, color: '#ef4444' },
    { name: '人工审核', value: hitDetails.filter(h => h.action === 'review').length, color: '#f59e0b' },
    { name: '标记关注', value: hitDetails.filter(h => h.action === 'flag').length, color: '#8b5cf6' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">结果对比</h1>
          <p className="text-slate-400">任务ID: {taskId} - 详细分析试算结果和版本差异</p>
        </div>
        <div className="flex space-x-3">
          {currentTaskSuspiciousMarks.length > 0 && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400 font-medium">{currentTaskSuspiciousMarks.length}个可疑样本</span>
            </div>
          )}
          <Button variant="secondary" icon={<Download className="w-4 h-4" />} onClick={handleExport}>
            导出报告
          </Button>
          <Button icon={<Flag className="w-4 h-4" />} onClick={handleGenerateReport}>
            生成评估报告
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="通过率"
          value={`${statistics.passRate}%`}
          icon={Target}
          trend={{ value: comparison.passRateChange, isPositive: comparison.passRateChange >= 0 }}
          color="green"
        />
        <StatCard
          title="命中数"
          value={statistics.hitCount}
          icon={CheckCircle2}
          color="blue"
        />
        <StatCard
          title="未命中数"
          value={statistics.missCount}
          icon={XCircle}
          color="red"
        />
        <StatCard
          title="平均执行时间"
          value={`${statistics.avgExecutionTime}ms`}
          icon={Clock}
          color="purple"
        />
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">分组统计</h2>
        <div className="flex items-center space-x-4 mb-6">
          <span className="text-sm text-slate-400">分组维度:</span>
          <div className="flex space-x-2">
            {(['group', 'channel', 'timeRange'] as const).map(dim => (
              <button
                key={dim}
                onClick={() => setGroupDimension(dim)}
                className={clsx(
                  'px-3 py-1.5 text-sm rounded-lg transition-colors',
                  groupDimension === dim
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-700'
                )}
              >
                {dim === 'group' ? '用户群体' : dim === 'channel' ? '渠道' : '时间段'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-4">各组通过率</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={groupedData.groups}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="passRate" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-4">执行动作分布</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={actionDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {actionDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden">
        <div className="border-b border-slate-700">
          <div className="flex items-center space-x-1 p-2">
            {[
              { key: 'hit', label: '命中明细', count: hitDetails.length, icon: CheckCircle2 },
              { key: 'miss', label: '未命中分析', count: missDetails.length, icon: XCircle },
              { key: 'suspicious', label: '可疑样本', count: currentTaskSuspiciousMarks.length, icon: AlertTriangle },
              { key: 'chain', label: '规则链路', count: ruleChain.length, icon: GitCompare },
              { key: 'compare', label: '版本对比', count: 0, icon: BarChart3 }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={clsx(
                  'flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'hit' && (
            <Table
              columns={[
                {
                  key: 'sampleId',
                  label: '样本ID',
                  render: (item) => <span className="font-mono text-blue-400">{item.sampleId}</span>
                },
                {
                  key: 'userId',
                  label: '用户ID',
                  render: (item) => <span className="text-slate-300">{item.userId}</span>
                },
                {
                  key: 'hitCondition',
                  label: '命中条件',
                  render: (item) => <span className="text-sm text-slate-400">{item.hitCondition}</span>
                },
                {
                  key: 'action',
                  label: '执行动作',
                  render: (item) => {
                    const actionStyles = {
                      allow: 'bg-green-500/20 text-green-400',
                      block: 'bg-red-500/20 text-red-400',
                      review: 'bg-yellow-500/20 text-yellow-400',
                      flag: 'bg-purple-500/20 text-purple-400'
                    };
                    const actionLabels = {
                      allow: '允许通过',
                      block: '阻止交易',
                      review: '人工审核',
                      flag: '标记关注'
                    };
                    return (
                      <span className={clsx('px-2 py-1 text-xs font-medium rounded', actionStyles[item.action as keyof typeof actionStyles])}>
                        {actionLabels[item.action as keyof typeof actionLabels]}
                      </span>
                    );
                  }
                },
                {
                  key: 'executionTime',
                  label: '执行时间',
                  render: (item) => <span className="text-slate-400">{item.executionTime}ms</span>
                },
                {
                  key: 'mark',
                  label: '标记',
                  render: (item: any) => {
                    const mark = getMarkForSample(item.sampleId);
                    if (mark) {
                      return (
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded flex items-center space-x-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>可疑</span>
                          </span>
                          <button
                            onClick={() => handleRemoveMark(mark.id)}
                            className="text-slate-400 hover:text-red-400 transition-colors text-xs"
                            title="移除标记"
                          >
                            移除
                          </button>
                        </div>
                      );
                    }
                    return (
                      <button
                        onClick={() => handleMarkSample(item.sampleId)}
                        className="px-2 py-1 text-xs text-slate-400 hover:text-red-400 border border-slate-600 hover:border-red-500/50 rounded transition-colors"
                      >
                        标记可疑
                      </button>
                    );
                  }
                }
              ]}
              data={hitDetails}
              emptyText="暂无命中数据"
            />
          )}

          {activeTab === 'miss' && (
            <div className="space-y-4">
              <Table
                columns={[
                  {
                    key: 'sampleId',
                    label: '样本ID',
                    render: (item) => <span className="font-mono text-blue-400">{item.sampleId}</span>
                  },
                  {
                    key: 'userId',
                    label: '用户ID',
                    render: (item) => <span className="text-slate-300">{item.userId}</span>
                  },
                  {
                    key: 'reason',
                    label: '未命中原因',
                    render: (item) => <span className="text-red-400">{item.reason}</span>
                  },
                  {
                    key: 'suggestion',
                    label: '改进建议',
                    render: (item) => <span className="text-sm text-slate-400">{item.suggestion}</span>
                  },
                  {
                    key: 'mark',
                    label: '标记',
                    render: (item: any) => {
                      const mark = getMarkForSample(item.sampleId);
                      if (mark) {
                        return (
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded flex items-center space-x-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>可疑</span>
                            </span>
                            <button
                              onClick={() => handleRemoveMark(mark.id)}
                              className="text-slate-400 hover:text-red-400 transition-colors text-xs"
                              title="移除标记"
                            >
                              移除
                            </button>
                          </div>
                        );
                      }
                      return (
                        <button
                          onClick={() => handleMarkSample(item.sampleId)}
                          className="px-2 py-1 text-xs text-slate-400 hover:text-red-400 border border-slate-600 hover:border-red-500/50 rounded transition-colors"
                        >
                          标记可疑
                        </button>
                      );
                    }
                  }
                ]}
                data={missDetails}
                emptyText="暂无未命中数据"
              />
            </div>
          )}

          {activeTab === 'suspicious' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-400">筛选:</span>
                  <select
                    value={suspiciousFilter}
                    onChange={(e) => setSuspiciousFilter(e.target.value as any)}
                    className="px-3 py-1.5 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">全部</option>
                    <option value="hit">已命中</option>
                    <option value="miss">未命中</option>
                  </select>
                </div>
                <div className="text-sm text-slate-400">
                  共 {filteredSuspiciousMarks.length} 个可疑样本
                </div>
              </div>

              <Table
                columns={[
                  {
                    key: 'sampleId',
                    label: '样本ID',
                    render: (mark: AnomalyMark) => <span className="font-mono text-blue-400">{mark.sampleId}</span>
                  },
                  {
                    key: 'anomalyType',
                    label: '类型',
                    render: (mark: AnomalyMark) => (
                      <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded">
                        {mark.anomalyType === 'suspicious' ? '可疑' : mark.anomalyType}
                      </span>
                    )
                  },
                  {
                    key: 'remark',
                    label: '备注',
                    render: (mark: AnomalyMark) => <span className="text-sm text-slate-300">{mark.remark}</span>
                  },
                  {
                    key: 'markedAt',
                    label: '标记时间',
                    render: (mark: AnomalyMark) => (
                      <span className="text-slate-400">{new Date(mark.markedAt).toLocaleString('zh-CN')}</span>
                    )
                  },
                  {
                    key: 'actions',
                    label: '操作',
                    render: (mark: AnomalyMark) => (
                      <button
                        onClick={() => handleRemoveMark(mark.id)}
                        className="px-2 py-1 text-xs text-slate-400 hover:text-red-400 border border-slate-600 hover:border-red-500/50 rounded transition-colors"
                      >
                        移除标记
                      </button>
                    )
                  }
                ]}
                data={filteredSuspiciousMarks}
                emptyText="暂无可疑样本"
              />
            </div>
          )}

          {activeTab === 'chain' && (
            <div className="space-y-4">
              {ruleChain.map((node, index) => (
                <div key={node.nodeId} className="flex items-start space-x-4">
                  <div className="flex flex-col items-center">
                    <div className={clsx(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      node.status === 'passed' && 'bg-green-500/20 text-green-400',
                      node.status === 'failed' && 'bg-red-500/20 text-red-400',
                      node.status === 'skipped' && 'bg-slate-500/20 text-slate-400'
                    )}>
                      {node.status === 'passed' && <CheckCircle2 className="w-5 h-5" />}
                      {node.status === 'failed' && <XCircle className="w-5 h-5" />}
                      {node.status === 'skipped' && <AlertCircle className="w-5 h-5" />}
                    </div>
                    {index < ruleChain.length - 1 && (
                      <div className="w-0.5 h-16 bg-slate-600"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-8">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-white">{node.ruleName}</h4>
                      <span className="text-sm text-slate-400">{node.executionTime}ms</span>
                    </div>
                    <p className="text-sm text-slate-400">{node.details}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'compare' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">版本对比</h3>
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-center">
                      <p className="text-sm text-slate-400 mb-2">旧版本</p>
                      <p className="text-3xl font-bold text-slate-300">{comparison.oldPassRate}%</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {comparison.passRateChange >= 0 ? (
                        <TrendingUp className="w-6 h-6 text-green-400" />
                      ) : (
                        <TrendingDown className="w-6 h-6 text-red-400" />
                      )}
                      <span className={clsx(
                        'text-lg font-bold',
                        comparison.passRateChange >= 0 ? 'text-green-400' : 'text-red-400'
                      )}>
                        {comparison.passRateChange >= 0 ? '+' : ''}{comparison.passRateChange}%
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-400 mb-2">新版本</p>
                      <p className="text-3xl font-bold text-blue-400">{comparison.newPassRate}%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">影响统计</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                        <span className="text-slate-300">正向影响</span>
                      </div>
                      <span className="text-2xl font-bold text-green-400">{comparison.statistics.improved}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <TrendingDown className="w-5 h-5 text-red-400" />
                        <span className="text-slate-300">负向影响</span>
                      </div>
                      <span className="text-2xl font-bold text-red-400">{comparison.statistics.degraded}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Target className="w-5 h-5 text-slate-400" />
                        <span className="text-slate-300">无变化</span>
                      </div>
                      <span className="text-2xl font-bold text-slate-400">{comparison.statistics.unchanged}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">通过率趋势</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={passRateData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                      formatter={(value: any) => [`${value}%`, '通过率']}
                    />
                    <Line
                      type="monotone"
                      dataKey="passRate"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ r: 6, fill: '#3b82f6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {showMarkModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span>标记可疑样本</span>
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">样本ID</label>
                <p className="text-blue-400 font-mono">{selectedSample}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">备注信息 <span className="text-red-400">*</span></label>
                <textarea
                  value={markRemark}
                  onChange={(e) => setMarkRemark(e.target.value)}
                  placeholder="请输入可疑原因或备注..."
                  rows={4}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="secondary" onClick={() => {
                setShowMarkModal(false);
                setMarkRemark('');
                setSelectedSample(null);
              }}>
                取消
              </Button>
              <Button onClick={handleSubmitMark}>
                确认标记
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
