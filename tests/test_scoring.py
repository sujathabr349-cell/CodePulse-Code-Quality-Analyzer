"""
Unit tests for transparent quality scoring system.
"""

from analyzer.scoring import calculate_quality_score, DEFAULT_SCORING_WEIGHTS


def test_perfect_score_calculation():
    findings = []
    metrics = {
        "total_lines": 20,
        "sloc": 15,
        "average_cyclomatic_complexity": 2.0,
        "max_cyclomatic_complexity": 3,
        "maintainability_index": 92.0,
    }
    result = calculate_quality_score(findings, metrics)
    assert result["score"] == 100.0
    assert result["grade"] == "A+"
    assert result["rating"] == "Excellent"
    assert result["breakdown"]["total_deductions"] == 0.0


def test_syntax_error_severe_cap():
    findings = [{"severity": "error", "rule_id": "CP-SYN-001"}]
    metrics = {"total_lines": 10, "sloc": 8}
    result = calculate_quality_score(findings, metrics, has_syntax_error=True)
    assert result["score"] == 15.0
    assert result["grade"] == "F"
    assert result["rating"] == "Requires attention"


def test_weighted_deductions():
    findings = [
        {"severity": "error", "rule_id": "CP-SEC-001"},
        {"severity": "warning", "rule_id": "CP-IMP-001"},
        {"severity": "information", "rule_id": "CP-DOC-001"},
    ]
    metrics = {
        "total_lines": 50,
        "sloc": 35,
        "average_cyclomatic_complexity": 7.0,
        "max_cyclomatic_complexity": 14,
        "maintainability_index": 65.0,
    }
    result = calculate_quality_score(findings, metrics)
    assert result["score"] < 80.0
    assert result["breakdown"]["error_deductions"] > 0
    assert result["breakdown"]["warning_deductions"] > 0
    assert result["breakdown"]["info_deductions"] > 0
    assert result["breakdown"]["complexity_deduction"] > 0
    assert result["breakdown"]["maintainability_deduction"] > 0
