/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Finding,
} from '../types';
import {
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Wrench,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface FindingsExplorerProps {
  findings: Finding[];
  onApplyFix: (ruleId: string, line: number) => void;
  onNavigateToLine: (line: number) => void;
  onOpenLearningGuide: (ruleId: string) => void;
  isFixing?: boolean;
}

export const FindingsExplorer: React.FC<FindingsExplorerProps> = ({
  findings,
  onApplyFix,
  onNavigateToLine,
  onOpenLearningGuide,
  isFixing = false,
}) => {
  const [search, setSearch] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'line' | 'severity' | 'rule'>('line');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'syntax', label: 'Syntax' },
    { id: 'complexity', label: 'Complexity' },
    { id: 'security', label: 'Security' },
    { id: 'maintainability', label: 'Maintainability' },
    { id: 'code_style', label: 'Style' },
    { id: 'docstrings', label: 'Docstrings' },
  ];

  const handleCopySuggestion = async (finding: Finding) => {
    const textToCopy = `Fix for ${finding.rule_id} (${finding.title}):\nRecommendation: ${finding.recommendation}\n${
      finding.after_example ? `\nExample:\n${finding.after_example}` : ''
    }`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedId(finding.finding_id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
    }
  };

  // Filtering
  const filtered = findings.filter((f) => {
    if (selectedSeverity !== 'all' && f.severity !== selectedSeverity) return false;
    if (selectedCategory !== 'all' && f.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        f.rule_id.toLowerCase().includes(q) ||
        f.title.toLowerCase().includes(q) ||
        f.message.toLowerCase().includes(q) ||
        f.source.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'line') return a.line - b.line;
    if (sortBy === 'severity') {
      const weights = { error: 0, warning: 1, information: 2 };
      return weights[a.severity] - weights[b.severity];
    }
    if (sortBy === 'rule') return a.rule_id.localeCompare(b.rule_id);
    return 0;
  });

  const getSeverityBadge = (sev: string) => {
    if (sev === 'error') {
      return {
        icon: AlertCircle,
        bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        text: 'Error',
      };
    }
    if (sev === 'warning') {
      return {
        icon: AlertTriangle,
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        text: 'Warning',
      };
    }
    return {
      icon: Info,
      bg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      text: 'Info',
    };
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
      {/* Header and Controls */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>Static Analysis Findings</span>
              <span className="font-mono text-xs text-slate-400">
                ({filtered.length} of {findings.length})
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review rule explanations, risk analysis, and safe corrections
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rule ID, title, keyword..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950/70 border border-slate-800 rounded text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Severity Tabs (Interactive filter control) */}
          <div className="flex items-center gap-1 p-1 bg-slate-950/60 rounded-lg border border-slate-800">
            {['all', 'error', 'warning', 'information'].map((sev) => {
              const isActive = selectedSeverity === sev;
              const count =
                sev === 'all'
                  ? findings.length
                  : findings.filter((f) => f.severity === sev).length;
              return (
                <button
                  key={sev}
                  onClick={() => setSelectedSeverity(sev)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors capitalize ${
                    isActive
                      ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sev === 'information' ? 'Info' : sev}{' '}
                  <span className="font-mono text-[10px] ml-1 text-slate-500">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Category Dropdown and Sort */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950/70 border border-slate-800 rounded text-xs text-slate-300 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-950/70 border border-slate-800 rounded text-xs text-slate-300 focus:outline-none"
            >
              <option value="line">Sort by Line Number</option>
              <option value="severity">Sort by Severity</option>
              <option value="rule">Sort by Rule ID</option>
            </select>
          </div>
        </div>
      </div>

      {/* Findings List */}
      <div className="divide-y divide-slate-800/80 overflow-y-auto max-h-[580px]">
        {sorted.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
            <h4 className="text-sm font-semibold text-slate-200">No matching issues found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Your Python code satisfies all filtered static quality rules.
            </p>
          </div>
        ) : (
          sorted.map((finding) => {
            const badge = getSeverityBadge(finding.severity);
            const Icon = badge.icon;
            const isExpanded = expandedId === finding.finding_id;

            return (
              <div
                key={finding.finding_id}
                className="p-4 hover:bg-slate-850/40 transition-colors"
              >
                {/* Main Card Line */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5">
                      <Icon className={`w-4 h-4 ${badge.bg.split(' ')[1]}`} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${badge.bg}`}
                        >
                          {badge.text}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-200">
                          {finding.rule_id}
                        </span>
                        <span className="text-slate-600 text-xs">&middot;</span>
                        <button
                          onClick={() => onNavigateToLine(finding.line)}
                          className="font-mono text-xs text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          Line {finding.line}
                          {finding.col > 0 && `:${finding.col}`}
                        </button>
                        <span className="text-slate-600 text-xs">&middot;</span>
                        <span className="text-xs text-slate-400 capitalize">
                          {finding.category.replace('_', ' ')}
                        </span>
                        <span className="text-slate-600 text-xs">&middot;</span>
                        <span className="text-[11px] text-slate-500">{finding.source}</span>
                      </div>

                      <h4 className="text-sm font-semibold text-slate-100 mb-1">
                        {finding.title}
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {finding.message}
                      </p>
                    </div>
                  </div>

                  {/* Right actions: Expand toggle & Quick actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {finding.can_autofix && (
                      <button
                        onClick={() => onApplyFix(finding.rule_id, finding.line)}
                        disabled={isFixing}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/60 rounded transition-colors disabled:opacity-40 cursor-pointer"
                        title="Automatically fix this deterministic finding"
                      >
                        <Wrench className="w-3 h-3" />
                        <span>Apply Fix</span>
                      </button>
                    )}

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : finding.finding_id)}
                      className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Pane */}
                {isExpanded && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-3 text-xs">
                    {/* Code Snippet Preview */}
                    {finding.snippet && (
                      <div>
                        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          Source Context
                        </div>
                        <div className="p-2.5 bg-slate-950 rounded border border-slate-800 font-mono text-slate-300 text-xs flex items-center justify-between">
                          <span>
                            <span className="text-slate-600 mr-3 select-none">{finding.line} |</span>
                            {finding.snippet}
                          </span>
                          <button
                            onClick={() => onNavigateToLine(finding.line)}
                            className="text-sky-400 hover:text-sky-300 text-[11px] flex items-center gap-1 ml-4"
                          >
                            Jump to Line
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Why this matters */}
                    <div>
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Why this matters
                      </div>
                      <p className="text-slate-300 bg-slate-950/40 p-2.5 rounded border border-slate-800/60 leading-relaxed">
                        {finding.why_it_matters || finding.explanation}
                      </p>
                    </div>

                    {/* Actionable recommendation */}
                    <div>
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Recommended Improvement
                      </div>
                      <p className="text-slate-300 bg-slate-950/40 p-2.5 rounded border border-slate-800/60 leading-relaxed">
                        {finding.recommendation}
                      </p>
                    </div>

                    {/* Before & After Examples */}
                    {(finding.before_example || finding.after_example) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        {finding.before_example && (
                          <div>
                            <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider mb-1">
                              Problematic Pattern
                            </div>
                            <pre className="p-2.5 bg-slate-950 rounded border border-rose-950/80 font-mono text-[11px] text-rose-200 overflow-x-auto whitespace-pre">
                              {finding.before_example}
                            </pre>
                          </div>
                        )}
                        {finding.after_example && (
                          <div>
                            <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                              Recommended Pattern
                            </div>
                            <pre className="p-2.5 bg-slate-950 rounded border border-emerald-950/80 font-mono text-[11px] text-emerald-200 overflow-x-auto whitespace-pre">
                              {finding.after_example}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Footer */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => onOpenLearningGuide(finding.rule_id)}
                        className="text-xs text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        Open in Learning Mode &amp; Student Tutor
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleCopySuggestion(finding)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors cursor-pointer"
                      >
                        {copiedId === finding.finding_id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Suggestion</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
