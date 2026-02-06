# Design-to-Deploy Skill: Full Pipeline Test Plan

## Project Under Test

**rogue-like-cards** — A browser-based card rogue-like built with SvelteKit 2 + Svelte 5 + TypeScript + Tailwind CSS 4.

| Setting | Value |
|---------|-------|
| Unit test framework | Vitest 4 (browser mode via `@vitest/browser-playwright` for `.svelte.test.ts`) |
| Unit test command | `npm run test -- --run` |
| E2E test framework | Playwright (`@playwright/test` 1.58) |
| E2E test command | `npx playwright test` |
| E2E config | `playwright.config.ts` (testDir: `src`, testMatch: `**/*.spec.ts`) |
| Test colocation | Tests live next to source (e.g. `enemy.svelte.ts` + `enemy.test.ts`) |
| Existing tests | ~30 unit test files, 2 e2e spec files |
| Git state | Main branch, clean working tree |

---

## Test Feature: Kill Counter

**Idea:** "Add a kill counter that tracks total enemies killed in the current run, displayed in the StatsPanel"

**Why this feature is a good test candidate:**
- **Atomic scope** — single stat, single store change, single UI change. Won't trigger the scope validator's split logic.
- **Full-stack touchpoints** — requires store logic (track kills), engine integration (increment on enemy death), and UI (render in StatsPanel). Exercises the entire pipeline.
- **Clear testability** — unit tests for store mutation logic, e2e test for visual presence and increment behaviour.
- **Existing patterns** — follows established stat tracking patterns already in the codebase (gold, XP, level).
- **Low risk** — doesn't touch combat mechanics, balancing, or persistence. Safe to experiment with.

---

## Pre-Flight Checklist

No config file needed — the pipeline discovers test commands from `package.json` automatically.

### 1. Verify test infrastructure works

```bash
cd /Users/hogers/Documents/repos/rogue-like-cards
npm run test -- --run          # Unit tests should pass
npx playwright test            # E2E tests should pass (needs dev server)
```

### 2. Ensure clean git state

```bash
git status                     # Should be clean
git stash                      # Stash any WIP if needed
```

---

## Pipeline Execution: Step by Step

Each step below maps to a pipeline stage. Run them in Claude Code using the skill.

### Stage 1: BRAINSTORM

**What happens:** A fresh agent takes your idea and produces a structured design doc through dialogue.

**Command (in Claude Code):**
```
Read the design-to-deploy skill, then run Stage 1: Brainstorm.

Idea: "Add a kill counter that tracks total enemies killed in the current run, displayed in the StatsPanel. The counter should increment each time an enemy dies, reset to zero on new run or game over, and appear in the stats panel alongside existing stats like level and gold."

Project root: /Users/hogers/Documents/repos/rogue-like-cards
```

**Expected output:**
- `session-history/{SESSION_ID}/00-brainstorm-transcript.md`
- `session-history/{SESSION_ID}/01-design-doc.md`
- `docs/designs/2026-02-06-kill-counter-design.md`

**What to verify:**
- [ ] Design doc has a Scope Declaration section with Type: `atomic-feature`
- [ ] Design doc mentions `gameState.svelte.ts` as the store to modify
- [ ] Design doc mentions `StatsPanel.svelte` as the UI to update
- [ ] Acceptance criteria are testable (not vague)
- [ ] Architecture section references existing patterns (e.g. how `gold` or `level` are tracked)

**Commit:** `design(kill-counter): brainstorm complete`

---

### Stage 2: VALIDATE & SPLIT

**What happens:** A fresh agent reads the design doc and validates scope. For this feature, it should pass without splitting.

**Expected output:**
- `session-history/{SESSION_ID}/02-scope-validation.md`
- Validation: PASS (no split needed)

**What to verify:**
- [ ] Validator confirms scope is within limits
- [ ] No split recommended (estimated files to create < 10, implementation < 4 hours)
- [ ] Scope declaration is flagged as valid

**Commit:** `design(kill-counter): scope validated`

---

### Stages 3-5: PARALLEL PLANNING

**What happens:** Three agents run simultaneously, each producing a plan.

**These should be launched as 3 parallel Task agents in a single message.**

#### Stage 3: Unit Test Plan

**Expected output:** `session-history/{SESSION_ID}/03-unit-test-plan.md`

**What to verify:**
- [ ] Tests cover: increment on kill, reset on new run, reset on game over, initial value is 0
- [ ] Test file location follows colocation: `src/lib/stores/gameState.test.ts` (extend existing)
- [ ] Mocking strategy is defined (how to simulate enemy death)
- [ ] Edge cases considered (multiple kills in one tick, overkill scenarios)

#### Stage 4: E2E Test Plan

**Expected output:** `session-history/{SESSION_ID}/04-e2e-test-plan.md`

**What to verify:**
- [ ] User journey defined: start game → kill enemies → verify counter increments
- [ ] Test file location: `src/routes/_kill-counter.spec.ts`
- [ ] Screenshot capture points defined
- [ ] Assertions include: counter visible in StatsPanel, counter updates after kill

#### Stage 5: Feature Implementation Plan

**Expected output:** `session-history/{SESSION_ID}/05-feature-plan.md`

**What to verify:**
- [ ] Files to modify listed: `gameState.svelte.ts`, `StatsPanel.svelte`, `types.ts` (if needed)
- [ ] Step-by-step approach with code snippets
- [ ] References existing patterns (how gold/xp/level tracking works)
- [ ] No unnecessary new files proposed

**Commit:** `plan(kill-counter): all plans generated`

---

### Stage 6: CROSS-CHECK

**What happens:** A fresh agent reads all 3 plans + the design doc, checks for gaps and inconsistencies.

**Expected output:** `session-history/{SESSION_ID}/06-cross-check-report.md`

**What to verify:**
- [ ] No gaps between unit test plan and feature plan (all new functions have test coverage)
- [ ] E2E plan's assertions align with feature plan's UI changes
- [ ] No conflicts between plans (e.g. different function names, incompatible interfaces)
- [ ] If patches were needed, they're documented

**Commit:** `plan(kill-counter): cross-check complete`

---

### Stage 7a: IMPLEMENT UNIT TESTS (failing)

**What happens:** A fresh agent writes unit tests based on the unit test plan. Tests must fail (feature isn't built yet).

**Expected output:** New/modified test file(s) in `src/lib/stores/`

**What to verify:**
- [ ] Tests are syntactically valid TypeScript
- [ ] `npm run test -- --run` produces failing tests (expected — feature doesn't exist yet)
- [ ] Tests follow project conventions: colocated, use `describe`/`it` blocks, have assertions
- [ ] No `any` types used (per CLAUDE.md rules)

**Commit:** `test(kill-counter): unit tests implemented (failing)`

---

### Stage 7b: IMPLEMENT E2E TESTS (failing)

**What happens:** A fresh agent writes Playwright tests based on the e2e test plan. Tests must fail.

**Expected output:** New spec file in `src/routes/`

**What to verify:**
- [ ] Tests use Playwright API correctly
- [ ] `npx playwright test` produces failing tests (expected)
- [ ] Tests match the pattern of existing specs (`_page.spec.ts`, `_legendary-selection.spec.ts`)

**Commit:** `test(kill-counter): e2e tests implemented (failing)`

---

### Stage 7c: IMPLEMENT FEATURE

**What happens:** A fresh agent implements the actual feature based on the feature plan.

**Expected output:** Modified source files

**What to verify:**
- [ ] `gameState.svelte.ts` has new kill counter state and increment logic
- [ ] `StatsPanel.svelte` renders the kill count
- [ ] Code follows project conventions (no `while` loops, no `any`, descriptive names, early returns)
- [ ] Uses the store-driven pattern from CLAUDE.md
- [ ] `src/lib/changelog.ts` updated with new entry (per CLAUDE.md changelog guidelines)

**Commit:** `feat(kill-counter): feature implemented`

---

### Stage 7d: VERIFY UNIT TESTS

**What happens:** Run unit tests — they should now pass. If they fail, retry logic kicks in.

**Expected outcome:** All tests pass.

**Retry escalation (if failures):**
1. Attempt 1-2: Agent fixes in context
2. Attempt 3: Systematic debugger (4-phase methodology)
3. Attempt 4: **PIPELINE STOPS** — failure report generated

**What to verify:**
- [ ] `npm run test -- --run` passes
- [ ] No new test failures introduced in existing tests
- [ ] If retries happened, check `session-history/{SESSION_ID}/07-implementation-log.md` for debugging notes

**Commit:** `test(kill-counter): unit tests passing`

---

### Stage 7e: VERIFY E2E TESTS

**What happens:** Run e2e tests — they should now pass.

**Expected outcome:** All tests pass. Screenshots captured.

**What to verify:**
- [ ] `npx playwright test` passes
- [ ] Screenshots saved to `test-results/`
- [ ] Kill counter visible in screenshots
- [ ] No existing e2e tests broken

**Commit:** `test(kill-counter): e2e tests passing`

---

### Stage 7f: VERIFY DESIGN COMPLIANCE

**What happens:** A fresh agent compares the implementation against the original design doc.

**Expected output:** `session-history/{SESSION_ID}/09-design-compliance.md`

**What to verify:**
- [ ] All acceptance criteria marked as met
- [ ] Any deviations from design are documented with rationale
- [ ] No missing functionality

**Commit:** `verify(kill-counter): design compliance confirmed`

---

### Stage 8: FINAL REVIEW

**What happens:** A fresh agent compiles all artifacts into human handoff notes.

**Expected output:** `session-history/{SESSION_ID}/10-review-notes.md`

**What to verify:**
- [ ] Summary of all changes is accurate
- [ ] Manual verification checklist provided (what to test by hand)
- [ ] Edge cases or concerns flagged
- [ ] Session history is complete (all 00-10 files present)

---

## Post-Pipeline

### On Success

```bash
# Merge the feature branch
cd /Users/hogers/Documents/repos/rogue-like-cards
git merge feature/kill-counter

# Clean up worktree
git worktree remove ../worktrees/{SESSION_ID}

# Verify everything one more time
npm run test -- --run
npx playwright test
npm run check
```

### On Failure

The worktree is preserved. Check:
```bash
# See where it stopped
cat session-history/{SESSION_ID}/failure-report.md

# Inspect the worktree
cd ../worktrees/{SESSION_ID}
git log --oneline

# Manual fix, then resume
# (back in Claude Code): /design-to-deploy --resume
```

---

## Success Criteria for the Skill Test

The pipeline test is considered successful if:

1. **All 13 stages complete** without manual intervention
2. **Design doc** is coherent and matches the idea
3. **Scope validation** correctly identifies this as atomic (no split)
4. **Plans are consistent** — cross-check finds no major gaps
5. **Tests are real** — not stubs, actually test meaningful behaviour
6. **Tests fail before feature** and pass after
7. **Feature code** follows project conventions from CLAUDE.md
8. **No existing tests break**
9. **Session history** is complete with all artifacts
10. **Git history** has clean conventional commits at each stage

---

## Known Risks & Workarounds

| Risk | Mitigation |
|------|------------|
| Vitest browser mode is finicky | If Svelte component tests fail to run, skip them and focus on store-level unit tests |
| Playwright needs dev server running | The playwright config starts one automatically (`bun run dev`) |
| Pre-commit hook bumps version | May need to account for version bump commits interleaving with pipeline commits |
| `bun.lock` vs `package-lock.json` | Project has both; stick with `npm` commands for consistency |
| Context window limits | Each stage runs in a fresh agent, so individual stages shouldn't hit limits |
| Worktree conflicts with existing `.worktrees/` | The project already has worktree dirs; name the new one distinctly |

---

## Tuning the Skill After the Test

Based on results, you'll likely want to adjust:

1. **Prompt templates** — if agents produce off-target output, refine the prompts in `references/prompts/`
2. **Sub-skill docs** — if agents miss project conventions, add project-specific context to sub-skill references
3. **Scope thresholds** — if validation is too strict/loose, adjust limits in the scope-validator sub-skill doc
4. **Commit messages** — if the pre-commit hook interferes, add hook handling to the orchestrator
5. **Test verification retries** — if tests are flaky, adjust max attempts or add retry delay
