"""
CodePulse Static Analysis Engine.
Combines Python AST structural visitors, metrics computation, transparent scoring,
and optional external tool integrations (Ruff, Radon, Bandit) with deduplication.
"""

import ast
import re
import subprocess
import tempfile
import os
import json
import builtins
from typing import Dict, Any, List, Optional, Tuple, Set

from .rules import RULE_CATALOG, get_rule_definition
from .metrics import calculate_metrics
from .scoring import calculate_quality_score, DEFAULT_SCORING_WEIGHTS
from .suggestions import get_learning_guide

BUILTIN_NAMES = set(dir(builtins))


class ASTAnalysisVisitor(ast.NodeVisitor):
    """
    Comprehensive AST Visitor inspecting code quality rules, conventions, and anti-patterns.
    """

    def __init__(self, code: str, settings: Dict[str, Any]):
        self.code = code
        self.lines = code.splitlines()
        self.settings = settings
        self.findings: List[Dict[str, Any]] = []

        # Scope and symbol tracking
        self.imported_symbols: Dict[str, Tuple[int, int, str]] = {}  # alias_name -> (line, col, original_name)
        self.used_symbols: Set[str] = set()
        self.assigned_vars_by_scope: List[Dict[str, Tuple[int, int]]] = [{}]  # scope stack
        self.used_vars_by_scope: List[Set[str]] = [set()]

        # Thresholds
        self.max_cc = int(settings.get("max_cyclomatic_complexity", 10))
        self.max_fn_len = int(settings.get("max_function_length", 35))
        self.max_nesting = int(settings.get("max_nesting_depth", 3))

    def _add_finding(
        self,
        rule_id: str,
        line: int,
        col: int = 0,
        end_line: Optional[int] = None,
        custom_message: Optional[str] = None,
        source_override: Optional[str] = None,
        can_autofix: Optional[bool] = None,
    ):
        rule = RULE_CATALOG.get(rule_id, {})
        # Check if rule is disabled in settings
        rule_toggle_key = f"enable_{rule_id.lower().replace('-', '_')}"
        if self.settings.get(rule_toggle_key, True) is False:
            return

        end_l = end_line or line
        snippet = ""
        if 1 <= line <= len(self.lines):
            snippet = self.lines[line - 1].strip()

        finding_id = f"{rule_id}:{line}:{col}"
        
        # Avoid duplicate findings at the exact same location with the same rule
        if any(f["finding_id"] == finding_id for f in self.findings):
            return

        self.findings.append({
            "finding_id": finding_id,
            "rule_id": rule_id,
            "severity": rule.get("default_severity", "warning"),
            "category": rule.get("category", "code_style"),
            "title": rule.get("title", rule_id),
            "message": custom_message or rule.get("explanation", ""),
            "explanation": rule.get("explanation", ""),
            "why_it_matters": rule.get("why_it_matters", ""),
            "recommendation": rule.get("recommendation", ""),
            "before_example": rule.get("before_example", ""),
            "after_example": rule.get("after_example", ""),
            "line": line,
            "col": col,
            "end_line": end_l,
            "snippet": snippet,
            "can_autofix": rule.get("can_autofix", False) if can_autofix is None else can_autofix,
            "source": source_override or rule.get("source", "CodePulse AST"),
        })

    def visit_Import(self, node: ast.Import):
        for alias in node.names:
            name = alias.asname or alias.name.split(".")[0]
            self.imported_symbols[name] = (node.lineno, node.col_offset, alias.name)
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom):
        for alias in node.names:
            if alias.name == "*":
                mod_name = node.module or "..."
                self._add_finding(
                    "CP-IMP-002",
                    node.lineno,
                    node.col_offset,
                    custom_message=f"Wildcard import 'from {mod_name} import *' pollutes namespace.",
                )
            else:
                name = alias.asname or alias.name
                self.imported_symbols[name] = (node.lineno, node.col_offset, alias.name)
        self.generic_visit(node)

    def visit_Name(self, node: ast.Name):
        if isinstance(node.ctx, ast.Load):
            self.used_symbols.add(node.id)
            if self.used_vars_by_scope:
                self.used_vars_by_scope[-1].add(node.id)
        elif isinstance(node.ctx, ast.Store):
            # Only track local assignments inside functions
            if len(self.assigned_vars_by_scope) > 1 and not node.id.startswith("_"):
                self.assigned_vars_by_scope[-1][node.id] = (node.lineno, node.col_offset)
        self.generic_visit(node)

    def visit_Call(self, node: ast.Call):
        # Check eval / exec
        if isinstance(node.func, ast.Name) and node.func.id in ("eval", "exec"):
            self._add_finding(
                "CP-SEC-001",
                node.lineno,
                node.col_offset,
                custom_message=f"Direct invocation of '{node.func.id}()' introduces critical code execution risk.",
            )
        self.generic_visit(node)

    def visit_Assert(self, node: ast.Assert):
        self._add_finding(
            "CP-SEC-003",
            node.lineno,
            node.col_offset,
            custom_message="Assertion statement used. 'assert' can be bypassed when Python runs with '-O'.",
        )
        self.generic_visit(node)

    def visit_ExceptHandler(self, node: ast.ExceptHandler):
        if node.type is None:
            self._add_finding(
                "CP-EXC-001",
                node.lineno,
                node.col_offset,
                custom_message="Bare 'except:' catches all exceptions, masking critical runtime errors.",
            )
        elif isinstance(node.type, ast.Name) and node.type.id in ("Exception", "BaseException"):
            self._add_finding(
                "CP-EXC-001",
                node.lineno,
                node.col_offset,
                custom_message=f"Broad 'except {node.type.id}:' catch-all hides unforeseen logic bugs.",
            )
        self.generic_visit(node)

    def visit_ClassDef(self, node: ast.ClassDef):
        # Check class naming: CapWords / PascalCase
        if not re.match(r"^[A-Z][a-zA-Z0-9]*$", node.name):
            self._add_finding(
                "CP-STY-002",
                node.lineno,
                node.col_offset,
                custom_message=f"Class '{node.name}' should follow CapWords / PascalCase convention.",
            )

        # Check docstring
        docstring = ast.get_docstring(node)
        if not docstring and not node.name.startswith("_"):
            self._add_finding(
                "CP-DOC-001",
                node.lineno,
                node.col_offset,
                custom_message=f"Class '{node.name}' is missing a docstring.",
            )
        elif docstring and (len(docstring.strip()) < 5 or "TODO" in docstring.upper()):
            self._add_finding(
                "CP-DOC-002",
                node.lineno,
                node.col_offset,
                custom_message=f"Class '{node.name}' has a trivial or placeholder docstring.",
            )

        self.generic_visit(node)

    def _check_statement_list_for_unreachable(self, stmts: List[ast.stmt]):
        terminal_types = (ast.Return, ast.Raise, ast.Break, ast.Continue)
        found_terminal = False
        for stmt in stmts:
            if found_terminal:
                self._add_finding(
                    "CP-RCH-001",
                    stmt.lineno,
                    stmt.col_offset,
                    custom_message="Unreachable statement detected after terminal return/raise/break/continue.",
                )
                break
            if isinstance(stmt, terminal_types):
                found_terminal = True

    def visit_FunctionDef(self, node: ast.FunctionDef):
        self._check_function(node)

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef):
        self._check_function(node)

    def visit_Try(self, node: ast.Try):
        self._check_statement_list_for_unreachable(node.body)
        self._check_statement_list_for_unreachable(node.orelse)
        self._check_statement_list_for_unreachable(node.finalbody)
        self.generic_visit(node)

    def visit_If(self, node: ast.If):
        self._check_statement_list_for_unreachable(node.body)
        self._check_statement_list_for_unreachable(node.orelse)
        self.generic_visit(node)

    def visit_While(self, node: ast.While):
        self._check_statement_list_for_unreachable(node.body)
        self._check_statement_list_for_unreachable(node.orelse)
        self.generic_visit(node)

    def visit_For(self, node: ast.For):
        self._check_statement_list_for_unreachable(node.body)
        self._check_statement_list_for_unreachable(node.orelse)
        self.generic_visit(node)

    def _check_function(self, node):
        fn_name = node.name
        start_line = node.lineno
        end_line = getattr(node, "end_lineno", start_line)
        fn_length = max(1, end_line - start_line + 1)

        # Check PEP 8 naming (snake_case)
        if not re.match(r"^[a-z_][a-z0-9_]*$", fn_name) and not (fn_name.startswith("__") and fn_name.endswith("__")):
            self._add_finding(
                "CP-STY-001",
                node.lineno,
                node.col_offset,
                custom_message=f"Function '{fn_name}' should use snake_case (lowercase with underscores).",
            )

        # Check function length
        if fn_length > self.max_fn_len:
            self._add_finding(
                "CP-CMP-002",
                node.lineno,
                node.col_offset,
                end_line=end_line,
                custom_message=f"Function '{fn_name}' length ({fn_length} lines) exceeds threshold of {self.max_fn_len} lines.",
            )

        # Check mutable default argument
        for default in node.args.defaults + [d for d in node.args.kw_defaults if d]:
            if isinstance(default, (ast.List, ast.Dict, ast.Set)):
                self._add_finding(
                    "CP-SEC-002",
                    default.lineno,
                    default.col_offset,
                    custom_message=f"Function '{fn_name}' defines a mutable default argument. Use 'None' instead.",
                )

        # Check docstring
        docstring = ast.get_docstring(node)
        if not docstring and not fn_name.startswith("_"):
            self._add_finding(
                "CP-DOC-001",
                node.lineno,
                node.col_offset,
                custom_message=f"Function '{fn_name}' is missing a docstring.",
            )
        elif docstring and (len(docstring.strip()) < 5 or "TODO" in docstring.upper()):
            self._add_finding(
                "CP-DOC-002",
                node.lineno,
                node.col_offset,
                custom_message=f"Function '{fn_name}' has a trivial or placeholder docstring.",
            )

        # Push scope for unused variable tracking inside this function
        self.assigned_vars_by_scope.append({})
        self.used_vars_by_scope.append(set())

        # Check unreachable code inside function statements
        self._check_statement_list_for_unreachable(node.body)

        self.generic_visit(node)

        # Pop scope and detect unused local variables
        assigned = self.assigned_vars_by_scope.pop()
        used = self.used_vars_by_scope.pop()
        for var_name, (v_line, v_col) in assigned.items():
            if var_name not in used and not var_name.startswith("_"):
                self._add_finding(
                    "CP-VAR-001",
                    v_line,
                    v_col,
                    custom_message=f"Local variable '{var_name}' is assigned but never used.",
                )


    def visit_Expr(self, node: ast.Expr):
        # Detect pointless expressions (e.g. `x + 1` as a statement without assignment or function call)
        # Exclude docstrings (top-level or first statement in function/class)
        if isinstance(node.value, (ast.Constant, ast.BinOp, ast.UnaryOp, ast.Compare)):
            # If it's a string constant, check if it might be an intentional comment/docstring
            if isinstance(node.value, ast.Constant) and isinstance(node.value.value, str):
                pass
            else:
                self._add_finding(
                    "CP-EXP-001",
                    node.lineno,
                    node.col_offset,
                    custom_message="Expression result is discarded without assignment or side effects.",
                )
        self.generic_visit(node)

    def finalize_findings(self):
        """Perform post-traversal validations like unused imports."""
        for name, (line, col, orig_name) in self.imported_symbols.items():
            if name not in self.used_symbols and not name.startswith("_"):
                self._add_finding(
                    "CP-IMP-001",
                    line,
                    col,
                    custom_message=f"Imported symbol '{orig_name}' (as '{name}') is never referenced.",
                )


def run_ruff_linter(code: str) -> List[Dict[str, Any]]:
    """Runs Ruff if available on system, returning normalized findings."""
    findings = []
    try:
        with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False) as tf:
            tf.write(code)
            temp_path = tf.name

        cmd = ["ruff", "check", "--output-format=json", temp_path]
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=3)
        if proc.stdout.strip():
            data = json.loads(proc.stdout)
            for item in data:
                line = item.get("location", {}).get("row", 1)
                col = item.get("location", {}).get("column", 1)
                code_rule = item.get("code", "RUFF")
                message = item.get("message", "Linter finding")

                # Map Ruff rules to CodePulse categories
                findings.append({
                    "finding_id": f"RUFF-{code_rule}:{line}:{col}",
                    "rule_id": f"RUFF-{code_rule}",
                    "severity": "warning" if code_rule.startswith(("F", "E")) else "information",
                    "category": "maintainability" if code_rule.startswith("F") else "code_style",
                    "title": f"Ruff Rule {code_rule}",
                    "message": message,
                    "explanation": f"Ruff static analysis detected rule {code_rule}: {message}",
                    "why_it_matters": "Enforces standard Python idioms, imports, and error prevention.",
                    "recommendation": item.get("fix", {}).get("applicability", "Refactor code according to rule guidelines."),
                    "before_example": "",
                    "after_example": "",
                    "line": line,
                    "col": col,
                    "end_line": item.get("end_location", {}).get("row", line),
                    "snippet": "",
                    "can_autofix": bool(item.get("fix")),
                    "source": "Ruff",
                })
        os.remove(temp_path)
    except Exception:
        # Graceful degradation if ruff fails or times out
        if 'temp_path' in locals() and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
    return findings


def run_bandit_security(code: str) -> List[Dict[str, Any]]:
    """Runs Bandit security static analyzer if available."""
    findings = []
    try:
        with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False) as tf:
            tf.write(code)
            temp_path = tf.name

        cmd = ["bandit", "-f", "json", "-q", temp_path]
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=4)
        if proc.stdout.strip():
            data = json.loads(proc.stdout)
            for issue in data.get("results", []):
                line = issue.get("line_number", 1)
                col = issue.get("col_offset", 0)
                bandit_id = issue.get("test_id", "B000")
                severity = issue.get("issue_severity", "MEDIUM").lower()
                sev_mapped = "error" if severity == "high" else ("warning" if severity == "medium" else "information")

                findings.append({
                    "finding_id": f"BANDIT-{bandit_id}:{line}:{col}",
                    "rule_id": f"BANDIT-{bandit_id}",
                    "severity": sev_mapped,
                    "category": "security",
                    "title": issue.get("test_name", "Bandit Security Issue"),
                    "message": issue.get("issue_text", ""),
                    "explanation": f"Security static analysis finding: {issue.get('issue_text')}",
                    "why_it_matters": "Identifies insecure coding patterns, credential leaks, and unsafe primitives.",
                    "recommendation": "Review security implications and replace with hardened primitives.",
                    "before_example": "",
                    "after_example": "",
                    "line": line,
                    "col": col,
                    "end_line": line,
                    "snippet": issue.get("code", "").strip(),
                    "can_autofix": False,
                    "source": "Bandit",
                })
        os.remove(temp_path)
    except Exception:
        if 'temp_path' in locals() and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
    return findings


class CodePulseEngine:
    """Main coordinator for Python static analysis pipeline."""

    def __init__(self, settings: Optional[Dict[str, Any]] = None):
        self.settings = settings or {}

    def analyze(self, code: str, filename: str = "snippet.py") -> Dict[str, Any]:
        """
        Execute full analysis pipeline:
        1. Syntax check & AST parsing
        2. Complexity and volume metrics
        3. AST quality rule visitors
        4. External tools (Ruff, Bandit) deduplication
        5. Quality score computation
        6. Summary and category breakdowns
        """
        if not isinstance(code, str):
            code = ""

        # Validate max size (1MB limit)
        if len(code.encode("utf-8")) > 1024 * 1024:
            return {
                "error": "File size exceeds 1MB limit for static analysis.",
                "status": "error",
            }

        findings: List[Dict[str, Any]] = []
        has_syntax_error = False
        tree: Optional[ast.AST] = None

        try:
            tree = ast.parse(code, filename=filename)
        except SyntaxError as e:
            has_syntax_error = True
            line_no = e.lineno or 1
            col_no = e.offset or 1
            findings.append({
                "finding_id": f"CP-SYN-001:{line_no}:{col_no}",
                "rule_id": "CP-SYN-001",
                "severity": "error",
                "category": "syntax",
                "title": "Python Syntax Error",
                "message": f"SyntaxError: {e.msg}",
                "explanation": f"The Python interpreter encountered invalid syntax at line {line_no}, col {col_no}.",
                "why_it_matters": "Syntax errors prevent Python from compiling, importing, or executing this code.",
                "recommendation": "Check for missing colons, unbalanced brackets, quotes, or indentation errors.",
                "before_example": "def greet(name)\n    print(name)",
                "after_example": "def greet(name):\n    print(name)",
                "line": line_no,
                "col": col_no,
                "end_line": line_no,
                "snippet": e.text.strip() if e.text else "",
                "can_autofix": False,
                "source": "Python AST Parser",
            })

        # Calculate metrics
        metrics = calculate_metrics(code, tree)

        # If AST parsed successfully, run AST rule visitors
        if tree is not None:
            visitor = ASTAnalysisVisitor(code, self.settings)
            visitor.visit(tree)
            visitor.finalize_findings()
            findings.extend(visitor.findings)

            # Check function-level complexity against threshold
            max_cc_thresh = int(self.settings.get("max_cyclomatic_complexity", 10))
            for fn in metrics["functions"]:
                if fn["cyclomatic_complexity"] > max_cc_thresh:
                    findings.append({
                        "finding_id": f"CP-CMP-001:{fn['start_line']}:0",
                        "rule_id": "CP-CMP-001",
                        "severity": "warning" if fn["cyclomatic_complexity"] <= 20 else "error",
                        "category": "complexity",
                        "title": "High Cyclomatic Complexity",
                        "message": f"Function '{fn['name']}' has a cyclomatic complexity of {fn['cyclomatic_complexity']} (threshold is {max_cc_thresh}).",
                        "explanation": "High cyclomatic complexity indicates excessive branching conditions that complicate testing and maintenance.",
                        "why_it_matters": "Each additional branch multiplies the unit tests required to achieve high branch coverage.",
                        "recommendation": "Refactor by extracting sub-routines, flattening nested conditions, or adopting dispatch tables.",
                        "before_example": "def compute(data):\n    # 15 nested if/elif branches",
                        "after_example": "def compute(data):\n    handler = DISPATCH.get(data.type, default_handler)\n    return handler(data)",
                        "line": fn["start_line"],
                        "col": 0,
                        "end_line": fn["end_line"],
                        "snippet": f"def {fn['name']}(...):",
                        "can_autofix": False,
                        "source": "CodePulse Metrics",
                    })

            # Check deep nesting
            max_nesting_thresh = int(self.settings.get("max_nesting_depth", 3))
            for fn in metrics["functions"]:
                if fn["nesting_depth"] > max_nesting_thresh:
                    findings.append({
                        "finding_id": f"CP-CMP-003:{fn['start_line']}:0",
                        "rule_id": "CP-CMP-003",
                        "severity": "warning",
                        "category": "complexity",
                        "title": "Deep Nesting Level",
                        "message": f"Function '{fn['name']}' has a nesting depth of {fn['nesting_depth']} (threshold is {max_nesting_thresh}).",
                        "explanation": "Deeply nested blocks obscure control flow and indicate overly convoluted conditional branches.",
                        "why_it_matters": "Developers reading nested blocks must keep multiple condition states in short-term memory.",
                        "recommendation": "Use guard clauses and early returns to flatten nested blocks.",
                        "before_example": "if a:\n    if b:\n        if c:\n            do_work()",
                        "after_example": "if not a or not b or not c:\n    return\ndo_work()",
                        "line": fn["start_line"],
                        "col": 0,
                        "end_line": fn["end_line"],
                        "snippet": f"def {fn['name']}(...):",
                        "can_autofix": False,
                        "source": "CodePulse AST",
                    })

            # Optional external linters if enabled in settings
            if self.settings.get("enable_ruff", True):
                ruff_findings = run_ruff_linter(code)
                # Deduplicate against AST findings on the same line
                existing_lines_and_rules = {(f["line"], f["rule_id"]) for f in findings}
                for rf in ruff_findings:
                    if (rf["line"], rf["rule_id"]) not in existing_lines_and_rules:
                        findings.append(rf)

            if self.settings.get("enable_bandit", True):
                bandit_findings = run_bandit_security(code)
                existing_lines = {f["line"] for f in findings if f["category"] == "security"}
                for bf in bandit_findings:
                    if bf["line"] not in existing_lines:
                        findings.append(bf)

        # Sort findings primarily by line number, then severity
        severity_order = {"error": 0, "warning": 1, "information": 2}
        findings.sort(key=lambda x: (x.get("line", 0), severity_order.get(x.get("severity", "information"), 3)))

        # Calculate Quality Score
        scoring_weights = {
            "error_weight": float(self.settings.get("error_weight", DEFAULT_SCORING_WEIGHTS["error_weight"])),
            "warning_weight": float(self.settings.get("warning_weight", DEFAULT_SCORING_WEIGHTS["warning_weight"])),
            "info_weight": float(self.settings.get("info_weight", DEFAULT_SCORING_WEIGHTS["info_weight"])),
            "complexity_weight": float(self.settings.get("complexity_weight", DEFAULT_SCORING_WEIGHTS["complexity_weight"])),
            "maintainability_weight": float(self.settings.get("maintainability_weight", DEFAULT_SCORING_WEIGHTS["maintainability_weight"])),
        }
        score_data = calculate_quality_score(findings, metrics, has_syntax_error, scoring_weights)

        # Tally counts by category and severity
        by_severity = {
            "error": sum(1 for f in findings if f["severity"] == "error"),
            "warning": sum(1 for f in findings if f["severity"] == "warning"),
            "information": sum(1 for f in findings if f["severity"] == "information"),
        }
        by_category = {
            "syntax": sum(1 for f in findings if f["category"] == "syntax"),
            "complexity": sum(1 for f in findings if f["category"] == "complexity"),
            "code_style": sum(1 for f in findings if f["category"] == "code_style"),
            "security": sum(1 for f in findings if f["category"] == "security"),
            "maintainability": sum(1 for f in findings if f["category"] == "maintainability"),
            "docstrings": sum(1 for f in findings if f["category"] == "docstrings"),
        }

        # Enhance findings with learning guides
        enhanced_findings = []
        for f in findings:
            guide = get_learning_guide(f["rule_id"])
            item = {**f, "learning_guide": guide}
            enhanced_findings.append(item)

        return {
            "filename": filename,
            "has_syntax_error": has_syntax_error,
            "quality_score": score_data["score"],
            "grade": score_data["grade"],
            "rating": score_data["rating"],
            "summary": score_data["summary"],
            "scoring_breakdown": score_data["breakdown"],
            "formula_explanation": score_data["formula_explanation"],
            "issue_counts": {
                "total": len(findings),
                "by_severity": by_severity,
                "by_category": by_category,
            },
            "metrics": metrics,
            "findings": enhanced_findings,
            "tools_used": {
                "python_ast": True,
                "metrics_engine": True,
                "ruff": self.settings.get("enable_ruff", True),
                "bandit": self.settings.get("enable_bandit", True),
            },
        }


def analyze_python_code(code: str, filename: str = "snippet.py", settings: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Convenience helper for one-shot analysis."""
    engine = CodePulseEngine(settings)
    return engine.analyze(code, filename)


def apply_code_fix(code: str, rule_id: str, line: int) -> Tuple[bool, str, str]:
    """
    Applies safe deterministic fix for specific rules.
    Returns (success, updated_code, explanation).
    """
    lines = code.splitlines(keepends=True)
    if not (1 <= line <= len(lines)):
        return False, code, "Invalid target line for fix."

    target_line = lines[line - 1]

    if rule_id == "CP-IMP-001":
        # Unused import: remove line safely
        new_lines = lines[:line - 1] + lines[line:]
        return True, "".join(new_lines), f"Removed unused import at line {line}."

    elif rule_id == "CP-SEC-002":
        # Dangerous mutable default: replace `arg=[]` with `arg=None`
        pattern = r"(\b\w+\s*=\s*)(\[\]|\{\}|set\(\))"
        if re.search(pattern, target_line):
            fixed_line = re.sub(pattern, r"\1None", target_line, count=1)
            lines[line - 1] = fixed_line
            return True, "".join(lines), f"Replaced mutable default argument with None at line {line}."

    elif rule_id == "CP-DOC-001":
        # Missing docstring: inject standard docstring under def line
        indent_match = re.match(r"^(\s*)def\s+(\w+)", target_line)
        if indent_match:
            indent = indent_match.group(1) + "    "
            fn_name = indent_match.group(2)
            docstring_line = f'{indent}"""Execute {fn_name} procedure with validated parameters."""\n'
            lines.insert(line, docstring_line)
            return True, "".join(lines), f"Added template docstring for '{fn_name}'."

    return False, code, f"No automatic fix available for rule {rule_id}."
