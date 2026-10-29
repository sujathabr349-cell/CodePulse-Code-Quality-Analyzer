/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, NavigationTab } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { CodeEditor } from './components/CodeEditor';
import { QualityScoreCard } from './components/QualityScoreCard';
import { MetricsCards } from './components/MetricsCards';
import { ComplexityBreakdown } from './components/ComplexityBreakdown';
import { FindingsExplorer } from './components/FindingsExplorer';
import { ComparisonView } from './components/ComparisonView';
import { LearningMode } from './components/LearningMode';
import { DashboardView } from './components/DashboardView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { HelpDocsView } from './components/HelpDocsView';
import { AnalysisResult, ComparisonResult } from './types';

const INITIAL_CODE = `import math
import sys

def calculate_discounted_total(price, discount=0.1, tags=[]):
    """Calculate discounted customer total price."""
    unused_calculation = price * 2
    if price < 0:
        return 0.0
    
    total = price * (1.0 - discount)
    tags.append("discounted")
    return round(total, 2)

def process_batch(items):
    # Missing docstring and broad exception handling
    try:
        results = []
        for item in items:
            results.append(calculate_discounted_total(item))
        return results
    except:
        return []
`;

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('analyzer');
  const [code, setCode] = useState<string>(INITIAL_CODE);
  const [filename, setFilename] = useState<string>('order_calculator.py');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);

  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [previousAnalysis, setPreviousAnalysis] = useState<AnalysisResult | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isFixing, setIsFixing] = useState<boolean>(false);
  const [selectedLearningRuleId, setSelectedLearningRuleId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    setHasUnsavedChanges(true);
  };

  const runAnalysis = async (codeToAnalyze = code, fname = filename, saveHistory = true) => {
    try {
      setIsAnalyzing(true);
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeToAnalyze,
          filename: fname,
          save_to_history: saveHistory,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        showToast(err.error || 'Analysis failed.');
        return;
      }

      const result: AnalysisResult = await res.json();

      // If we had a prior analysis, calculate comparison
      if (currentAnalysis) {
        setPreviousAnalysis(currentAnalysis);
        // Compare via backend
        try {
          const compRes = await fetch('/api/compare', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              previous: currentAnalysis,
              current: result,
            }),
          });
          if (compRes.ok) {
            const compData = await compRes.json();
            setComparison(compData);
          }
        } catch {
          // Fallback comparison
        }
      }

      setCurrentAnalysis(result);
      setHasUnsavedChanges(false);
      showToast(`Analysis complete: Score ${result.quality_score}/100 (${result.grade})`);
    } catch {
      showToast('Network error while running code analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Run initial analysis on app load
  useEffect(() => {
    runAnalysis(INITIAL_CODE, 'order_calculator.py', true);
  }, []);

  // Handle deterministic fix application
  const handleApplyFix = async (ruleId: string, line: number) => {
    try {
      setIsFixing(true);
      const res = await fetch('/api/autofix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, rule_id: ruleId, line }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCode(data.updated_code);
          showToast(data.message || 'Fix applied successfully!');
          // Immediately re-run analysis to show updated score and resolved issues
          await runAnalysis(data.updated_code, filename, true);
        } else {
          showToast(data.message || 'Auto-fix not applicable for this rule.');
        }
      }
    } catch {
      showToast('Error applying auto-fix.');
    } finally {
      setIsFixing(false);
    }
  };

  // Load sample code
  const handleLoadSample = async (sampleKey: string) => {
    try {
      const res = await fetch(`/api/samples/${sampleKey}`);
      if (res.ok) {
        const data = await res.json();
        setCode(data.content);
        setFilename(data.filename);
        setHasUnsavedChanges(false);
        setHighlightedLine(null);
        await runAnalysis(data.content, data.filename, true);
        showToast(`Loaded sample: ${data.filename}`);
      }
    } catch {
      showToast('Failed to load sample code.');
    }
  };

  // Navigate to line in editor
  const handleNavigateToLine = (line: number) => {
    setCurrentTab('analyzer');
    setHighlightedLine(line);
    setTimeout(() => setHighlightedLine(null), 3000);
  };

  // Jump to learning mode with specific rule
  const handleOpenLearningGuide = (ruleId: string) => {
    setSelectedLearningRuleId(ruleId);
    setCurrentTab('learning');
  };

  // Load from history into editor
  const handleLoadFromHistory = (sourceCode: string, fname: string) => {
    setCode(sourceCode);
    setFilename(fname);
    setCurrentTab('analyzer');
    runAnalysis(sourceCode, fname, true);
  };

  // Compare two historical reports
  const handleCompareTwoHistorical = async (idA: string, idB: string) => {
    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previous_id: idA, current_id: idB }),
      });
      if (res.ok) {
        const data = await res.json();
        setComparison(data);
        setCurrentTab('compare');
        showToast('Historical comparison ready!');
      }
    } catch {
      showToast('Failed to compare historical reports.');
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-800 text-slate-100 border border-slate-700 px-4 py-2.5 rounded-lg shadow-xl text-xs flex items-center gap-2 animate-fade-in">
          <div className="w-2 h-2 rounded-full bg-sky-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        totalFindingsCount={currentAnalysis?.issue_counts.total || 0}
        qualityScore={currentAnalysis?.quality_score}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navigation */}
        <TopNav
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onRunAnalysis={() => runAnalysis(code, filename, true)}
          isAnalyzing={isAnalyzing}
          filename={filename}
        />

        {/* Viewport Canvas */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950/95">
          {/* TAB 1: CODE ANALYZER (Editor + Live Quality Metrics) */}
          {currentTab === 'analyzer' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Upper Split: Code Editor (Left) & Quality Score + Metrics (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
                {/* Editor Column (7/12) */}
                <div className="lg:col-span-7 h-[580px]">
                  <CodeEditor
                    code={code}
                    onChangeCode={handleCodeChange}
                    filename={filename}
                    onChangeFilename={setFilename}
                    onAnalyze={() => runAnalysis(code, filename, true)}
                    isAnalyzing={isAnalyzing}
                    onLoadSample={handleLoadSample}
                    hasUnsavedChanges={hasUnsavedChanges}
                    onResetUnsavedChanges={() => setHasUnsavedChanges(false)}
                    highlightedLine={highlightedLine}
                  />
                </div>

                {/* Score & Quick Metrics Column (5/12) */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  {currentAnalysis ? (
                    <>
                      <QualityScoreCard
                        score={currentAnalysis.quality_score}
                        grade={currentAnalysis.grade}
                        rating={currentAnalysis.rating}
                        summary={currentAnalysis.summary}
                        breakdown={currentAnalysis.scoring_breakdown}
                        formulaExplanation={currentAnalysis.formula_explanation}
                      />
                      <MetricsCards
                        metrics={currentAnalysis.metrics}
                        issueCounts={currentAnalysis.issue_counts}
                      />
                    </>
                  ) : (
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center text-slate-500 text-xs">
                      Run code analysis to view score breakdown and metrics.
                    </div>
                  )}
                </div>
              </div>

              {/* Lower Section: Findings Explorer & Complexity Tables */}
              {currentAnalysis && (
                <div className="space-y-6 pt-2">
                  <FindingsExplorer
                    findings={currentAnalysis.findings}
                    onApplyFix={handleApplyFix}
                    onNavigateToLine={handleNavigateToLine}
                    onOpenLearningGuide={handleOpenLearningGuide}
                    isFixing={isFixing}
                  />

                  <ComplexityBreakdown
                    functions={currentAnalysis.metrics.functions}
                    onNavigateToLine={handleNavigateToLine}
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DASHBOARD */}
          {currentTab === 'dashboard' && (
            <div className="max-w-7xl mx-auto">
              <DashboardView
                onSelectReport={async (id) => {
                  try {
                    const res = await fetch(`/api/history/${id}`);
                    if (res.ok) {
                      const rep = await res.json();
                      setCurrentAnalysis(rep);
                      if (rep.source_code) setCode(rep.source_code);
                      setFilename(rep.filename);
                      setCurrentTab('analyzer');
                    }
                  } catch {}
                }}
                onGoToEditor={() => setCurrentTab('analyzer')}
              />
            </div>
          )}

          {/* TAB 3: DEDICATED FINDINGS EXPLORER */}
          {currentTab === 'findings' && (
            <div className="max-w-7xl mx-auto">
              {currentAnalysis ? (
                <FindingsExplorer
                  findings={currentAnalysis.findings}
                  onApplyFix={handleApplyFix}
                  onNavigateToLine={handleNavigateToLine}
                  onOpenLearningGuide={handleOpenLearningGuide}
                  isFixing={isFixing}
                />
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center text-xs text-slate-500">
                  No analysis active. Please analyze a Python module in the editor first.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: BEFORE & AFTER COMPARISON */}
          {currentTab === 'compare' && (
            <div className="max-w-7xl mx-auto">
              <ComparisonView
                comparison={comparison}
                onNavigateToLine={handleNavigateToLine}
              />
            </div>
          )}

          {/* TAB 5: ANALYSIS HISTORY */}
          {currentTab === 'history' && (
            <div className="max-w-7xl mx-auto">
              <HistoryView
                onLoadIntoEditor={handleLoadFromHistory}
                onOpenReport={async (id) => {
                  const res = await fetch(`/api/history/${id}`);
                  if (res.ok) {
                    const data = await res.json();
                    setCurrentAnalysis(data);
                    if (data.source_code) setCode(data.source_code);
                    setFilename(data.filename);
                    setCurrentTab('analyzer');
                  }
                }}
                onCompareTwo={handleCompareTwoHistorical}
              />
            </div>
          )}

          {/* TAB 6: LEARNING MODE TUTOR */}
          {currentTab === 'learning' && (
            <div className="max-w-7xl mx-auto">
              <LearningMode initialRuleId={selectedLearningRuleId} />
            </div>
          )}

          {/* TAB 7: RULE SETTINGS */}
          {currentTab === 'settings' && (
            <div className="max-w-7xl mx-auto">
              <SettingsView />
            </div>
          )}

          {/* TAB 8: DOCUMENTATION & API */}
          {currentTab === 'docs' && (
            <div className="max-w-7xl mx-auto">
              <HelpDocsView />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
