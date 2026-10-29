/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  Upload,
  Copy,
  Trash2,
  Play,
  Check,
  FileCode,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';

interface CodeEditorProps {
  code: string;
  onChangeCode: (newCode: string) => void;
  filename: string;
  onChangeFilename: (name: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  onLoadSample: (sampleKey: string) => void;
  hasUnsavedChanges: boolean;
  onResetUnsavedChanges: () => void;
  highlightedLine?: number | null;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChangeCode,
  filename,
  onChangeFilename,
  onAnalyze,
  isAnalyzing,
  onLoadSample,
  hasUnsavedChanges,
  onResetUnsavedChanges,
  highlightedLine,
}) => {
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const lines = code.split('\n');
  const lineCount = lines.length;
  const charCount = code.length;
  const byteSize = new Blob([code]).size;
  const isOverSizeLimit = byteSize > 1024 * 1024;

  // Handle Tab key indentation (4 spaces)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      onChangeCode(newCode);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const promptDiscardIfDirty = (action: () => void) => {
    if (hasUnsavedChanges && code.trim().length > 50) {
      setPendingAction(() => action);
      setShowDiscardConfirm(true);
    } else {
      action();
    }
  };

  const handleClear = () => {
    promptDiscardIfDirty(() => {
      onChangeCode('');
      onChangeFilename('untitled.py');
      onResetUnsavedChanges();
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.py')) {
      setErrorMsg('Only Python (.py) source files are supported.');
      return;
    }

    if (file.size > 1024 * 1024) {
      setErrorMsg('File exceeds 1MB limit. Please upload a smaller module.');
      return;
    }

    promptDiscardIfDirty(() => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        onChangeCode(content);
        onChangeFilename(file.name);
        setErrorMsg(null);
        onResetUnsavedChanges();
      };
      reader.onerror = () => {
        setErrorMsg('Failed to read the file.');
      };
      reader.readAsText(file);
    });

    // Reset input
    e.target.value = '';
  };

  // Scroll to highlighted line when requested
  useEffect(() => {
    if (highlightedLine && textareaRef.current) {
      const lineHeight = 20; // approximate
      textareaRef.current.scrollTop = Math.max(0, (highlightedLine - 3) * lineHeight);
    }
  }, [highlightedLine]);

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-lg">
      {/* Editor Toolbar */}
      <div className="h-12 px-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-4">
        {/* Left: File input name & sample selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-slate-300 font-mono">
            <FileCode className="w-3.5 h-3.5 text-sky-400" />
            <input
              type="text"
              value={filename}
              onChange={(e) => onChangeFilename(e.target.value)}
              className="bg-transparent border-none focus:outline-none w-32 font-mono text-slate-200"
              placeholder="filename.py"
            />
          </div>

          <div className="relative">
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  const val = e.target.value;
                  promptDiscardIfDirty(() => onLoadSample(val));
                  e.target.value = '';
                }
              }}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 rounded cursor-pointer transition-colors focus:outline-none"
            >
              <option value="" disabled>
                Load Sample Code...
              </option>
              <option value="clean">01. Clean Code (PEP 8 Baseline)</option>
              <option value="issues">02. Typical Issues (Junior Code)</option>
              <option value="complex">03. Complex Legacy (High Complexity)</option>
              <option value="security">04. Security Risks (eval, mutable defaults)</option>
            </select>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".py"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded transition-colors cursor-pointer"
            title="Upload .py file"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>

          <button
            onClick={handleCopy}
            disabled={!code}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded transition-colors disabled:opacity-40 cursor-pointer"
            title="Copy code to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleClear}
            disabled={!code}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-rose-400 hover:text-rose-300 bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900/50 rounded transition-colors disabled:opacity-40 cursor-pointer"
            title="Clear editor"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Error alert banner */}
      {errorMsg && (
        <div className="px-4 py-2 bg-rose-950/60 border-b border-rose-900/60 text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-rose-200">
            &times;
          </button>
        </div>
      )}

      {/* Discard confirmation modal */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-sm w-full p-5 shadow-2xl">
            <h4 className="text-sm font-semibold text-slate-100 mb-2">Discard Unsaved Changes?</h4>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              You have modified code in the editor that has not been re-analyzed. Loading new code or clearing will replace it.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowDiscardConfirm(false);
                  setPendingAction(null);
                }}
                className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (pendingAction) pendingAction();
                  setShowDiscardConfirm(false);
                  setPendingAction(null);
                }}
                className="px-3 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded"
              >
                Discard &amp; Replace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Code Editor Body: Line Numbers + Textarea */}
      <div className="relative flex-1 flex overflow-hidden font-mono text-xs leading-5">
        {/* Line Numbers Gutter */}
        <div className="w-12 bg-slate-950/60 border-r border-slate-800 py-3 select-none text-right pr-3 text-slate-600 shrink-0 overflow-hidden">
          {Array.from({ length: Math.max(lineCount, 1) }).map((_, idx) => {
            const lineNum = idx + 1;
            const isTarget = highlightedLine === lineNum;
            return (
              <div
                key={lineNum}
                className={`${isTarget ? 'text-sky-400 font-bold bg-sky-950/40 -mr-3 pr-3' : ''}`}
              >
                {lineNum}
              </div>
            );
          })}
        </div>

        {/* Textarea Input */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onChangeCode(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="# Paste or type Python code here to analyze...&#10;&#10;def calculate_metrics(items):&#10;    total = sum(items)&#10;    return total&#10;"
          spellCheck={false}
          className="flex-1 p-3 bg-slate-900 text-slate-200 resize-none focus:outline-none overflow-auto font-mono whitespace-pre leading-5"
        />
      </div>

      {/* Editor Status Bar */}
      <div className="h-8 px-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <div className="flex items-center gap-4">
          <span>Python 3.10+</span>
          <span aria-hidden="true">&middot;</span>
          <span>
            {lineCount} {lineCount === 1 ? 'line' : 'lines'}
          </span>
          <span aria-hidden="true">&middot;</span>
          <span>{charCount} chars</span>
          <span aria-hidden="true">&middot;</span>
          <span className={isOverSizeLimit ? 'text-rose-400 font-semibold' : ''}>
            {(byteSize / 1024).toFixed(1)} KB / 1024 KB
          </span>
        </div>

        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <span className="text-amber-400 font-medium">Unanalyzed changes</span>
          )}
          <span className="text-slate-600">UTF-8 &middot; Tab: 4 spaces</span>
        </div>
      </div>
    </div>
  );
};
