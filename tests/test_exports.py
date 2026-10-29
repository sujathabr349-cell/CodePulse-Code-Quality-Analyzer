"""
Unit tests for JSON, CSV (with injection protection), and HTML export generation.
"""

from routes.exports import sanitize_csv_cell, generate_csv_report, generate_html_report


def test_csv_injection_sanitization():
    # Cells starting with formula triggers must be sanitized with prepended single quote
    assert sanitize_csv_cell("=1+1") == "'=1+1"
    assert sanitize_csv_cell("+cmd|' /C calc'!A0") == "'+cmd|' /C calc'!A0"
    assert sanitize_csv_cell("-5+2") == "'-5+2"
    assert sanitize_csv_cell("@SUM(A1:A10)") == "'@SUM(A1:A10)"
    assert sanitize_csv_cell("\tTABBED") == "'\tTABBED"
    # Normal content remains unchanged
    assert sanitize_csv_cell("Standard Text") == "Standard Text"
    assert sanitize_csv_cell("def compute():") == "def compute():"


def test_csv_report_generation():
    analysis = {
        "filename": "order_manager.py",
        "quality_score": 92.0,
        "grade": "A",
        "rating": "Excellent",
        "created_at": "2026-10-29T12:00:00Z",
        "metrics": {
            "total_lines": 50,
            "sloc": 40,
            "comment_lines": 5,
            "blank_lines": 5,
            "functions_count": 4,
            "average_cyclomatic_complexity": 2.5,
            "max_cyclomatic_complexity": 4,
            "maintainability_index": 85.0,
            "mi_grade": "A",
        },
        "findings": [
            {
                "finding_id": "CP-DOC-001:10:0",
                "rule_id": "CP-DOC-001",
                "severity": "information",
                "category": "docstrings",
                "title": "Missing Docstring",
                "line": 10,
                "col": 0,
                "message": "Function calculate is missing docstring.",
                "recommendation": "Add a descriptive docstring.",
                "source": "CodePulse AST",
            }
        ],
    }

    csv_content = generate_csv_report(analysis)
    assert "CodePulse Static Analysis Report" in csv_content
    assert "order_manager.py" in csv_content
    assert "CP-DOC-001" in csv_content
    assert "Missing Docstring" in csv_content


def test_html_report_generation():
    analysis = {
        "filename": "report_target.py",
        "quality_score": 78.4,
        "grade": "B",
        "rating": "Good",
        "created_at": "2026-10-29T12:00:00Z",
        "summary": "Solid code health with a few minor style improvements.",
        "formula_explanation": "Base 100 - Warnings (21.6) = 78.4",
        "metrics": {
            "total_lines": 120,
            "sloc": 95,
            "functions_count": 6,
            "average_cyclomatic_complexity": 3.8,
            "max_cyclomatic_complexity": 7,
            "maintainability_index": 72.0,
            "mi_grade": "B",
        },
        "findings": [],
        "issue_counts": {"by_severity": {"error": 0, "warning": 0, "information": 0}},
    }

    html_content = generate_html_report(analysis)
    assert "<!DOCTYPE html>" in html_content
    assert "CodePulse Code Quality Report" in html_content
    assert "report_target.py" in html_content
    assert "78.4" in html_content
