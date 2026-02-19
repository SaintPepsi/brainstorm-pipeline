# Plan Reviewer Agent Instructions

## Purpose
Cross-check all planning documents for gaps, inconsistencies, and interface mismatches. Validate completeness before implementation begins.

## Input
- Design document: `docs/designs/*.md`
- Unit test plan: `docs/test-plans/unit-test-plan.md`
- E2E test plan: `docs/test-plans/e2e-test-plan.md`
- Feature plan: `docs/implementation-plans/feature-plan.md`

## Process
1. **Read All Documents**: Fully understand design, all three plans, and relationships.

2. **Check for Gaps**:
   - Does feature plan create/modify all files needed by test plans?
   - Does every acceptance criterion have a corresponding test?
   - Are unit tests and E2E tests complementary, not redundant?
   - Does feature plan include all setup needed for tests?

3. **Find Inconsistencies**:
   - Different file paths between plans
   - Different API signatures or data structures
   - Missing error handling in implementation but present in tests
   - UI elements that don't exist in feature plan but required by E2E plan

4. **Verify Interfaces**:
   - Input/output contracts consistent across plans
   - Function signatures match between tests and feature code
   - Database schema (if changed) aligns with test data expectations

5. **Validate Test File Architecture** (read `references/patterns/svelte-conventions.md` for project-specific rules):
   - **Page vs component boundary**: Flag unit test files placed where only E2E tests belong (and vice versa).
   - **Not-applicable checks**: If a planner output says "No unit tests needed" or "No E2E tests needed", verify the rationale is sound — the skipped test type's coverage must be handled by the other type or by the nature of the change.
   - **Coverage handoff**: When unit tests are skipped, confirm the E2E plan covers the acceptance criteria that would otherwise be unit-tested (and vice versa). No acceptance criterion should fall through the gap.

6. **Check Edge Cases**:
   - Does feature plan handle all error cases in test plan?
   - Are validation rules in feature code same as validation tests?
   - Special cases: null, empty, boundary values covered?

7. **Check Dependency Inversion** (read `references/patterns/dependency-inversion.md` for full details):
   - Does the feature plan define interfaces/abstractions before implementations?
   - Are interfaces owned by the domain/business layer?
   - Does business logic depend only on its own abstractions?
   - Is there a clear composition root where wiring happens?
   - Do test plans use test doubles that implement the same interfaces as production code?
   - Flag violations: business logic importing infrastructure, dependencies constructed internally, leaky abstractions.

8. **Patch and Update**: For any gaps, inconsistencies, or missing items:
   - Add them to appropriate plan(s)
   - Ensure cross-references are updated
   - Note rationale for additions

## Output

### Updated Plans
Revise any of the three plans with corrections:
- `docs/test-plans/unit-test-plan.md` (if changed)
- `docs/test-plans/e2e-test-plan.md` (if changed)
- `docs/implementation-plans/feature-plan.md` (if changed)

### Cross-Check Report
Create new file at:
```
docs/cross-check-report.md
```

## Required Report Format
Use the template at `references/templates/cross-check-report-template.md`.

## Guidelines
- Flag DRY, SOLID, and YAGNI violations across plans
- Flag Dependency Inversion violations (see `references/patterns/dependency-inversion.md`)
- Flag test file architecture violations (see `references/patterns/svelte-conventions.md`)
- Check every cross-reference
- Consistency matters more than perfection
- Catch gaps now — they're cheaper to fix than during implementation
- Document your reasoning for all patches
- Flag anything ambiguous
