/**
 * Shared TypeScript Type Definitions for Design-to-Deploy Pipeline
 *
 * This module defines all types used across the pipeline, including:
 * - Configuration types
 * - Pipeline state types
 * - Stage instruction types
 * - Result/output types
 *
 * These types ensure type safety when passing data between pipeline stages
 * and when Claude Code agents construct or read stage artifacts.
 */

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/**
 * Testing framework configuration for a specific test type
 */
export interface TestFrameworkConfig {
  /** Name of the testing framework (e.g., "vitest", "jest", "playwright") */
  framework: string;
  /** Relative path to framework configuration file */
  config: string;
  /** Command to execute tests (must exit with 0 on success) */
  command: string;
  /** Optional timeout in milliseconds */
  timeout?: number;
  /** Optional coverage threshold (0-100) */
  coverage_threshold?: number;
}

/**
 * End-to-end testing configuration (extends TestFrameworkConfig)
 */
export interface E2ETestConfig extends TestFrameworkConfig {
  /** Directory where screenshots are saved on failure */
  screenshot_dir: string;
}

/**
 * Complete testing configuration
 */
export interface TestingConfig {
  unit: TestFrameworkConfig;
  e2e: E2ETestConfig;
}

/**
 * Output paths configuration
 */
export interface PathsConfig {
  /** Directory for design documents */
  designs: string;
  /** Directory for test plans and implementation plans */
  plans: string;
  /** Directory for session history (timestamped subdirectories) */
  session_history: string;
}

/**
 * Validation constraints for pipeline execution
 */
export interface ValidationConfig {
  /** Maximum files a single design should create */
  max_files_to_create: number;
  /** Maximum implementation hours for a single design */
  max_implementation_hours: number;
  /** Whether to require explicit scope declaration in design doc */
  require_scope_declaration: boolean;
}

/**
 * Complete pipeline configuration
 */
export interface PipelineConfig {
  testing: TestingConfig;
  paths: PathsConfig;
  validation: ValidationConfig;
  /** Optional git configuration */
  git?: {
    merge_strategy?: 'merge' | 'squash' | 'rebase';
    push_to_remote?: boolean;
    default_branch?: string;
  };
  /** Optional Claude configuration for advanced usage */
  claude?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  };
  /** Optional retry configuration */
  retry?: {
    max_attempts?: number;
    delay_between_attempts?: number;
    verbose_debugging?: boolean;
  };
}

// ============================================================================
// PIPELINE STAGE TYPES
// ============================================================================

/**
 * All possible pipeline stages
 */
export type PipelineStage =
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

/**
 * Stage execution status
 */
export type StageStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * Overall pipeline status
 */
export type PipelineStatus = 'running' | 'success' | 'failed' | 'paused';

/**
 * Record of a single stage execution
 */
export interface StageHistory {
  /** The stage that was executed */
  stage: PipelineStage;
  /** Current status of the stage */
  status: StageStatus;
  /** ISO 8601 timestamp when stage started */
  startTime: string;
  /** ISO 8601 timestamp when stage ended (if completed or failed) */
  endTime?: string;
  /** Error message if stage failed */
  errorMessage?: string;
  /** Number of retry attempts (for verification stages) */
  retryCount?: number;
  /** Additional metadata or notes */
  metadata?: Record<string, unknown>;
}

/**
 * Complete pipeline execution state
 */
export interface PipelineState {
  /** Unique identifier for this pipeline run */
  id: string;
  /** Original idea/feature description */
  idea: string;
  /** ISO 8601 timestamp when pipeline was created */
  createdAt: string;
  /** ISO 8601 timestamp when pipeline state was last updated */
  updatedAt: string;
  /** Current pipeline stage */
  currentStage: PipelineStage;
  /** Overall pipeline status */
  status: PipelineStatus;
  /** Git feature branch name */
  branchName: string;
  /** Absolute path to git worktree directory */
  worktreeDirectory: string;
  /** Absolute path to session history directory */
  sessionHistoryPath: string;
  /** Complete history of all stage executions */
  history: StageHistory[];
  /** Pipeline configuration */
  config: PipelineConfig;
  /** Optional custom metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// STAGE INSTRUCTION TYPES
// ============================================================================

/**
 * Instructions for a specific pipeline stage
 * Written to stage-instructions/{stage}.json for Claude Code to consume
 */
export interface StageInstructions {
  /** The stage these instructions are for */
  stage: PipelineStage;
  /** ISO 8601 timestamp when instructions were created */
  timestamp: string;
  /** Detailed instructions for what to do in this stage */
  instructions: string;
  /** Context information for this stage */
  context: StageContext;
  /** List of expected output files/artifacts */
  expectedOutputs: string[];
}

/**
 * Context provided to a stage
 */
export interface StageContext {
  /** Unique identifier for the pipeline run */
  pipelineId: string;
  /** Original idea/feature description */
  idea: string;
  /** Complete pipeline configuration */
  config: PipelineConfig;
  /** Absolute path to the git worktree */
  worktreeDir: string;
  /** Artifacts produced by previous stages */
  previousArtifacts: Record<PipelineStage, string>;
  /** Optional stage-specific context */
  stageSpecific?: Record<string, unknown>;
}

// ============================================================================
// STAGE REPORT TYPES
// ============================================================================

/**
 * Report written by Claude Code after completing a stage
 * Saved to stage-reports/{stage}.json
 */
export interface StageReport {
  /** The stage that was completed */
  stage: PipelineStage;
  /** ISO 8601 timestamp when stage was completed */
  completedAt: string;
  /** Whether the stage succeeded */
  success: boolean;
  /** Summary of what was done */
  summary: string;
  /** Any errors or issues encountered */
  errors?: string[];
  /** Warnings or notes for next stages */
  warnings?: string[];
  /** Files created or modified in this stage */
  outputFiles: string[];
  /** Optional detailed findings or analysis */
  details?: {
    [key: string]: unknown;
  };
}

// ============================================================================
// DEBUG & RETRY TYPES
// ============================================================================

/**
 * Record of a debugging attempt during test verification
 */
export interface DebugAttempt {
  /** Attempt number (1, 2, 3, etc.) */
  attempt: number;
  /** ISO 8601 timestamp of this attempt */
  timestamp: string;
  /** What was found/analyzed */
  findings: string;
  /** Action taken to fix the issue */
  actionTaken: string;
  /** Optional detailed debug logs */
  logs?: string;
}

/**
 * Result of test verification with retry attempts
 */
export interface TestVerificationResult {
  /** Whether tests ultimately passed */
  passed: boolean;
  /** Total number of attempts made */
  totalAttempts: number;
  /** Attempt on which tests passed (if passed) */
  passedOnAttempt?: number;
  /** All debug attempts (if any) */
  debugAttempts: DebugAttempt[];
  /** Final test output/error message */
  finalOutput: string;
  /** Total time spent on verification */
  duration: number;
}

/**
 * Failure report generated when pipeline fails
 */
export interface FailureReport {
  /** Pipeline ID that failed */
  pipelineId: string;
  /** Stage where failure occurred */
  failedStage: PipelineStage;
  /** ISO 8601 timestamp of failure */
  failureTime: string;
  /** Git feature branch name (preserved for debugging) */
  branchName: string;
  /** Path to git worktree (preserved for debugging) */
  worktreePath: string;
  /** Complete stage history up to failure */
  stageHistory: StageHistory[];
  /** Debug attempts if failure was during test verification */
  debugAttempts?: DebugAttempt[];
  /** Human-readable summary of what went wrong */
  summary: string;
  /** Recommended next steps */
  nextSteps: string[];
}

// ============================================================================
// DESIGN DOCUMENT TYPES
// ============================================================================

/**
 * Design document produced by BRAINSTORM stage
 */
export interface DesignDocument {
  /** Title/name of the feature */
  title: string;
  /** Description of the feature to implement */
  description: string;
  /** User stories or use cases */
  userStories: string[];
  /** Technical approach and architecture */
  technicalApproach: string;
  /** ASCII diagram of architecture (optional) */
  architectureDiagram?: string;
  /** Acceptance criteria */
  acceptanceCriteria: string[];
  /** Non-functional requirements */
  nonFunctionalRequirements: string[];
  /** Assumptions made in the design */
  assumptions: string[];
  /** Identified risks and mitigations */
  risks: Array<{ risk: string; mitigation: string }>;
  /** Estimated scope (number of files, hours) */
  estimatedScope: {
    filesToCreate: number;
    estimatedHours: number;
  };
}

/**
 * Validated/split design document
 */
export interface ValidatedDesignDocument extends DesignDocument {
  /** Validation timestamp */
  validatedAt: string;
  /** Whether scope is within limits */
  isWithinScope: boolean;
  /** If split, IDs of resulting designs */
  splitDesignIds?: string[];
  /** Validation notes/comments */
  validationNotes: string;
}

// ============================================================================
// TEST PLAN TYPES
// ============================================================================

/**
 * Unit test plan produced by PLAN_UNIT_TESTS stage
 */
export interface UnitTestPlan {
  /** Reference to design document */
  designDocId: string;
  /** Test categories/suites */
  testCategories: UnitTestCategory[];
  /** Coverage goals and targets */
  coverageGoals: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  /** Edge cases to test */
  edgeCases: string[];
  /** Mocking strategy */
  mockingStrategy: string;
  /** Test data fixtures */
  fixtures: TestFixture[];
}

/**
 * Category of unit tests
 */
export interface UnitTestCategory {
  name: string;
  description: string;
  testCases: string[];
}

/**
 * E2E test plan produced by PLAN_E2E_TESTS stage
 */
export interface E2ETestPlan {
  /** Reference to design document */
  designDocId: string;
  /** User flows to test */
  userFlows: UserFlow[];
  /** Test scenarios */
  scenarios: TestScenario[];
  /** Success criteria for tests */
  successCriteria: string[];
  /** Environment setup requirements */
  environmentSetup: string;
  /** Data fixtures needed */
  fixtures: TestFixture[];
}

/**
 * A user flow or journey to test
 */
export interface UserFlow {
  name: string;
  steps: string[];
  expectedOutcome: string;
}

/**
 * A test scenario
 */
export interface TestScenario {
  name: string;
  preconditions: string[];
  actions: string[];
  expectedResults: string[];
}

/**
 * Test data fixture
 */
export interface TestFixture {
  name: string;
  description: string;
  data: unknown;
}

// ============================================================================
// IMPLEMENTATION PLAN TYPES
// ============================================================================

/**
 * Implementation plan produced by PLAN_FEATURE stage
 */
export interface ImplementationPlan {
  /** Reference to design document */
  designDocId: string;
  /** Step-by-step implementation approach */
  implementationSteps: ImplementationStep[];
  /** Component breakdown */
  components: Component[];
  /** Dependencies and their versions */
  dependencies: Dependency[];
  /** Recommended file structure */
  fileStructure: FileStructure;
  /** Integration points with existing code */
  integrationPoints: string[];
  /** Potential breaking changes */
  breakingChanges: string[];
}

/**
 * Single implementation step
 */
export interface ImplementationStep {
  order: number;
  name: string;
  description: string;
  expectedOutputs: string[];
}

/**
 * Component to implement
 */
export interface Component {
  name: string;
  path: string;
  type: 'function' | 'class' | 'component' | 'module';
  responsibility: string;
  dependencies: string[];
}

/**
 * External dependency
 */
export interface Dependency {
  name: string;
  version: string;
  purpose: string;
}

/**
 * Recommended file structure
 */
export interface FileStructure {
  [path: string]: string; // path -> description
}

// ============================================================================
// CROSS-CHECK TYPES
// ============================================================================

/**
 * Result of cross-checking all plans against design doc
 */
export interface CrossCheckReport {
  /** Reference to design document */
  designDocId: string;
  /** Timestamp of cross-check */
  checkedAt: string;
  /** Whether all plans are consistent with design */
  isConsistent: boolean;
  /** Issues found during cross-check */
  issues: CrossCheckIssue[];
  /** Resolutions for identified issues */
  resolutions: string[];
}

/**
 * An issue found during cross-check
 */
export interface CrossCheckIssue {
  severity: 'error' | 'warning' | 'info';
  plan: 'unit-tests' | 'e2e-tests' | 'implementation';
  message: string;
  location?: string;
}

// ============================================================================
// CLI ARGUMENT TYPES
// ============================================================================

/**
 * Parsed command-line arguments
 */
export interface CLIArgs {
  /** Feature idea/description */
  idea?: string;
  /** Path to configuration file */
  config?: string;
  /** Resume a failed pipeline */
  resume?: boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Result of executing a git operation
 */
export interface GitOperationResult {
  success: boolean;
  command: string;
  output: string;
  error?: string;
}

/**
 * Session metadata
 */
export interface SessionMetadata {
  /** Timestamp when session was created */
  timestamp: string;
  /** Original feature idea */
  idea: string;
  /** ISO 8601 creation timestamp */
  createdAt: string;
}
