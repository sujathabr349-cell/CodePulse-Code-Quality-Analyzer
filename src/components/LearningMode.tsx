/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Code,
  ArrowRight,
} from 'lucide-react';

interface LearningRule {
  rule_id: string;
  title: string;
  concept: string;
  plain_explanation: string;
  why_it_matters: string;
  common_causes: string[];
  step_by_step_fix: string;
  before_example: string;
  after_example: string;
}

const KNOWLEDGE_BASE: LearningRule[] = [
  {
    rule_id: 'CP-SYN-001',
    title: 'Python Syntax Errors',
    concept: 'Grammar and Parsing Rules',
    plain_explanation:
      'Python has strict grammar rules. If you forget a colon (:) at the end of an if statement or leave brackets unclosed, the Python interpreter cannot even begin to read your program.',
    why_it_matters:
      'Unlike a human who can guess what you meant, the Python interpreter terminates immediately when syntax is invalid.',
    common_causes: [
      'Forgot a colon (:) at the end of def, class, if, elif, else, for, while, try, or except',
      'Unmatched parentheses ( ), square brackets [ ], or curly braces { }',
      'Accidentally mixing tab characters and spaces for indentation',
    ],
    step_by_step_fix:
      'Check the reported line number. If the line looks correct, inspect the line immediately above it—unclosed parentheses often cause the error to be flagged on the next line.',
    before_example: 'def calculate_total(prices)\n    return sum(prices)',
    after_example: 'def calculate_total(prices):\n    return sum(prices)',
  },
  {
    rule_id: 'CP-IMP-001',
    title: 'Unused Import Statements',
    concept: 'Module Hygiene & Namespace Clutter',
    plain_explanation:
      'You told Python to load an external library (like "import math"), but your code never calls any functions or constants from that library.',
    why_it_matters:
      'Every unused import consumes startup time and memory. It also confuses other developers into thinking the module is needed.',
    common_causes: [
      'Imported a library while experimenting and forgot to clean it up',
      'Deleted the function that used the import, leaving the import behind',
    ],
    step_by_step_fix:
      'Simply delete the import statement line from the top of your file, or start using the imported module.',
    before_example: 'import math\nimport os\n\ndef add(a, b):\n    return a + b',
    after_example: 'def add(a, b):\n    return a + b',
  },
  {
    rule_id: 'CP-VAR-001',
    title: 'Unused Local Variables',
    concept: 'Dead Store & Forgotten Assignments',
    plain_explanation:
      'You stored a calculated value in a variable, but never read or returned that variable anywhere in the function.',
    why_it_matters:
      'In beginner code, this usually indicates a bug where you computed something (like "discounted_total") but returned the old "total" by mistake.',
    common_causes: [
      'Typo in a return statement (returning the original variable instead of the result)',
      'Leftover debug variable used for manual inspection',
    ],
    step_by_step_fix:
      'Check whether you meant to return or use the variable. If not needed, remove the assignment or prefix with an underscore (e.g. "_ignored").',
    before_example: 'def get_discounted_price(price, discount):\n    final_price = price - discount\n    return price  # Bug! Returned original price',
    after_example: 'def get_discounted_price(price, discount):\n    final_price = price - discount\n    return final_price',
  },
  {
    rule_id: 'CP-CMP-001',
    title: 'High Cyclomatic Complexity',
    concept: 'Branching Decision Paths',
    plain_explanation:
      'Cyclomatic complexity measures how many different conditional paths exist inside a single function (each if, elif, for, while, and/or counts as a fork in the road).',
    why_it_matters:
      'If a function has a complexity of 12, you must write at least 12 distinct test cases just to test every branch once.',
    common_causes: [
      'Trying to solve all edge cases in one massive monolithic function',
      'Deeply nested if statements without early returns',
    ],
    step_by_step_fix:
      'Use "guard clauses": test for invalid inputs at the start of the function and return immediately. Extract repeated logic into helper functions.',
    before_example: 'def validate_user(user):\n    if user:\n        if user.is_active:\n            if user.email_verified:\n                return True\n    return False',
    after_example: 'def validate_user(user):\n    if not user or not user.is_active:\n        return False\n    return user.email_verified',
  },
  {
    rule_id: 'CP-SEC-001',
    title: 'Insecure eval() or exec()',
    concept: 'Arbitrary Code Execution Hazards',
    plain_explanation:
      'The eval() function executes any text string passed to it as Python code with full system permissions.',
    why_it_matters:
      'If any user input reaches eval(), an attacker can run commands to delete files or steal database passwords.',
    common_causes: [
      'Using eval() to turn string numbers into integers or floats',
      'Using eval() to parse JSON-like data or evaluate calculator expressions',
    ],
    step_by_step_fix:
      'Use ast.literal_eval() for safe literal parsing, json.loads() for JSON data, or int()/float() for numbers.',
    before_example: 'user_input = request.form["expression"]\nresult = eval(user_input)',
    after_example: 'import ast\nuser_input = request.form["expression"]\nresult = ast.literal_eval(user_input)',
  },
  {
    rule_id: 'CP-SEC-002',
    title: 'Dangerous Mutable Default Arguments',
    concept: 'Default Parameter Persistence Gotcha',
    plain_explanation:
      'In Python, default arguments like "def add_item(item, list=[])" are created ONCE when the file is loaded, NOT each time the function is called.',
    why_it_matters:
      'Every call to the function appends to the SAME list in memory, leaking state and data across different users or calls.',
    common_causes: [
      'Assuming "list=[]" creates a fresh empty list every time the function runs',
    ],
    step_by_step_fix:
      'Use "None" as the default argument value, and initialize the list inside the function body.',
    before_example: 'def append_record(record, records=[]):\n    records.append(record)\n    return records',
    after_example: 'def append_record(record, records=None):\n    if records is None:\n        records = []\n    records.append(record)\n    return records',
  },
  {
    rule_id: 'CP-EXC-001',
    title: 'Broad Exception Handling',
    concept: 'Exception Granularity & Bare Except',
    plain_explanation:
      'Writing "except:" with no exception name catches ALL errors, including when you press Ctrl+C to terminate or when Python runs out of memory.',
    why_it_matters:
      'It hides bugs, typos, and syntax errors, making debugging take hours instead of seconds.',
    common_causes: [
      'Writing a quick try/except block without checking which exception might actually be raised',
    ],
    step_by_step_fix:
      'Always specify the exact exception types expected, such as "except (ValueError, KeyError):".',
    before_example: 'try:\n    num = int(user_str)\nexcept:\n    num = 0',
    after_example: 'try:\n    num = int(user_str)\nexcept ValueError:\n    num = 0',
  },
  {
    rule_id: 'CP-DOC-001',
    title: 'Missing Docstrings',
    concept: 'Inline Documentation Standards',
    plain_explanation:
      'A docstring is a triple-quoted string (""" ... """) placed at the top of a function or class explaining what it does, its arguments, and what it returns.',
    why_it_matters:
      'Without docstrings, other engineers and future you must read the entire implementation code just to understand how to use your function.',
    common_causes: [
      'Writing functions in a hurry without documenting parameter expectations',
    ],
    step_by_step_fix:
      'Add a triple-quoted comment under the "def" line stating purpose, input parameters, and return type.',
    before_example: 'def format_currency(amount, symbol="$"):\n    return f"{symbol}{amount:,.2f}"',
    after_example: 'def format_currency(amount: float, symbol: str = "$") -> str:\n    """Format a numerical amount into a human-readable currency string."""\n    return f"{symbol}{amount:,.2f}"',
  },
];

interface LearningModeProps {
  initialRuleId?: string | null;
}

export const LearningMode: React.FC<LearningModeProps> = ({ initialRuleId }) => {
  const [selectedRuleId, setSelectedRuleId] = useState<string>(
    initialRuleId || KNOWLEDGE_BASE[0].rule_id
  );
  const [search, setSearch] = useState('');

  const filteredRules = KNOWLEDGE_BASE.filter(
    (r) =>
      r.rule_id.toLowerCase().includes(search.toLowerCase()) ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.concept.toLowerCase().includes(search.toLowerCase())
  );

  const currentRule =
    KNOWLEDGE_BASE.find((r) => r.rule_id === selectedRuleId) || KNOWLEDGE_BASE[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col md:flex-row min-h-[640px]">
      {/* Left Rules Navigation */}
      <div className="w-full md:w-80 border-r border-slate-800 bg-slate-950/60 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-semibold text-slate-100">Learning Mode Tutor</h3>
          </div>
          <p className="text-xs text-slate-400 mb-3 leading-relaxed">
            Curated concepts and Python quality explanations tailored for students and BCA portfolio reviews.
          </p>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search concepts or rules..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Rule selector list */}
        <div className="p-2 space-y-1 overflow-y-auto flex-1">
          {filteredRules.map((rule) => {
            const isSelected = rule.rule_id === selectedRuleId;
            return (
              <button
                key={rule.rule_id}
                onClick={() => setSelectedRuleId(rule.rule_id)}
                className={`w-full text-left p-2.5 rounded-lg transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-mono text-xs font-bold">{rule.rule_id}</span>
                  <span className="text-[10px] text-slate-500">{rule.concept}</span>
                </div>
                <div className="text-xs font-semibold text-slate-200 truncate">{rule.title}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Guide Content */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {/* Header */}
        <div className="border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
              {currentRule.rule_id}
            </span>
            <span className="text-xs text-slate-400">&middot; {currentRule.concept}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">{currentRule.title}</h2>
        </div>

        {/* 1. What it means */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-sky-400" />
            <span>1. What this issue means</span>
          </h4>
          <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
            {currentRule.plain_explanation}
          </p>
        </div>

        {/* 2. Why it matters */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>2. Why it matters in software engineering</span>
          </h4>
          <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
            {currentRule.why_it_matters}
          </p>
        </div>

        {/* 3. Common causes */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-yellow-400" />
            <span>3. Common beginner mistakes</span>
          </h4>
          <ul className="space-y-2 bg-slate-950/60 p-4 rounded-lg border border-slate-800/80 text-sm text-slate-300">
            {currentRule.common_causes.map((cause, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-sky-400 font-bold">&bull;</span>
                <span>{cause}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 4. Step-by-step fix */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>4. How to improve it</span>
          </h4>
          <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
            {currentRule.step_by_step_fix}
          </p>
        </div>

        {/* 5. Python Example */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-2">
            <Code className="w-4 h-4 text-indigo-400" />
            <span>5. Code pattern comparison</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-lg border border-rose-950">
              <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2">
                Avoid (Problematic Code)
              </div>
              <pre className="font-mono text-xs text-rose-200 overflow-x-auto whitespace-pre leading-5">
                {currentRule.before_example}
              </pre>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-emerald-950">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                Recommended (Clean Python)
              </div>
              <pre className="font-mono text-xs text-emerald-200 overflow-x-auto whitespace-pre leading-5">
                {currentRule.after_example}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
