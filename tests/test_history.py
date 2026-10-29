"""
Unit tests for SQLite analysis persistence, history retrieval, and dashboard stats.
"""

from database.models import (
    init_db,
    save_analysis,
    get_analysis,
    list_analyses,
    delete_analysis,
    clear_history,
    get_dashboard_stats,
    get_settings,
    update_settings,
)


def test_sqlite_history_lifecycle():
    init_db()
    clear_history()

    sample_analysis = {
        "filename": "pipeline_test.py",
        "quality_score": 88.5,
        "grade": "B",
        "rating": "Good",
        "issue_counts": {
            "total": 3,
            "by_severity": {"error": 0, "warning": 2, "information": 1},
        },
        "metrics": {
            "total_lines": 45,
            "sloc": 32,
            "average_cyclomatic_complexity": 3.2,
            "max_cyclomatic_complexity": 6,
            "maintainability_index": 78.0,
        },
        "findings": [
            {"finding_id": "CP-IMP-001:1:0", "rule_id": "CP-IMP-001", "severity": "warning", "line": 1}
        ],
        "scoring_breakdown": {"base_score": 100, "total_deductions": 11.5},
    }

    # 1. Save analysis
    analysis_id = save_analysis(sample_analysis, source_code="import os\nprint(1)", store_code=True)
    assert analysis_id is not None
    assert len(analysis_id) > 10

    # 2. Retrieve analysis
    record = get_analysis(analysis_id)
    assert record is not None
    assert record["filename"] == "pipeline_test.py"
    assert record["quality_score"] == 88.5
    assert record["source_code"] == "import os\nprint(1)"
    assert len(record["findings"]) == 1

    # 3. List analyses
    listing = list_analyses(limit=10)
    assert len(listing) >= 1
    assert any(item["id"] == analysis_id for item in listing)

    # 4. Search analyses
    matched = list_analyses(search="pipeline_test")
    assert len(matched) >= 1
    unmatched = list_analyses(search="nonexistent_module_xyz")
    assert len(unmatched) == 0

    # 5. Dashboard stats
    stats = get_dashboard_stats()
    assert stats["total_analyzed"] >= 1
    assert stats["avg_quality_score"] > 0

    # 6. Delete analysis
    deleted = delete_analysis(analysis_id)
    assert deleted is True
    assert get_analysis(analysis_id) is None


def test_settings_persistence():
    init_db()
    curr = get_settings()
    assert "max_cyclomatic_complexity" in curr

    updated = update_settings({"max_cyclomatic_complexity": 15})
    assert updated["max_cyclomatic_complexity"] == 15

    # Re-fetch from DB
    refetched = get_settings()
    assert refetched["max_cyclomatic_complexity"] == 15
