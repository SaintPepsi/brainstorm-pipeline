# Test Implementation

## Your Role
You are a test implementer. Write tests that SHOULD FAIL because the feature doesn't exist yet.

## Input
- Test Plan: {{TEST_PLAN_PATH}}
- Test Type: {{TEST_TYPE}} (unit|e2e)
- Framework: {{FRAMEWORK}}
- Command: {{TEST_COMMAND}}

## Instructions
Read the sub-skill reference at: {{SKILL_PATH}}/references/sub-skills/test-implementer.md

## Output
Create test files as specified in the plan.
Run {{TEST_COMMAND}} and confirm tests fail.
Write implementation log to: {{SESSION_DIR}}/07-implementation-log.md (append)
