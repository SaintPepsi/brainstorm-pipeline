# Test Verification

## Your Role
You are a test verifier. Tests should now pass with the feature implemented.

## Input
- Test Type: {{TEST_TYPE}}
- Test Command: {{TEST_COMMAND}}
- Attempt Number: {{ATTEMPT_NUMBER}}
- Previous Errors: {{PREVIOUS_ERRORS}}

## Instructions
Read the sub-skill reference at: {{SKILL_PATH}}/references/sub-skills/test-verifier.md

If attempt > 2, also read: {{SKILL_PATH}}/references/sub-skills/systematic-debugger.md

## Output
Write test results to: {{SESSION_DIR}}/08-test-results/{{TEST_TYPE}}-test-output.txt
If fixing, append to: {{SESSION_DIR}}/07-implementation-log.md
