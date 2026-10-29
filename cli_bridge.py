"""
CLI Bridge for executing CodePulse analyzer functions directly from Node/Express or terminal.
Provides high-speed JSON interface over standard input/output.
"""

import sys
import json
import os
from analyzer.engine import analyze_python_code, apply_code_fix
from database.models import (
    save_analysis,
    get_analysis,
    list_analyses,
    delete_analysis,
    clear_history,
    get_dashboard_stats,
    get_settings,
    update_settings,
    DEFAULT_APP_SETTINGS,
)
from routes.exports import generate_csv_report, generate_html_report
from analyzer.rules import RULE_CATALOG


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No action specified."}))
        sys.exit(1)

    action = sys.argv[1]

    try:
        raw_input = sys.stdin.read()
        payload = json.loads(raw_input) if raw_input.strip() else {}
    except Exception as e:
        print(json.dumps({"error": f"Invalid JSON stdin: {str(e)}"}))
        sys.exit(1)

    try:
        if action == "analyze":
            code = payload.get("code", "")
            filename = payload.get("filename", "snippet.py")
            save_hist = payload.get("save_to_history", True)
            settings = get_settings()

            result = analyze_python_code(code, filename, settings)
            saved_id = None
            if save_hist and result.get("status") != "error":
                store_code = bool(settings.get("store_code_in_history", True))
                saved_id = save_analysis(result, source_code=code, store_code=store_code)
            result["analysis_id"] = saved_id
            print(json.dumps(result))

        elif action == "autofix":
            code = payload.get("code", "")
            rule_id = payload.get("rule_id", "")
            line = int(payload.get("line", 1))
            success, updated_code, msg = apply_code_fix(code, rule_id, line)
            print(json.dumps({
                "success": success,
                "updated_code": updated_code,
                "message": msg,
            }))

        elif action == "history_list":
            search = payload.get("search", "")
            limit = int(payload.get("limit", 50))
            items = list_analyses(limit=limit, search=search)
            print(json.dumps({"history": items}))

        elif action == "history_get":
            aid = payload.get("id", "")
            record = get_analysis(aid)
            if not record:
                print(json.dumps({"error": "Analysis not found."}))
                sys.exit(1)
            print(json.dumps(record))

        elif action == "history_delete":
            aid = payload.get("id", "")
            deleted = delete_analysis(aid)
            print(json.dumps({"success": deleted}))

        elif action == "history_clear":
            count = clear_history()
            print(json.dumps({"success": True, "deleted_count": count}))

        elif action == "dashboard_stats":
            stats = get_dashboard_stats()
            print(json.dumps(stats))

        elif action == "get_settings":
            settings = get_settings()
            print(json.dumps({
                "settings": settings,
                "default_settings": DEFAULT_APP_SETTINGS,
                "rules_catalog": RULE_CATALOG,
            }))

        elif action == "update_settings":
            updates = payload.get("settings", {})
            updated = update_settings(updates)
            print(json.dumps({"success": True, "settings": updated}))

        elif action == "export_csv":
            aid = payload.get("id", "")
            record = get_analysis(aid)
            if not record:
                print(json.dumps({"error": "Analysis not found."}))
                sys.exit(1)
            csv_str = generate_csv_report(record)
            print(json.dumps({"content": csv_str}))

        elif action == "export_html":
            aid = payload.get("id", "")
            record = get_analysis(aid)
            if not record:
                print(json.dumps({"error": "Analysis not found."}))
                sys.exit(1)
            html_str = generate_html_report(record)
            print(json.dumps({"content": html_str}))

        elif action == "compare":
            prev_id = payload.get("previous_id")
            curr_id = payload.get("current_id")
            prev_analysis = payload.get("previous") or (get_analysis(prev_id) if prev_id else None)
            curr_analysis = payload.get("current") or (get_analysis(curr_id) if curr_id else None)

            if not prev_analysis or not curr_analysis:
                print(json.dumps({"error": "Both previous and current analyses required."}))
                sys.exit(1)

            prev_score = float(prev_analysis.get("quality_score", 0))
            curr_score = float(curr_analysis.get("quality_score", 0))
            score_delta = round(curr_score - prev_score, 1)

            prev_issues = prev_analysis.get("findings", [])
            curr_issues = curr_analysis.get("findings", [])

            def finding_key(f):
                return f"{f.get('rule_id')}:{f.get('title')}:{f.get('snippet', '').strip()}"

            prev_keys = {finding_key(f): f for f in prev_issues}
            curr_keys = {finding_key(f): f for f in curr_issues}

            new_findings = [curr_keys[k] for k in curr_keys if k not in prev_keys]
            resolved_findings = [prev_keys[k] for k in prev_keys if k not in curr_keys]
            persistent_findings = [curr_keys[k] for k in curr_keys if k in prev_keys]

            prev_metrics = prev_analysis.get("metrics", {})
            curr_metrics = curr_analysis.get("metrics", {})

            result = {
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
            }
            print(json.dumps(result))

        else:
            print(json.dumps({"error": f"Unknown action: {action}"}))
            sys.exit(1)

    except Exception as exc:
        print(json.dumps({"error": str(exc)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
