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
- [ ] Unit test file placement follows project conventions (read `references/patterns/svelte-conventions.md` if Svelte)
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
