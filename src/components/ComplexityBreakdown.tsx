/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FunctionMetric } from '../types';
import { GitBranch, ArrowUpDown, CornerDownRight } from 'lucide-react';

interface ComplexityBreakdownProps {
  functions: FunctionMetric[];
  onNavigateToLine: (line: number) => void;
}

export const ComplexityBreakdown: React.FC<ComplexityBreakdownProps> = ({
  functions,
  onNavigateToLine,
}) => {
  const [sortBy, setSortBy] = useState<'cc' | 'loc' | 'nesting' | 'line'>('cc');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (field: 'cc' | 'loc' | 'nesting' | 'line') => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(false);
    }
  };

  const sortedFunctions = [...functions].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'cc') comparison = b.cyclomatic_complexity - a.cyclomatic_complexity;
    else if (sortBy === 'loc') comparison = b.loc - a.loc;
    else if (sortBy === 'nesting') comparison = b.nesting_depth - a.nesting_depth;
    else if (sortBy === 'line') comparison = a.start_line - b.start_line;
    return sortAsc ? -comparison : comparison;
  });

  const getComplexityBadge = (cc: number) => {
    if (cc <= 5) return { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Simple' };
    if (cc <= 10) return { bg: 'bg-sky-500/10 text-sky-400 border-sky-500/20', label: 'Moderate' };
    if (cc <= 15) return { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: 'Complex' };
    return { bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20', label: 'Refactor' };
  };

  if (functions.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-center text-slate-500 text-xs">
        No function definitions detected in this module.
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-semibold text-slate-200">
            Function Complexity &amp; Architecture
          </h3>
          <span className="text-xs text-slate-500 font-mono">({functions.length} functions)</span>
        </div>
        <div className="text-xs text-slate-400">
          Click any row to jump to source definition
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px] select-none">
            <tr>
              <th
                onClick={() => handleSort('line')}
                className="py-2.5 px-4 cursor-pointer hover:text-slate-200"
              >
                <div className="flex items-center gap-1">
                  <span>Lines</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-4">Function Signature</th>
              <th
                onClick={() => handleSort('cc')}
                className="py-2.5 px-4 cursor-pointer hover:text-slate-200 text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Complexity (CC)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('nesting')}
                className="py-2.5 px-4 cursor-pointer hover:text-slate-200 text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Nesting</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('loc')}
                className="py-2.5 px-4 cursor-pointer hover:text-slate-200 text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>SLOC</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {sortedFunctions.map((fn, idx) => {
              const badge = getComplexityBadge(fn.cyclomatic_complexity);
              return (
                <tr
                  key={`${fn.name}-${idx}`}
                  onClick={() => onNavigateToLine(fn.start_line)}
                  className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4 text-slate-500 tabular-nums whitespace-nowrap">
                    {fn.start_line}&ndash;{fn.end_line}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-200 group-hover:text-sky-300 transition-colors">
                    <div className="flex items-center gap-1.5">
                      <CornerDownRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-sky-400" />
                      <span>{fn.name}</span>
                      {fn.is_async && (
                        <span className="text-[10px] text-purple-400 bg-purple-950/40 px-1 py-0.2 rounded border border-purple-800/40">
                          async
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums">
                    <span
                      className={`font-bold ${
                        fn.cyclomatic_complexity > 10 ? 'text-rose-400' : 'text-slate-200'
                      }`}
                    >
                      {fn.cyclomatic_complexity}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-slate-400">
                    {fn.nesting_depth} deep
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-slate-400">
                    {fn.loc} lines
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-sans font-semibold uppercase tracking-wider border ${badge.bg}`}
                    >
                      {badge.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
