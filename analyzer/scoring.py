"""
Transparent Quality Scoring Algorithm for CodePulse.
Calculates a 0-100 score with complete factor breakdowns, weights, and rating bands.
"""

from typing import Dict, Any, List

DEFAULT_SCORING_WEIGHTS = {
    "error_weight": 18.0,
    "warning_weight": 4.5,
    "info_weight": 1.0,
    "complexity_weight": 12.0,
    "maintainability_weight": 15.0,
}

def calculate_quality_score(
    findings: List[Dict[str, Any]],
    metrics: Dict[str, Any],
    has_syntax_error: bool = False,
    weights: Dict[str, float] = None,
) -> Dict[str, Any]:
    """
    Computes quality score out of 100 with comprehensive transparency breakdown.
    
    Formula:
    Score = Base(100) - Deductions
    Deductions = Issue Penalties + Complexity Penalty + Maintainability Deficit
    """
    cfg = {**DEFAULT_SCORING_WEIGHTS, **(weights or {})}
    
    total_lines = metrics.get("total_lines", 0)
    sloc = metrics.get("sloc", 0)
    
    # Handle empty or zero-code cases cleanly
    if total_lines == 0 or sloc == 0:
        return {
            "score": 100 if total_lines == 0 else 95,
            "grade": "A+",
            "rating": "Excellent",
            "summary": "Clean or empty source file without executable statements.",
            "breakdown": {
                "base_score": 100,
                "error_deductions": 0.0,
                "warning_deductions": 0.0,
                "info_deductions": 0.0,
                "complexity_deduction": 0.0,
                "maintainability_deduction": 0.0,
                "total_deductions": 0.0,
            },
            "formula_explanation": "Base score 100 with no issue deductions for empty/comment-only file.",
        }

    # Handle syntax error: instant severe cap
    if has_syntax_error:
        return {
            "score": 15,
            "grade": "F",
            "rating": "Requires attention",
            "summary": "Critical syntax error prevented AST compilation and execution.",
            "breakdown": {
                "base_score": 100,
                "error_deductions": 85.0,
                "warning_deductions": 0.0,
                "info_deductions": 0.0,
                "complexity_deduction": 0.0,
                "maintainability_deduction": 0.0,
                "total_deductions": 85.0,
            },
            "formula_explanation": "Syntax errors invalidate the code structure, reducing quality score to 15.",
        }

    # Count issues by severity
    errors_count = sum(1 for f in findings if f.get("severity") == "error")
    warnings_count = sum(1 for f in findings if f.get("severity") == "warning")
    infos_count = sum(1 for f in findings if f.get("severity") == "information")

    # Issue deductions with sub-linear damping for high counts to avoid negative runaway
    error_deduction = min(50.0, errors_count * cfg["error_weight"])
    warning_deduction = min(35.0, warnings_count * cfg["warning_weight"])
    info_deduction = min(15.0, infos_count * cfg["info_weight"])

    # Complexity penalty
    avg_cc = metrics.get("average_cyclomatic_complexity", 1.0)
    max_cc = metrics.get("max_cyclomatic_complexity", 1)
    
    complexity_deduction = 0.0
    if avg_cc > 5.0:
        complexity_deduction += min(8.0, (avg_cc - 5.0) * 1.5)
    if max_cc > 10:
        complexity_deduction += min(7.0, (max_cc - 10) * 0.8)
    complexity_deduction = min(cfg["complexity_weight"], complexity_deduction)

    # Maintainability deficit
    # MI ranges 0-100. If MI is 80+, deduction is 0. If MI drops below 80, penalize proportionally.
    mi = metrics.get("maintainability_index", 100.0)
    maintainability_deduction = 0.0
    if mi < 80.0:
        maintainability_deduction = min(cfg["maintainability_weight"], (80.0 - mi) * (cfg["maintainability_weight"] / 80.0))

    total_deductions = round(
        error_deduction + warning_deduction + info_deduction + complexity_deduction + maintainability_deduction,
        1
    )
    final_score = round(max(0.0, min(100.0, 100.0 - total_deductions)), 1)

    # Grade and rating mapping
    if final_score >= 90.0:
        grade = "A+" if final_score >= 95 else "A"
        rating = "Excellent"
        summary = "Outstanding code quality with clean architecture and minimal defects."
    elif final_score >= 75.0:
        grade = "B"
        rating = "Good"
        summary = "Solid code health with a few minor style or structure improvements recommended."
    elif final_score >= 60.0:
        grade = "C"
        rating = "Needs improvement"
        summary = "Moderate technical debt or complexity bottlenecks identified."
    else:
        grade = "D" if final_score >= 45 else "F"
        rating = "Requires attention"
        summary = "High defect rate, excessive complexity, or security risks present."

    return {
        "score": final_score,
        "grade": grade,
        "rating": rating,
        "summary": summary,
        "breakdown": {
            "base_score": 100,
            "error_deductions": round(error_deduction, 1),
            "warning_deductions": round(warning_deduction, 1),
            "info_deductions": round(info_deduction, 1),
            "complexity_deduction": round(complexity_deduction, 1),
            "maintainability_deduction": round(maintainability_deduction, 1),
            "total_deductions": total_deductions,
        },
        "formula_explanation": (
            f"Base Score (100) - Errors ({error_deduction:.1f}) - Warnings ({warning_deduction:.1f}) "
            f"- Info ({info_deduction:.1f}) - Complexity ({complexity_deduction:.1f}) - Maintainability Deficit ({maintainability_deduction:.1f}) = {final_score}"
        ),
    }
