# Test Verifier Agent Instructions

## Purpose
Run all tests and verify they pass now that feature is implemented. Handle test failures with targeted fixes or escalation.

## Input
- Implemented feature code
- Unit test files: `tests/unit/`
- E2E test files: `tests/e2e/`
- Feature implementation report: `docs/implementation-reports/feature-implementation-report.md`

## Process

**User-provided results shortcut**: If the user has already shared test output (terminal paste, screenshot, or summary), accept it as ground truth. Do not re-run the same tests to "confirm" — record the user-provided results in the verification report and proceed to failure analysis (if needed) or mark as passing.

1. **Run Unit Tests**:
   - Use test command from `.design-to-deploy.yml`
   - Capture full output and test results
   - Count passes and failures

2. **Run E2E Tests**:
   - Use test command from `.design-to-deploy.yml`
   - Verify browser sessions work
   - Capture screenshots and results

3. **Analyze Failures** (if any):
   - Read error messages carefully
   - Identify root cause: logic error? API mismatch? setup issue?
   - Make targeted fix (single issue per attempt)
   - Rerun only failed tests

4. **Attempt Fixes** (Max 2 in this context):
   - **Attempt 1**: Fix most obvious issue, rerun tests
   - **Attempt 2**: Fix next issue, rerun tests
   - If still failing after 2 attempts → escalate

5. **Escalate After 2 Failures**:
   - Generate debugging report
   - Hand off to systematic-debugger agent
   - Do NOT continue attempting fixes

## Output

### Test Results
Create file at:
```
docs/test-reports/test-verification-report.md
```

## Required Report Format
Use the template at `references/templates/test-verification-report-template.md`.

## Guidelines
- Read error messages completely before fixing
- Check for patterns: are multiple tests failing with same error?
- **Fix test infrastructure, never production defaults.** When tests break because a new feature changes the environment (new middleware, auth guards, layout wrappers), fix the test setup to accommodate the new behaviour — never weaken or remove production code to make tests pass. Test helpers, fixtures, mock configurations, and setup functions are the correct fix targets.
- Targeted fixes are better than broad changes
- Run specific test files, not entire suite when debugging
- E2E screenshot failures might indicate visual regressions—check diffs
- After 2 failed attempts, step back and let debugger investigate
