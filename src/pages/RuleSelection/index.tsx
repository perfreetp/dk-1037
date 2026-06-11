import { useEffect, useState } from 'react';
import { Search, Filter, GitCompare, Eye, Edit, CheckCircle, Clock, Archive, Plus } from 'lucide-react';
import { useStore } from '../../stores';
import { ruleApi } from '../../services/api';
import type { RuleVersion } from '../../types';
import StatCard from '../../components/common/StatCard';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export default function RuleSelection() {
  const { rules, setRules, selectedRule, setSelectedRule, setLoading, setError } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLocalLoading] = useState(true);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLocalLoading(true);
      const data = await ruleApi.getRules();
      setRules(data);
    } catch (err) {
      setError('加载规则失败');
    } finally {
      setLocalLoading(false);
    }
  };

  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.ruleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rule.versionNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rule.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusBadge = (status: string) => {
    const styles = {
      published: 'bg-green-500/20 text-green-400 border-green-500/30',
      draft: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      archived: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-medium border rounded-full ${styles[status as keyof typeof styles]}`}>
        {status === 'published' ? '已发布' : status === 'draft' ? '草稿' : '已归档'}
      </span>
    );
  };

  const columns = [
    {
      key: 'ruleName',
      label: '规则名称',
      render: (rule: RuleVersion) => (
        <div>
          <p className="font-medium text-white">{rule.ruleName}</p>
          <p className="text-xs text-slate-500 mt-0.5">{rule.configParams.description}</p>
        </div>
      )
    },
    {
      key: 'versionNumber',
      label: '版本',
      render: (rule: RuleVersion) => (
        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-mono rounded">
          {rule.versionNumber}
        </span>
      )
    },
    {
      key: 'priority',
      label: '优先级',
      render: (rule: RuleVersion) => (
        <span className="text-slate-300">#{rule.configParams.priority}</span>
      )
    },
    {
      key: 'status',
      label: '状态',
      render: (rule: RuleVersion) => statusBadge(rule.status)
    },
    {
      key: 'updatedAt',
      label: '更新时间',
      render: (rule: RuleVersion) => (
        <span className="text-slate-400">{new Date(rule.updatedAt).toLocaleString('zh-CN')}</span>
      )
    },
    {
      key: 'actions',
      label: '操作',
      render: (rule: RuleVersion) => (
        <div className="flex items-center space-x-2">
          <button className="p-1.5 text-slate-400 hover:text-blue-400 transition-colors" title="查看详情">
            <Eye className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-purple-400 transition-colors" title="版本对比">
            <GitCompare className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-green-400 transition-colors" title="编辑">
            <Edit className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const publishedCount = rules.filter(r => r.status === 'published').length;
  const draftCount = rules.filter(r => r.status === 'draft').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">规则选择</h1>
          <p className="text-slate-400">管理和选择规则版本进行试算验证</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />}>
          新建规则
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="规则总数"
          value={rules.length}
          icon={FileText}
          trend={{ value: 12, isPositive: true }}
          color="blue"
        />
        <StatCard
          title="已发布规则"
          value={publishedCount}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="草稿规则"
          value={draftCount}
          icon={Clock}
          color="orange"
        />
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4 flex-1 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索规则名称或版本号..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全部状态</option>
                <option value="published">已发布</option>
                <option value="draft">草稿</option>
                <option value="archived">已归档</option>
              </select>
            </div>
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredRules}
          loading={loading}
          emptyText="暂无规则数据"
          onRowClick={(rule) => setSelectedRule(rule)}
          selectedKey={selectedRule?.id}
        />
      </div>

      {selectedRule && (
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">{selectedRule.ruleName}</h2>
              <div className="flex items-center space-x-3">
                {statusBadge(selectedRule.status)}
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-mono rounded">
                  {selectedRule.versionNumber}
                </span>
                <span className="text-sm text-slate-400">
                  优先级 #{selectedRule.configParams.priority}
                </span>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="secondary" icon={<Eye className="w-4 h-4" />}>
                预览规则
              </Button>
              <Button icon={<CheckCircle2 className="w-4 h-4" />}>
                开始试算
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-3">规则条件</h3>
              <div className="space-y-2">
                {selectedRule.configParams.conditions.map((condition, index) => (
                  <div key={condition.id} className="p-3 bg-slate-900/50 border border-slate-700 rounded-lg">
                    <div className="flex items-center space-x-2 text-sm">
                      {index > 0 && (
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                          {condition.logic || 'AND'}
                        </span>
                      )}
                      <span className="text-slate-300 font-mono">{condition.field}</span>
                      <span className="text-slate-500">{condition.operator}</span>
                      <span className="text-blue-400 font-mono">{String(condition.value)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-3">执行动作</h3>
              <div className="space-y-2">
                {selectedRule.configParams.actions.map((action, index) => (
                  <div key={index} className="p-3 bg-slate-900/50 border border-slate-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {action.type === 'allow' && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                        {action.type === 'block' && <AlertCircle className="w-5 h-5 text-red-400" />}
                        <span className="text-slate-300 capitalize">
                          {action.type === 'allow' ? '允许通过' : 
                           action.type === 'block' ? '阻止交易' : 
                           action.type === 'review' ? '人工审核' : '标记'}
                        </span>
                      </div>
                      <span className="text-sm text-slate-500">优先级 #{action.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
