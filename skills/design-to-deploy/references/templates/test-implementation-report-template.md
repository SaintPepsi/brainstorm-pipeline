## Unit Test Implementation
- Test file(s) created: {list paths}
- Total unit tests written: {count}
- Framework: {jest | vitest | mocha | other}
- Test command: {exact command used}

## Unit Test Execution Results
- Status: ALL TESTS FAILING (expected)
- Failures summary:
  - {test name}: {failure reason - typically "feature not yet implemented"}
  - {test name}: {failure reason}
  - ...
- Passing tests: {count}
- Failing tests: {count}

## E2E Test Implementation
- Test file(s) created: {list paths}
- Total E2E tests written: {count}
- Framework: Playwright
- Test command: {exact command used}

## E2E Test Execution Results
- Status: ALL TESTS FAILING (expected)
- Sample failures:
  - {test name}: {failure reason - typically "page not found" or "button not found"}
  - {test name}: {failure reason}
- Passing tests: {count}
- Failing tests: {count}

## Test Quality Checks
- [ ] All tests have clear, descriptive names
- [ ] All assertions are specific (not vague)
- [ ] Setup/teardown is properly structured
- [ ] Mocks are configured correctly
- [ ] E2E tests capture screenshots at key points
- [ ] No hardcoded timeouts (or documented if necessary)

## Next Steps
Feature implementation should make these tests pass.
