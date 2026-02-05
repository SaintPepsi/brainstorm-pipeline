# Design-to-Deploy Skill Specification

## Overview

A recursive, multi-agent workflow skill for Claude Code that automates the journey from idea → validated design → implementation → verified tests. Each pipeline stage runs in a **fresh context** to prevent context pollution.

---

## Core Principle: Context Isolation

Each major step spawns a new agent instance with:

- Fresh context (no accumulated noise)
- Specific input files (design docs, plans)
- Clear output requirements
- Session artifacts passed via filesystem, not context

---

## Pipeline Architecture

### Main Pipeline (Orchestrator)

```
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 1: BRAINSTORM                                                 │
│  Input:  User's rough idea                                          │
│  Output: docs/designs/YYYY-MM-DD-<topic>-design.md                  │
│  Agent:  Fresh context, uses obra/brainstorming skill               │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 2: VALIDATE & SPLIT (recursive)                               │
│  Input:  design-doc.md                                              │
│  Output: validated design doc(s) - may split into multiple          │
│  Agent:  Fresh context, scope-validator sub-skill                   │
│  Loop:   Until all design docs pass validation                      │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEPS 3-5: PARALLEL PLAN GENERATION                                │
│                                                                     │
│  ┌─────────────────────┐ ┌─────────────────────┐ ┌───────────────┐  │
│  │ UNIT TEST PLAN      │ │ E2E TEST PLAN       │ │ FEATURE PLAN  │  │
│  │ Input: design-doc   │ │ Input: design-doc   │ │ Input: design │  │
│  │ Output: unit-tests  │ │ Output: e2e-tests   │ │ Output: feat  │  │
│  │ .md                 │ │ .md                 │ │ .md           │  │
│  └─────────────────────┘ └─────────────────────┘ └───────────────┘  │
│  All 3 agents run in parallel with fresh contexts                   │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 6: CROSS-CHECK & PATCH GAPS                                   │
│  Input:  All 3 plans + original design doc                          │
│  Output: Updated plans with gaps filled, consistency verified       │
│  Agent:  Fresh context, plan-reviewer sub-skill                     │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 7: IMPLEMENTATION PIPELINE (sub-pipeline)                     │
│  See "Implementation Pipeline" below                                │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 8: FINAL REVIEW & HUMAN HANDOFF                               │
│  Input:  All artifacts, test results, screenshots                   │
│  Output: session-history/review-notes.md with:                      │
│          - Summary of changes                                       │
│          - What human should manually verify                        │
│          - Any concerns or edge cases                               │
│  Agent:  Fresh context, review-compiler sub-skill                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Implementation Pipeline (Sub-Pipeline)

```
┌─────────────────────────────────────────────────────────────────────┐
│  IMPL-1: IMPLEMENT UNIT TESTS (failing)                             │
│  Input:  unit-tests-plan.md                                         │
│  Output: Test files created, confirmed failing                      │
│  Agent:  Fresh context, test-implementer sub-skill                  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  IMPL-2: IMPLEMENT E2E TESTS (failing)                              │
│  Input:  e2e-tests-plan.md                                          │
│  Output: Playwright tests created, confirmed failing                │
│  Agent:  Fresh context, playwright-implementer sub-skill            │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  IMPL-3: IMPLEMENT FEATURE                                          │
│  Input:  feature-plan.md                                            │
│  Output: Feature code implemented                                   │
│  Agent:  Fresh context, feature-implementer sub-skill               │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  IMPL-4: VERIFY UNIT TESTS (should pass)                            │
│  Input:  Unit test files + feature code                             │
│  Output: Test results, fix any failures                             │
│  Agent:  Fresh context, test-verifier sub-skill                     │
│  Loop:   Until pass OR max attempts reached                         │
│                                                                     │
│  Failure escalation:                                                │
│  ├─ Attempt 1-2: Fix in test-verifier context                       │
│  ├─ Attempt 3:   Invoke systematic-debugging sub-skill              │
│  └─ Attempt 4+:  STOP PIPELINE → generate failure report            │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  IMPL-5: VERIFY E2E TESTS (should pass)                             │
│  Input:  Playwright test files + feature code                       │
│  Output: Test results + screenshots, fix any failures               │
│  Agent:  Fresh context, e2e-verifier sub-skill                      │
│  Loop:   Until pass OR max attempts reached                         │
│                                                                     │
│  Failure escalation: (same as IMPL-4)                               │
│  ├─ Attempt 1-2: Fix in e2e-verifier context                        │
│  ├─ Attempt 3:   Invoke systematic-debugging sub-skill              │
│  └─ Attempt 4+:  STOP PIPELINE → generate failure report            │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  IMPL-6: VERIFY AGAINST DESIGN DOC                                  │
│  Input:  Original design doc + all implementations                  │
│  Output: Compliance report, list any deviations                     │
│  Agent:  Fresh context, design-compliance-checker sub-skill         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Scope Validator Logic

The validator uses a combined approach:

### 1. Token/Complexity Heuristics

```yaml
flags_for_split:
  - estimated_files_to_create: > 10
  - estimated_files_to_modify: > 15
  - estimated_implementation_time: > 4 hours
  - distinct_feature_areas: > 3
  - external_api_integrations: > 2
  - new_database_tables: > 3
```

### 2. Explicit Scope Markers in Design Doc

Design docs should declare:

```markdown
## Scope Declaration

- Type: [atomic-feature | multi-feature | epic]
- Estimated Complexity: [small | medium | large]
- Dependencies: [list of external dependencies]
- Can Be Split: [yes | no]
```

### 3. LLM Judgment Criteria

The validator agent considers:

- Can this be implemented in a single focused session?
- Are there natural seams where this could be split?
- Does this mix unrelated concerns (UI + API + DB schema)?
- Would a junior developer understand the scope clearly?

### Split Strategy

When splitting:

1. Identify natural boundaries (by layer, feature, or component)
2. Ensure each split is independently testable
3. Define clear interfaces between splits
4. Maintain dependency order for implementation

---

## Session History Structure

```
{project}/
└── session-history/
    └── YYYY-MM-DD-HH-MM-<topic>/
        ├── 00-brainstorm-transcript.md      # Raw brainstorm dialogue
        ├── 01-design-doc.md                 # Final design document
        ├── 02-scope-validation.md           # Validator output
        ├── 03-unit-test-plan.md             # Unit test plan
        ├── 04-e2e-test-plan.md              # E2E test plan
        ├── 05-feature-plan.md               # Feature implementation plan
        ├── 06-cross-check-report.md         # Gap analysis results
        ├── 07-implementation-log.md         # Step-by-step impl log
        ├── 08-test-results/
        │   ├── unit-test-output.txt
        │   ├── e2e-test-output.txt
        │   └── screenshots/                 # Playwright screenshots
        ├── 09-design-compliance.md          # Final verification
        └── 10-review-notes.md               # Human handoff notes
```

---

## Plan Templates

### Unit Test Plan Template

````markdown
# Unit Test Plan: {feature-name}

## Test Coverage Goals

- [ ] Core business logic
- [ ] Edge cases
- [ ] Error handling
- [ ] Input validation

## Test Structure

### {Component/Module Name}

**File:** `src/__tests__/{component}.test.ts`

#### Test: {test-description}

```typescript
// Expected test code
```
````

**Setup required:**

- {mock/stub requirements}

**Assertions:**

- {specific assertions}

````

### E2E Test Plan Template
```markdown
# E2E Test Plan: {feature-name}

## User Journeys Covered
1. {journey-name}: {description}

## Test Structure
### {journey-name}.spec.ts

**File:** `e2e/{journey-name}.spec.ts`

#### Scenario: {scenario}
```typescript
// Playwright test code
````

**Screenshots to capture:**

- {screenshot-points}

**Assertions:**

- Visual: {visual checks}
- Functional: {functional checks}

````

### Feature Implementation Plan Template
```markdown
# Feature Implementation Plan: {feature-name}

## Architecture Overview
{2-3 sentences on approach}

## Files to Create
| File | Purpose |
|------|---------|
| {path} | {description} |

## Files to Modify
| File | Changes |
|------|---------|
| {path} | {line-ranges, description} |

## Implementation Steps
### Step 1: {step-name}
**Files:** {files involved}
**Code:**
```typescript
// Exact implementation
````

**Verification:** {how to verify this step}

```

---

## Sub-Skill Responsibilities

| Sub-Skill | Fresh Context Input | Output |
|-----------|---------------------|--------|
| `brainstormer` | User idea + project context | design-doc.md |
| `scope-validator` | design-doc.md | validated doc(s) or split docs |
| `unit-test-planner` | design-doc.md | unit-test-plan.md |
| `e2e-test-planner` | design-doc.md | e2e-test-plan.md |
| `feature-planner` | design-doc.md | feature-plan.md |
| `plan-reviewer` | All 3 plans + design doc | Patched plans |
| `test-implementer` | test-plan.md | Test files |
| `playwright-implementer` | e2e-plan.md | Playwright test files |
| `feature-implementer` | feature-plan.md | Feature code |
| `test-verifier` | Test files + code | Pass/fail + fixes |
| `e2e-verifier` | Playwright tests | Pass/fail + screenshots |
| `design-compliance-checker` | Design doc + all code | Compliance report |
| `review-compiler` | All artifacts | Human handoff notes |

---

## External Skill Dependencies

This skill integrates with obra/superpowers skills:

### Required
| Skill | Purpose | Trigger |
|-------|---------|---------|
| `brainstorming` | Entry point - refines ideas into design docs | Step 1 |
| `systematic-debugging` | Root cause analysis when fixes fail | After 2 failed fix attempts |

### Systematic Debugging Integration

When test verification fails twice, invoke systematic debugging with:
```

Input: {
failing_tests: ["path/to/test.ts"],
error_output: "...",
recent_changes: ["git diff output"],
attempt_count: 2
}

````

The debugging agent follows the 4-phase methodology:
1. **Root cause investigation** - Read errors carefully, reproduce, check recent changes
2. **Pattern analysis** - Find similar working code, list differences
3. **Hypothesis testing** - Single hypothesis, minimal change, verify
4. **Implementation** - Fix root cause, not symptoms

**Red flags that trigger STOP:**
- "Quick fix for now"
- Multiple changes at once
- "Probably X, let me fix that"
- 3+ failed attempts

---

## Tech Stack Configuration

```yaml
# .design-to-deploy.yml (project root)
testing:
  unit:
    framework: vitest
    config: vitest.config.ts
    command: "npx vitest run"
  e2e:
    framework: playwright
    config: playwright.config.ts
    command: "npx playwright test"
    screenshot_dir: "e2e/screenshots"

paths:
  designs: "docs/designs"
  plans: "docs/plans"
  session_history: "session-history"

validation:
  max_files_to_create: 10
  max_implementation_hours: 4
  require_scope_declaration: true
````

---

## Entry Point Command

```bash
# In Claude Code
/design-to-deploy "Add user authentication with magic links"
```

This triggers:

1. Load SKILL.md
2. Start brainstorm session (fresh context)
3. Pipeline orchestrator takes over
4. Each step spawns fresh agent with specific inputs

---

## Resolved Design Decisions

### 1. Parallelisation ✓

Steps 3-5 (unit test plan, e2e plan, feature plan) run in **parallel** with fresh contexts.

### 2. Failure Handling ✓

If test fixes fail repeatedly:

- After **2 failed fix attempts**: Invoke `systematic-debugging` sub-skill
- Systematic debugging follows the 4-phase approach:
  1. Root cause investigation (no fixes without understanding)
  2. Pattern analysis (compare to working code)
  3. Hypothesis and testing (one change at a time)
  4. Implementation (fix root cause)
- After **3+ failed fix attempts** even with systematic debugging: **STOP pipeline**, generate failure report, await human intervention
- **Never attempt fix #4 without architectural discussion**

### 3. Git Worktree Strategy ✓

The **entire pipeline** runs in a git worktree:

```bash
# At pipeline start
git worktree add ../worktrees/{session-id} -b feature/{topic}

# All implementation happens in worktree
cd ../worktrees/{session-id}

# On successful completion
git checkout main
git merge feature/{topic}
git worktree remove ../worktrees/{session-id}

# On failure - worktree preserved for human review
```

Benefits:

- Main branch stays clean throughout
- Failed pipelines don't pollute main
- Easy to inspect/resume failed sessions
- Clean merge on success

### 4. Commit Strategy ✓

Commit after **each successful step**:

```
commit: "design: {topic} - brainstorm complete"
commit: "design: {topic} - scope validated"
commit: "plan: {topic} - all plans generated"
commit: "test: {topic} - unit tests implemented (failing)"
commit: "test: {topic} - e2e tests implemented (failing)"
commit: "feat: {topic} - feature implemented"
commit: "test: {topic} - unit tests passing"
commit: "test: {topic} - e2e tests passing"
commit: "verify: {topic} - design compliance confirmed"
```

This provides:

- Clear rollback points
- Progress visibility
- Audit trail in session history

---

## Complete Pipeline Lifecycle

```bash
# 1. INITIALISE (in main branch)
SESSION_ID=$(date +%Y-%m-%d-%H-%M)-{topic}
git worktree add ../worktrees/$SESSION_ID -b feature/{topic}
cd ../worktrees/$SESSION_ID
mkdir -p session-history/$SESSION_ID

# 2. BRAINSTORM → commit
# ... brainstorm dialogue ...
git add docs/designs/ session-history/
git commit -m "design({topic}): brainstorm complete"

# 3. VALIDATE SCOPE → commit
# ... scope validation ...
git add session-history/
git commit -m "design({topic}): scope validated"

# 4. PARALLEL PLANNING → commit
# ... 3 agents in parallel ...
git add docs/plans/
git commit -m "plan({topic}): all plans generated"

# 5. CROSS-CHECK → commit
# ... gap analysis ...
git add docs/plans/ session-history/
git commit -m "plan({topic}): cross-check complete"

# 6. IMPLEMENT UNIT TESTS (failing) → commit
git add src/__tests__/
git commit -m "test({topic}): unit tests implemented (failing)"

# 7. IMPLEMENT E2E TESTS (failing) → commit
git add e2e/
git commit -m "test({topic}): e2e tests implemented (failing)"

# 8. IMPLEMENT FEATURE → commit
git add src/
git commit -m "feat({topic}): feature implemented"

# 9. VERIFY UNIT TESTS → commit on pass
git commit -m "test({topic}): unit tests passing"

# 10. VERIFY E2E TESTS → commit on pass
git add e2e/screenshots/
git commit -m "test({topic}): e2e tests passing"

# 11. DESIGN COMPLIANCE → commit
git add session-history/
git commit -m "verify({topic}): design compliance confirmed"

# 12. FINALISE
cd ../{original-project}
git merge feature/{topic}
git worktree remove ../worktrees/$SESSION_ID
git branch -d feature/{topic}

echo "✅ Pipeline complete. Review session-history/$SESSION_ID/"
```

### On Pipeline Failure

```bash
# Worktree preserved for human inspection
echo "❌ Pipeline failed at step: {step}"
echo "Worktree preserved at: ../worktrees/$SESSION_ID"
echo "Failure report: session-history/$SESSION_ID/failure-report.md"
echo ""
echo "To resume: cd ../worktrees/$SESSION_ID && /design-to-deploy --resume"
echo "To abandon: git worktree remove ../worktrees/$SESSION_ID --force"
```

---

## Next Steps

Once this spec is approved:

1. Initialise skill with `init_skill.py`
2. Create orchestrator script (handles worktree, commits, failure escalation)
3. Create sub-skill reference docs for each agent type
4. Create prompt templates for each sub-skill
5. Test on a real feature implementation
