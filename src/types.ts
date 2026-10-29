/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Finding {
  finding_id: string;
  rule_id: string;
  severity: 'error' | 'warning' | 'information';
  category: 'syntax' | 'complexity' | 'code_style' | 'security' | 'maintainability' | 'docstrings';
  title: string;
  message: string;
  explanation: string;
  why_it_matters: string;
  recommendation: string;
  before_example?: string;
  after_example?: string;
  line: number;
  col: number;
  end_line?: number;
  snippet?: string;
  can_autofix?: boolean;
  source: string;
  learning_guide?: LearningGuide;
}

export interface LearningGuide {
  rule_id: string;
  title: string;
  concept: string;
  plain_explanation: string;
  why_it_matters: string;
  common_causes: string[];
  step_by_step_fix: string;
  before_example: string;
  after_example: string;
}

export interface FunctionMetric {
  name: string;
  start_line: number;
  end_line: number;
  loc: number;
  cyclomatic_complexity: number;
  nesting_depth: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  is_async?: boolean;
}

export interface Metrics {
  total_lines: number;
  sloc: number;
  comment_lines: number;
  blank_lines: number;
  classes_count: number;
  functions_count: number;
  total_cyclomatic_complexity: number;
  average_cyclomatic_complexity: number;
  max_cyclomatic_complexity: number;
  maintainability_index: number;
  raw_mi: number;
  mi_grade: string;
  mi_status: string;
  halstead_volume: number;
  functions: FunctionMetric[];
  radon_mi?: number | null;
}

export interface ScoringBreakdown {
  base_score: number;
  error_deductions: number;
  warning_deductions: number;
  info_deductions: number;
  complexity_deduction: number;
  maintainability_deduction: number;
  total_deductions: number;
}

export interface AnalysisResult {
  analysis_id?: string;
  filename: string;
  has_syntax_error: boolean;
  quality_score: number;
  grade: string;
  rating: string;
  summary: string;
  scoring_breakdown: ScoringBreakdown;
  formula_explanation: string;
  issue_counts: {
    total: number;
    by_severity: {
      error: number;
      warning: number;
      information: number;
    };
    by_category: {
      syntax: number;
      complexity: number;
      code_style: number;
      security: number;
      maintainability: number;
      docstrings: number;
    };
  };
  metrics: Metrics;
  findings: Finding[];
  tools_used: {
    python_ast: boolean;
    metrics_engine: boolean;
    ruff: boolean;
    bandit: boolean;
  };
  source_code?: string;
  created_at?: string;
}

export interface HistoryItem {
  id: string;
  filename: string;
  created_at: string;
  quality_score: number;
  grade: string;
  rating: string;
  total_issues: number;
  errors_count: number;
  warnings_count: number;
  infos_count: number;
  cyclomatic_complexity: number;
  maintainability_index: number;
  sloc: number;
}

export interface DashboardStats {
  total_analyzed: number;
  avg_quality_score: number;
  total_issues: number;
  total_errors: number;
  total_warnings: number;
  total_infos: number;
  avg_complexity: number;
  avg_maintainability: number;
  trend_data: Array<{
    id: string;
    filename: string;
    created_at: string;
    quality_score: number;
    total_issues: number;
    cyclomatic_complexity: number;
  }>;
}

export interface ComparisonResult {
  score_comparison: {
    previous_score: number;
    current_score: number;
    score_delta: number;
    improved: boolean;
  };
  issues_comparison: {
    previous_total: number;
    current_total: number;
    new_count: number;
    resolved_count: number;
    persistent_count: number;
    new_findings: Finding[];
    resolved_findings: Finding[];
    persistent_findings: Finding[];
  };
  metrics_comparison: {
    previous_cc: number;
    current_cc: number;
    cc_delta: number;
    previous_mi: number;
    current_mi: number;
    mi_delta: number;
  };
}

export interface AppSettings {
  max_cyclomatic_complexity: number;
  max_function_length: number;
  max_nesting_depth: number;
  enable_ruff: boolean;
  enable_bandit: boolean;
  error_weight: number;
  warning_weight: number;
  info_weight: number;
  complexity_weight: number;
  maintainability_weight: number;
  store_code_in_history: boolean;
  [key: string]: any;
}
