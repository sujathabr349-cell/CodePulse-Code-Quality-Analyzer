"""
Flask REST API routes for analysis history, comparisons, dashboard metrics, and exports.
"""

from flask import Blueprint, request, jsonify, Response
from database.models import (
    list_analyses,
    get_analysis,
    delete_analysis,
    clear_history,
    get_dashboard_stats,
)
from routes.exports import generate_csv_report, generate_html_report

history_bp = Blueprint("history", __name__, url_prefix="/api")


@history_bp.route("/history", methods=["GET"])
def get_history():
    search = request.args.get("search", "")
    limit = int(request.args.get("limit", 50))
    analyses = list_analyses(limit=limit, search=search)
    return jsonify({"history": analyses}), 200


@history_bp.route("/history/<analysis_id>", methods=["GET"])
def get_single_analysis(analysis_id):
    analysis = get_analysis(analysis_id)
    if not analysis:
        return jsonify({"error": "Analysis not found."}), 404
    return jsonify(analysis), 200


@history_bp.route("/history/<analysis_id>", methods=["DELETE"])
def remove_analysis(analysis_id):
    deleted = delete_analysis(analysis_id)
    if not deleted:
        return jsonify({"error": "Analysis not found or could not be deleted."}), 404
    return jsonify({"success": True, "message": "Analysis deleted."}), 200


@history_bp.route("/history/clear", methods=["POST", "DELETE"])
def clear_all_history():
    count = clear_history()
    return jsonify({"success": True, "deleted_count": count}), 200


@history_bp.route("/dashboard/stats", methods=["GET"])
def get_stats():
    stats = get_dashboard_stats()
    return jsonify(stats), 200


@history_bp.route("/compare", methods=["POST"])
def compare_analyses():
    """
    POST /api/compare
    Body: { "previous_id": str, "current_id": str } OR { "previous": dict, "current": dict }
    """
    data = request.get_json(silent=True) or {}
    prev_id = data.get("previous_id")
    curr_id = data.get("current_id")

    prev_analysis = data.get("previous") or (get_analysis(prev_id) if prev_id else None)
    curr_analysis = data.get("current") or (get_analysis(curr_id) if curr_id else None)

    if not prev_analysis or not curr_analysis:
        return jsonify({"error": "Both previous and current analyses are required for comparison."}), 400

    prev_score = float(prev_analysis.get("quality_score", 0))
    curr_score = float(curr_analysis.get("quality_score", 0))
    score_delta = round(curr_score - prev_score, 1)

    prev_issues = prev_analysis.get("findings", [])
    curr_issues = curr_analysis.get("findings", [])

    # Match findings using stable rule identifier + source context / title
    def finding_key(f):
        return f"{f.get('rule_id')}:{f.get('title')}:{f.get('snippet', '').strip()}"

    prev_keys = {finding_key(f): f for f in prev_issues}
    curr_keys = {finding_key(f): f for f in curr_issues}

    new_findings = [curr_keys[k] for k in curr_keys if k not in prev_keys]
    resolved_findings = [prev_keys[k] for k in prev_keys if k not in curr_keys]
    persistent_findings = [curr_keys[k] for k in curr_keys if k in prev_keys]

    prev_metrics = prev_analysis.get("metrics", {})
    curr_metrics = curr_analysis.get("metrics", {})

    return jsonify({
        "score_comparison": {
            "previous_score": prev_score,
            "current_score": curr_score,
            "score_delta": score_delta,
            "improved": score_delta > 0,
        },
        "issues_comparison": {
            "previous_total": len(prev_issues),
            "current_total": len(curr_issues),
            "new_count": len(new_findings),
            "resolved_count": len(resolved_findings),
            "persistent_count": len(persistent_findings),
            "new_findings": new_findings,
            "resolved_findings": resolved_findings,
            "persistent_findings": persistent_findings,
        },
        "metrics_comparison": {
            "previous_cc": prev_metrics.get("average_cyclomatic_complexity", 1.0),
            "current_cc": curr_metrics.get("average_cyclomatic_complexity", 1.0),
            "cc_delta": round(curr_metrics.get("average_cyclomatic_complexity", 1.0) - prev_metrics.get("average_cyclomatic_complexity", 1.0), 1),
            "previous_mi": prev_metrics.get("maintainability_index", 100.0),
            "current_mi": curr_metrics.get("maintainability_index", 100.0),
            "mi_delta": round(curr_metrics.get("maintainability_index", 100.0) - prev_metrics.get("maintainability_index", 100.0), 1),
        },
    }), 200


@history_bp.route("/export/<analysis_id>/<export_format>", methods=["GET"])
def export_report(analysis_id, export_format):
    analysis = get_analysis(analysis_id)
    if not analysis:
        return jsonify({"error": "Analysis not found."}), 404

    fname = analysis.get("filename", "snippet.py").replace(".py", "")

    if export_format == "json":
        return jsonify(analysis), 200

    elif export_format == "csv":
        csv_data = generate_csv_report(analysis)
        return Response(
            csv_data,
            mimetype="text/csv",
            headers={"Content-Disposition": f"attachment; filename=codepulse_{fname}_{analysis_id[:8]}.csv"}
        )

    elif export_format == "html":
        html_data = generate_html_report(analysis)
        return Response(
            html_data,
            mimetype="text/html",
            headers={"Content-Disposition": f"inline; filename=codepulse_{fname}_{analysis_id[:8]}.html"}
        )

    return jsonify({"error": f"Unsupported export format '{export_format}'. Use json, csv, or html."}), 400
