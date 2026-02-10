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

5. **Check Edge Cases**:
   - Does feature plan handle all error cases in test plan?
   - Are validation rules in feature code same as validation tests?
   - Special cases: null, empty, boundary values covered?

6. **Patch and Update**: For any gaps, inconsistencies, or missing items:
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

## DRY + SOLID Review

In addition to consistency checks, review all plans for DRY and SOLID violations:

- **Duplicated logic across plans**: If the feature plan and test plans both define the same constants, types, or helper logic inline, flag it. Patch by adding a shared module to the feature plan and updating test plans to import from it.
- **Copy-paste patterns**: If the same code snippet or data structure appears in more than one plan, extract it into a shared module.
- **Single Responsibility violations**: Flag any planned module that handles multiple unrelated concerns. Recommend splitting.
- **Missing shared test utilities**: If test plans have duplicated setup across test files, add shared fixture/factory/helper modules to the test plan.
- **Hardcoded values in tests**: If tests redefine constants, route paths, or config values that exist in production code, flag them and update to import instead.

## Guidelines
- Be thorough—check every cross-reference
- Consistency matters more than perfection
- Gaps are better caught now than during implementation
- Document your reasoning for all patches
- If something seems ambiguous, flag it
