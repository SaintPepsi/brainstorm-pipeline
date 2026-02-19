## Design Compliance Report
- Design doc reviewed: {file path}
- Implementation reviewed: {files checked}
- Review date: {date}

## Requirements Compliance

### Requirement: {requirement from design}
- [✓ MET / ✗ NOT MET / ⚠ PARTIAL]
- Implementation: {where in code this is satisfied}
- Supporting evidence: {test name if applicable}
- Status detail: {any notes}

### Requirement: {requirement from design}
- [✓ MET / ✗ NOT MET / ⚠ PARTIAL]
- Implementation: {where in code}
- Supporting evidence: {test results}

... (repeat for all major requirements)

## Acceptance Criteria Compliance

### User Story: {story title}
- **AC 1**: {acceptance criterion}
  - Status: [✓ MET / ✗ NOT MET]
  - Test covering this: {test name}
  - Test result: [PASS / FAIL]

- **AC 2**: {acceptance criterion}
  - Status: [✓ MET / ✗ NOT MET]
  - Test covering this: {test name}
  - Test result: [PASS / FAIL]

... (repeat for all acceptance criteria)

## Technical Constraints Review
- Constraint: {from design doc}
  - Status: [✓ MET / ✗ NOT MET]
  - How verified: {how we know this is true}

... (repeat for all constraints)

## Deviations from Design

### Intentional Changes
- {Change}: {Reason why this was better}
- {Change}: {Reason}

### Unintentional Gaps
- {Gap}: {What was supposed to be there}
- {Gap}: {Impact}

### Additional Functionality
- {Feature added}: {Was this in scope? Why added?}

## Completeness Summary
- Total requirements: {count}
- Met: {count}
- Partial: {count}
- Not met: {count}

- Total acceptance criteria: {count}
- Tests passing: {count}
- Tests failing: {count}
- No test coverage: {count}

## Risk Assessment
- [ ] All critical requirements met
- [ ] All acceptance criteria have passing tests
- [ ] No critical gaps or deviations
- [ ] Architecture matches design intent
- Concerns: {if any}

## Final Status
[COMPLIANT / NON-COMPLIANT WITH NOTES / DEVIATIONS]
- Summary: {one sentence conclusion}
- Recommendation: {merge / address gaps / review}
