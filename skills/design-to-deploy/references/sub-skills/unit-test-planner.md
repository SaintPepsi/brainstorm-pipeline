# Unit Test Planner Agent Instructions

## Purpose
Create comprehensive unit test plans covering all business logic, edge cases, and error handling.

## Input
- Design document from `docs/designs/`
- Project test framework configuration from `.design-to-deploy.yml`

## Process
1. **Scope Check — Is a unit test plan needed?**
   Evaluate whether the feature introduces testable units. Unit tests are appropriate for:
   - Standalone functions and utility modules
   - Business logic (stores, state machines, computed values)
   - Shared UI components in `$lib/components/` (via `.svelte.test.ts` in Svelte projects)
   - Data transformations, parsers, validators

   Unit tests are **not** appropriate for:
   - Page-level route components (`src/routes/`) — these are tested via E2E
   - Pure UI layout refactors with no new logic
   - Changes that only rearrange existing markup or styling

   If the feature has no testable units, output a short plan stating "No unit tests needed" with a rationale explaining why, and list which test type (E2E, manual, etc.) covers the behaviour instead. This is a valid outcome — not every feature needs unit tests.

2. **Extract Requirements**: Identify all:
   - Core business logic units
   - Input validation rules
   - Error conditions
   - Edge cases mentioned in acceptance criteria

3. **Map to Test Cases**: For each piece of logic, define:
   - Happy path test
   - Error/edge case tests
   - Input validation tests
   - Boundary condition tests

4. **Plan Test Structure**: Organize by:
   - Module/component
   - Function or class under test
   - Test category (unit, integration, edge case)

5. **Review Coverage**: Ensure every acceptance criterion has at least one test case.

## Output
Create test plan at:
```
docs/test-plans/unit-test-plan.md
```

## Required Format

### Test File Structure
For each module/component, specify:

```markdown
## Module: {module_name}

**File to test**: `src/path/to/module.ts`
**Test file location**: `tests/unit/path/to/module.test.ts`

### Test: {test_name}
- **Description**: What this test validates
- **Setup**: Any fixtures, mocks, or initialization needed
- **Action**: The code being tested
- **Assertions**: Specific assertions (e.g., "assert return value equals X", "assert error is thrown")
- **Category**: (happy-path | edge-case | error-handling | validation)
```

### Coverage Summary
- Total test cases planned
- Coverage by category (% happy path, % edge cases, % error handling)
- Any identified gaps or risky areas with no tests

### Framework Details
- Test framework (from `.design-to-deploy.yml`)
- Testing utilities and helpers needed
- Mocking strategy for external dependencies
- Test runner command

## Guidelines
- Follow DRY, SOLID, and YAGNI — plan shared test helpers/factories/fixtures, import production constants
- **Test against abstractions.** If the design doc defines interfaces (see "Interfaces & Contracts" section), plan tests that exercise business logic through those interfaces using test doubles. This makes tests fast, deterministic, and decoupled from infrastructure.
- **Test file architecture (Svelte projects):** Component unit tests (`.svelte.test.ts`) belong only in `$lib/components/` for shared, reusable components. Never plan `.svelte.test.ts` files for page-level route components under `src/routes/` — page behaviour is validated by E2E tests via Playwright.
- Plan test doubles (fakes, stubs) that implement the same interfaces as production code. Prefer simple fakes over mocking frameworks.
- Plan at least 2-3 tests per public function
- Include error cases (invalid input, null values, boundary conditions)
- Edge cases: off-by-one, empty collections, max values, special characters
- Be specific with assertions
- If database involved, plan transaction/rollback strategy
