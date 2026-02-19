# Review Compiler Agent Instructions

## Purpose
Synthesize all artifacts and results into a final review document with summary, verification checklist, and handoff guidance for human review.

## Input
- Design document: `docs/designs/*.md`
- Feature plan: `docs/implementation-plans/feature-plan.md`
- Test plans: `docs/test-plans/unit-test-plan.md` and `e2e-test-plan.md`
- All reports:
  - `docs/test-reports/test-implementation-report.md`
  - `docs/test-reports/test-verification-report.md`
  - `docs/implementation-reports/feature-implementation-report.md`
  - `docs/cross-check-report.md`
  - `docs/compliance-reports/compliance-report.md`
  - `docs/debugging-reports/debugging-report.md` (if present)
- Test results (pass/fail status)
- Git commit log for this feature

## Process
1. **Compile Summary**: Extract key facts from all reports
   - What was built?
   - How many tests? How many pass?
   - Are all design requirements met?
   - Any issues or gaps?

2. **Assess Quality**:
   - Test coverage adequate?
   - Implementation follows patterns?
   - Code quality acceptable?
   - Edge cases handled?

3. **List Manual Verification Steps**: What should human reviewer test?
   - Critical user journeys
   - Error scenarios
   - Performance or edge cases not easily testable

4. **Identify Concerns**: Flag anything that needs attention:
   - Untested code paths
   - Complex areas that might have bugs
   - Performance considerations
   - Security implications

5. **Determine Status**: Is this ready to merge?
   - All tests passing?
   - Design compliance verified?
   - Code quality acceptable?
   - Documentation complete?

## Output

Create review notes at:
```
docs/review-notes.md
```

## Required Format
Use the template at `references/templates/review-notes-template.md`.

## Guidelines
- Be honest: flag real concerns
- Distinguish between "needs fixing" and "worth noting"
- Manual verification checklist should be actionable
- Severity levels help prioritize what to check first
- Provide specific steps for manual testing
- Keep summary concise—details go in reports
