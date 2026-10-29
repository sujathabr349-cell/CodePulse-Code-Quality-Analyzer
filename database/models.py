"""
SQLite persistence for CodePulse analysis history, reports, and configurable settings.
Uses parameterized queries to prevent SQL injection and ensures data safety.
"""

import sqlite3
import json
import os
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

DB_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "codepulse.db")


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize SQLite tables for analyses and settings."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS analyses (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        created_at TEXT NOT NULL,
        quality_score REAL NOT NULL,
        grade TEXT NOT NULL,
        rating TEXT NOT NULL,
        total_issues INTEGER NOT NULL,
        errors_count INTEGER NOT NULL,
        warnings_count INTEGER NOT NULL,
        infos_count INTEGER NOT NULL,
        cyclomatic_complexity REAL NOT NULL,
        maintainability_index REAL NOT NULL,
        sloc INTEGER NOT NULL,
        source_code TEXT,
        metrics_json TEXT NOT NULL,
        findings_json TEXT NOT NULL,
        scoring_breakdown_json TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );
    """)

    conn.commit()
    conn.close()


def save_analysis(
    analysis_data: Dict[str, Any],
    source_code: Optional[str] = None,
    store_code: bool = True
) -> str:
    """Save an analysis report to SQLite history."""
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    analysis_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()

    metrics = analysis_data.get("metrics", {})
    issue_counts = analysis_data.get("issue_counts", {})
    by_sev = issue_counts.get("by_severity", {})

    cursor.execute("""
    INSERT INTO analyses (
        id, filename, created_at, quality_score, grade, rating,
        total_issues, errors_count, warnings_count, infos_count,
        cyclomatic_complexity, maintainability_index, sloc,
        source_code, metrics_json, findings_json, scoring_breakdown_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        analysis_id,
        analysis_data.get("filename", "snippet.py"),
        now_iso,
        float(analysis_data.get("quality_score", 0.0)),
        analysis_data.get("grade", "N/A"),
        analysis_data.get("rating", "N/A"),
        int(issue_counts.get("total", 0)),
        int(by_sev.get("error", 0)),
        int(by_sev.get("warning", 0)),
        int(by_sev.get("information", 0)),
        float(metrics.get("average_cyclomatic_complexity", 1.0)),
        float(metrics.get("maintainability_index", 100.0)),
        int(metrics.get("sloc", 0)),
        source_code if store_code else None,
        json.dumps(metrics),
        json.dumps(analysis_data.get("findings", [])),
        json.dumps(analysis_data.get("scoring_breakdown", {})),
    ))

    conn.commit()
    conn.close()
    return analysis_id


def get_analysis(analysis_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve full analysis report by ID."""
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM analyses WHERE id = ?;", (analysis_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    return {
        "id": row["id"],
        "filename": row["filename"],
        "created_at": row["created_at"],
        "quality_score": row["quality_score"],
        "grade": row["grade"],
        "rating": row["rating"],
        "issue_counts": {
            "total": row["total_issues"],
            "by_severity": {
                "error": row["errors_count"],
                "warning": row["warnings_count"],
                "information": row["infos_count"],
            },
        },
        "cyclomatic_complexity": row["cyclomatic_complexity"],
        "maintainability_index": row["maintainability_index"],
        "sloc": row["sloc"],
        "source_code": row["source_code"],
        "metrics": json.loads(row["metrics_json"]),
        "findings": json.loads(row["findings_json"]),
        "scoring_breakdown": json.loads(row["scoring_breakdown_json"]),
    }


def list_analyses(limit: int = 50, search: str = "") -> List[Dict[str, Any]]:
    """List recent analysis history records."""
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
    SELECT id, filename, created_at, quality_score, grade, rating,
           total_issues, errors_count, warnings_count, infos_count,
           cyclomatic_complexity, maintainability_index, sloc
    FROM analyses
    """
    params: List[Any] = []

    if search.strip():
        query += " WHERE filename LIKE ? OR rating LIKE ?"
        params.extend([f"%{search}%", f"%{search}%"])

    query += " ORDER BY created_at DESC LIMIT ?;"
    params.append(limit)

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    results = []
    for r in rows:
        results.append({
            "id": r["id"],
            "filename": r["filename"],
            "created_at": r["created_at"],
            "quality_score": r["quality_score"],
            "grade": r["grade"],
            "rating": r["rating"],
            "total_issues": r["total_issues"],
            "errors_count": r["errors_count"],
            "warnings_count": r["warnings_count"],
            "infos_count": r["infos_count"],
            "cyclomatic_complexity": r["cyclomatic_complexity"],
            "maintainability_index": r["maintainability_index"],
            "sloc": r["sloc"],
        })
    return results


def delete_analysis(analysis_id: str) -> bool:
    """Delete an analysis report from database."""
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM analyses WHERE id = ?;", (analysis_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted


def clear_history() -> int:
    """Clear all analysis records from history."""
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM analyses;")
    count = cursor.rowcount
    conn.commit()
    conn.close()
    return count


def get_dashboard_stats() -> Dict[str, Any]:
    """Calculate aggregate dashboard statistics computed from real SQLite records."""
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT COUNT(*) as total_analyzed,
           COALESCE(AVG(quality_score), 0) as avg_quality_score,
           COALESCE(SUM(total_issues), 0) as total_issues,
           COALESCE(SUM(errors_count), 0) as total_errors,
           COALESCE(SUM(warnings_count), 0) as total_warnings,
           COALESCE(SUM(infos_count), 0) as total_infos,
           COALESCE(AVG(cyclomatic_complexity), 0) as avg_complexity,
           COALESCE(AVG(maintainability_index), 0) as avg_maintainability
    FROM analyses;
    """)
    stats_row = cursor.fetchone()

    # Recent history for trend
    cursor.execute("""
    SELECT id, filename, created_at, quality_score, total_issues, cyclomatic_complexity
    FROM analyses
    ORDER BY created_at ASC
    LIMIT 20;
    """)
    trend_rows = cursor.fetchall()
    conn.close()

    total_analyzed = stats_row["total_analyzed"] if stats_row else 0

    return {
        "total_analyzed": total_analyzed,
        "avg_quality_score": round(stats_row["avg_quality_score"], 1) if stats_row else 0.0,
        "total_issues": stats_row["total_issues"] if stats_row else 0,
        "total_errors": stats_row["total_errors"] if stats_row else 0,
        "total_warnings": stats_row["total_warnings"] if stats_row else 0,
        "total_infos": stats_row["total_infos"] if stats_row else 0,
        "avg_complexity": round(stats_row["avg_complexity"], 1) if stats_row else 0.0,
        "avg_maintainability": round(stats_row["avg_maintainability"], 1) if stats_row else 0.0,
        "trend_data": [
            {
                "id": r["id"],
                "filename": r["filename"],
                "created_at": r["created_at"],
                "quality_score": r["quality_score"],
                "total_issues": r["total_issues"],
                "cyclomatic_complexity": r["cyclomatic_complexity"],
            }
            for r in trend_rows
        ],
    }


DEFAULT_APP_SETTINGS = {
    "max_cyclomatic_complexity": "10",
    "max_function_length": "35",
    "max_nesting_depth": "3",
    "enable_ruff": "true",
    "enable_bandit": "true",
    "error_weight": "18.0",
    "warning_weight": "4.5",
    "info_weight": "1.0",
    "complexity_weight": "12.0",
    "maintainability_weight": "15.0",
    "store_code_in_history": "true",
}


def get_settings() -> Dict[str, Any]:
    """Retrieve application settings."""
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT key, value FROM settings;")
    rows = cursor.fetchall()
    conn.close()

    settings_dict = dict(DEFAULT_APP_SETTINGS)
    for r in rows:
        settings_dict[r["key"]] = r["value"]

    # Convert numeric and boolean types
    parsed: Dict[str, Any] = {}
    for k, v in settings_dict.items():
        if v.lower() in ("true", "false"):
            parsed[k] = v.lower() == "true"
        elif v.replace(".", "", 1).isdigit():
            parsed[k] = float(v) if "." in v else int(v)
        else:
            parsed[k] = v
    return parsed


def update_settings(new_settings: Dict[str, Any]) -> Dict[str, Any]:
    """Persist updated settings after validation."""
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    for k, v in new_settings.items():
        str_val = str(v).lower() if isinstance(v, bool) else str(v)
        cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?);", (k, str_val))

    conn.commit()
    conn.close()
    return get_settings()
