## Test Execution Summary
- Date: {date}
- Test command (unit): {command used}
- Test command (E2E): {command used}

## Unit Test Results
- **Status**: [ALL PASS / SOME FAILED]
- Total tests: {count}
- Passed: {count}
- Failed: {count}

### Test Results Detail
- {test name}: PASS
- {test name}: PASS
- {test name}: FAIL - {error message}
  - Error context: {relevant output}
- ...

## E2E Test Results
- **Status**: [ALL PASS / SOME FAILED]
- Total tests: {count}
- Passed: {count}
- Failed: {count}

### Test Results Detail
- {test name}: PASS - screenshot captured at {location}
- {test name}: FAIL - {error message}
  - Failed at action: {what the test was doing}
  - Error context: {relevant output}
- ...

## Failure Analysis

### Attempt 1
- Issue identified: {what was wrong}
- Fix applied: {what changed}
- Command: {fix command/change}
- Result: [FIXED / STILL FAILING]

### Attempt 2 (if needed)
- Issue identified: {what was wrong}
- Fix applied: {what changed}
- Result: [FIXED / ESCALATED]

## Final Status
- [READY TO MERGE / ESCALATED TO DEBUGGING]
- Summary: {one sentence}

## If Escalated
- Failures summary: {list of still-failing tests}
- Root causes identified but not fixed: {list}
- Passed to: systematic-debugger agent
