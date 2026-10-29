"""
Flask REST API routes for CodePulse configuration and rule tuning.
"""

from flask import Blueprint, request, jsonify
from database.models import get_settings, update_settings, DEFAULT_APP_SETTINGS
from analyzer.rules import RULE_CATALOG

settings_bp = Blueprint("settings", __name__, url_prefix="/api")


@settings_bp.route("/settings", methods=["GET"])
def retrieve_settings():
    settings = get_settings()
    return jsonify({
        "settings": settings,
        "default_settings": DEFAULT_APP_SETTINGS,
        "rules_catalog": RULE_CATALOG,
    }), 200


@settings_bp.route("/settings", methods=["POST", "PUT"])
def save_settings():
    payload = request.get_json(silent=True) or {}
    validated: dict = {}

    # Validate complexity threshold
    if "max_cyclomatic_complexity" in payload:
        try:
            val = int(payload["max_cyclomatic_complexity"])
            if 1 <= val <= 100:
                validated["max_cyclomatic_complexity"] = val
        except (ValueError, TypeError):
            pass

    # Validate function length threshold
    if "max_function_length" in payload:
        try:
            val = int(payload["max_function_length"])
            if 5 <= val <= 500:
                validated["max_function_length"] = val
        except (ValueError, TypeError):
            pass

    # Validate nesting depth
    if "max_nesting_depth" in payload:
        try:
            val = int(payload["max_nesting_depth"])
            if 1 <= val <= 20:
                validated["max_nesting_depth"] = val
        except (ValueError, TypeError):
            pass

    # Validate weights
    weight_keys = ["error_weight", "warning_weight", "info_weight", "complexity_weight", "maintainability_weight"]
    for wk in weight_keys:
        if wk in payload:
            try:
                w_val = float(payload[wk])
                if 0.0 <= w_val <= 50.0:
                    validated[wk] = round(w_val, 1)
            except (ValueError, TypeError):
                pass

    # Booleans
    bool_keys = ["enable_ruff", "enable_bandit", "store_code_in_history"]
    for bk in bool_keys:
        if bk in payload:
            validated[bk] = bool(payload[bk])

    # Rule toggles
    for k, v in payload.items():
        if k.startswith("enable_cp_"):
            validated[k] = bool(v)

    updated = update_settings(validated)
    return jsonify({
        "success": True,
        "settings": updated,
        "message": "Settings updated and validated successfully.",
    }), 200


@settings_bp.route("/settings/reset", methods=["POST"])
def reset_to_defaults():
    updated = update_settings(DEFAULT_APP_SETTINGS)
    return jsonify({
        "success": True,
        "settings": updated,
        "message": "Settings reset to default values.",
    }), 200
