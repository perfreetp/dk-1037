import { useEffect, useState } from 'react';
import { Plus, Play, Pause, CheckCircle, XCircle, Clock, Loader2, Calendar, Settings, Flag } from 'lucide-react';
import { useStore } from '../../stores';
import { taskApi, ruleApi, sampleApi } from '../../services/api';
import type { TrialTask, RuleVersion, SampleData } from '../../types';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import StatCard from '../../components/common/StatCard';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

export default function TrialTask() {
  const { tasks, setTasks, rules, setRules, samples, setSamples } = useStore();
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksData, rulesData, samplesData] = await Promise.all([
        taskApi.getTasks(),
        ruleApi.getRules(),
        sampleApi.getSamples()
      ]);
      setTasks(tasksData);
      setRules(rulesData);
      setSamples(samplesData);
    } catch (err) {
      console.error('加载数据失败', err);
    } finally {
      setLoading(false);
    }
  };

  const getTaskStatusBadge = (status: string) => {
    type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';
    const styles: Record<TaskStatus, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      running: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      completed: 'bg-green-500/20 text-green-400 border-green-500/30',
      failed: 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    const icons: Record<TaskStatus, JSX.Element> = {
      pending: <Clock className="w-3 h-3" />,
      running: <Loader2 className="w-3 h-3 animate-spin" />,
      completed: <CheckCircle className="w-3 h-3" />,
      failed: <XCircle className="w-3 h-3" />
    };
    const labels: Record<TaskStatus, string> = {
      pending: '等待中',
      running: '执行中',
      completed: '已完成',
      failed: '失败'
    };
    return (
      <span className={clsx('inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium border rounded-full', styles[status as TaskStatus])}>
        {icons[status as TaskStatus]}
        <span>{labels[status as TaskStatus]}</span>
      </span>
    );
  };

  const getRuleName = (ruleVersionId: string) => {
    const rule = rules.find(r => r.id === ruleVersionId);
    return rule ? `${rule.ruleName} (${rule.versionNumber})` : '未知规则';
  };

  const handleExecuteTask = async (taskId: string) => {
    try {
      await taskApi.executeTask(taskId);
      await loadData();
    } catch (err) {
      console.error('执行任务失败', err);
    }
  };

  const columns = [
    {
      key: 'ruleName',
      label: '规则版本',
      render: (task: TrialTask) => (
        <div>
          <p className="font-medium text-white">{getRuleName(task.ruleVersionId)}</p>
          <p className="text-xs text-slate-500 mt-0.5">样本数: {task.sampleIds.length}</p>
        </div>
      )
    },
    {
      key: 'sampleCount',
      label: '样本数量',
      render: (task: TrialTask) => (
        <span className="text-blue-400 font-medium">{task.sampleIds.length} 条</span>
      )
    },
    {
      key: 'simulateParams',
      label: '模拟参数',
      render: (task: TrialTask) => (
        <div className="text-sm text-slate-400">
          <div className="flex items-center space-x-2">
            <Calendar className="w-3 h-3" />
            <span>{task.simulateParams.startTime} ~ {task.simulateParams.endTime}</span>
          </div>
          <div className="text-xs mt-1">环境: {task.simulateParams.environment}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: '状态',
      render: (task: TrialTask) => getTaskStatusBadge(task.status)
    },
    {
      key: 'createdAt',
      label: '创建时间',
      render: (task: TrialTask) => (
        <span className="text-slate-400">{new Date(task.createdAt).toLocaleString('zh-CN')}</span>
      )
    },
    {
      key: 'actions',
      label: '操作',
      render: (task: TrialTask) => (
        <div className="flex items-center space-x-2">
          {task.status === 'pending' && (
            <Button
              size="sm"
              variant="primary"
              icon={<Play className="w-4 h-4" />}
              onClick={() => handleExecuteTask(task.id)}
            >
              执行
            </Button>
          )}
          {task.status === 'completed' && (
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="secondary"
                icon={<Settings className="w-4 h-4" />}
                onClick={() => navigate(`/results/${task.id}`)}
              >
                查看结果
              </Button>
              <Button
                size="sm"
                variant="ghost"
                icon={<Flag className="w-4 h-4" />}
                onClick={() => navigate(`/reports?taskId=${task.id}`)}
              >
                生成报告
              </Button>
            </div>
          )}
          {task.status === 'running' && (
            <Button
              size="sm"
              variant="ghost"
              icon={<Pause className="w-4 h-4" />}
            >
              暂停
            </Button>
          )}
        </div>
      )
    }
  ];

  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const runningCount = tasks.filter(t => t.status === 'running').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">试算任务</h1>
          <p className="text-slate-400">创建和管理规则试算任务，批量发起验证</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
          新建任务
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="任务总数"
          value={tasks.length}
          icon={Plus}
          trend={{ value: 8, isPositive: true }}
          color="blue"
        />
        <StatCard
          title="等待中"
          value={pendingCount}
          icon={Clock}
          color="orange"
        />
        <StatCard
          title="执行中"
          value={runningCount}
          icon={Loader2}
          color="blue"
        />
        <StatCard
          title="已完成"
          value={completedCount}
          icon={CheckCircle}
          color="green"
        />
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">任务列表</h2>
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="secondary" icon={<Play className="w-4 h-4" />}>
                批量执行
              </Button>
            </div>
          </div>

          <Table
            columns={columns}
            data={tasks}
            loading={loading}
            emptyText="暂无试算任务，点击新建任务开始"
          />
        </div>
      </div>

      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadData();
          }}
          rules={rules}
          samples={samples}
        />
      )}
    </div>
  );
}

interface CreateTaskModalProps {
  onClose: () => void;
  onSuccess: () => void;
  rules: RuleVersion[];
  samples: SampleData[];
}

function CreateTaskModal({ onClose, onSuccess, rules, samples }: CreateTaskModalProps) {
  const [selectedRuleId, setSelectedRuleId] = useState('');
  const [selectedSampleIds, setSelectedSampleIds] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('2026-06-01');
  const [endTime, setEndTime] = useState('2026-06-30');
  const [environment, setEnvironment] = useState('staging');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!selectedRuleId || selectedSampleIds.length === 0) {
      alert('请选择规则和样本');
      return;
    }

    try {
      setCreating(true);
      await taskApi.createTask({
        ruleVersionId: selectedRuleId,
        sampleIds: selectedSampleIds,
        simulateParams: {
          startTime,
          endTime,
          environment
        }
      });
      onSuccess();
    } catch (err) {
      console.error('创建任务失败', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">创建试算任务</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">选择规则版本</label>
            <select
              value={selectedRuleId}
              onChange={(e) => setSelectedRuleId(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">请选择规则</option>
              {rules.map(rule => (
                <option key={rule.id} value={rule.id}>
                  {rule.ruleName} ({rule.versionNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">选择样本</label>
            <div className="border border-slate-600 rounded-lg p-4 max-h-48 overflow-y-auto bg-slate-800/50">
              {samples.map(sample => (
                <label key={sample.id} className="flex items-center space-x-2 py-1 cursor-pointer hover:bg-slate-700/50 px-2 rounded">
                  <input
                    type="checkbox"
                    checked={selectedSampleIds.includes(sample.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSampleIds([...selectedSampleIds, sample.id]);
                      } else {
                        setSelectedSampleIds(selectedSampleIds.filter(id => id !== sample.id));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-slate-300 text-sm">{sample.data.userId || sample.id}</span>
                  <span className="text-slate-500 text-xs">({sample.groupTag})</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">已选择 {selectedSampleIds.length} 个样本</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">开始时间</label>
              <input
                type="date"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">结束时间</label>
              <input
                type="date"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">执行环境</label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="staging">预发环境</option>
              <option value="production">生产环境</option>
              <option value="test">测试环境</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-8">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleCreate} loading={creating}>
            创建任务
          </Button>
        </div>
      </div>
    </div>
  );
}
