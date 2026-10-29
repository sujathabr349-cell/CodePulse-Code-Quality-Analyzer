"""
Flask REST API routes for code analysis and automated fixes.
"""

from flask import Blueprint, request, jsonify
from analyzer.engine import analyze_python_code, apply_code_fix
from database.models import save_analysis, get_settings

analysis_bp = Blueprint("analysis", __name__, url_prefix="/api")


@analysis_bp.route("/analyze", methods=["POST"])
def analyze():
    """
    POST /api/analyze
    Body: { "code": str, "filename": Optional[str], "save_to_history": Optional[bool] }
    """
    data = request.get_json(silent=True) or {}
    code = data.get("code", "")
    filename = data.get("filename", "snippet.py")
    save_to_history = data.get("save_to_history", True)

    if not isinstance(code, str):
        return jsonify({"error": "Code must be a string."}), 400

    # Max 1MB
    if len(code.encode("utf-8")) > 1024 * 1024:
        return jsonify({"error": "Code exceeds 1MB limit."}), 413

    settings = get_settings()
    result = analyze_python_code(code, filename=filename, settings=settings)

    if result.get("status") == "error":
        return jsonify(result), 400

    saved_id = None
    if save_to_history:
        store_code = bool(settings.get("store_code_in_history", True))
        saved_id = save_analysis(result, source_code=code, store_code=store_code)

    result["analysis_id"] = saved_id
    return jsonify(result), 200


@analysis_bp.route("/autofix", methods=["POST"])
def autofix():
    """
    POST /api/autofix
    Body: { "code": str, "rule_id": str, "line": int }
    """
    data = request.get_json(silent=True) or {}
    code = data.get("code", "")
    rule_id = data.get("rule_id", "")
    line = int(data.get("line", 1))

    success, updated_code, msg = apply_code_fix(code, rule_id, line)
    return jsonify({
        "success": success,
        "updated_code": updated_code,
        "message": msg,
    }), 200
