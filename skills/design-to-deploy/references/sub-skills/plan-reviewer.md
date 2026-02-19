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

5. **Validate Test File Architecture**:
   - **Page vs component boundary**: In Svelte projects, `.svelte.test.ts` unit tests belong only in `$lib/components/` for shared, reusable components. If the unit test plan places `.svelte.test.ts` files under `src/routes/` (page-level route components), flag this as an architecture violation — page behaviour must be tested via E2E (Playwright `.spec.ts`), not component unit tests.
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

### Consistency Check Results

```markdown
## Test Coverage Audit
- [x/y] acceptance criteria have unit tests
- [x/y] acceptance criteria have E2E tests
- [?] areas with insufficient test coverage:
  - {specific area and why}

## Interface Validation
- [ ] Function signatures consistent across plans
- [ ] Data structures aligned (API contracts match)
- [ ] File paths consistent throughout
- [ ] Error handling uniformly addressed
- Issues found:
  - {describe issue and which documents affected}

## Test File Architecture
- [ ] No `.svelte.test.ts` files planned for page-level route components (`src/routes/`)
- [ ] Component unit tests scoped to shared `$lib/components/` only
- [ ] "Not applicable" planner decisions have sound rationale
- [ ] Coverage handoff verified — no acceptance criteria lost between unit and E2E plans
- Issues found:
  - {describe violations and recommended fixes}

## Edge Case Coverage
- Missing edge cases:
  - {describe case and which plans need updates}
- Redundant tests:
  - {describe unnecessary duplication}

## Integration Readiness
- [ ] All dependencies documented
- [ ] Implementation order is logically sound
- [ ] Test setup aligns with feature requirements
- Issues:
  - {describe issues}

## Patches Applied
- Added to unit-test-plan.md: {what was added}
- Added to e2e-test-plan.md: {what was added}
- Modified in feature-plan.md: {what changed}
- Rationale: {why these changes were necessary}

## Status
- [READY / NEEDS REVISION]: {one sentence summary}
```

## Guidelines
- Flag DRY, SOLID, and YAGNI violations across plans — duplicated logic, missing shared modules, hardcoded values that should be imported
- **Flag Dependency Inversion violations** — business logic importing infrastructure, missing interfaces at module boundaries, dependencies constructed internally, abstractions defined in the wrong layer. If the design doc has an "Interfaces & Contracts" section, verify the plans implement every listed abstraction.
- Check every cross-reference
- Consistency matters more than perfection
- Catch gaps now — they're cheaper to fix than during implementation
- Document your reasoning for all patches
- Flag anything ambiguous
- **Flag test file architecture violations** — unit tests for page-level route components, `.svelte.test.ts` files outside `$lib/components/`, or missing coverage when a planner declares "not applicable"
