"""
Unit and integration tests for CodePulse static analysis engine.
"""

import pytest
from analyzer.engine import analyze_python_code, apply_code_fix


def test_clean_code_analysis():
    clean_code = '''
def add(a: int, b: int) -> int:
    """Add two integers and return result."""
    return a + b
'''
    result = analyze_python_code(clean_code, "clean.py")
    assert result["has_syntax_error"] is False
    assert result["quality_score"] >= 90
    assert result["grade"] in ("A", "A+")
    assert result["issue_counts"]["total"] == 0


def test_syntax_error_detection():
    broken_code = '''
def broken_fn(x, y)
    return x + y
'''
    result = analyze_python_code(broken_code, "broken.py")
    assert result["has_syntax_error"] is True
    assert result["quality_score"] <= 20
    assert result["grade"] == "F"
    assert any(f["rule_id"] == "CP-SYN-001" for f in result["findings"])


def test_empty_code_analysis():
    result = analyze_python_code("", "empty.py")
    assert result["has_syntax_error"] is False
    assert result["quality_score"] == 100
    assert result["metrics"]["total_lines"] == 0


def test_unused_import_and_mutable_defaults():
    code_with_issues = '''
import math
import sys

def collect_data(item, cache=[]):
    """Collect item into cache."""
    cache.append(item)
    return cache
'''
    result = analyze_python_code(code_with_issues, "issues.py")
    rule_ids = [f["rule_id"] for f in result["findings"]]
    assert "CP-IMP-001" in rule_ids  # unused math / sys
    assert "CP-SEC-002" in rule_ids  # mutable default


def test_broad_exception_and_unreachable_code():
    code = '''
def risky_action():
    """Execute risky operation."""
    try:
        return 42
        print("Unreachable")
    except:
        return 0
'''
    result = analyze_python_code(code, "risky.py")
    rule_ids = [f["rule_id"] for f in result["findings"]]
    assert "CP-EXC-001" in rule_ids
    assert "CP-RCH-001" in rule_ids


def test_cyclomatic_complexity_calculation():
    complex_fn = '''
def complex_branching(a, b, c, d):
    """High branch count function."""
    if a:
        if b:
            if c:
                if d:
                    return 1
    elif b:
        return 2
    elif c:
        return 3
    return 0
'''
    result = analyze_python_code(complex_fn, "complex.py")
    funcs = result["metrics"]["functions"]
    assert len(funcs) == 1
    assert funcs[0]["cyclomatic_complexity"] >= 6


def test_deterministic_autofix():
    code = "import math\n\ndef run():\n    return 1"
    success, fixed_code, msg = apply_code_fix(code, "CP-IMP-001", line=1)
    assert success is True
    assert "import math" not in fixed_code
    assert "def run" in fixed_code
