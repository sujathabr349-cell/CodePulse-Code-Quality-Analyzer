/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HistoryItem } from '../types';
import {
  History,
  Search,
  Trash2,
  Download,
  FileCode,
  ArrowRight,
  GitCompare,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface HistoryViewProps {
  onLoadIntoEditor: (code: string, filename: string) => void;
  onOpenReport: (id: string) => void;
  onCompareTwo: (idA: string, idB: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  onLoadIntoEditor,
  onOpenReport,
  onCompareTwo,
}) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/history?search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [search]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setHistory((prev) => prev.filter((item) => item.id !== id));
        setSelectedIds((prev) => prev.filter((item) => item !== id));
        setDeleteTargetId(null);
      }
    } catch {
      // Error
    }
  };

  const handleClearAll = async () => {
    try {
      const res = await fetch('/api/history/clear', { method: 'POST' });
      if (res.ok) {
        setHistory([]);
        setSelectedIds([]);
        setShowClearConfirm(false);
      }
    } catch {
      // Error
    }
  };

  const toggleSelectForCompare = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      if (selectedIds.length >= 2) {
        setSelectedIds([selectedIds[1], id]);
      } else {
        setSelectedIds([...selectedIds, id]);
      }
    }
  };

  const handleExport = (id: string, format: 'json' | 'csv' | 'html') => {
    window.open(`/api/export/${id}/${format}`, '_blank');
  };

  const handleOpenSource = async (id: string) => {
    try {
      const res = await fetch(`/api/history/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.source_code) {
          onLoadIntoEditor(data.source_code, data.filename);
        } else {
          alert('Source code was not saved for this analysis (privacy setting was off).');
        }
      }
    } catch {
      // Error
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
      {/* Header and Toolbar */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <History className="w-4 h-4 text-sky-400" />
              <span>Persistent Analysis History</span>
              <span className="font-mono text-xs text-slate-400">({history.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Locally stored in SQLite &middot; Opt-in code snapshot persistence
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Compare Selected Button */}
            {selectedIds.length === 2 && (
              <button
                onClick={() => onCompareTwo(selectedIds[0], selectedIds[1])}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>Compare Selected (2)</span>
              </button>
            )}

            {history.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-950 hover:bg-rose-950/40 text-rose-400 border border-slate-800 hover:border-rose-900/50 rounded text-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by filename or grade..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950/70 border border-slate-800 rounded text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Confirmation Modals */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-sm w-full p-5 shadow-2xl">
            <h4 className="text-sm font-semibold text-slate-100 mb-2">Clear Entire History?</h4>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              This will permanently delete all {history.length} saved analysis records from the SQLite database.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTargetId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-sm w-full p-5 shadow-2xl">
            <h4 className="text-sm font-semibold text-slate-100 mb-2">Delete Analysis Record?</h4>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Are you sure you want to delete this analysis report from SQLite? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTargetId)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto flex-1">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-400" />
            <span>Loading records from SQLite...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No analysis records found. Run an analysis from the editor to save records.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px] select-none">
              <tr>
                <th className="py-2.5 px-4 w-8">Compare</th>
                <th className="py-2.5 px-4">File &amp; Timestamp</th>
                <th className="py-2.5 px-4 text-center">Score</th>
                <th className="py-2.5 px-4 text-center">Issues</th>
                <th className="py-2.5 px-4 text-right">Complexity</th>
                <th className="py-2.5 px-4 text-right">Maintainability</th>
                <th className="py-2.5 px-4 text-right">Actions &amp; Exports</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {history.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-850/50 transition-colors ${
                      isSelected ? 'bg-sky-950/30' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectForCompare(item.id)}
                        className="rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0 cursor-pointer"
                        title="Select up to 2 items to compare"
                      />
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200 font-sans flex items-center gap-1.5">
                        <FileCode className="w-3.5 h-3.5 text-sky-400" />
                        <span>{item.filename}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {new Date(item.created_at).toLocaleString()}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`font-bold tabular-nums ${
                          item.quality_score >= 80 ? 'text-emerald-400' : 'text-sky-400'
                        }`}
                      >
                        {item.quality_score}
                      </span>
                      <span className="text-[11px] text-slate-500 font-sans ml-1">
                        ({item.grade})
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center font-sans text-slate-300">
                      <span className="font-mono font-semibold">{item.total_issues}</span>
                      <span className="text-[10px] text-slate-500 ml-1">
                        ({item.errors_count}e/{item.warnings_count}w/{item.infos_count}i)
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums text-slate-300">
                      {item.cyclomatic_complexity} CC
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums text-emerald-400">
                      {item.maintainability_index} MI
                    </td>

                    <td className="py-3 px-4 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Open in Editor */}
                        <button
                          onClick={() => handleOpenSource(item.id)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] transition-colors cursor-pointer"
                          title="Open code in editor"
                        >
                          Open in Editor
                        </button>

                        {/* Export Menu */}
                        <div className="flex items-center bg-slate-950 rounded border border-slate-800">
                          <button
                            onClick={() => handleExport(item.id, 'json')}
                            className="px-1.5 py-1 text-[10px] text-slate-400 hover:text-slate-200 border-r border-slate-800"
                            title="Export JSON"
                          >
                            JSON
                          </button>
                          <button
                            onClick={() => handleExport(item.id, 'csv')}
                            className="px-1.5 py-1 text-[10px] text-slate-400 hover:text-slate-200 border-r border-slate-800"
                            title="Export CSV (formula sanitized)"
                          >
                            CSV
                          </button>
                          <button
                            onClick={() => handleExport(item.id, 'html')}
                            className="px-1.5 py-1 text-[10px] text-slate-400 hover:text-slate-200"
                            title="Export Standalone HTML Report"
                          >
                            HTML
                          </button>
                        </div>

                        {/* Delete Single */}
                        <button
                          onClick={() => setDeleteTargetId(item.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                          title="Delete report"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Storage policy footer */}
      <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Storage behavior: Source code is only stored when opt-in history storage is active in Settings.</span>
        <span>Local SQLite persistence &middot; Zero cloud telemetry</span>
      </div>
    </div>
  );
};
