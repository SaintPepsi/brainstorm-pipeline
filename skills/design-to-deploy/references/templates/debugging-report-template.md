## Debugging Session Report
- Feature: {feature name}
- Tests involved: {list of failing test names}
- Session start: {timestamp}

## Root Cause Investigation
### Initial Error Analysis
- Error message: {complete error text}
- Location: {file:line}
- Stack trace: {relevant parts}

### Reproduction
- Successfully reproduced: [yes/no]
- Steps to reproduce: {steps}
- Consistent: [always fails / intermittent]

### Context Review
- Implementation matches plan: [yes/no/partially]
- Changes since test write:
  - {change 1}
  - {change 2}

## Pattern Analysis
### Similar Working Code
- Found working example at: {file:line}
- Pattern used: {describe pattern}

### Differences Identified
- {difference 1}
- {difference 2}
- ...

## Hypothesis Testing
### Hypothesis 1: {describe}
- Change made: {describe change}
- Test result: [FIXED / FAILED]
- Analysis: {what we learned}

### Hypothesis 2: {describe}
- Change made: {describe change}
- Test result: [FIXED / FAILED]
- Analysis: {what we learned}

## Final Fix Applied
- Root cause: {clear statement of what was wrong}
- Fix: {what was changed and why this is the right fix}
- Files modified: {list with line numbers}
- Tests now passing: {count}

## Verification
- All related tests: {status}
- No new failures introduced: [yes/no]
- Edge cases checked: [yes/no]

## Status
[RESOLVED / REQUIRES FURTHER INVESTIGATION]
