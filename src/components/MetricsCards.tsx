/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertCircle, AlertTriangle, Info, GitBranch, Gauge, Code2 } from 'lucide-react';
import { Metrics } from '../types';

interface MetricsCardsProps {
  metrics: Metrics;
  issueCounts: {
    total: number;
    by_severity: {
      error: number;
      warning: number;
      information: number;
    };
  };
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ metrics, issueCounts }) => {
  const { error, warning, information } = issueCounts.by_severity;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Issues Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-500 uppercase tracking-wider font-semibold">
          <span>Detected Issues</span>
          <AlertCircle className="w-4 h-4 text-slate-400" />
        </div>
        <div className="my-2">
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-100">
            {issueCounts.total}
          </div>
          <div className="flex items-center gap-2 mt-1 text-[11px] font-mono">
            <span className="text-rose-400">{error} err</span>
            <span className="text-slate-600">&middot;</span>
            <span className="text-amber-400">{warning} warn</span>
            <span className="text-slate-600">&middot;</span>
            <span className="text-sky-400">{information} info</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-500">Static rule violations</div>
      </div>

      {/* Code Volume */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-500 uppercase tracking-wider font-semibold">
          <span>Source SLOC</span>
          <Code2 className="w-4 h-4 text-slate-400" />
        </div>
        <div className="my-2">
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-100">
            {metrics.sloc}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            {metrics.total_lines} total &middot; {metrics.comment_lines} comments
          </div>
        </div>
        <div className="text-[11px] text-slate-500">{metrics.functions_count} functions &middot; {metrics.classes_count} classes</div>
      </div>

      {/* Cyclomatic Complexity */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-500 uppercase tracking-wider font-semibold">
          <span>Avg Complexity</span>
          <GitBranch className="w-4 h-4 text-slate-400" />
        </div>
        <div className="my-2">
          <div className="text-2xl font-bold font-mono tabular-nums text-sky-400">
            {metrics.average_cyclomatic_complexity}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            Max function CC: <span className={metrics.max_cyclomatic_complexity > 10 ? 'text-amber-400 font-bold' : 'text-slate-200'}>{metrics.max_cyclomatic_complexity}</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-500">McCabe decision paths</div>
      </div>

      {/* Maintainability Index */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-500 uppercase tracking-wider font-semibold">
          <span>Maintainability (MI)</span>
          <Gauge className="w-4 h-4 text-slate-400" />
        </div>
        <div className="my-2">
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
            {metrics.maintainability_index}
            <span className="text-sm font-sans text-slate-500 font-normal ml-1">/100</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="font-semibold text-emerald-400">Grade {metrics.mi_grade}</span>
            <span className="text-slate-600">&middot;</span>
            <span className="truncate">{metrics.mi_status}</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-500 font-mono">Vol: {metrics.halstead_volume}</div>
      </div>
    </div>
  );
};
