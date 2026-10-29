/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import {
  Sliders,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertCircle,
  Shield,
  Layers,
  Scale,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch {
      setErrorMsg('Failed to fetch settings from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    try {
      setErrorMsg(null);
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        setErrorMsg('Validation failed on server.');
      }
    } catch {
      setErrorMsg('Network error while saving settings.');
    }
  };

  const handleReset = async () => {
    try {
      const res = await fetch('/api/settings/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch {
      setErrorMsg('Failed to reset settings.');
    }
  };

  if (loading || !settings) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center text-xs text-slate-400">
        Loading configurable rule engine parameters...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            <span>Rule Engine &amp; Quality Scoring Settings</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Customize complexity boundaries, scoring deductions, and external tool runners
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded text-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded text-xs transition-colors cursor-pointer shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {savedSuccess && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Settings saved, validated, and persisted in SQLite successfully!</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-lg text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Section 1: Complexity & Structural Thresholds */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-400" />
          <span>1. Complexity &amp; Structural Thresholds</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-slate-950/60 rounded border border-slate-800">
            <label className="text-xs font-medium text-slate-200 block mb-1">
              Max Cyclomatic Complexity
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              Trigger CP-CMP-001 when function CC exceeds:
            </p>
            <input
              type="number"
              min="1"
              max="50"
              value={settings.max_cyclomatic_complexity}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  max_cyclomatic_complexity: parseInt(e.target.value, 10) || 1,
                })
              }
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="p-3 bg-slate-950/60 rounded border border-slate-800">
            <label className="text-xs font-medium text-slate-200 block mb-1">
              Max Function Length (SLOC)
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              Flag function lines exceeding:
            </p>
            <input
              type="number"
              min="5"
              max="300"
              value={settings.max_function_length}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  max_function_length: parseInt(e.target.value, 10) || 5,
                })
              }
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="p-3 bg-slate-950/60 rounded border border-slate-800">
            <label className="text-xs font-medium text-slate-200 block mb-1">
              Max Nesting Depth Level
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              Flag nested blocks exceeding:
            </p>
            <input
              type="number"
              min="1"
              max="10"
              value={settings.max_nesting_depth}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  max_nesting_depth: parseInt(e.target.value, 10) || 1,
                })
              }
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Transparent Scoring Weights */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Scale className="w-4 h-4 text-purple-400" />
          <span>2. Quality Scoring Weights (Points Deducted per Unit)</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-slate-950/60 rounded border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-medium text-slate-200">Error Deduction Weight</div>
              <div className="text-[11px] text-slate-500">Points penalized per critical error</div>
            </div>
            <input
              type="number"
              step="0.5"
              min="1"
              max="40"
              value={settings.error_weight}
              onChange={(e) =>
                setSettings({ ...settings, error_weight: parseFloat(e.target.value) || 0 })
              }
              className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-slate-100 text-right"
            />
          </div>

          <div className="p-3 bg-slate-950/60 rounded border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-medium text-slate-200">Warning Deduction Weight</div>
              <div className="text-[11px] text-slate-500">Points penalized per warning</div>
            </div>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="20"
              value={settings.warning_weight}
              onChange={(e) =>
                setSettings({ ...settings, warning_weight: parseFloat(e.target.value) || 0 })
              }
              className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-slate-100 text-right"
            />
          </div>

          <div className="p-3 bg-slate-950/60 rounded border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-medium text-slate-200">Informational Deduction Weight</div>
              <div className="text-[11px] text-slate-500">Points penalized per info notice</div>
            </div>
            <input
              type="number"
              step="0.5"
              min="0"
              max="10"
              value={settings.info_weight}
              onChange={(e) =>
                setSettings({ ...settings, info_weight: parseFloat(e.target.value) || 0 })
              }
              className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-slate-100 text-right"
            />
          </div>

          <div className="p-3 bg-slate-950/60 rounded border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-medium text-slate-200">Maintainability Max Deficit</div>
              <div className="text-[11px] text-slate-500">Max points penalized for low MI index</div>
            </div>
            <input
              type="number"
              step="1"
              min="0"
              max="30"
              value={settings.maintainability_weight}
              onChange={(e) =>
                setSettings({ ...settings, maintainability_weight: parseFloat(e.target.value) || 0 })
              }
              className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-slate-100 text-right"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Linters & Privacy */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>3. Engine Integrations &amp; Storage Privacy</span>
        </h4>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 bg-slate-950/60 rounded border border-slate-800 cursor-pointer">
            <div>
              <div className="text-xs font-semibold text-slate-200">Enable Ruff Linter Rules</div>
              <div className="text-[11px] text-slate-500">Runs Ruff static subprocess for advanced PEP 8 rules</div>
            </div>
            <input
              type="checkbox"
              checked={settings.enable_ruff}
              onChange={(e) => setSettings({ ...settings, enable_ruff: e.target.checked })}
              className="rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-slate-950/60 rounded border border-slate-800 cursor-pointer">
            <div>
              <div className="text-xs font-semibold text-slate-200">Enable Bandit Security Analyzer</div>
              <div className="text-[11px] text-slate-500">Scans for insecure cryptographic primitives and unsafe functions</div>
            </div>
            <input
              type="checkbox"
              checked={settings.enable_bandit}
              onChange={(e) => setSettings({ ...settings, enable_bandit: e.target.checked })}
              className="rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-slate-950/60 rounded border border-slate-800 cursor-pointer">
            <div>
              <div className="text-xs font-semibold text-slate-200">Save Source Code in History</div>
              <div className="text-[11px] text-slate-500">
                Opt-in code snapshot saving. When disabled, only findings metadata and metrics are saved to SQLite.
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.store_code_in_history}
              onChange={(e) => setSettings({ ...settings, store_code_in_history: e.target.checked })}
              className="rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0 cursor-pointer"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
