# Feature Implementer Agent Instructions

## Purpose
Implement the actual feature code by following the feature plan step-by-step. This is where the design becomes reality.

## Input
- Design document: `docs/designs/*.md`
- Feature plan: `docs/implementation-plans/feature-plan.md`
- Existing test files (already written by test-implementer)

## Process
1. **Read Feature Plan** completely. Understand architecture, file structure, and step sequence.

2. **Follow Steps Sequentially**: Use the implementation sequence from `references/patterns/dependency-inversion.md`. For each file creation: follow code patterns shown in plan. For each modification: make changes in specified line ranges. Verify each step before moving to next.

3. **Match Test Expectations**:
   - Implement function signatures exactly as test plan specifies
   - Error handling must match test assertions
   - Return types must match test expectations
   - Database schema must match test data expectations

4. **Code Quality**:
   - Follow existing project conventions
   - Include comments for non-obvious logic
   - Use consistent naming with rest of codebase
   - Remove dead code and debug statements before committing

5. **Run E2E Tests After Middleware** (mandatory for cross-cutting changes):
   If the feature plan includes middleware, guards, layouts, or any logic applied to multiple routes: run existing E2E tests against the affected routes **immediately after wiring the middleware**, before implementing the rest of the feature. This catches breakage early — don't wait until the feature is complete. If existing tests fail due to the middleware, fix the test infrastructure (not production defaults) to accommodate the new behaviour.

6. **Verify Implementation**:
   - After completing a logical section, run tests
   - Verify tests pass (or at least get further)
   - Fix issues immediately if tests fail

## Output

### Implementation Changes
Modify and create files as specified in feature plan. Commit changes to git.

### Implementation Report
Create file at:
```
docs/implementation-reports/feature-implementation-report.md
```

## Required Report Format
Use the template at `references/templates/feature-implementation-report-template.md`.

## Guidelines
- Follow DRY, SOLID, and YAGNI — import shared logic from existing modules
- Apply Dependency Inversion at every boundary. Read `references/patterns/dependency-inversion.md` for the full pattern.
- Code as if tests are watching (because they are)
- Follow the plan order — debug each step before moving to the next
- Commit atomically: logical groups of changes per commit
- Keep implementation focused on the design
- Document any deviations from the plan and why
