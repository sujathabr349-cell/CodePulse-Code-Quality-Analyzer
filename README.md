# CodePulse — AI-Powered Code Quality Analyzer

> An engineering-grade Python static code analysis platform that evaluates cyclomatic complexity, code maintainability, structural anti-patterns, and code health metrics with transparent scoring and actionable improvement recommendations.

---

## 1. Project Overview

**CodePulse** is a full-stack developer tool built to help software engineers, BCA final-year students, and technical interview candidates measure, understand, and elevate Python code quality.

Unlike generic linting scripts or black-box AI tools, CodePulse operates using **transparent AST-based deterministic analysis**, McCabe cyclomatic complexity algorithms, and Radon-compatible SEI Maintainability Index calculations. It runs **100% offline** without requiring expensive third-party API keys or transmitting source code over the cloud.

---

## 2. Problem Statement & Objectives

### Problem
- Python developers often accumulate technical debt through deeply nested control flow, unhandled broad exceptions, mutable default argument leakage, and high cyclomatic complexity.
- Beginners struggle to understand cryptic compiler or linter errors without contextual educational tutoring.
- Code review teams lack standardized, transparent 0–100 health metrics with formula breakdowns.

### Objectives
1. **Accurate Static Analysis**: Parse Python syntax trees using Python's `ast` module, Ruff, Radon, and Bandit.
2. **Transparent Scoring**: Calculate a mathematical quality score (0–100) with complete factor deduction visibility.
3. **Interactive Fixes**: Offer safe, deterministic auto-repairs for common mistakes (e.g. unused imports, mutable defaults).
4. **Before & After Regression Testing**: Diff code modifications in real time, calculating score changes ($\Delta$ score), resolved defects, and complexity shifts.
5. **Educational Tutoring**: Provide beginner-friendly Learning Mode guides explaining *What it means*, *Why it matters*, and *How to improve*.
6. **Persistence & Export**: Store analysis history in SQLite and export reports in JSON, CSV (with spreadsheet formula injection defense), and standalone HTML.

---

## 3. Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS (Dark Navy `#0B1120` palette, accessible WCAG AA contrast)
- **Icons**: Lucide React
- **Visualizations**: Dynamic SVG Gauge meters, Trend lines, and Complexity distribution charts

### Backend
- **Python Backend**: Python 3.10+ / Flask REST API
- **Full-Stack Server**: Node.js 22 + Express 4 + TypeScript (`tsx`)
- **Static Analysis Engine**:
  - Python `ast` (Abstract Syntax Tree parser & structural node visitor)
  - Python `tokenize` & `dis` (Halstead metrics token analyzer)
  - `radon` (Cyclomatic Complexity & Maintainability Index)
  - `ruff` (High-speed PEP 8 linting)
  - `bandit` (Security static analysis)
- **Database**: SQLite3 (Local persistence with parameterized SQL queries)
- **Testing**: `pytest` test suite with 15 automated test cases

---

## 4. Architecture Overview

```
                        ┌────────────────────────────────────────┐
                        │          React SPA (Vite/TSX)          │
                        │  Code Editor, Dashboard, Findings, Diff │
                        └───────────────────┬────────────────────┘
                                            │ HTTP / REST API
                        ┌───────────────────▼────────────────────┐
                        │      Express / Flask REST Server       │
                        │        /api/analyze, /api/history      │
                        └───────────────────┬────────────────────┘
                                            │ JSON Bridge
                        ┌───────────────────▼────────────────────┐
                        │     CodePulse Static Engine (Python)   │
                        ├───────────────────┬────────────────────┤
                        │   ast NodeVisitor │   Metrics Engine   │
                        │  (PEP 8, Security,│  (McCabe CC, SLOC, │
                        │   Exceptions, etc)│   Radon MI index)  │
                        └─────────┬─────────┴──────────┬─────────┘
                                  │                    │
                        ┌─────────▼─────────┐ ┌────────▼─────────┐
                        │  SQLite Database  │ │ Report Exporter  │
                        │ (codepulse.db)    │ │ JSON, CSV, HTML  │
                        └───────────────────┘ └──────────────────┘
```

---

## 5. Getting Started & Installation

### Prerequisites
- Python 3.10 or higher
- Node.js 18+ and npm

### Clone the Repository
```bash
git clone https://github.com/your-username/codepulse.git
cd codepulse
```

### Option A: Running Full-Stack Web Application (Recommended)

1. **Install Node.js & Python dependencies**:
   ```bash
   npm install
   pip install -r requirements.txt
   ```

2. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

### Option B: Running Pure Python Flask API

1. **Create and Activate Virtual Environment**:

   **On Linux / macOS**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

   **On Windows (PowerShell)**:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

2. **Run Flask Server**:
   ```bash
   python app.py
   ```
   The Flask API will start on `http://127.0.0.1:5000`.

---

## 6. Running Automated Tests

Run the comprehensive automated `pytest` test suite covering AST parsing, syntax detection, complexity metrics, scoring calculations, SQLite persistence, and exports:

```bash
# Run all Python tests
pytest -v

# Or run via npm script
npm run test:python
```

**Test Coverage Summary**:
- `tests/test_analysis.py`: Clean code, syntax errors, empty files, unused imports, mutable defaults, broad exceptions, unreachable code, complexity calculation, and deterministic autofix.
- `tests/test_scoring.py`: Perfect score, syntax error cap, deduction weighting, rating bands.
- `tests/test_history.py`: SQLite record lifecycle, search filtering, dashboard statistics, settings persistence.
- `tests/test_exports.py`: JSON export, CSV export with formula injection sanitization, HTML report rendering.

---

## 7. REST API Documentation

### 1. Code Analysis
- **Endpoint**: `POST /api/analyze`
- **Payload**:
  ```json
  {
    "code": "def divide(a, b=[]):\n    return a / b",
    "filename": "math_helper.py",
    "save_to_history": true
  }
  ```
- **Response**:
  ```json
  {
    "filename": "math_helper.py",
    "quality_score": 76.5,
    "grade": "B",
    "rating": "Good",
    "issue_counts": { "total": 2, "by_severity": { "error": 0, "warning": 2, "information": 0 } },
    "metrics": { "average_cyclomatic_complexity": 1.0, "maintainability_index": 82.4, "sloc": 2 },
    "findings": [ ... ]
  }
  ```

### 2. Apply Deterministic Auto-Fix
- **Endpoint**: `POST /api/autofix`
- **Payload**:
  ```json
  {
    "code": "import math\ndef test(): return 1",
    "rule_id": "CP-IMP-001",
    "line": 1
  }
  ```

### 3. Dashboard Aggregate Statistics
- **Endpoint**: `GET /api/dashboard/stats`
- **Description**: Returns live statistics aggregated across all records in SQLite.

### 4. Export Report
- **Endpoint**: `GET /api/export/:id/:format`
- **Supported Formats**: `json`, `csv`, `html`

---

## 8. Screen Previews

| View | Description |
| :--- | :--- |
| **Code Analyzer & Live Metrics** | Split-pane code editor with real-time score gauge, SLOC metrics, and findings table. |
| **Dashboard** | Historical trend charts and issue severity distribution computed from SQLite. |
| **Findings Explorer** | Severity/category filter tabs with expandable code snippets and "Apply Fix" buttons. |
| **Before & After Comparison** | Regression testing view displaying $\Delta$ score changes and resolved defect lists. |
| **Learning Mode** | Student-friendly tutoring guides explaining Python concepts, rationale, and fixes. |

---

## 9. Limitations & Ethical Static Analysis

- **Static vs. Dynamic Analysis**: CodePulse evaluates structural properties and patterns without executing untrusted code. It does not replace dynamic unit testing, runtime profiling, or integration testing.
- **Scoring Heuristics**: The 0–100 quality score is an educational indicator based on weighted metric deductions; it is not an industry-standard certificate guaranteeing absence of bugs.

---

## 10. Future Enhancements

- Support for multi-file Python repository ZIP uploads.
- Git hook integration (`pre-commit`) for automated pull-request gatekeeping.
- Custom user-defined AST pattern rule builder.

---

## 11. License & Credits

Distributed under the MIT License. Built with:
- Python Standard Library `ast`, `tokenize`, `sqlite3`
- [Radon](https://github.com/rubik/radon) & [Ruff](https://github.com/astral-sh/ruff)
- React, Tailwind CSS, and Lucide React
