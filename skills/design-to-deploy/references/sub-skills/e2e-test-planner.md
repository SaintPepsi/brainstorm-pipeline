# E2E Test Planner Agent Instructions

## Purpose
Plan end-to-end user journey tests using Playwright, covering real workflows with visual and functional validation.

## Input
- Design document from `docs/designs/`
- Existing application structure and UI patterns
- Project test configuration from `.design-to-deploy.yml`

## Process
1. **Scope Check — Is an E2E test plan needed?**
   Evaluate whether the feature affects user-visible behaviour. E2E tests are appropriate for:
   - Page-level route components and layouts (`src/routes/`)
   - User-facing workflows (navigation, forms, interactions)
   - UI layout refactors that change what the user sees or how they interact
   - Any change where acceptance criteria describe user actions or visual outcomes

   E2E tests are **not** appropriate for:
   - Pure backend/utility logic with no UI surface
   - Internal refactors that don't change any user-visible behaviour
   - Library-level modules consumed only by other code (tested via unit tests)

   If the feature has no user-visible behaviour to validate, output a short plan stating "No E2E tests needed" with a rationale explaining why, and list which test type (unit, integration, etc.) covers the behaviour instead. This is a valid outcome.

2. **Extract User Journeys**: From user stories and acceptance criteria, identify:
   - Primary user workflows
   - Critical happy paths
   - Edge cases affecting user experience
   - Error scenarios users might encounter

3. **Map to Playwright Scenarios**: For each journey, define:
   - Initial state/setup
   - User actions (clicks, input, navigation)
   - Expected UI changes
   - Visual regression points
   - Final verification

4. **Plan Visual Assertions**: Identify points where:
   - Screenshots should be captured (after major changes)
   - Visual stability should be asserted
   - Layout/rendering should be validated

## Output
Create test plan at:
```
docs/test-plans/e2e-test-plan.md
```

## Required Format

### Test Scenario Template
For each user journey:

```markdown
## Scenario: {descriptive_title}

**User Story**: Reference which story from design doc this covers
**Setup**: Initial application state, users, data needed
**Complexity**: (simple | moderate | complex)

### Steps
1. User action: {action} → Expected: {expected_ui_change}
2. User action: {action} → Expected: {expected_ui_change}
3. ...

### Visual Assertions
- **Screenshot point 1**: After {action}, capture "{name}.png" and verify {layout/visual property}
- **Screenshot point 2**: After {action}, capture "{name}.png" and verify {layout/visual property}

### Functional Assertions
- Assert: {specific_behavior} (e.g., "data is saved to database", "user is redirected to dashboard")
- Assert: {specific_behavior}

### Error Handling
- If {error_condition} occurs, user should see: {error_message}
- System should not: {bad_state}
```

### Test File Locations
Specify the directory where E2E tests will live:
```
tests/e2e/
```

### Test Execution Strategy
- Test environment setup (test database, mock APIs, etc.)
- Browser configuration (headless, viewport sizes)
- Parallel vs sequential execution
- Timeout expectations for long-running flows

### Screenshot Baseline
- Specify baseline screenshot directory
- Document screenshot naming convention
- Note any expected visual variations (responsive breakpoints)

## Guidelines
- Follow DRY, SOLID, and YAGNI — plan shared page objects/helpers, import production constants
- **Leverage Dependency Inversion for test infrastructure.** Where the application uses DIP (interfaces for external services, databases, etc.), plan E2E test setup that wires test-specific implementations (in-memory stores, mock APIs) at the composition root.
- Plan 1-3 E2E tests per major user story
- Include a happy path journey
- Cover at least one error case per feature
- Screenshot points should capture key state changes
- Tests should be deterministic
- Use clear, sequential naming (Scenario 1, 2, 3...)
- Playwright assertions should be specific: `expect(page).toHaveURL()`, `expect(element).toBeVisible()`
