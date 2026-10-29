"""
Export generators for JSON, CSV (with formula injection defense), and standalone HTML reports.
"""

import csv
import io
import html
from typing import Dict, Any, List


def sanitize_csv_cell(value: Any) -> str:
    """
    Prevent Spreadsheet Formula Injection (CSV Injection).
    If a cell starts with =, +, -, @, \t, \r, prefix with a single quote.
    """
    s = str(value) if value is not None else ""
    if s and s[0] in ("=", "+", "-", "@", "\t", "\r"):
        return f"'{s}"
    return s


def generate_csv_report(analysis: Dict[str, Any]) -> str:
    """Generate safe CSV export of findings and metrics."""
    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

    # Header section
    writer.writerow(["CodePulse Static Analysis Report"])
    writer.writerow(["File Name", sanitize_csv_cell(analysis.get("filename", "snippet.py"))])
    writer.writerow(["Quality Score", sanitize_csv_cell(analysis.get("quality_score", 0))])
    writer.writerow(["Grade", sanitize_csv_cell(analysis.get("grade", "N/A"))])
    writer.writerow(["Rating", sanitize_csv_cell(analysis.get("rating", "N/A"))])
    writer.writerow(["Analysis Timestamp", sanitize_csv_cell(analysis.get("created_at", ""))])
    writer.writerow([])

    # Metrics Summary
    metrics = analysis.get("metrics", {})
    writer.writerow(["METRICS SUMMARY"])
    writer.writerow(["Total Lines", sanitize_csv_cell(metrics.get("total_lines", 0))])
    writer.writerow(["Source Lines of Code (SLOC)", sanitize_csv_cell(metrics.get("sloc", 0))])
    writer.writerow(["Comment Lines", sanitize_csv_cell(metrics.get("comment_lines", 0))])
    writer.writerow(["Blank Lines", sanitize_csv_cell(metrics.get("blank_lines", 0))])
    writer.writerow(["Total Functions", sanitize_csv_cell(metrics.get("functions_count", 0))])
    writer.writerow(["Average Cyclomatic Complexity", sanitize_csv_cell(metrics.get("average_cyclomatic_complexity", 1.0))])
    writer.writerow(["Max Cyclomatic Complexity", sanitize_csv_cell(metrics.get("max_cyclomatic_complexity", 1))])
    writer.writerow(["Maintainability Index (0-100)", sanitize_csv_cell(metrics.get("maintainability_index", 100))])
    writer.writerow(["Maintainability Grade", sanitize_csv_cell(metrics.get("mi_grade", "A"))])
    writer.writerow([])

    # Findings Table
    writer.writerow([
        "Finding ID",
        "Rule ID",
        "Severity",
        "Category",
        "Title",
        "Line",
        "Column",
        "Explanation",
        "Recommendation",
        "Source Tool",
    ])

    for f in analysis.get("findings", []):
        writer.writerow([
            sanitize_csv_cell(f.get("finding_id", "")),
            sanitize_csv_cell(f.get("rule_id", "")),
            sanitize_csv_cell(f.get("severity", "")),
            sanitize_csv_cell(f.get("category", "")),
            sanitize_csv_cell(f.get("title", "")),
            sanitize_csv_cell(f.get("line", "")),
            sanitize_csv_cell(f.get("col", "")),
            sanitize_csv_cell(f.get("message", "")),
            sanitize_csv_cell(f.get("recommendation", "")),
            sanitize_csv_cell(f.get("source", "CodePulse")),
        ])

    return output.getvalue()


def generate_html_report(analysis: Dict[str, Any]) -> str:
    """
    Generate an offline, production-grade HTML report with dark navy aesthetics,
    metrics breakdown, and findings table.
    """
    filename = html.escape(str(analysis.get("filename", "snippet.py")))
    score = analysis.get("quality_score", 0)
    grade = html.escape(str(analysis.get("grade", "N/A")))
    rating = html.escape(str(analysis.get("rating", "N/A")))
    created_at = html.escape(str(analysis.get("created_at", "Just now")))
    summary = html.escape(str(analysis.get("summary", "Analysis completed.")))
    formula = html.escape(str(analysis.get("formula_explanation", "")))

    metrics = analysis.get("metrics", {})
    sloc = metrics.get("sloc", 0)
    total_lines = metrics.get("total_lines", 0)
    functions_count = metrics.get("functions_count", 0)
    avg_cc = metrics.get("average_cyclomatic_complexity", 1.0)
    max_cc = metrics.get("max_cyclomatic_complexity", 1)
    mi = metrics.get("maintainability_index", 100.0)
    mi_grade = html.escape(str(metrics.get("mi_grade", "A")))

    findings = analysis.get("findings", [])
    issue_counts = analysis.get("issue_counts", {})
    by_sev = issue_counts.get("by_severity", {})

    errors = by_sev.get("error", 0)
    warnings = by_sev.get("warning", 0)
    infos = by_sev.get("information", 0)

    # Score color
    score_color = "#10b981" if score >= 90 else ("#3b82f6" if score >= 75 else ("#f59e0b" if score >= 60 else "#ef4444"))

    # Rows for findings
    findings_rows = []
    if not findings:
        findings_rows.append('<tr><td colspan="6" style="padding: 24px; text-align: center; color: #94a3b8;">No issues detected! Clean code report.</td></tr>')
    else:
        for f in findings:
            sev = f.get("severity", "information")
            sev_badge_color = "#ef4444" if sev == "error" else ("#f59e0b" if sev == "warning" else "#3b82f6")
            findings_rows.append(f"""
            <tr style="border-bottom: 1px solid #1e293b;">
                <td style="padding: 12px 16px; font-family: monospace; font-size: 13px; color: #cbd5e1;">{f.get('line', 1)}</td>
                <td style="padding: 12px 16px;">
                    <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; background: {sev_badge_color}22; color: {sev_badge_color}; border: 1px solid {sev_badge_color}44;">
                        {html.escape(sev)}
                    </span>
                </td>
                <td style="padding: 12px 16px; font-family: monospace; font-size: 12px; color: #94a3b8;">{html.escape(f.get('rule_id', ''))}</td>
                <td style="padding: 12px 16px;">
                    <div style="font-weight: 600; color: #f8fafc; margin-bottom: 4px;">{html.escape(f.get('title', ''))}</div>
                    <div style="color: #94a3b8; font-size: 13px;">{html.escape(f.get('message', ''))}</div>
                </td>
                <td style="padding: 12px 16px; font-size: 13px; color: #cbd5e1;">{html.escape(f.get('recommendation', ''))}</td>
                <td style="padding: 12px 16px; font-size: 12px; color: #64748b;">{html.escape(f.get('source', 'CodePulse'))}</td>
            </tr>
            """)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodePulse Report - {filename}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #0b1120;
            color: #f1f5f9;
            margin: 0;
            padding: 32px 24px;
            line-height: 1.5;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
        }}
        .card {{
            background: #0f172a;
            border: 1px solid #1e293b;
            border-radius: 8px;
            padding: 24px;
            margin-bottom: 24px;
        }}
        .grid-4 {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 16px;
        }}
        .stat-label {{
            font-size: 12px;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 4px;
        }}
        .stat-value {{
            font-size: 24px;
            font-weight: 700;
            font-variant-numeric: tabular-nums;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            text-align: left;
        }}
        th {{
            background: #1e293b;
            color: #94a3b8;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 12px 16px;
        }}
        .badge {{
            padding: 4px 10px;
            border-radius: 6px;
            font-weight: bold;
            font-size: 14px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <header style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 20px; margin-bottom: 24px;">
            <div>
                <h1 style="font-size: 24px; margin: 0 0 4px 0; color: #38bdf8;">CodePulse Code Quality Report</h1>
                <div style="color: #94a3b8; font-size: 14px;">File: <strong style="color: #f8fafc;">{filename}</strong> &middot; Generated on {created_at}</div>
            </div>
            <div style="text-align: right;">
                <div class="stat-label">Overall Health Grade</div>
                <div style="font-size: 28px; font-weight: 800; color: {score_color};">{grade} &middot; {score}/100</div>
            </div>
        </header>

        <div class="card" style="border-left: 4px solid {score_color};">
            <h3 style="margin-top: 0; font-size: 16px; color: #e2e8f0;">Quality Executive Summary</h3>
            <p style="margin-bottom: 8px; color: #cbd5e1;">{summary}</p>
            <div style="font-size: 12px; color: #94a3b8; font-family: monospace;">Formula Breakdown: {formula}</div>
        </div>

        <div class="grid-4" style="margin-bottom: 24px;">
            <div class="card">
                <div class="stat-label">Total Issues</div>
                <div class="stat-value" style="color: #f8fafc;">{len(findings)}</div>
                <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">{errors} errors &middot; {warnings} warnings &middot; {infos} info</div>
            </div>
            <div class="card">
                <div class="stat-label">Source Lines (SLOC)</div>
                <div class="stat-value" style="color: #f8fafc;">{sloc}</div>
                <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Out of {total_lines} total lines</div>
            </div>
            <div class="card">
                <div class="stat-label">Avg Complexity</div>
                <div class="stat-value" style="color: #38bdf8;">{avg_cc}</div>
                <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Max: {max_cc} &middot; {functions_count} functions</div>
            </div>
            <div class="card">
                <div class="stat-label">Maintainability Index</div>
                <div class="stat-value" style="color: #10b981;">{mi} / 100</div>
                <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">SEI Maintainability Grade: {mi_grade}</div>
            </div>
        </div>

        <div class="card" style="padding: 0; overflow: hidden;">
            <div style="padding: 16px 20px; border-bottom: 1px solid #1e293b;">
                <h3 style="margin: 0; font-size: 16px;">Detected Findings ({len(findings)})</h3>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Line</th>
                        <th>Severity</th>
                        <th>Rule ID</th>
                        <th>Issue & Description</th>
                        <th>Actionable Recommendation</th>
                        <th>Engine</th>
                    </tr>
                </thead>
                <tbody>
                    {"".join(findings_rows)}
                </tbody>
            </table>
        </div>

        <footer style="margin-top: 32px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 20px;">
            CodePulse Static Analysis Platform &middot; Built with Python AST, Radon &amp; Ruff.
        </footer>
    </div>
</body>
</html>"""
