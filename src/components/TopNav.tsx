/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, Sparkles } from 'lucide-react';
import { NavigationTab } from './Sidebar';

interface TopNavProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
  filename: string;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  onSelectTab,
  onRunAnalysis,
  isAnalyzing,
  filename,
}) => {
  const getBreadcrumbLabel = (tab: NavigationTab): string => {
    switch (tab) {
      case 'analyzer':
        return `Code Editor / ${filename}`;
      case 'dashboard':
        return 'System Quality Metrics / Dashboard';
      case 'findings':
        return 'Static Analysis / Findings Explorer';
      case 'compare':
        return 'Regression Testing / Before & After';
      case 'history':
        return 'Persistence / SQLite Analysis History';
      case 'learning':
        return 'Education / Learning Mode Tutor';
      case 'settings':
        return 'Configuration / Rule Tuning';
      case 'docs':
        return 'Documentation / Architecture & API';
      default:
        return 'CodePulse';
    }
  };

  return (
    <header className="h-16 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-8 shrink-0 z-10 sticky top-0">
      {/* Zone 1: Brand title & breadcrumb trail */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-base font-bold text-slate-100 whitespace-nowrap shrink-0">
          CodePulse
        </span>
        <span className="text-slate-600 font-mono text-sm">/</span>
        <span className="text-sm font-medium text-slate-400 truncate">
          {getBreadcrumbLabel(currentTab)}
        </span>
      </div>

      {/* Zone 2: Navigation Links (Single-line, concise) */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => onSelectTab('analyzer')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            currentTab === 'analyzer' ? 'text-sky-400 font-semibold' : ''
          }`}
        >
          Editor
        </button>
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            currentTab === 'dashboard' ? 'text-sky-400 font-semibold' : ''
          }`}
        >
          Metrics
        </button>
        <button
          onClick={() => onSelectTab('findings')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            currentTab === 'findings' ? 'text-sky-400 font-semibold' : ''
          }`}
        >
          Findings
        </button>
        <button
          onClick={() => onSelectTab('compare')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            currentTab === 'compare' ? 'text-sky-400 font-semibold' : ''
          }`}
        >
          Compare
        </button>
        <button
          onClick={() => onSelectTab('learning')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            currentTab === 'learning' ? 'text-sky-400 font-semibold' : ''
          }`}
        >
          Learning Guide
        </button>
      </nav>

      {/* Zone 3: 1 Primary Action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onRunAnalysis}
          disabled={isAnalyzing}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors shadow-sm disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
        >
          {isAnalyzing ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing AST...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Analyze Code</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
