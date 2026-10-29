/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  HelpCircle,
  Terminal,
  Book,
  Code2,
  Cpu,
  Layers,
  Copy,
  Check,
} from 'lucide-react';

export const HelpDocsView: React.FC = () => {
  const [copiedCurl, setCopiedCurl] = useState<string | null>(null);

  const curlExample = `curl -X POST http://localhost:3000/api/analyze \\
  -H "Content-Type: application/json" \\
  -d '{
    "code": "def greet(name):\\n    return f\\"Hello {name}\\"",
    "filename": "hello.py"
  }'`;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCurl(id);
    setTimeout(() => setCopiedCurl(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl text-xs text-slate-300">
      {/* Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-2">
          <Book className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-semibold text-slate-100">
            CodePulse Documentation &amp; Technical Architecture
          </h3>
        </div>
        <p className="text-slate-400 leading-relaxed">
          CodePulse is an engineering-grade Python static code analyzer designed for student portfolio demonstrations, technical interviews, and automated code health review. It runs completely offline using Python AST, Radon, and Ruff without requiring paid external API subscriptions.
        </p>
      </div>

      {/* Metrics Explanation */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-purple-400" />
          <span>Core Engineering Metrics</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 bg-slate-950/60 rounded border border-slate-800 space-y-2">
            <div className="font-semibold text-slate-200 text-xs">
              Cyclomatic Complexity (McCabe)
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Measures the number of linearly independent paths through program source code. Starts at 1 and increments on every branching construct: if, elif, for, while, except, with, and boolean operators.
            </p>
            <div className="text-[10px] font-mono text-slate-500">
              CC &le; 5: Simple &middot; CC 6-10: Moderate &middot; CC &gt; 10: Refactor
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded border border-slate-800 space-y-2">
            <div className="font-semibold text-slate-200 text-xs">
              Maintainability Index (SEI / Radon)
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Calculates ease of maintaining code based on Halstead Volume (V), Cyclomatic Complexity (CC), and Source Lines of Code (LOC):
            </p>
            <div className="p-2 bg-slate-900 rounded font-mono text-[10px] text-emerald-400">
              MI = 171 - 5.2&times;ln(V) - 0.23&times;CC - 16.2&times;ln(LOC)
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded border border-slate-800 space-y-2">
            <div className="font-semibold text-slate-200 text-xs">
              Transparent Quality Score (0-100)
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Base score of 100 with weighted deductions for errors (default -18), warnings (default -4.5), complexity spikes, and low maintainability indices.
            </p>
            <div className="text-[10px] font-mono text-sky-400">
              90-100: Excellent &middot; 75-89: Good &middot; &lt;60: Attention
            </div>
          </div>
        </div>
      </div>

      {/* REST API Endpoints */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>REST API Endpoints Specification</span>
        </h4>

        <div className="space-y-3 font-mono text-[11px]">
          <div className="p-3 bg-slate-950/80 rounded border border-slate-800 flex items-start justify-between">
            <div>
              <span className="text-emerald-400 font-bold mr-2">POST</span>
              <span className="text-slate-200">/api/analyze</span>
              <p className="text-slate-500 font-sans text-xs mt-1">
                Executes static analysis, computing complexity, findings, and scoring breakdown.
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-950/80 rounded border border-slate-800 flex items-start justify-between">
            <div>
              <span className="text-sky-400 font-bold mr-2">GET</span>
              <span className="text-slate-200">/api/dashboard/stats</span>
              <p className="text-slate-500 font-sans text-xs mt-1">
                Returns real aggregated stats from SQLite database.
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-950/80 rounded border border-slate-800 flex items-start justify-between">
            <div>
              <span className="text-sky-400 font-bold mr-2">GET</span>
              <span className="text-slate-200">/api/history</span>
              <p className="text-slate-500 font-sans text-xs mt-1">
                Lists recent saved reports with search query support (?search=query).
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-950/80 rounded border border-slate-800 flex items-start justify-between">
            <div>
              <span className="text-sky-400 font-bold mr-2">GET</span>
              <span className="text-slate-200">/api/export/:id/:format</span>
              <p className="text-slate-500 font-sans text-xs mt-1">
                Exports analysis report in json, csv (formula-sanitized), or standalone HTML format.
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-950/80 rounded border border-slate-800 flex items-start justify-between">
            <div>
              <span className="text-emerald-400 font-bold mr-2">POST</span>
              <span className="text-slate-200">/api/autofix</span>
              <p className="text-slate-500 font-sans text-xs mt-1">
                Applies deterministic, verified code repair for safe rules (e.g. unused imports, mutable defaults).
              </p>
            </div>
          </div>
        </div>

        {/* cURL Example */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1">
            <span>Example cURL Command</span>
            <button
              onClick={() => handleCopy(curlExample, 'curl1')}
              className="flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors"
            >
              {copiedCurl === 'curl1' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCurl === 'curl1' ? 'Copied' : 'Copy cURL'}</span>
            </button>
          </div>
          <pre className="p-3 bg-slate-950 rounded border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto whitespace-pre">
            {curlExample}
          </pre>
        </div>
      </div>
    </div>
  );
};
