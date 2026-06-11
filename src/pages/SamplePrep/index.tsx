import { useEffect, useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, FolderOpen, Plus, Trash2, Download, Filter, CheckSquare, Square } from 'lucide-react';
import { useStore } from '../../stores';
import { sampleApi, testSetApi } from '../../services/api';
import type { SampleData, TestSet } from '../../types';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import * as XLSX from 'xlsx';
import { clsx } from 'clsx';

export default function SamplePrep() {
  const { samples, setSamples, testSets, setTestSets, selectedSamples, setSelectedSamples } = useStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'samples' | 'testsets'>('samples');
  const [dragActive, setDragActive] = useState(false);
  const [groupFilter, setGroupFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [samplesData, testSetsData] = await Promise.all([
        sampleApi.getSamples(),
        testSetApi.getTestSets()
      ]);
      setSamples(samplesData);
      setTestSets(testSetsData);
    } catch (err) {
      console.error('加载数据失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const importedSamples = await sampleApi.importSamples(
          jsonData.map((row: any) => ({
            data: row,
            groupTag: row.group || '未分组',
            channel: row.channel || 'unknown',
            timeRange: row.date || new Date().toISOString().split('T')[0]
          }))
        );
        
        setSamples([...samples, ...importedSamples]);
      } catch (err) {
        console.error('文件解析失败', err);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const toggleSampleSelection = (sampleId: string) => {
    if (selectedSamples.includes(sampleId)) {
      setSelectedSamples(selectedSamples.filter(id => id !== sampleId));
    } else {
      setSelectedSamples([...selectedSamples, sampleId]);
    }
  };

  const selectAllSamples = () => {
    if (selectedSamples.length === filteredSamples.length) {
      setSelectedSamples([]);
    } else {
      setSelectedSamples(filteredSamples.map(s => s.id));
    }
  };

  const filteredSamples = samples.filter(sample => {
    return groupFilter === 'all' || sample.groupTag === groupFilter;
  });

  const uniqueGroups = Array.from(new Set(samples.map(s => s.groupTag)));

  const sampleColumns = [
    {
      key: 'select',
      label: '',
      render: (sample: SampleData) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSampleSelection(sample.id);
          }}
          className="text-slate-400 hover:text-blue-400 transition-colors"
        >
          {selectedSamples.includes(sample.id) ? (
            <CheckSquare className="w-5 h-5 text-blue-400" />
          ) : (
            <Square className="w-5 h-5" />
          )}
        </button>
      )
    },
    {
      key: 'userId',
      label: '用户ID',
      render: (sample: SampleData) => (
        <span className="font-mono text-blue-400">{sample.data.userId || 'N/A'}</span>
      )
    },
    {
      key: 'amount',
      label: '交易金额',
      render: (sample: SampleData) => (
        <span className="text-white">¥{(sample.data.amount || 0).toLocaleString()}</span>
      )
    },
    {
      key: 'frequency',
      label: '频率',
      render: (sample: SampleData) => (
        <span className="text-slate-300">{sample.data.frequency || 0}次</span>
      )
    },
    {
      key: 'groupTag',
      label: '用户群体',
      render: (sample: SampleData) => (
        <span className={clsx(
          'px-2 py-1 text-xs font-medium rounded',
          sample.groupTag === 'VIP用户' && 'bg-purple-500/20 text-purple-400',
          sample.groupTag === '普通用户' && 'bg-slate-500/20 text-slate-400',
          sample.groupTag === '高风险用户' && 'bg-red-500/20 text-red-400',
          !['VIP用户', '普通用户', '高风险用户'].includes(sample.groupTag) && 'bg-slate-500/20 text-slate-400'
        )}>
          {sample.groupTag}
        </span>
      )
    },
    {
      key: 'channel',
      label: '渠道',
      render: (sample: SampleData) => (
        <span className="text-slate-300 capitalize">{sample.channel}</span>
      )
    },
    {
      key: 'importedAt',
      label: '导入时间',
      render: (sample: SampleData) => (
        <span className="text-slate-400">{new Date(sample.importedAt).toLocaleString('zh-CN')}</span>
      )
    }
  ];

  const testSetColumns = [
    {
      key: 'name',
      label: '测试集名称',
      render: (testSet: TestSet) => (
        <div>
          <p className="font-medium text-white">{testSet.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{testSet.description}</p>
        </div>
      )
    },
    {
      key: 'sampleCount',
      label: '样本数量',
      render: (testSet: TestSet) => (
        <span className="text-blue-400 font-medium">{testSet.sampleIds.length}</span>
      )
    },
    {
      key: 'createdAt',
      label: '创建时间',
      render: (testSet: TestSet) => (
        <span className="text-slate-400">{new Date(testSet.createdAt).toLocaleString('zh-CN')}</span>
      )
    },
    {
      key: 'actions',
      label: '操作',
      render: (testSet: TestSet) => (
        <div className="flex items-center space-x-2">
          <button className="p-1.5 text-slate-400 hover:text-blue-400 transition-colors" title="使用此测试集">
            <FolderOpen className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-red-400 transition-colors" title="删除">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">样本准备</h1>
          <p className="text-slate-400">导入和管理测试样本数据，保存常用测试集</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary" icon={<Download className="w-4 h-4" />}>
            导出模板
          </Button>
          <Button icon={<Upload className="w-4 h-4" />} onClick={() => document.getElementById('fileInput')?.click()}>
            导入数据
          </Button>
          <input
            id="fileInput"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      </div>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={clsx(
          'border-2 border-dashed rounded-xl p-12 text-center transition-all',
          dragActive
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-slate-600 hover:border-slate-500 bg-slate-800/30'
        )}
      >
        <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-slate-500" />
        <p className="text-lg text-slate-300 mb-2">拖拽文件到此处，或点击上传</p>
        <p className="text-sm text-slate-500">支持 Excel (.xlsx, .xls) 和 CSV 格式</p>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden">
        <div className="border-b border-slate-700">
          <div className="flex items-center space-x-1 p-2">
            <button
              onClick={() => setActiveTab('samples')}
              className={clsx(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                activeTab === 'samples'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              )}
            >
              样本列表 ({filteredSamples.length})
            </button>
            <button
              onClick={() => setActiveTab('testsets')}
              className={clsx(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                activeTab === 'testsets'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              )}
            >
              测试集 ({testSets.length})
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'samples' ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={selectAllSamples}
                    className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
                  >
                    {selectedSamples.length === filteredSamples.length ? (
                      <CheckSquare className="w-5 h-5 text-blue-400" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                    <span className="text-sm">全选</span>
                  </button>
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                      value={groupFilter}
                      onChange={(e) => setGroupFilter(e.target.value)}
                      className="px-3 py-1.5 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">全部群体</option>
                      {uniqueGroups.map(group => (
                        <option key={group} value={group}>{group}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {selectedSamples.length > 0 && (
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-slate-400">
                      已选择 {selectedSamples.length} 条样本
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<FolderOpen className="w-4 h-4" />}
                    >
                      保存为测试集
                    </Button>
                  </div>
                )}
              </div>

              <Table
                columns={sampleColumns}
                data={filteredSamples}
                loading={loading}
                emptyText="暂无样本数据"
              />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2 text-slate-400">
                  <FolderOpen className="w-5 h-5" />
                  <span className="text-sm">管理常用测试集</span>
                </div>
                <Button size="sm" icon={<Plus className="w-4 h-4" />}>
                  新建测试集
                </Button>
              </div>

              <Table
                columns={testSetColumns}
                data={testSets}
                loading={loading}
                emptyText="暂无测试集"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
