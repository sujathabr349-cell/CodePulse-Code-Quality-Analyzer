/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Code2,
  LayoutDashboard,
  SearchCode,
  GitCompare,
  History,
  GraduationCap,
  Sliders,
  HelpCircle,
  FileCheck2,
} from 'lucide-react';

export type NavigationTab =
  | 'analyzer'
  | 'dashboard'
  | 'findings'
  | 'compare'
  | 'history'
  | 'learning'
  | 'settings'
  | 'docs';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  totalFindingsCount?: number;
  qualityScore?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  totalFindingsCount = 0,
  qualityScore,
}) => {
  const navItems = [
    { id: 'analyzer' as NavigationTab, label: 'Code Analyzer', icon: Code2 },
    { id: 'dashboard' as NavigationTab, label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'findings' as NavigationTab,
      label: 'Findings Explorer',
      icon: SearchCode,
      count: totalFindingsCount > 0 ? totalFindingsCount : undefined,
    },
    { id: 'compare' as NavigationTab, label: 'Before & After', icon: GitCompare },
    { id: 'history' as NavigationTab, label: 'Analysis History', icon: History },
    { id: 'learning' as NavigationTab, label: 'Learning Mode', icon: GraduationCap },
    { id: 'settings' as NavigationTab, label: 'Rule Settings', icon: Sliders },
    { id: 'docs' as NavigationTab, label: 'Documentation', icon: HelpCircle },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 select-none h-screen sticky top-0">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800">
        <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
          <FileCheck2 className="w-5 h-5" />
        </div>
        <div>
          <div className="font-semibold text-slate-100 text-base tracking-tight leading-tight">CodePulse</div>
          <div className="text-xs text-slate-500 font-medium">Python Quality Engine</div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="p-3 flex-1 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
          Workspace
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sky-500/15 text-sky-300 font-semibold border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.count !== undefined && (
                <span className="text-xs font-mono tabular-nums px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quality Badge Footer in Sidebar */}
      {qualityScore !== undefined && (
        <div className="p-4 mx-3 mb-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Last Analyzed Score</span>
            <span className="font-mono tabular-nums font-semibold text-slate-200">{qualityScore}/100</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                qualityScore >= 90
                  ? 'bg-emerald-400'
                  : qualityScore >= 75
                  ? 'bg-sky-400'
                  : qualityScore >= 60
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${Math.max(5, qualityScore)}%` }}
            />
          </div>
        </div>
      )}

      {/* Engine Status */}
      <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span className="truncate">Python AST &middot; Radon &middot; Ruff</span>
        <span className="font-mono text-[11px] text-slate-400">v1.0.0</span>
      </div>
    </aside>
  );
};
