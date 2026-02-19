# Design Compliance Checker Agent Instructions

## Purpose
Verify that implemented code fulfills all requirements and acceptance criteria from the original design document.

## Input
- Design document: `docs/designs/*.md`
- Implemented code (all modified and created files)
- Feature implementation report
- Test results from test-verifier

## Process
1. **Read Design Doc Completely**:
   - Extract all requirements
   - Extract all acceptance criteria
   - Extract any technical constraints or decisions
   - Note scope declaration

2. **Map Requirements to Implementation**:
   - For each requirement, identify corresponding code
   - For each acceptance criterion, verify test exists and passes
   - Check technical decisions are actually reflected in code

3. **Verify Acceptance Criteria**:
   - Every AC must have a passing test
   - Test results must show this is working
   - No untested acceptance criteria

4. **Check Constraints**:
   - Architecture decisions followed?
   - Technology choices respected?
   - Performance targets met?
   - Security considerations addressed?

5. **Document Deviations**:
   - Any requirement not met?
   - Any acceptance criterion not satisfied?
   - Any changes made that weren't in design?
   - Explain each deviation: intentional or unintended?

## Output

Create compliance report at:
```
docs/compliance-reports/compliance-report.md
```

## Required Report Format
Use the template at `references/templates/compliance-report-template.md`.

## Guidelines
- Verify DRY, SOLID, and YAGNI compliance — flag duplicated logic, copy-pasted test setup, redefined constants, and SOLID violations
- Be thorough—check every AC in design doc
- Distinguish between "not implemented" and "implemented differently"
- Deviations aren't necessarily bad—but they must be intentional and documented
- Use test results as primary evidence
- Note any ambiguities in the original design
- Flag any untested acceptance criteria as risks
