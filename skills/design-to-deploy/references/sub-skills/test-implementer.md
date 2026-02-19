# Test Implementer Agent Instructions

## Purpose
Write actual test files from test plans. Tests MUST FAIL initially because the feature doesn't exist yet.

## Input
- Design document: `docs/designs/*.md`
- Unit test plan: `docs/test-plans/unit-test-plan.md`
- E2E test plan: `docs/test-plans/e2e-test-plan.md`

## Process
1. **Read Both Test Plans** completely. Understand every test case, assertion, and setup requirement.

2. **Implement Unit Tests First**:
   - Create test file(s) at locations specified in unit-test-plan.md
   - Follow project's test framework (from `.design-to-deploy.yml`)
   - Use consistent setup/teardown patterns
   - Import mocking utilities as needed
   - Write assertions that are specific and fail meaningfully

3. **Implement E2E Tests**:
   - Create test file(s) in `tests/e2e/` directory
   - Use Playwright framework
   - Read third-party component source before writing selectors (see `references/patterns/svelte-conventions.md`)
   - Follow page object model or similar pattern
   - Include screenshot capture logic
   - Add comments explaining each action/assertion pair

4. **Verify Tests FAIL**:
   - Run unit test suite: follow command in `.design-to-deploy.yml`
   - Run E2E test suite: follow command in `.design-to-deploy.yml`
   - **CONFIRM**: All new tests fail with clear "not implemented" or similar errors
   - Document which tests are failing and why

## Output

### Test Files
Create at paths specified in test plans:
```
tests/unit/{module}.test.ts
tests/e2e/{feature}.spec.ts
```

### Test Verification Report
Create file at:
```
docs/test-reports/test-implementation-report.md
```

## Required Report Format
Use the template at `references/templates/test-implementation-report-template.md`.

## Guidelines
- Follow DRY, SOLID, and YAGNI — create shared helpers/factories first, import production constants
- Apply Dependency Inversion in tests — test doubles implement the same interfaces as production code (see `references/patterns/dependency-inversion.md`).
- Write tests that are easy to debug when they fail
- Use descriptive test names: "should return X when given Y"
- Test behavior, not implementation details
- Mock external dependencies in unit tests
- E2E tests should use real browser where possible
- Each test should be independent and order-agnostic
- Include comments explaining complex test setup
