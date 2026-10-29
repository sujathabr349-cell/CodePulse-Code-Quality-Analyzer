/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info, ShieldCheck, AlertCircle } from 'lucide-react';
import { ScoringBreakdown } from '../types';

interface QualityScoreCardProps {
  score: number;
  grade: string;
  rating: string;
  summary: string;
  breakdown: ScoringBreakdown;
  formulaExplanation: string;
}

export const QualityScoreCard: React.FC<QualityScoreCardProps> = ({
  score,
  grade,
  rating,
  summary,
  breakdown,
  formulaExplanation,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  // SVG Gauge calculations
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreTheme = (val: number) => {
    if (val >= 90) {
      return {
        text: 'text-emerald-400',
        stroke: '#34d399',
        border: 'border-emerald-500/20',
        bg: 'bg-emerald-500/10',
      };
    }
    if (val >= 75) {
      return {
        text: 'text-sky-400',
        stroke: '#38bdf8',
        border: 'border-sky-500/20',
        bg: 'bg-sky-500/10',
      };
    }
    if (val >= 60) {
      return {
        text: 'text-amber-400',
        stroke: '#fbbf24',
        border: 'border-amber-500/20',
        bg: 'bg-amber-500/10',
      };
    }
    return {
      text: 'text-rose-400',
      stroke: '#f87171',
      border: 'border-rose-500/20',
      bg: 'bg-rose-500/10',
    };
  };

  const theme = getScoreTheme(score);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-0.5">
            Code Quality Index
          </div>
          <div className="text-sm font-medium text-slate-300">
            Automated Multi-Metric Health Rating
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider ${theme.bg} ${theme.text} border ${theme.border}`}>
          {rating}
        </div>
      </div>

      {/* Main Score Visual */}
      <div className="py-5 flex items-center justify-between gap-6">
        {/* Left: Score Gauge */}
        <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background track */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="stroke-slate-800"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Value stroke */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke={theme.stroke}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold font-mono tabular-nums leading-none ${theme.text}`}>
              {score}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 mt-0.5">GRADE {grade}</span>
          </div>
        </div>

        {/* Right: Summary Prose */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            {summary}
          </p>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>Deductions: <strong className="font-mono text-slate-200">-{breakdown.total_deductions} pts</strong></span>
            <span aria-hidden="true">&middot;</span>
            <span>Base: <strong className="font-mono text-slate-200">100</strong></span>
          </div>
        </div>
      </div>

      {/* Toggle Breakdown */}
      <div className="pt-3 border-t border-slate-800/80">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition-colors py-1 cursor-pointer"
        >
          <span className="font-medium">Transparent Scoring Formula Breakdown</span>
          {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showDetails && (
          <div className="mt-3 space-y-2 text-xs">
            <div className="p-3 bg-slate-950/60 rounded border border-slate-800 font-mono text-[11px] text-slate-400 leading-relaxed">
              {formulaExplanation}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="p-2.5 bg-slate-950/40 rounded border border-slate-800/80 flex justify-between">
                <span className="text-slate-400">Error Penalties</span>
                <span className="font-mono text-rose-400 font-medium">-{breakdown.error_deductions}</span>
              </div>
              <div className="p-2.5 bg-slate-950/40 rounded border border-slate-800/80 flex justify-between">
                <span className="text-slate-400">Warning Penalties</span>
                <span className="font-mono text-amber-400 font-medium">-{breakdown.warning_deductions}</span>
              </div>
              <div className="p-2.5 bg-slate-950/40 rounded border border-slate-800/80 flex justify-between">
                <span className="text-slate-400">Info Deductions</span>
                <span className="font-mono text-sky-400 font-medium">-{breakdown.info_deductions}</span>
              </div>
              <div className="p-2.5 bg-slate-950/40 rounded border border-slate-800/80 flex justify-between">
                <span className="text-slate-400">Complexity Deductions</span>
                <span className="font-mono text-purple-400 font-medium">-{breakdown.complexity_deduction}</span>
              </div>
              <div className="p-2.5 bg-slate-950/40 rounded border border-slate-800/80 flex justify-between col-span-2">
                <span className="text-slate-400">Maintainability Deficit</span>
                <span className="font-mono text-indigo-400 font-medium">-{breakdown.maintainability_deduction}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 pt-2 leading-relaxed">
              * Note: This score is a heuristic educational quality indicator formulated by CodePulse, not an industry-standard certification or guarantee of absolute correctness.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
