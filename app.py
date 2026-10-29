"""
CodePulse - AI-Powered Code Quality Analyzer
Main Flask Application Entry Point.
"""

import os
from flask import Flask, jsonify, request
from database.models import init_db
from routes.analysis import analysis_bp
from routes.history import history_bp
from routes.settings import settings_bp

app = Flask(__name__, static_folder="static")
app.config["MAX_CONTENT_LENGTH"] = 2 * 1024 * 1024  # 2MB request limit

# Initialize SQLite database tables
init_db()

# Register REST API Blueprints
app.register_blueprint(analysis_bp)
app.register_blueprint(history_bp)
app.register_blueprint(settings_bp)


@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint providing engine status."""
    return jsonify({
        "status": "healthy",
        "service": "CodePulse Analyzer API",
        "version": "1.0.0",
        "capabilities": {
            "python_ast": True,
            "radon_metrics": True,
            "ruff_linter": True,
            "bandit_security": True,
            "sqlite_history": True,
        },
    }), 200


@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({"error": "Payload exceeds 2MB limit."}), 413


@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found."}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error occurred in analysis pipeline."}), 500


if __name__ == "__main__":
    port = int(os.environ.get("FLASK_PORT", 5000))
    print(f"Starting CodePulse Flask API on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
