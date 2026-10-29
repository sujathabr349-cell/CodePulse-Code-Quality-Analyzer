/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  DashboardStats,
  HistoryItem,
} from '../types';
import {
  LayoutDashboard,
  CheckCircle,
  AlertTriangle,
  Info,
  GitBranch,
  Gauge,
  TrendingUp,
  FileCode,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface DashboardViewProps {
  onSelectReport: (id: string) => void;
  onGoToEditor: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectReport,
  onGoToEditor,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // Handle error gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-sky-400" />
        <p className="text-xs">Computing aggregated SQLite metrics...</p>
      </div>
    );
  }

  const hasData = stats && stats.total_analyzed > 0;

  if (!hasData) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-16 text-center">
        <LayoutDashboard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-200 mb-1">
          No Analyzed Code in History Yet
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6 leading-relaxed">
          The dashboard computes live metrics, complexity trends, and issue distributions directly from your persistent SQLite database.
        </p>
        <button
          onClick={onGoToEditor}
          className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors cursor-pointer"
        >
          Analyze Your First Python File
        </button>
      </div>
    );
  }

  const {
    total_analyzed,
    avg_quality_score,
    total_issues,
    total_errors,
    total_warnings,
    total_infos,
    avg_complexity,
    avg_maintainability,
    trend_data,
  } = stats!;

  // SVG Trend Chart Geometry
  const chartHeight = 160;
  const chartWidth = 560;
  const padding = 20;

  const points = trend_data.map((item, idx) => {
    const x =
      trend_data.length === 1
        ? chartWidth / 2
        : padding + (idx / (trend_data.length - 1)) * (chartWidth - padding * 2);
    const y =
      chartHeight - padding - (item.quality_score / 100) * (chartHeight - padding * 2);
    return { x, y, score: item.quality_score, filename: item.filename };
  });

  const polylineStr = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="space-y-6">
      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
            Total Analyzed Files
          </div>
          <div className="text-3xl font-bold font-mono text-slate-100 tabular-nums">
            {total_analyzed}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Stored in SQLite database</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
            Average Quality Score
          </div>
          <div
            className={`text-3xl font-bold font-mono tabular-nums ${
              avg_quality_score >= 80 ? 'text-emerald-400' : 'text-sky-400'
            }`}
          >
            {avg_quality_score}
            <span className="text-sm font-sans text-slate-500 font-normal ml-1">/100</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Aggregated overall rating</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
            Average Complexity
          </div>
          <div className="text-3xl font-bold font-mono text-sky-400 tabular-nums">
            {avg_complexity}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">McCabe branching paths</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
            Average Maintainability
          </div>
          <div className="text-3xl font-bold font-mono text-emerald-400 tabular-nums">
            {avg_maintainability}
            <span className="text-sm font-sans text-slate-500 font-normal ml-1">/100</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">SEI Maintainability Index</div>
        </div>
      </div>

      {/* Middle Row: Trend Chart & Issues Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quality Trend Chart (2 columns) */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-400" />
                <span>Historical Quality Progression</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Score progression across recent analysis runs
              </p>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Last {trend_data.length} analyses
            </div>
          </div>

          {/* SVG Line Chart */}
          <div className="py-4">
            <svg
              className="w-full h-44 overflow-visible"
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            >
              {/* Horizontal Gridlines */}
              {[25, 50, 75, 100].map((level) => {
                const y = chartHeight - padding - (level / 100) * (chartHeight - padding * 2);
                return (
                  <g key={level}>
                    <line
                      x1={padding}
                      y1={y}
                      x2={chartWidth - padding}
                      y2={y}
                      stroke="#1e293b"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={chartWidth - padding + 5}
                      y={y + 3}
                      fill="#64748b"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {level}
                    </text>
                  </g>
                );
              })}

              {/* Area gradient under line */}
              {points.length > 1 && (
                <polygon
                  points={`${points[0].x},${chartHeight - padding} ${polylineStr} ${
                    points[points.length - 1].x
                  },${chartHeight - padding}`}
                  fill="rgba(56, 189, 248, 0.08)"
                />
              )}

              {/* Trend Polyline */}
              {points.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  points={polylineStr}
                />
              )}

              {/* Data points */}
              {points.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill="#0f172a"
                  stroke="#38bdf8"
                  strokeWidth="2"
                />
              ))}
            </svg>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800/80">
            <span>First Recorded</span>
            <span>Latest Run</span>
          </div>
        </div>

        {/* Issue Severity Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 mb-1">
              Issue Distribution by Severity
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Total {total_issues} issues identified across codebase
            </p>

            <div className="space-y-4">
              {/* Errors */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Critical Errors
                  </span>
                  <span className="font-mono tabular-nums text-slate-300">
                    {total_errors} (
                    {total_issues ? Math.round((total_errors / total_issues) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full"
                    style={{
                      width: `${total_issues ? (total_errors / total_issues) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Warnings */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Warnings
                  </span>
                  <span className="font-mono tabular-nums text-slate-300">
                    {total_warnings} (
                    {total_issues ? Math.round((total_warnings / total_issues) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full"
                    style={{
                      width: `${total_issues ? (total_warnings / total_issues) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Informational */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-sky-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    Informational
                  </span>
                  <span className="font-mono tabular-nums text-slate-300">
                    {total_infos} (
                    {total_issues ? Math.round((total_infos / total_issues) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-500 h-full"
                    style={{
                      width: `${total_issues ? (total_infos / total_issues) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-xs text-slate-400">
            Categorized via Python AST &amp; Static Linters
          </div>
        </div>
      </div>

      {/* Recent Analysis History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-100">
            Recent Analysis Records
          </h3>
          <span className="text-xs text-slate-500">Live SQLite records</span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {trend_data.slice(0, 6).map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectReport(item.id)}
              className="p-3.5 hover:bg-slate-800/50 flex items-center justify-between transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <FileCode className="w-4 h-4 text-sky-400" />
                <div>
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-sky-300 transition-colors">
                    {item.filename}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span
                    className={`font-mono font-bold text-xs ${
                      item.quality_score >= 80 ? 'text-emerald-400' : 'text-sky-400'
                    }`}
                  >
                    {item.quality_score} pts
                  </span>
                  <div className="text-[11px] text-slate-500">
                    {item.total_issues} issues &middot; {item.cyclomatic_complexity} CC
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
