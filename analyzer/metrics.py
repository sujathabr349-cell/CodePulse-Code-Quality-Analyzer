"""
Code complexity and maintainability metrics calculator.
Supports McCabe Cyclomatic Complexity, Halstead Volume, and Maintainability Index.
"""

import ast
import math
import tokenize
import io
from typing import Dict, Any, List, Optional

try:
    from radon.complexity import cc_visit
    from radon.metrics import mi_visit
    RADON_AVAILABLE = True
except ImportError:
    RADON_AVAILABLE = False


class CyclomaticComplexityVisitor(ast.NodeVisitor):
    """
    Computes McCabe Cyclomatic Complexity of an AST node.
    Starts at 1, increments for each decision point / branch:
    - if, elif, while, for, async for
    - except handler, with, async with
    - assert
    - comprehension if clauses
    - boolean operators (and, or)
    - conditional expressions (x if c else y)
    """

    def __init__(self):
        self.complexity = 1

    def visit_If(self, node: ast.If):
        self.complexity += 1
        self.generic_visit(node)

    def visit_While(self, node: ast.While):
        self.complexity += 1
        self.generic_visit(node)

    def visit_For(self, node: ast.For):
        self.complexity += 1
        self.generic_visit(node)

    def visit_AsyncFor(self, node: ast.AsyncFor):
        self.complexity += 1
        self.generic_visit(node)

    def visit_ExceptHandler(self, node: ast.ExceptHandler):
        self.complexity += 1
        self.generic_visit(node)

    def visit_With(self, node: ast.With):
        self.complexity += 1
        self.generic_visit(node)

    def visit_AsyncWith(self, node: ast.AsyncWith):
        self.complexity += 1
        self.generic_visit(node)

    def visit_Assert(self, node: ast.Assert):
        self.complexity += 1
        self.generic_visit(node)

    def visit_IfExp(self, node: ast.IfExp):
        self.complexity += 1
        self.generic_visit(node)

    def visit_comprehension(self, node: ast.comprehension):
        # for clause + each if clause
        self.complexity += len(node.ifs)
        self.generic_visit(node)

    def visit_BoolOp(self, node: ast.BoolOp):
        # A and B and C adds 2 decision points (len(values) - 1)
        self.complexity += max(0, len(node.values) - 1)
        self.generic_visit(node)


def calculate_function_complexity(fn_node: ast.AST) -> int:
    """Calculate cyclomatic complexity of a single function AST node."""
    visitor = CyclomaticComplexityVisitor()
    # Don't increment for the function definition itself, start at 1 for the base path
    for stmt in getattr(fn_node, "body", []):
        visitor.visit(stmt)
    return visitor.complexity


def calculate_nesting_depth(node: ast.AST, current_depth: int = 0) -> int:
    """Compute maximum block nesting depth within a function node."""
    branching_types = (ast.If, ast.While, ast.For, ast.AsyncFor, ast.Try, ast.With, ast.AsyncWith)
    max_depth = current_depth

    for child in ast.iter_child_nodes(node):
        if isinstance(child, branching_types):
            depth = calculate_nesting_depth(child, current_depth + 1)
            if depth > max_depth:
                max_depth = depth
        else:
            depth = calculate_nesting_depth(child, current_depth)
            if depth > max_depth:
                max_depth = depth
    return max_depth


def get_complexity_grade(cc: int) -> str:
    """Return cyclomatic complexity grade."""
    if cc <= 5:
        return "A"
    if cc <= 10:
        return "B"
    if cc <= 20:
        return "C"
    if cc <= 30:
        return "D"
    return "F"


def compute_halstead_and_mi(code: str, total_cc: int, sloc: int) -> Dict[str, Any]:
    """
    Calculate Halstead metrics and Maintainability Index (MI).
    Uses standard SEI MI equation:
    MI = 171 - 5.2 * ln(V) - 0.23 * CC - 16.2 * ln(LOC)
    Normalized to 0-100 scale: MI_normalized = max(0, min(100, MI * 100 / 171))
    """
    operators = set()
    operands = set()
    total_operators = 0
    total_operands = 0

    try:
        tokens = list(tokenize.tokenize(io.BytesIO(code.encode("utf-8")).readline))
        for tok in tokens:
            tok_type = tok.type
            val = tok.string
            if tok_type in (tokenize.OP, tokenize.NAME) and val in {
                "+", "-", "*", "/", "%", "**", "//", "=", "+=", "-=", "==", "!=",
                "<", ">", "<=", ">=", "and", "or", "not", "is", "in", "import", "def",
                "return", "if", "else", "elif", "for", "while", "try", "except"
            }:
                operators.add(val)
                total_operators += 1
            elif tok_type in (tokenize.NAME, tokenize.NUMBER, tokenize.STRING):
                operands.add(val)
                total_operands += 1
    except Exception:
        # Fallback approximation if tokenization encounters unexpected byte stream
        total_operators = max(1, sloc * 3)
        total_operands = max(1, sloc * 2)
        operators = set(range(min(20, total_operators)))
        operands = set(range(min(20, total_operands)))

    n1 = max(1, len(operators))
    n2 = max(1, len(operands))
    N1 = max(1, total_operators)
    N2 = max(1, total_operands)

    vocabulary = n1 + n2
    length = N1 + N2
    volume = length * math.log2(vocabulary) if vocabulary > 0 else 1.0

    effective_loc = max(1, sloc)
    effective_vol = max(1.0, volume)
    effective_cc = max(1, total_cc)

    # SEI Maintainability Index
    raw_mi = 171.0 - (5.2 * math.log(effective_vol)) - (0.23 * effective_cc) - (16.2 * math.log(effective_loc))
    normalized_mi = max(0.0, min(100.0, (raw_mi * 100.0) / 171.0))

    if normalized_mi >= 80:
        mi_grade = "A"
        mi_status = "Highly Maintainable"
    elif normalized_mi >= 60:
        mi_grade = "B"
        mi_status = "Moderately Maintainable"
    elif normalized_mi >= 40:
        mi_grade = "C"
        mi_status = "Difficult to Maintain"
    else:
        mi_grade = "D"
        mi_status = "Critical Technical Debt"

    return {
        "halstead_volume": round(volume, 2),
        "halstead_vocabulary": vocabulary,
        "halstead_length": length,
        "raw_mi": round(raw_mi, 2),
        "maintainability_index": round(normalized_mi, 1),
        "mi_grade": mi_grade,
        "mi_status": mi_status,
    }


def calculate_metrics(code: str, tree: Optional[ast.AST] = None) -> Dict[str, Any]:
    """
    Extract comprehensive complexity and volume metrics from Python code.
    """
    lines = code.splitlines()
    total_lines = len(lines)
    blank_lines = sum(1 for line in lines if not line.strip())
    comment_lines = sum(1 for line in lines if line.strip().startswith("#"))
    sloc = max(0, total_lines - blank_lines - comment_lines)

    functions: List[Dict[str, Any]] = []
    classes_count = 0

    if tree is not None:
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                classes_count += 1
            elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                fn_name = node.name
                start_line = node.lineno
                end_line = getattr(node, "end_lineno", start_line)
                fn_loc = max(1, end_line - start_line + 1)
                cc = calculate_function_complexity(node)
                depth = calculate_nesting_depth(node)
                grade = get_complexity_grade(cc)

                functions.append({
                    "name": fn_name,
                    "start_line": start_line,
                    "end_line": end_line,
                    "loc": fn_loc,
                    "cyclomatic_complexity": cc,
                    "nesting_depth": depth,
                    "grade": grade,
                    "is_async": isinstance(node, ast.AsyncFunctionDef),
                })

    functions_count = len(functions)
    total_cc = sum(f["cyclomatic_complexity"] for f in functions) if functions else 1
    avg_cc = round(total_cc / max(1, functions_count), 1) if functions else 1.0
    max_cc = max((f["cyclomatic_complexity"] for f in functions), default=1)

    # Sort functions by cyclomatic complexity descending
    functions.sort(key=lambda x: x["cyclomatic_complexity"], reverse=True)

    # Calculate MI and Halstead
    mi_data = compute_halstead_and_mi(code, total_cc, sloc)

    # Optional Radon check for comparison if available
    radon_mi = None
    if RADON_AVAILABLE:
        try:
            radon_raw = mi_visit(code, multi=True)
            radon_mi = round(max(0.0, min(100.0, (radon_raw * 100.0) / 100.0)), 1)
        except Exception:
            radon_mi = None

    return {
        "total_lines": total_lines,
        "sloc": sloc,
        "comment_lines": comment_lines,
        "blank_lines": blank_lines,
        "classes_count": classes_count,
        "functions_count": functions_count,
        "total_cyclomatic_complexity": total_cc,
        "average_cyclomatic_complexity": avg_cc,
        "max_cyclomatic_complexity": max_cc,
        "maintainability_index": mi_data["maintainability_index"],
        "raw_mi": mi_data["raw_mi"],
        "mi_grade": mi_data["mi_grade"],
        "mi_status": mi_data["mi_status"],
        "halstead_volume": mi_data["halstead_volume"],
        "functions": functions,
        "radon_mi": radon_mi,
    }
