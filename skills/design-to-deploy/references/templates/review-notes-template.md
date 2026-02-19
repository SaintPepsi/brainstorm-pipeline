# Code Review Notes

## Overview
- Feature: {feature name}
- Branch/Commits: {commit hashes or range}
- Review date: {date}
- Status: [READY TO MERGE / NEEDS REVIEW / NEEDS FIXES]

## What Changed
### Summary
{1-2 sentence summary of what was implemented}

### Scope
- Files created: {count}
- Files modified: {count}
- Lines added: {count}
- Lines removed: {count}

### Key Changes
- {component/file}: {what changed}
- {component/file}: {what changed}
- ...

## Test Results Summary

### Unit Tests
- Total: {count}
- Passing: {count}
- Failing: {count}
- Coverage: {areas covered}

### E2E Tests
- Total: {count}
- Passing: {count}
- Failing: {count}
- Scenarios covered: {list key scenarios}

### Test Quality
- [✓/✗] Tests are specific and meaningful
- [✓/✗] Edge cases covered
- [✓/✗] Error cases tested
- [✓/✗] Test names are clear and descriptive

## Design Compliance

### Requirements Met
- [✓/✗] All acceptance criteria satisfied
- [✓/✗] All requirements implemented
- [✓/✗] Scope declaration honored (type, complexity, splits)

### Deviations
- {deviation 1}: {brief explanation}
- {deviation 2}: {brief explanation}
- (or "None" if fully compliant)

## Code Quality Assessment

### Strengths
- {positive observation}
- {positive observation}

### Areas for Manual Verification
- [ ] {behavior to manually test}
- [ ] {behavior to manually test}
- [ ] {behavior to manually test}

### Edge Cases & Concerns
- **Concern**: {describe potential issue}
  - Severity: [low / medium / high]
  - Suggested manual test: {what to try}

- **Concern**: {describe potential issue}
  - Severity: [low / medium / high]
  - Suggested manual test: {what to try}

## Implementation Quality

### Code Organization
- [✓/✗] Files are well-organized
- [✓/✗] Naming is clear and consistent
- [✓/✗] No dead code or debug statements
- [✓/✗] Comments explain non-obvious logic

### Architecture Adherence
- [✓/✗] Follows project conventions
- [✓/✗] Integrates cleanly with existing code
- [✓/✗] No breaking changes to public APIs
- Notes: {any architecture concerns}

## What a Human Reviewer Should Check

### Critical (Must Verify Before Merge)
1. {specific behavior to manually test}
   - How to test: {steps}
   - Expected result: {what should happen}

2. {specific behavior to manually test}
   - How to test: {steps}
   - Expected result: {what should happen}

### Important (Should Verify When Possible)
1. {behavior}
   - How to test: {steps}

2. {behavior}
   - How to test: {steps}

### Nice to Verify (If Time Permits)
1. {edge case or scenario}
2. {edge case or scenario}

## Overall Assessment

### Ready for Merge?
[YES / NO / WITH RESERVATIONS]

### Summary
{2-3 sentence assessment of implementation quality and readiness}

### Recommendations
- {action item if any}
- {action item if any}

## Artifacts for Reference
- Design: `docs/designs/{design-file}`
- Feature Plan: `docs/implementation-plans/feature-plan.md`
- Test Plans: `docs/test-plans/{unit,e2e}-test-plan.md`
- Implementation Report: `docs/implementation-reports/feature-implementation-report.md`
- Test Results: `docs/test-reports/test-verification-report.md`
- Compliance: `docs/compliance-reports/compliance-report.md`
