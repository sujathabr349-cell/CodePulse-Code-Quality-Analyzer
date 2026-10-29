"""
Curated Learning Mode explanations and beginner-friendly tutoring guides.
Works 100% offline without requiring paid external AI models.
"""

from typing import Dict, Any, Optional
from .rules import RULE_CATALOG

STUDENT_GUIDES: Dict[str, Dict[str, Any]] = {
    "CP-SYN-001": {
        "concept": "Syntax Grammar Rules",
        "plain_explanation": "Python has strict spelling and grammar rules. If a colon ':' is missing after an 'if' statement or brackets don't match, Python cannot read the program.",
        "why_it_matters": "Unlike human conversation where people guess your meaning, the Python interpreter stops immediately when syntax is wrong.",
        "common_causes": [
            "Forgot colon (:) at the end of if, for, while, def, class",
            "Mismatched parenthesis, brackets, or quotes",
            "Incorrect indentation mixing tabs and spaces",
        ],
        "step_by_step_fix": "Look at the exact line number reported. Check the end of the line and the line immediately before it for missing colons or unclosed brackets.",
    },
    "CP-IMP-001": {
        "concept": "Import Management & Module Hygiene",
        "plain_explanation": "You asked Python to import a library (like 'import math'), but your code never used any tools from that library.",
        "why_it_matters": "Importing unused packages slows down startup time, consumes memory, and confuses other developers into thinking the module is needed.",
        "common_causes": [
            "Imported a module during experimentation and forgot to clean it up",
            "Deleted code that used the import without deleting the import statement",
        ],
        "step_by_step_fix": "Simply delete the import line, or if you plan to use it later, write the code that calls it.",
    },
    "CP-VAR-001": {
        "concept": "Variable Lifecycle & Dead Assignments",
        "plain_explanation": "You calculated or stored a value in a variable, but then never used that variable anywhere else in the function.",
        "why_it_matters": "Often, this points to a bug where you meant to return or print the variable but returned something else by mistake.",
        "common_causes": [
            "Typo in a later variable name (e.g. calculated 'total_sum' but printed 'sum')",
            "Leftover temporary debug variable",
        ],
        "step_by_step_fix": "Check if you forgot to use the variable. If you truly don't need it, delete the variable assignment or prefix with '_' (e.g. '_count').",
    },
    "CP-CMP-001": {
        "concept": "Cyclomatic Complexity & Branching Paths",
        "plain_explanation": "Cyclomatic complexity measures how many different decision paths exist in your function (if, elif, for, while, and/or). High complexity means too many branching roads.",
        "why_it_matters": "When a function has 10+ paths, writing tests for all conditions is difficult, and edge cases easily slip through.",
        "common_causes": [
            "Doing too many distinct tasks in one giant function",
            "Deeply nested 'if' statements without early exits",
        ],
        "step_by_step_fix": "Use 'early returns' (return immediately if an input is invalid) and break long sections into smaller, named helper functions.",
    },
    "CP-SEC-001": {
        "concept": "Arbitrary Code Injection & eval() Hazards",
        "plain_explanation": "eval() takes any text string and runs it as Python code with full system privileges.",
        "why_it_matters": "If user input reaches eval(), an attacker can type 'os.system(\"rm -rf /\")' or read private passwords from your machine.",
        "common_causes": [
            "Using eval() to parse numbers or JSON strings instead of safe built-ins",
            "Using eval() to evaluate basic calculator math formulas",
        ],
        "step_by_step_fix": "Use ast.literal_eval() for safe literal parsing, or a dedicated arithmetic parser for math expressions.",
    },
    "CP-SEC-002": {
        "concept": "Mutable Default Arguments Gotcha",
        "plain_explanation": "In Python, default arguments like 'def add_item(item, items=[])' are created ONCE when the file is loaded, NOT each time the function is called.",
        "why_it_matters": "Every call to the function appends to the SAME shared list in memory, leaking state between different users or requests.",
        "common_causes": [
            "Assuming default arguments reset to a new empty list [] on each function call",
        ],
        "step_by_step_fix": "Set the default argument to 'None', and inside the function check: 'if items is None: items = []'.",
    },
    "CP-EXC-001": {
        "concept": "Exception Granularity & Bare Except",
        "plain_explanation": "Catching all errors with a bare 'except:' catches everything, even when the user presses Ctrl+C to stop the program or when Python runs out of memory.",
        "why_it_matters": "It hides programming bugs and typos, making debugging take hours instead of seconds.",
        "common_causes": [
            "Writing quick try/except blocks without specifying the exact error expected",
        ],
        "step_by_step_fix": "Specify the exact exception you expect, such as 'except (ValueError, KeyError):'.",
    },
    "CP-DOC-001": {
        "concept": "Code Documentation & Docstrings",
        "plain_explanation": "A docstring is a multi-line string at the top of a function or class explaining what it does, what inputs it takes, and what it returns.",
        "why_it_matters": "Without docstrings, other developers have to read every line of your function's implementation just to know how to call it.",
        "common_causes": [
            "Rushing through implementation without documenting public functions",
        ],
        "step_by_step_fix": "Add a triple-quoted string right under the 'def' line describing what the function accomplishes.",
    },
}

def get_learning_guide(rule_id: str) -> Dict[str, Any]:
    """Retrieve educational tutoring material for a specific rule."""
    rule_info = RULE_CATALOG.get(rule_id, {})
    guide = STUDENT_GUIDES.get(rule_id, {})
    
    return {
        "rule_id": rule_id,
        "title": rule_info.get("title", rule_id),
        "concept": guide.get("concept", rule_info.get("category", "General Best Practice").title()),
        "plain_explanation": guide.get("plain_explanation", rule_info.get("explanation", "")),
        "why_it_matters": guide.get("why_it_matters", rule_info.get("why_it_matters", "")),
        "common_causes": guide.get("common_causes", [
            "Code pattern does not follow standard Python conventions",
            "Refactoring or modification left redundant logic",
        ]),
        "step_by_step_fix": guide.get("step_by_step_fix", rule_info.get("recommendation", "")),
        "before_example": rule_info.get("before_example", ""),
        "after_example": rule_info.get("after_example", ""),
    }
