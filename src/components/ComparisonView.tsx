/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ComparisonResult, Finding } from '../types';
import {
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Minus,
  Sparkles,
  GitCompare,
} from 'lucide-react';

interface ComparisonViewProps {
  comparison: ComparisonResult | null;
  onNavigateToLine: (line: number) => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  comparison,
  onNavigateToLine,
}) => {
  const [activeTab, setActiveTab] = useState<'resolved' | 'new' | 'persistent'>('resolved');

  if (!comparison) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center">
        <GitCompare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-200 mb-1">
          No Regression Baseline Yet
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Run an initial code analysis, make code adjustments in the editor, and run analysis again to view real-time score diffs, resolved issues, and metrics progression.
        </p>
      </div>
    );
  }

  const { score_comparison, issues_comparison, metrics_comparison } = comparison;
  const isImproved = score_comparison.score_delta > 0;
  const isNeutral = score_comparison.score_delta === 0;

  const currentFindingsList: Finding[] =
    activeTab === 'resolved'
      ? issues_comparison.resolved_findings
      : activeTab === 'new'
      ? issues_comparison.new_findings
      : issues_comparison.persistent_findings;

  return (
    <div className="space-y-4">
      {/* Top Regression Summary Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-0.5">
              Code Evolution &amp; Regression
            </div>
            <div className="text-sm font-semibold text-slate-200">
              Before &amp; After Analysis Diff
            </div>
          </div>
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider border ${
              isNeutral
                ? 'bg-slate-800 text-slate-300 border-slate-700'
                : isImproved
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}
          >
            {isNeutral ? (
              <Minus className="w-3.5 h-3.5" />
            ) : isImproved ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            <span>
              {isNeutral
                ? 'No Score Change'
                : `${isImproved ? '+' : ''}${score_comparison.score_delta} pts`}
            </span>
          </div>
        </div>

        {/* 4 Metric Deltas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
          <div className="p-3 bg-slate-950/60 rounded border border-slate-800">
            <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
              Quality Score
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-bold font-mono text-slate-400">
                {score_comparison.previous_score}
              </span>
              <span className="text-slate-600">&rarr;</span>
              <span
                className={`text-xl font-bold font-mono ${
                  score_comparison.score_delta > 0
                    ? 'text-emerald-400'
                    : score_comparison.score_delta < 0
                    ? 'text-rose-400'
                    : 'text-slate-200'
                }`}
              >
                {score_comparison.current_score}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded border border-slate-800">
            <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
              Resolved Issues
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              +{issues_comparison.resolved_count}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Issues eliminated</div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded border border-slate-800">
            <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
              New Issues
            </div>
            <div
              className={`text-xl font-bold font-mono mt-1 ${
                issues_comparison.new_count > 0 ? 'text-rose-400' : 'text-slate-300'
              }`}
            >
              +{issues_comparison.new_count}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Introduced defects</div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded border border-slate-800">
            <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
              Maintainability (MI)
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-mono text-slate-400">
                {metrics_comparison.previous_mi}
              </span>
              <span className="text-slate-600">&rarr;</span>
              <span
                className={`text-xl font-mono font-bold ${
                  metrics_comparison.mi_delta > 0
                    ? 'text-emerald-400'
                    : metrics_comparison.mi_delta < 0
                    ? 'text-rose-400'
                    : 'text-slate-200'
                }`}
              >
                {metrics_comparison.current_mi}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Resolved vs New vs Persistent */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('resolved')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'resolved'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Resolved Findings ({issues_comparison.resolved_count})</span>
          </button>

          <button
            onClick={() => setActiveTab('new')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'new'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>New Findings ({issues_comparison.new_count})</span>
          </button>

          <button
            onClick={() => setActiveTab('persistent')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'persistent'
                ? 'bg-slate-800 text-slate-200 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Remaining Findings ({issues_comparison.persistent_count})</span>
          </button>
        </div>

        {/* Tab Findings List */}
        <div className="divide-y divide-slate-800/80 p-2 max-h-[420px] overflow-y-auto">
          {currentFindingsList.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No findings in this category.
            </div>
          ) : (
            currentFindingsList.map((f, i) => (
              <div key={i} className="p-3 flex items-start justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-slate-300">{f.rule_id}</span>
                    <span className="text-slate-600">&middot;</span>
                    <button
                      onClick={() => onNavigateToLine(f.line)}
                      className="text-sky-400 hover:underline font-mono"
                    >
                      Line {f.line}
                    </button>
                    <span className="text-slate-600">&middot;</span>
                    <span className="text-slate-400 capitalize">{f.category}</span>
                  </div>
                  <div className="font-semibold text-slate-200">{f.title}</div>
                  <div className="text-slate-400 mt-0.5">{f.message}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
