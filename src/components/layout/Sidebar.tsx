import { NavLink } from 'react-router-dom';
import {
  FileText,
  Database,
  Play,
  BarChart3,
  ClipboardList,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';

const menuItems = [
  { path: '/', icon: FileText, label: '规则选择', description: '管理规则版本' },
  { path: '/samples', icon: Database, label: '样本准备', description: '导入测试数据' },
  { path: '/tasks', icon: Play, label: '试算任务', description: '创建和执行任务' },
  { path: '/results/task_001', icon: BarChart3, label: '结果对比', description: '分析试算结果' },
  { path: '/reports', icon: ClipboardList, label: '评估报告', description: '生成评估结论' }
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`${
        collapsed ? 'w-16' : 'w-64'
      } bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300`}
    >
      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-400'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="text-xs text-slate-500">{item.description}</span>
                  </div>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-2 border-t border-slate-800">
        <NavLink
          to="/settings"
          className="flex items-center space-x-3 px-3 py-2.5 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-all"
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!collapsed && (
            <span className="text-sm font-medium">系统设置</span>
          )}
        </NavLink>
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute bottom-20 -right-3 w-6 h-6 bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-600 transition-all shadow-lg"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
