import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Send,
  Download,
  Eye,
  Flag,
  Plus,
  Filter,
  Search,
  ExternalLink,
  BarChart3,
  XCircle,
  GitCompare
} from 'lucide-react';
import { useStore } from '../../stores';
import { reportApi, recordApi, resultApi } from '../../services/api';
import type { EvaluationReport, TrialRecord, TrialResult } from '../../types';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import StatCard from '../../components/common/StatCard';
import { clsx } from 'clsx';

export default function EvaluationReport() {
  const { reports, setReports, records, setRecords, prefillReport, setPrefillReport } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reports' | 'history'>('reports');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<EvaluationReport | null>(null);
  const [reportResult, setReportResult] = useState<TrialResult | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'create' && prefillReport) {
      setShowCreateModal(true);
      window.history.replaceState({}, '', '/reports');
    }
  }, [prefillReport, showCreateModal]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('taskId') && params.get('action') === 'create') {
      setShowCreateModal(true);
      window.history.replaceState({}, '', '/reports');
    }
  }, []);

  const handleViewDetail = async (report: EvaluationReport) => {
    setSelectedReport(report);
    setShowDetailModal(true);

    // Load the result for this task
    try {
      const result = await resultApi.getResult(report.taskId);
      setReportResult(result);
    } catch (err) {
      console.error('加载结果失败', err);
      setReportResult(null);
    }
  };

  const handleApprove = async (reportId: string) => {
    // Update report approval status
    const updatedReports = reports.map(r =>
      r.id === reportId ? { ...r, isApproved: true } : r
    );
    setReports(updatedReports);

    if (selectedReport && selectedReport.id === reportId) {
      setSelectedReport({ ...selectedReport, isApproved: true });
    }

    alert('报告已通过审批');
    setShowDetailModal(false);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      alert('请填写驳回原因');
      return;
    }

    const updatedReports = reports.map(r =>
      r.id === selectedReport?.id ? { ...r, isApproved: false, rejectReason } : r
    );
    setReports(updatedReports);

    if (selectedReport) {
      setSelectedReport({ ...selectedReport, isApproved: false, rejectReason });
    }

    alert('报告已驳回，原因：' + rejectReason);
    setShowRejectModal(false);
    setRejectReason('');
    setShowDetailModal(false);
  };

  const handleViewRecord = (record: TrialRecord) => {
    navigate(`/results/${record.taskId}`);
  };

  const handleNavigateToResult = () => {
    if (selectedReport) {
      navigate(`/results/${selectedReport.taskId}`);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [reportsData, recordsData] = await Promise.all([
        reportApi.getReports(),
        recordApi.getRecords()
      ]);
      setReports(reportsData);
      setRecords(recordsData);
    } catch (err) {
      console.error('加载数据失败', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (level: string) => {
    type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
    const styles: Record<RiskLevel, string> = {
      low: 'bg-green-500/20 text-green-400 border-green-500/30',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      critical: 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    const icons: Record<RiskLevel, JSX.Element> = {
      low: <CheckCircle2 className="w-3 h-3" />,
      medium: <AlertTriangle className="w-3 h-3" />,
      high: <AlertCircle className="w-3 h-3" />,
      critical: <AlertCircle className="w-3 h-3" />
    };
    const labels: Record<RiskLevel, string> = {
      low: '低风险',
      medium: '中风险',
      high: '高风险',
      critical: '严重风险'
    };
    return (
      <span className={clsx('inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium border rounded-full', styles[level as RiskLevel])}>
        {icons[level as RiskLevel]}
        <span>{labels[level as RiskLevel]}</span>
      </span>
    );
  };

  const handleExportReport = (report: EvaluationReport) => {
    const reportContent = `
评估报告
=========================================

报告ID: ${report.id}
关联任务: ${report.taskId}
风险等级: ${report.riskLevel === 'low' ? '低风险' : report.riskLevel === 'medium' ? '中风险' : report.riskLevel === 'high' ? '高风险' : '严重风险'}
审批状态: ${report.isApproved ? '已审批' : '待审批'}
创建时间: ${new Date(report.createdAt).toLocaleString('zh-CN')}

评估结论:
${report.conclusion}

上线建议:
${report.suggestion}

=========================================
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `评估报告_${report.id}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const filteredReports = reports.filter(report => {
    return riskFilter === 'all' || report.riskLevel === riskFilter;
  });

  const reportColumns = [
    {
      key: 'taskId',
      label: '关联任务',
      render: (report: EvaluationReport) => (
        <span className="font-mono text-blue-400">{report.taskId}</span>
      )
    },
    {
      key: 'conclusion',
      label: '评估结论',
      render: (report: EvaluationReport) => (
        <div className="max-w-md">
          <p className="text-slate-300 line-clamp-2">{report.conclusion}</p>
        </div>
      )
    },
    {
      key: 'riskLevel',
      label: '风险等级',
      render: (report: EvaluationReport) => getRiskBadge(report.riskLevel)
    },
    {
      key: 'suggestion',
      label: '上线建议',
      render: (report: EvaluationReport) => (
        <div className="max-w-md">
          <p className="text-slate-400 text-sm line-clamp-2">{report.suggestion}</p>
        </div>
      )
    },
    {
      key: 'isApproved',
      label: '审批状态',
      render: (report: EvaluationReport) => (
        <span className={clsx(
          'px-2.5 py-1 text-xs font-medium rounded-full',
          report.isApproved
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
        )}>
          {report.isApproved ? '已审批' : '待审批'}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: '创建时间',
      render: (report: EvaluationReport) => (
        <span className="text-slate-400">{new Date(report.createdAt).toLocaleString('zh-CN')}</span>
      )
    },
    {
      key: 'actions',
      label: '操作',
      render: (report: EvaluationReport) => (
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => handleViewDetail(report)}
            className="p-1.5 text-slate-400 hover:text-blue-400 transition-colors" 
            title="查看详情"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleExportReport(report)}
            className="p-1.5 text-slate-400 hover:text-green-400 transition-colors" 
            title="导出"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const recordColumns = [
    {
      key: 'id',
      label: '记录ID',
      render: (record: TrialRecord) => (
        <span className="font-mono text-blue-400">{record.id}</span>
      )
    },
    {
      key: 'task',
      label: '任务信息',
      render: (record: TrialRecord) => (
        <div>
          <p className="text-slate-300">规则版本: {record.taskSnapshot.ruleVersionId}</p>
          <p className="text-xs text-slate-500 mt-0.5">样本数: {record.taskSnapshot.sampleIds.length}</p>
        </div>
      )
    },
    {
      key: 'status',
      label: '任务状态',
      render: (record: TrialRecord) => (
        <span className={clsx(
          'px-2.5 py-1 text-xs font-medium rounded-full',
          record.taskSnapshot.status === 'completed' && 'bg-green-500/20 text-green-400',
          record.taskSnapshot.status === 'running' && 'bg-blue-500/20 text-blue-400',
          record.taskSnapshot.status === 'failed' && 'bg-red-500/20 text-red-400'
        )}>
          {record.taskSnapshot.status === 'completed' ? '已完成' :
           record.taskSnapshot.status === 'running' ? '执行中' : '失败'}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: '创建时间',
      render: (record: TrialRecord) => (
        <span className="text-slate-400">{new Date(record.createdAt).toLocaleString('zh-CN')}</span>
      )
    },
    {
      key: 'actions',
      label: '操作',
      render: (record: TrialRecord) => (
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => handleViewRecord(record)}
            className="p-1.5 text-slate-400 hover:text-blue-400 transition-colors" 
            title="查看结果"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-purple-400 transition-colors" title="恢复此状态">
            <Flag className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const lowRiskCount = reports.filter(r => r.riskLevel === 'low').length;
  const highRiskCount = reports.filter(r => ['high', 'critical'].includes(r.riskLevel)).length;
  const pendingCount = reports.filter(r => !r.isApproved).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">评估报告</h1>
          <p className="text-slate-400">生成评估结论，提交上线建议，查看完整试算历史</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
          新建评估
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="评估报告总数"
          value={reports.length}
          icon={FileText}
          trend={{ value: 15, isPositive: true }}
          color="blue"
        />
        <StatCard
          title="低风险报告"
          value={lowRiskCount}
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          title="高风险报告"
          value={highRiskCount}
          icon={AlertCircle}
          color="red"
        />
        <StatCard
          title="待审批"
          value={pendingCount}
          icon={Clock}
          color="orange"
        />
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden">
        <div className="border-b border-slate-700">
          <div className="flex items-center space-x-1 p-2">
            <button
              onClick={() => setActiveTab('reports')}
              className={clsx(
                'flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                activeTab === 'reports'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              )}
            >
              <FileText className="w-4 h-4" />
              <span>评估报告 ({reports.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={clsx(
                'flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                activeTab === 'history'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              )}
            >
              <Clock className="w-4 h-4" />
              <span>试算记录 ({records.length})</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'reports' ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4 flex-1 max-w-2xl">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="搜索报告内容..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                      value={riskFilter}
                      onChange={(e) => setRiskFilter(e.target.value)}
                      className="px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">全部风险等级</option>
                      <option value="low">低风险</option>
                      <option value="medium">中风险</option>
                      <option value="high">高风险</option>
                      <option value="critical">严重风险</option>
                    </select>
                  </div>
                </div>
                <Button 
                  variant="secondary" 
                  icon={<Download className="w-4 h-4" />}
                  onClick={() => {
                    if (filteredReports.length > 0) {
                      filteredReports.forEach(report => handleExportReport(report));
                    } else {
                      alert('没有可导出的报告');
                    }
                  }}
                >
                  批量导出
                </Button>
              </div>

              <Table
                columns={reportColumns}
                data={filteredReports}
                loading={loading}
                emptyText="暂无评估报告"
              />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">试算记录列表</h2>
                <p className="text-sm text-slate-400">共 {records.length} 条记录</p>
              </div>

              <Table
                columns={recordColumns}
                data={records}
                loading={loading}
                emptyText="暂无试算记录"
              />
            </>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateReportModal
          onClose={() => {
            setShowCreateModal(false);
            setPrefillReport(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setPrefillReport(null);
            loadData();
          }}
          prefillData={prefillReport}
        />
      )}

      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-5xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">评估报告详情</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setReportResult(null);
                }}
                className="text-slate-400 hover:text-white transition-colors text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* 报告基本信息 */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">报告ID</label>
                    <p className="text-sm text-blue-400 font-mono">{selectedReport.id}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">风险等级</label>
                    <p className={`text-sm font-medium ${
                      selectedReport.riskLevel === 'low' ? 'text-green-400' :
                      selectedReport.riskLevel === 'medium' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {selectedReport.riskLevel === 'low' ? '🟢 低风险' :
                       selectedReport.riskLevel === 'medium' ? '🟡 中风险' :
                       selectedReport.riskLevel === 'high' ? '🟠 高风险' : '🔴 严重风险'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">审批状态</label>
                    <p className={`text-sm font-medium ${selectedReport.isApproved ? 'text-green-400' : 'text-yellow-400'}`}>
                      {selectedReport.isApproved ? '✅ 已审批' : '⏳ 待审批'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">创建时间</label>
                    <p className="text-sm text-slate-300">{new Date(selectedReport.createdAt).toLocaleString('zh-CN')}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-sm text-slate-400">关联任务:</span>
                  <button
                    onClick={handleNavigateToResult}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors"
                  >
                    <span className="font-mono text-sm">{selectedReport.taskId}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* 试算结果概览 */}
              {reportResult && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                      <BarChart3 className="w-5 h-5 text-blue-400" />
                      <span>试算结果概览</span>
                    </h3>
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<ExternalLink className="w-4 h-4" />}
                      onClick={handleNavigateToResult}
                    >
                      查看完整结果
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-white">{reportResult.statistics.total}</p>
                      <p className="text-xs text-slate-400 mt-1">总样本数</p>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-green-400">{reportResult.statistics.hitCount}</p>
                      <p className="text-xs text-slate-400 mt-1">命中数</p>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-red-400">{reportResult.statistics.missCount}</p>
                      <p className="text-xs text-slate-400 mt-1">未命中数</p>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-blue-400">{reportResult.statistics.passRate.toFixed(1)}%</p>
                      <p className="text-xs text-slate-400 mt-1">通过率</p>
                    </div>
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-purple-400">{reportResult.statistics.avgExecutionTime}ms</p>
                      <p className="text-xs text-slate-400 mt-1">平均耗时</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 mt-4">
                    <button
                      onClick={() => navigate(`/results/${selectedReport.taskId}?tab=hit`)}
                      className="flex items-center space-x-2 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-slate-300">命中明细 ({reportResult.hitDetails.length})</span>
                    </button>
                    <button
                      onClick={() => navigate(`/results/${selectedReport.taskId}?tab=miss`)}
                      className="flex items-center space-x-2 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors"
                    >
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-slate-300">未命中分析 ({reportResult.missDetails.length})</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 可疑样本摘要 */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <span>可疑样本摘要</span>
                  </h3>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<ExternalLink className="w-4 h-4" />}
                    onClick={() => navigate(`/results/${selectedReport.taskId}?tab=suspicious`)}
                  >
                    查看可疑样本列表
                  </Button>
                </div>

                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                  {selectedReport.conclusion.includes('可疑样本数') ? (
                    <div className="space-y-2">
                      <p className="text-slate-300 text-sm">
                        共发现 <span className="text-red-400 font-bold">{selectedReport.conclusion.match(/可疑样本数[：:]\s*(\d+)/)?.[1] || 0}</span> 个可疑样本
                      </p>
                      {selectedReport.conclusion.includes('可疑样本备注') && (
                        <div className="mt-3 pt-3 border-t border-slate-700">
                          <p className="text-xs text-slate-400 mb-2">可疑样本详情：</p>
                          <div className="space-y-1">
                            {selectedReport.conclusion.split('\n').filter(line => line.includes(':')).slice(-5).map((line, idx) => (
                              <p key={idx} className="text-xs text-slate-400 font-mono">{line}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">暂无可疑样本</p>
                  )}
                </div>
              </div>

              {/* 评估结论 */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">评估结论</h3>
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                  <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{selectedReport.conclusion}</p>
                </div>
              </div>

              {/* 上线建议 */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">上线建议</h3>
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                  <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{selectedReport.suggestion}</p>
                </div>
              </div>

              {/* 驳回原因 */}
              {(selectedReport as any).rejectReason && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-red-400 mb-4">驳回原因</h3>
                  <div className="bg-slate-900/50 border border-red-500/30 rounded-lg p-4">
                    <p className="text-slate-300">{(selectedReport as any).rejectReason}</p>
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                <div className="text-sm text-slate-500">
                  最后更新: {new Date(selectedReport.createdAt).toLocaleString('zh-CN')}
                </div>
                {!selectedReport.isApproved && (
                  <div className="flex space-x-3">
                    <Button
                      variant="danger"
                      onClick={() => setShowRejectModal(true)}
                    >
                      驳回
                    </Button>
                    <Button
                      onClick={() => handleApprove(selectedReport.id)}
                    >
                      通过审批
                    </Button>
                  </div>
                )}
                {selectedReport.isApproved && (
                  <div className="flex items-center space-x-2 text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">已通过审批</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 驳回原因弹窗 */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-white mb-4">驳回报告</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  驳回原因 <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="请输入驳回原因，便于后续追溯..."
                  rows={4}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="secondary" onClick={() => {
                setShowRejectModal(false);
                setRejectReason('');
              }}>
                取消
              </Button>
              <Button variant="danger" onClick={handleReject}>
                确认驳回
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface CreateReportModalProps {
  onClose: () => void;
  onSuccess: () => void;
  prefillData?: {
    taskId?: string;
    passRate?: number;
    hitCount?: number;
    missCount?: number;
    suspiciousCount?: number;
    suspiciousRemarks?: string[];
  } | null;
}

function CreateReportModal({ onClose, onSuccess, prefillData }: CreateReportModalProps) {
  const prefillConclusion = prefillData ? `试算结果分析：
- 通过率：${prefillData.passRate?.toFixed(1)}%
- 命中数：${prefillData.hitCount}条
- 未命中数：${prefillData.missCount}条
- 可疑样本数：${prefillData.suspiciousCount || 0}条
${prefillData.suspiciousRemarks && prefillData.suspiciousRemarks.length > 0 ? `\n可疑样本备注：\n${prefillData.suspiciousRemarks.join('\n')}` : ''}` : '';

  const [taskId, setTaskId] = useState(prefillData?.taskId || '');
  const [conclusion, setConclusion] = useState(prefillConclusion);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [suggestion, setSuggestion] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!conclusion || !suggestion) {
      alert('请填写评估结论和建议');
      return;
    }

    try {
      setCreating(true);
      await reportApi.createReport({
        taskId,
        conclusion,
        riskLevel,
        suggestion
      });
      onSuccess();
    } catch (err) {
      console.error('创建报告失败', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-6">新建评估报告</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">关联任务 (可选)</label>
            <input
              type="text"
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              placeholder="输入任务ID或留空"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">风险等级</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'low', label: '低风险', color: 'green', icon: CheckCircle2 },
                { value: 'medium', label: '中风险', color: 'yellow', icon: AlertTriangle },
                { value: 'high', label: '高风险', color: 'orange', icon: AlertCircle },
                { value: 'critical', label: '严重风险', color: 'red', icon: AlertCircle }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setRiskLevel(option.value as any)}
                  className={clsx(
                    'flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border transition-all',
                    riskLevel === option.value
                      ? `bg-${option.color}-500/20 border-${option.color}-500/50 text-${option.color}-400`
                      : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'
                  )}
                >
                  <option.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">评估结论 <span className="text-red-400">*</span></label>
            <textarea
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              placeholder="详细描述规则试算的评估结论..."
              rows={4}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">上线建议 <span className="text-red-400">*</span></label>
            <textarea
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              placeholder="提供具体的上线建议和风险缓解措施..."
              rows={4}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-8">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleCreate} loading={creating}>
            创建报告
          </Button>
        </div>
      </div>
    </div>
  );
}
