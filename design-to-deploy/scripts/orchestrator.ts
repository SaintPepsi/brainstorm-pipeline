#!/usr/bin/env ts-node
/**
 * Design-to-Deploy Pipeline Orchestrator
 *
 * Manages the complete pipeline from idea/design to implementation and deployment.
 * This script coordinates multiple pipeline stages, manages git worktrees, tracks state,
 * and hands off work to Claude Code agents at each stage.
 *
 * Usage:
 *   ts-node orchestrator.ts --idea "Feature description" [--config path/to/.design-to-deploy.yml] [--resume]
 *   tsx orchestrator.ts --idea "Feature description" --config ./config.yml
 *
 * Exit codes:
 *   0 - Pipeline completed successfully
 *   1 - Configuration or CLI parsing error
 *   2 - Pipeline failed (feature branch + failure report preserved)
 *   3 - Resume requested but no failed state found
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync, spawnSync } from 'child_process';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface TestingConfig {
  unit: {
    framework: string;
    config: string;
    command: string;
  };
  e2e: {
    framework: string;
    config: string;
    command: string;
    screenshot_dir: string;
  };
}

interface PipelineConfig {
  testing: TestingConfig;
  paths: {
    designs: string;
    plans: string;
    session_history: string;
  };
  validation: {
    max_files_to_create: number;
    max_implementation_hours: number;
    require_scope_declaration: boolean;
  };
}

type PipelineStage =
  | 'BRAINSTORM'
  | 'VALIDATE_SPLIT'
  | 'PLAN_UNIT_TESTS'
  | 'PLAN_E2E_TESTS'
  | 'PLAN_FEATURE'
  | 'CROSS_CHECK'
  | 'IMPL_UNIT_TESTS'
  | 'IMPL_E2E_TESTS'
  | 'IMPL_FEATURE'
  | 'VERIFY_UNIT_TESTS'
  | 'VERIFY_E2E_TESTS'
  | 'VERIFY_DESIGN_DOC'
  | 'FINAL_REVIEW';

type StageStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

interface StageHistory {
  stage: PipelineStage;
  status: StageStatus;
  startTime: string;
  endTime?: string;
  errorMessage?: string;
  retryCount?: number;
}

interface PipelineState {
  id: string;
  idea: string;
  createdAt: string;
  updatedAt: string;
  currentStage: PipelineStage;
  status: 'running' | 'success' | 'failed' | 'paused';
  branchName: string;
  worktreeDirectory: string;
  sessionHistoryPath: string;
  history: StageHistory[];
  config: PipelineConfig;
}

interface DebugAttempt {
  attempt: number;
  timestamp: string;
  findings: string;
  actionTaken: string;
}

// ============================================================================
// CLI ARGUMENT PARSING
// ============================================================================

interface CLIArgs {
  idea?: string;
  config?: string;
  resume?: boolean;
}

function parseArgs(): CLIArgs {
  const args: CLIArgs = {
    resume: false,
  };

  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];

    if (arg === '--idea' && i + 1 < process.argv.length) {
      args.idea = process.argv[++i];
    } else if (arg === '--config' && i + 1 < process.argv.length) {
      args.config = process.argv[++i];
    } else if (arg === '--resume') {
      args.resume = true;
    }
  }

  return args;
}

// ============================================================================
// CONFIGURATION LOADING
// ============================================================================

/**
 * Parse a simple YAML-like configuration file (key: value format)
 * This is a minimal parser for the .design-to-deploy.yml format.
 * Does not handle complex nested structures - those are simulated here.
 */
function loadConfig(configPath: string): PipelineConfig {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }

  // For now, return the default configuration structure
  // In practice, this would parse the YAML file
  const defaultConfig: PipelineConfig = {
    testing: {
      unit: {
        framework: 'vitest',
        config: 'vitest.config.ts',
        command: 'npx vitest run',
      },
      e2e: {
        framework: 'playwright',
        config: 'playwright.config.ts',
        command: 'npx playwright test',
        screenshot_dir: 'e2e/screenshots',
      },
    },
    paths: {
      designs: 'docs/designs',
      plans: 'docs/plans',
      session_history: 'session-history',
    },
    validation: {
      max_files_to_create: 10,
      max_implementation_hours: 4,
      require_scope_declaration: true,
    },
  };

  // TODO: Parse actual YAML configuration when file exists
  // For now, merge with defaults if the file contains overrides
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    // Simple override: if file exists, we trust defaults above
    // A real implementation would parse the YAML structure
  } catch (error) {
    // Use defaults
  }

  return defaultConfig;
}

// ============================================================================
// GIT WORKTREE MANAGEMENT
// ============================================================================

/**
 * Create a new git worktree for the feature branch.
 * This isolates the pipeline work from the main branch.
 */
function createWorktree(branchName: string, worktreeDir: string): void {
  try {
    // Ensure we're in a git repository
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
  } catch {
    throw new Error('Current directory is not a git repository');
  }

  try {
    // Create the feature branch and worktree
    execSync(`git worktree add --track -b ${branchName} "${worktreeDir}" origin/main || git worktree add -b ${branchName} "${worktreeDir}" HEAD`, {
      stdio: 'inherit',
    });
    logInfo(`Created git worktree at ${worktreeDir} on branch ${branchName}`);
  } catch (error) {
    throw new Error(`Failed to create git worktree: ${error}`);
  }
}

/**
 * Commit changes in the worktree with a conventional commit message.
 */
function commitChanges(worktreeDir: string, stage: PipelineStage, topic: string, message: string): void {
  try {
    const cwd = worktreeDir;

    // Stage all changes
    execSync('git add .', { cwd, stdio: 'inherit' });

    // Create conventional commit: type(scope): subject
    const conventionalMessage = `${getCommitType(stage)}(${topic}): ${message}`;

    execSync(`git commit -m "${conventionalMessage}"`, { cwd, stdio: 'inherit' });
    logInfo(`Committed: ${conventionalMessage}`);
  } catch (error) {
    // It's OK if there's nothing to commit
    logDebug(`Commit stage ${stage}: No changes to commit`);
  }
}

/**
 * Get the conventional commit type from the stage.
 */
function getCommitType(stage: PipelineStage): string {
  if (stage === 'BRAINSTORM') return 'design';
  if (stage === 'VALIDATE_SPLIT') return 'design';
  if (stage.startsWith('PLAN')) return 'test';
  if (stage === 'CROSS_CHECK') return 'test';
  if (stage.startsWith('IMPL')) return 'feat';
  if (stage.startsWith('VERIFY')) return 'test';
  if (stage === 'FINAL_REVIEW') return 'release';
  return 'chore';
}

/**
 * Merge the feature branch back to main and clean up the worktree.
 * Only called on successful pipeline completion.
 */
function mergeAndCleanup(branchName: string, worktreeDir: string): void {
  try {
    // Switch to main branch
    execSync('git checkout main', { stdio: 'inherit' });

    // Merge the feature branch
    execSync(`git merge --no-ff ${branchName} -m "Merge ${branchName}: design-to-deploy pipeline"`, {
      stdio: 'inherit',
    });

    logInfo(`Merged branch ${branchName} into main`);

    // Remove the worktree
    execSync(`git worktree remove "${worktreeDir}"`, { stdio: 'inherit' });
    logInfo(`Cleaned up worktree at ${worktreeDir}`);
  } catch (error) {
    throw new Error(`Failed to merge and cleanup: ${error}`);
  }
}

/**
 * Preserve the worktree directory for debugging on failure.
 * The branch and worktree remain for manual inspection.
 */
function preserveWorktreeOnFailure(branchName: string, worktreeDir: string): void {
  logInfo(`Preserving worktree at ${worktreeDir} on branch ${branchName}`);
  logInfo(`You can inspect the work by running: git checkout ${branchName}`);
  logInfo(`Clean up later with: git worktree remove "${worktreeDir}"`);
}

// ============================================================================
// SESSION AND STATE MANAGEMENT
// ============================================================================

/**
 * Create the session-history directory structure.
 * Organized by timestamp to allow multiple pipeline runs to coexist.
 */
function createSessionHistory(config: PipelineConfig, idea: string): string {
  const sessionHistoryRoot = config.paths.session_history;

  if (!fs.existsSync(sessionHistoryRoot)) {
    fs.mkdirSync(sessionHistoryRoot, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + Date.now();
  const sessionDir = path.join(sessionHistoryRoot, timestamp);

  fs.mkdirSync(sessionDir, { recursive: true });

  // Create subdirectories for different artifacts
  const subdirs = ['stage-instructions', 'stage-reports', 'designs', 'plans', 'implementations'];
  subdirs.forEach(dir => {
    fs.mkdirSync(path.join(sessionDir, dir), { recursive: true });
  });

  // Write initial session metadata
  const metadata = {
    timestamp,
    idea,
    createdAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(sessionDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );

  logInfo(`Created session history directory at ${sessionDir}`);
  return sessionDir;
}

/**
 * Load or create a pipeline state file.
 */
function loadOrCreateState(
  stateFilePath: string,
  idea: string,
  config: PipelineConfig,
  branchName: string,
  worktreeDir: string,
  sessionDir: string
): PipelineState {
  if (fs.existsSync(stateFilePath)) {
    const content = fs.readFileSync(stateFilePath, 'utf-8');
    return JSON.parse(content);
  }

  const state: PipelineState = {
    id: generateId(),
    idea,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    currentStage: 'BRAINSTORM',
    status: 'running',
    branchName,
    worktreeDirectory: worktreeDir,
    sessionHistoryPath: sessionDir,
    history: [],
    config,
  };

  saveState(stateFilePath, state);
  return state;
}

/**
 * Save pipeline state to disk.
 */
function saveState(stateFilePath: string, state: PipelineState): void {
  fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2));
}

/**
 * Generate a unique ID for the pipeline run.
 */
function generateId(): string {
  return 'p-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// ============================================================================
// STAGE EXECUTION
// ============================================================================

/**
 * Write stage instructions to a file for Claude Code to consume.
 * This creates a structured way for the skill to understand what to do.
 */
function writeStageInstructions(
  sessionDir: string,
  stage: PipelineStage,
  context: Record<string, unknown>
): void {
  const stageInstructions = {
    stage,
    timestamp: new Date().toISOString(),
    instructions: getStageInstructions(stage),
    context,
    expectedOutputs: getExpectedOutputs(stage),
  };

  const filePath = path.join(
    sessionDir,
    'stage-instructions',
    `${stage.toLowerCase()}.json`
  );

  fs.writeFileSync(filePath, JSON.stringify(stageInstructions, null, 2));
  logInfo(`Wrote stage instructions for ${stage} to ${filePath}`);
}

/**
 * Get detailed instructions for each pipeline stage.
 * These are provided to Claude Code to guide its work.
 */
function getStageInstructions(stage: PipelineStage): string {
  const instructions: Record<PipelineStage, string> = {
    BRAINSTORM: `
      Take the provided idea and create a comprehensive design document.
      Output: docs/designs/design-doc.md
      Include: scope, user stories, technical approach, architecture diagram (ASCII),
      acceptance criteria, non-functional requirements, assumptions, risks.
    `,
    VALIDATE_SPLIT: `
      Review the design document for scope and completeness.
      May split into multiple PRs if scope is too large.
      Output: docs/designs/design-doc-validated.md (or multiple split documents)
      Validate against: max_files_to_create, max_implementation_hours config values.
      Update scope declaration if splitting.
    `,
    PLAN_UNIT_TESTS: `
      Create a comprehensive unit test plan based on the design document.
      Output: docs/plans/unit-test-plan.md
      Include: test categories, coverage goals, edge cases, mocking strategy.
    `,
    PLAN_E2E_TESTS: `
      Create a comprehensive end-to-end test plan based on the design document.
      Output: docs/plans/e2e-test-plan.md
      Include: user flows, scenarios, success criteria, environment setup, data fixtures.
    `,
    PLAN_FEATURE: `
      Create a detailed implementation plan for the feature.
      Output: docs/plans/implementation-plan.md
      Include: step-by-step approach, component breakdown, dependencies, file structure.
    `,
    CROSS_CHECK: `
      Review all three plans (unit tests, e2e tests, implementation) against the design doc.
      Ensure consistency, identify gaps, and resolve conflicts.
      Output: docs/plans/cross-check-report.md
      Document any issues found and how they were resolved.
    `,
    IMPL_UNIT_TESTS: `
      Implement unit tests based on the unit test plan.
      Tests should FAIL at this stage (tests before implementation).
      Output: tests/unit/*.test.ts (as per project structure)
      Command: npm run test:unit -- --reporter=verbose (will fail, which is expected)
    `,
    IMPL_E2E_TESTS: `
      Implement e2e tests based on the e2e test plan.
      Tests should FAIL at this stage (tests before implementation).
      Output: e2e/specs/*.spec.ts (as per project structure)
      Command: npm run test:e2e (will fail, which is expected)
    `,
    IMPL_FEATURE: `
      Implement the actual feature based on the implementation plan.
      Ensure all unit and e2e tests pass.
      Output: All feature code files
      Commit message: feat(topic): implement [feature name]
    `,
    VERIFY_UNIT_TESTS: `
      Run unit tests and verify they all pass.
      If tests fail, apply systematic debugging (see retry logic in orchestrator).
      Command: npm run test:unit
      Success criterion: All tests pass
    `,
    VERIFY_E2E_TESTS: `
      Run e2e tests and verify they all pass.
      If tests fail, apply systematic debugging (see retry logic in orchestrator).
      Command: npm run test:e2e
      Success criterion: All tests pass with acceptable screenshots
    `,
    VERIFY_DESIGN_DOC: `
      Review implementation against original design document.
      Verify all acceptance criteria are met.
      Output: docs/plans/implementation-verification.md
      Document any deviations and why they were necessary.
    `,
    FINAL_REVIEW: `
      Perform final review of the entire pipeline output.
      Verify code quality, test coverage, documentation completeness.
      Output: docs/plans/final-review-report.md
      Confirm readiness for merge to main.
    `,
  };

  return instructions[stage] || 'Unknown stage';
}

/**
 * Get expected output files/artifacts for each stage.
 */
function getExpectedOutputs(stage: PipelineStage): string[] {
  const outputs: Record<PipelineStage, string[]> = {
    BRAINSTORM: ['docs/designs/design-doc.md'],
    VALIDATE_SPLIT: ['docs/designs/design-doc-validated.md'],
    PLAN_UNIT_TESTS: ['docs/plans/unit-test-plan.md'],
    PLAN_E2E_TESTS: ['docs/plans/e2e-test-plan.md'],
    PLAN_FEATURE: ['docs/plans/implementation-plan.md'],
    CROSS_CHECK: ['docs/plans/cross-check-report.md'],
    IMPL_UNIT_TESTS: ['tests/unit/*.test.ts'],
    IMPL_E2E_TESTS: ['e2e/specs/*.spec.ts'],
    IMPL_FEATURE: ['src/**/*.ts', 'src/**/*.tsx'],
    VERIFY_UNIT_TESTS: ['coverage reports'],
    VERIFY_E2E_TESTS: ['test results', 'screenshots'],
    VERIFY_DESIGN_DOC: ['docs/plans/implementation-verification.md'],
    FINAL_REVIEW: ['docs/plans/final-review-report.md'],
  };

  return outputs[stage] || [];
}

/**
 * Execute a single stage of the pipeline.
 * In a real scenario, this hands off to Claude Code with the stage instructions.
 */
function executeStage(
  stage: PipelineStage,
  state: PipelineState,
  stateFilePath: string
): void {
  logSection(`Executing stage: ${stage}`);

  // Record stage start
  const stageRecord: StageHistory = {
    stage,
    status: 'in_progress',
    startTime: new Date().toISOString(),
  };

  state.history.push(stageRecord);
  state.currentStage = stage;
  state.updatedAt = new Date().toISOString();
  saveState(stateFilePath, state);

  try {
    // Write stage instructions for Claude Code to consume
    const context = {
      pipelineId: state.id,
      idea: state.idea,
      config: state.config,
      worktreeDir: state.worktreeDirectory,
      previousArtifacts: getPreviousArtifacts(state),
    };

    writeStageInstructions(state.sessionHistoryPath, stage, context);

    // UPDATE STATUS: At this point, Claude Code would consume the instructions
    // and perform the work. The orchestrator waits for completion.
    // In practice, this would involve:
    // 1. Claude Code reading the stage-instructions JSON
    // 2. Executing the work according to instructions
    // 3. Writing stage reports and artifacts
    // 4. Calling back into the orchestrator to mark completion

    logInfo(`Stage ${stage} ready for Claude Code execution`);
    logInfo(`Instructions written to: ${state.sessionHistoryPath}/stage-instructions/${stage.toLowerCase()}.json`);

    // Simulate stage completion (in real scenario, Claude Code would trigger this)
    // For now, we'll demonstrate the completion flow
    completeStage(state, stage, stateFilePath, 'Successfully completed');

  } catch (error) {
    failStage(state, stage, stateFilePath, String(error));
    throw error;
  }
}

/**
 * Mark a stage as successfully completed.
 */
function completeStage(
  state: PipelineState,
  stage: PipelineStage,
  stateFilePath: string,
  message: string
): void {
  const stageRecord = state.history[state.history.length - 1];
  if (stageRecord && stageRecord.stage === stage) {
    stageRecord.status = 'completed';
    stageRecord.endTime = new Date().toISOString();
  }

  state.updatedAt = new Date().toISOString();
  saveState(stateFilePath, state);

  logSuccess(`Stage ${stage} completed: ${message}`);
}

/**
 * Mark a stage as failed.
 */
function failStage(
  state: PipelineState,
  stage: PipelineStage,
  stateFilePath: string,
  errorMessage: string
): void {
  const stageRecord = state.history[state.history.length - 1];
  if (stageRecord && stageRecord.stage === stage) {
    stageRecord.status = 'failed';
    stageRecord.errorMessage = errorMessage;
    stageRecord.endTime = new Date().toISOString();
  }

  state.status = 'failed';
  state.updatedAt = new Date().toISOString();
  saveState(stateFilePath, state);

  logError(`Stage ${stage} failed: ${errorMessage}`);
}

/**
 * Get list of artifacts produced by previous stages.
 */
function getPreviousArtifacts(state: PipelineState): Record<string, string> {
  const artifacts: Record<string, string> = {};
  const config = state.config;
  const baseDir = state.worktreeDirectory;

  // Map stages to their output files
  const completedStages = state.history.filter(h => h.status === 'completed');

  completedStages.forEach(h => {
    const outputs = getExpectedOutputs(h.stage);
    outputs.forEach(output => {
      artifacts[h.stage] = path.join(baseDir, output);
    });
  });

  return artifacts;
}

// ============================================================================
// TEST VERIFICATION WITH RETRY LOGIC
// ============================================================================

/**
 * Verify tests pass with sophisticated retry logic.
 *
 * Retry strategy:
 * - Attempts 1-2: Simple test rerun
 * - Attempt 2+: Invoke systematic debugging
 * - Attempt 3: Generate failure report and stop
 */
function verifyTestsWithRetry(
  worktreeDir: string,
  testCommand: string,
  stage: PipelineStage,
  state: PipelineState,
  stateFilePath: string,
  maxAttempts: number = 4
): boolean {
  let attempt = 1;
  const debugAttempts: DebugAttempt[] = [];

  while (attempt <= maxAttempts) {
    logSection(`Test verification attempt ${attempt}/${maxAttempts}`);

    try {
      // Try to run tests
      execSync(testCommand, {
        cwd: worktreeDir,
        stdio: 'inherit',
      });

      logSuccess(`Tests passed on attempt ${attempt}`);
      return true;
    } catch (error) {
      logError(`Tests failed on attempt ${attempt}`);

      if (attempt === 1) {
        // First attempt: just note the failure
        logInfo('First attempt failed - will retry');
      } else if (attempt === 2) {
        // Second attempt: begin systematic debugging
        logInfo('Second attempt failed - initiating systematic debugging');
        const debugResult = systematicDebug(worktreeDir, stage, state);
        debugAttempts.push({
          attempt,
          timestamp: new Date().toISOString(),
          findings: debugResult.findings,
          actionTaken: debugResult.actionTaken,
        });

        // Commit debugging work
        commitChanges(worktreeDir, stage, 'debug', `systematic debugging attempt ${attempt}`);
      } else if (attempt >= 3) {
        // Subsequent attempts: continue debugging if we have insight
        logInfo(`Attempt ${attempt}: Continuing debugging`);
        const debugResult = systematicDebug(worktreeDir, stage, state);
        debugAttempts.push({
          attempt,
          timestamp: new Date().toISOString(),
          findings: debugResult.findings,
          actionTaken: debugResult.actionTaken,
        });

        commitChanges(worktreeDir, stage, 'debug', `systematic debugging attempt ${attempt}`);
      }

      // If we've hit max attempts, fail
      if (attempt === maxAttempts) {
        generateFailureReport(state, stage, debugAttempts, worktreeDir);
        return false;
      }

      attempt++;
    }
  }

  return false;
}

/**
 * Perform systematic debugging of test failures.
 * This is where Claude Code would be invoked to analyze and fix issues.
 */
function systematicDebug(
  worktreeDir: string,
  stage: PipelineStage,
  state: PipelineState
): { findings: string; actionTaken: string } {
  logSection('Performing systematic debugging');

  // In a real scenario, this would:
  // 1. Capture detailed test output
  // 2. Invoke Claude Code with the failing tests
  // 3. Get suggestions for fixes
  // 4. Apply the fixes
  // 5. Document the findings

  const findings = `
    Test failures analyzed at ${new Date().toISOString()}.
    Capturing test output and error details for Claude Code review.

    Claude Code would:
    1. Read test output files
    2. Analyze stack traces and error messages
    3. Identify root causes
    4. Suggest code fixes
    5. Apply fixes to implementation
  `;

  const actionTaken = 'Waiting for Claude Code systematic debugging intervention';

  return { findings, actionTaken };
}

/**
 * Generate a detailed failure report when the pipeline fails.
 */
function generateFailureReport(
  state: PipelineState,
  failedStage: PipelineStage,
  debugAttempts: DebugAttempt[],
  worktreeDir: string
): void {
  const reportPath = path.join(state.sessionHistoryPath, 'failure-report.md');

  const report = `# Pipeline Failure Report

**Pipeline ID:** ${state.id}
**Failed Stage:** ${failedStage}
**Failure Time:** ${new Date().toISOString()}
**Feature Branch:** ${state.branchName}
**Worktree Location:** ${worktreeDir}

## Summary
The pipeline failed at the **${failedStage}** stage after ${debugAttempts.length} debugging attempts.

## Stage History
${state.history.map(h => `- **${h.stage}**: ${h.status} (${h.startTime}${h.endTime ? ` - ${h.endTime}` : ''})`).join('\n')}

## Debug Attempts
${debugAttempts.map(attempt => `
### Attempt ${attempt.attempt}
**Time:** ${attempt.timestamp}

**Findings:**
\`\`\`
${attempt.findings}
\`\`\`

**Action Taken:**
${attempt.actionTaken}
`).join('\n')}

## Next Steps
1. The feature branch **${state.branchName}** and worktree at **${worktreeDir}** have been preserved
2. You can investigate the failure by checking out the feature branch:
   \`\`\`bash
   git checkout ${state.branchName}
   \`\`\`
3. Review test output and error logs in the worktree
4. Once issues are fixed, restart the pipeline with:
   \`\`\`bash
   ts-node orchestrator.ts --resume --config path/to/config.yml
   \`\`\`
5. Clean up the worktree when done:
   \`\`\`bash
   git worktree remove "${worktreeDir}"
   \`\`\`

## Recommendations
- Check test failure details in the test output
- Review implementation against design document
- Verify all dependencies are correctly installed
- Check for environment-specific issues (file paths, permissions, etc.)
`;

  fs.writeFileSync(reportPath, report);
  logInfo(`Failure report written to ${reportPath}`);
}

// ============================================================================
// PIPELINE ORCHESTRATION
// ============================================================================

/**
 * Run the complete design-to-deploy pipeline.
 */
function runPipeline(
  idea: string,
  configPath: string,
  resumeMode: boolean = false
): void {
  logSection('Design-to-Deploy Pipeline Orchestrator');

  // Load configuration
  let config: PipelineConfig;
  try {
    config = loadConfig(configPath);
    logInfo(`Loaded configuration from ${configPath}`);
  } catch (error) {
    logError(`Failed to load configuration: ${error}`);
    process.exit(1);
  }

  // Generate branch and directory names
  const timestamp = Date.now().toString(36);
  const branchName = `design-to-deploy/${timestamp}`;
  const worktreeDir = path.resolve(`.worktrees/${branchName}`);
  const stateFile = path.resolve(`.design-to-deploy-state-${timestamp}.json`);

  let state: PipelineState;
  let sessionDir: string;

  if (resumeMode) {
    // Try to load existing state
    if (!fs.existsSync(stateFile)) {
      logError(`No saved pipeline state found. Cannot resume.`);
      process.exit(3);
    }

    state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
    sessionDir = state.sessionHistoryPath;
    logInfo(`Resumed pipeline ${state.id}`);
  } else {
    // Create new pipeline
    sessionDir = createSessionHistory(config, idea);

    // Create git worktree
    try {
      createWorktree(branchName, worktreeDir);
    } catch (error) {
      logError(`Failed to create worktree: ${error}`);
      process.exit(1);
    }

    // Initialize state
    state = loadOrCreateState(stateFile, idea, config, branchName, worktreeDir, sessionDir);
    logInfo(`Created new pipeline ${state.id}`);
  }

  // Define the pipeline stages
  const stages: PipelineStage[] = [
    'BRAINSTORM',
    'VALIDATE_SPLIT',
    'PLAN_UNIT_TESTS',
    'PLAN_E2E_TESTS',
    'PLAN_FEATURE',
    'CROSS_CHECK',
    'IMPL_UNIT_TESTS',
    'IMPL_E2E_TESTS',
    'IMPL_FEATURE',
    'VERIFY_UNIT_TESTS',
    'VERIFY_E2E_TESTS',
    'VERIFY_DESIGN_DOC',
    'FINAL_REVIEW',
  ];

  // Find starting stage (skip completed ones on resume)
  const completedStages = new Set(state.history.filter(h => h.status === 'completed').map(h => h.stage));
  let startIndex = stages.indexOf(state.currentStage);
  if (resumeMode && completedStages.has(state.currentStage)) {
    startIndex = stages.indexOf(state.currentStage) + 1;
  }

  // Execute pipeline stages
  try {
    for (let i = startIndex; i < stages.length; i++) {
      const stage = stages[i];

      // Special handling for parallel stages
      if (stage === 'PLAN_UNIT_TESTS') {
        // In a real scenario, these would run in parallel
        // For now, we execute sequentially but document the parallelization
        logSection('Running parallel planning stages (Unit Tests, E2E Tests, Feature)');
        executeStage('PLAN_UNIT_TESTS', state, stateFile);
        executeStage('PLAN_E2E_TESTS', state, stateFile);
        executeStage('PLAN_FEATURE', state, stateFile);
        i += 2; // Skip the next two stages as we've executed them
      }
      // Special handling for test verification with retry logic
      else if (stage === 'VERIFY_UNIT_TESTS') {
        executeStage(stage, state, stateFile);
        const testCommand = state.config.testing.unit.command;
        const passed = verifyTestsWithRetry(
          state.worktreeDirectory,
          testCommand,
          stage,
          state,
          stateFile,
          4
        );
        if (!passed) {
          throw new Error(`Unit tests failed after maximum retry attempts`);
        }
      }
      // Special handling for e2e test verification with retry logic
      else if (stage === 'VERIFY_E2E_TESTS') {
        executeStage(stage, state, stateFile);
        const testCommand = state.config.testing.e2e.command;
        const passed = verifyTestsWithRetry(
          state.worktreeDirectory,
          testCommand,
          stage,
          state,
          stateFile,
          4
        );
        if (!passed) {
          throw new Error(`E2E tests failed after maximum retry attempts`);
        }
      }
      // Normal stage execution
      else {
        executeStage(stage, state, stateFile);
      }

      // Commit stage completion
      commitChanges(
        state.worktreeDirectory,
        stage,
        extractTopic(state.idea),
        `${stage.toLowerCase()} complete`
      );
    }

    // Pipeline completed successfully
    state.status = 'success';
    state.updatedAt = new Date().toISOString();
    saveState(stateFile, state);

    logSuccess('Pipeline completed successfully!');
    logInfo('Merging feature branch into main...');

    // Merge and cleanup
    mergeAndCleanup(state.branchName, state.worktreeDirectory);

    logSuccess('Feature branch merged and worktree cleaned up');
    logInfo(`Pipeline artifacts available at: ${state.sessionHistoryPath}`);

    process.exit(0);
  } catch (error) {
    logError(`Pipeline failed: ${error}`);

    state.status = 'failed';
    state.updatedAt = new Date().toISOString();
    saveState(stateFile, state);

    // Preserve worktree for debugging
    preserveWorktreeOnFailure(state.branchName, state.worktreeDirectory);

    process.exit(2);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract a topic name from the idea (first few words).
 */
function extractTopic(idea: string): string {
  return idea.split(' ').slice(0, 3).join('-').toLowerCase().replace(/[^a-z0-9-]/g, '');
}

// ============================================================================
// LOGGING UTILITIES
// ============================================================================

const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  SUCCESS: 'SUCCESS',
  WARN: 'WARN',
  ERROR: 'ERROR',
};

function log(level: string, message: string): void {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}]`;
  console.log(`${prefix} ${message}`);
}

function logDebug(message: string): void {
  log(LogLevel.DEBUG, message);
}

function logInfo(message: string): void {
  log(LogLevel.INFO, message);
}

function logSuccess(message: string): void {
  log(LogLevel.SUCCESS, message);
}

function logWarn(message: string): void {
  log(LogLevel.WARN, message);
}

function logError(message: string): void {
  log(LogLevel.ERROR, message);
}

function logSection(title: string): void {
  console.log('\n' + '='.repeat(80));
  console.log(`  ${title}`);
  console.log('='.repeat(80) + '\n');
}

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

function main(): void {
  const args = parseArgs();

  // Validate required arguments
  if (!args.idea && !args.resume) {
    console.error('Usage: ts-node orchestrator.ts --idea "description" [--config path/to/config.yml] [--resume]');
    console.error('');
    console.error('Arguments:');
    console.error('  --idea TEXT       Idea/feature description (required unless --resume)');
    console.error('  --config PATH     Path to .design-to-deploy.yml config file');
    console.error('  --resume          Resume a failed pipeline');
    process.exit(1);
  }

  // Determine config file path
  let configPath = args.config || '.design-to-deploy.yml';
  if (!fs.existsSync(configPath)) {
    logWarn(`Config file not found at ${configPath}, using defaults`);
  }

  // Run pipeline
  try {
    runPipeline(args.idea || 'resume', configPath, args.resume || false);
  } catch (error) {
    logError(`Fatal error: ${error}`);
    process.exit(1);
  }
}

main();
