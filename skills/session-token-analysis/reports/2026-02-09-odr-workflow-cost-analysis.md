# ODR Project Workflow Cost Analysis

**Date:** 2026-02-09
**Project:** international-odr (primarily)
**Sessions analysed:** 22 sessions across 8 workflow chains
**Purpose:** Compare token costs between all-in-one design-to-deploy and split brainstorm → plan → execute workflows

## Executive Summary

Across 8 workflow chains spanning Jan 19 – Feb 9, the **execute-plan phase consistently dominates cost**, regardless of whether the workflow is split or all-in-one. The cheapest Opus chain was `$24.78` (Chain C), the most expensive was `$117.55` (Chain B). Sonnet chains cost 50–80% less than equivalent Opus chains. No chain used proactive compaction effectively.

| Approach | Chains | Cost Range | Avg Cost |
|----------|--------|-----------|----------|
| All-in-one (Opus) | A | `$32.09` | `$32.09` |
| Split sessions (Opus 4.6) | B, C | `$24.78` – `$117.55` | `$71.17` |
| Split sessions (Opus 4.5) | D, E, F | `$39.30` – `$111.54` | `$75.98` |
| Split sessions (Sonnet 4.5) | G, H | `$18.36` – `$48.34` | `$33.35` |

## All Workflow Chains

### Chain A — All-in-One Design-to-Deploy (Opus 4.6, Feb 9)

A single session running the full `/design-to-deploy` skill.

| Session ID | Phase | Duration | Turns | Eff. Input | Peak Context | Est. Cost |
|-----------|-------|----------|-------|------------|-------------|-----------|
| `615373a8` | Full pipeline | 1h 11m | 102 | 8.1M | 156K (turn 59) | `$32.09` |

### Chain B — Split Sessions (Opus 4.6, Feb 9)

Brainstorm → brainstorm → TDD → execute across four consecutive sessions.

| Session ID | Phase | Duration | Turns | Eff. Input | Peak Context | Est. Cost |
|-----------|-------|----------|-------|------------|-------------|-----------|
| `98ec9b7a` | Brainstorm | 19m | 25 | 967K | 53K | `$3.52` |
| `1f2b5e75` | Brainstorm pt.2 | 21m | 42 | 2.5M | 116K | `$13.95` |
| `ae3ae8f9` | TDD + debugging | 21m | 123 | 8.5M | 110K | `$29.64` |
| `fe0b62ca` | Execute plan | 42m | 317 | 27.2M | 167K | `$70.44` |
| | **Total** | **1h 43m** | **507** | **39.1M** | | **`$117.55`** |

### Chain C — Split Sessions (Opus 4.6, Feb 5–6)

The most cost-efficient Opus chain. Fast execute phase with only 70 turns.

| Session ID | Phase | Duration | Turns | Eff. Input | Peak Context | Est. Cost |
|-----------|-------|----------|-------|------------|-------------|-----------|
| `26022764` | Brainstorm | 20m | 26 | 854K | — | `$2.93` |
| `3d025aa3` | Write plans | 19m | 40 | 2.1M | — | `$10.11` |
| `7b51280c` | Execute plans | 6m | 70 | 3.3M | — | `$11.74` |
| | **Total** | **45m** | **136** | **6.3M** | | **`$24.78`** |

### Chain D — Split Sessions (Opus 4.5, Feb 3–4)

The most expensive execute session across all chains — 439 turns, `$104`.

| Session ID | Phase | Duration | Turns | Eff. Input | Peak Context | Est. Cost |
|-----------|-------|----------|-------|------------|-------------|-----------|
| `570cb7a6` | Brainstorm | 14m | 41 | 1.4M | — | `$4.10` |
| `9e12700c` | Write plans | 12m | 27 | 931K | — | `$3.37` |
| `2dee4191` | Execute plans | 1h 19m | 439 | 44.9M | 166K | `$104.07` |
| | **Total** | **1h 45m** | **507** | **47.2M** | | **`$111.54`** |

### Chain E — Split Sessions (Opus 4.5, Jan 29)

Two brainstorm sessions followed by plan + execute.

| Session ID | Phase | Duration | Turns | Eff. Input | Peak Context | Est. Cost |
|-----------|-------|----------|-------|------------|-------------|-----------|
| `119f2cd3` | Brainstorm | 13m | 26 | 913K | — | `$2.60` |
| `fdcce930` | Brainstorm pt.2 | 2m | 5 | 136K | — | `$0.54` |
| `3fbfbb88` | Write plans | 6m | 17 | 625K | — | `$2.47` |
| `1eed460a` | Execute plans | 18h* | 160 | 9.7M | — | `$33.69` |
| | **Total** | **~18h*** | **208** | **11.4M** | | **`$39.30`** |

*Duration includes idle time — session was likely left open overnight.

### Chain F — Split Sessions (Opus 4.5, Jan 28–29)

Execute phase hit 148K context without compaction.

| Session ID | Phase | Duration | Turns | Eff. Input | Peak Context | Est. Cost |
|-----------|-------|----------|-------|------------|-------------|-----------|
| `111624d2` | Brainstorm | 23m | 56 | 2.7M | — | `$6.80` |
| `52d5067c` | Write plans | 9m | 33 | 1.6M | — | `$6.57` |
| `255c9e9a` | Execute plans | 35m | 237 | 23.3M | 148K | `$63.73` |
| | **Total** | **~1h 7m** | **326** | **27.6M** | | **`$77.10`** |

### Chain G — Split Sessions (Sonnet 4.5, Jan 19–20)

Highest turn count (1,099) but Sonnet pricing kept costs manageable.

| Session ID | Phase | Duration | Turns | Eff. Input | Peak Context | Est. Cost |
|-----------|-------|----------|-------|------------|-------------|-----------|
| `0e52cb80` | Brainstorm | 3h 49m | 210 | 22.3M | — | `$12.59` |
| `ad96a1f6` | Write plans | 8m | 38 | 2.4M | — | `$1.75` |
| `3a0c2e04` | Execute plans | 4h 14m | 851 | 85.9M | — | `$34.00` |
| | **Total** | **~8h** | **1,099** | **110.6M** | | **`$48.34`** |

### Chain H — Split Sessions (Sonnet 4.5, Jan 22)

Cheapest overall chain. Combined brainstorm + plan into one session.

| Session ID | Phase | Duration | Turns | Eff. Input | Peak Context | Est. Cost |
|-----------|-------|----------|-------|------------|-------------|-----------|
| `267b6962` | Brainstorm + plan | 26m | 89 | 5.0M | — | `$2.65` |
| `72808a0f` | Execute plans | 49m | 455 | 40.9M | — | `$15.71` |
| | **Total** | **~1h 14m** | **544** | **45.9M** | | **`$18.36`** |

## Cross-Chain Comparison

### Total Cost by Chain

| Chain | Model | Phases | Turns | Eff. Input | Est. Cost | Cost/Turn |
|-------|-------|--------|-------|------------|-----------|-----------|
| A (all-in-one) | Opus 4.6 | 1 session | 102 | 8.1M | `$32.09` | `$0.31` |
| B (split) | Opus 4.6 | 4 sessions | 507 | 39.1M | `$117.55` | `$0.23` |
| C (split) | Opus 4.6 | 3 sessions | 136 | 6.3M | `$24.78` | `$0.18` |
| D (split) | Opus 4.5 | 3 sessions | 507 | 47.2M | `$111.54` | `$0.22` |
| E (split) | Opus 4.5 | 4 sessions | 208 | 11.4M | `$39.30` | `$0.19` |
| F (split) | Opus 4.5 | 3 sessions | 326 | 27.6M | `$77.10` | `$0.24` |
| G (split) | Sonnet 4.5 | 3 sessions | 1,099 | 110.6M | `$48.34` | `$0.04` |
| H (split) | Sonnet 4.5 | 2 sessions | 544 | 45.9M | `$18.36` | `$0.03` |

### Cost by Phase (All Chains)

| Phase | Sessions | Avg Turns | Avg Cost (Opus) | Avg Cost (Sonnet) |
|-------|----------|-----------|-----------------|-------------------|
| Brainstorm | 10 | 50 | `$4.58` | `$12.59`* |
| Write plans | 5 | 31 | `$5.71` | `$1.75` |
| Execute plans | 7 | 361 | `$56.74` | `$24.86` |
| TDD/debugging | 1 | 123 | `$29.64` | — |

*Sonnet brainstorm had 210 turns — high turn count but cheap per-turn pricing.

### Execute Phase Deep Dive

The execute phase dominates cost in every chain. Here's how it varies:

| Chain | Model | Execute Turns | Execute Cost | % of Chain Total |
|-------|-------|--------------|-------------|-----------------|
| A | Opus 4.6 | 102* | `$32.09`* | 100% |
| B | Opus 4.6 | 317 | `$70.44` | 60% |
| C | Opus 4.6 | 70 | `$11.74` | 47% |
| D | Opus 4.5 | 439 | `$104.07` | 93% |
| E | Opus 4.5 | 160 | `$33.69` | 86% |
| F | Opus 4.5 | 237 | `$63.73` | 83% |
| G | Sonnet 4.5 | 851 | `$34.00` | 70% |
| H | Sonnet 4.5 | 455 | `$15.71` | 86% |

*Chain A is all-in-one, so the full session is the "execute" phase.

## Key Findings

### 1. The Execute Phase Is the Cost Centre

Across all 8 chains, the execute phase accounts for **47–93% of total cost**. The brainstorm and planning phases are comparatively cheap (`$1`–13 each). Optimising the execute phase would yield the largest savings.

### 2. Turn Count Varies Wildly (70–851 for Execute)

The most efficient execute session (Chain C) used 70 turns and cost `$11.74`. The least efficient (Chain G on Sonnet) used 851 turns. On Opus, Chain D's 439-turn execute cost `$104`. **Turn count is the single strongest predictor of cost.**

| Execute Turns | Opus Cost | Sonnet Cost |
|--------------|-----------|-------------|
| 70 | `$11.74` | `~$2` |
| 160 | `$33.69` | `~$6` |
| 237 | `$63.73` | `~$12` |
| 317 | `$70.44` | `~$14` |
| 439 | `$104.07` | `~$20` |
| 455 | — | `$15.71` |
| 851 | — | `$34.00` |

### 3. Sonnet Is 5–6x Cheaper Per Turn

| Model | Avg Cost/Turn | Turn Cost at 80K Context |
|-------|--------------|------------------------|
| Opus 4.6 | `$0.23` – `$0.31` | `~$0.27` |
| Opus 4.5 | `$0.19` – `$0.24` | `~$0.22` |
| Sonnet 4.5 | `$0.03` – `$0.04` | `~$0.04` |

Sonnet uses more turns to accomplish the same work, but at 1/6th the cost per turn, it's still dramatically cheaper. Even Chain G (1,099 turns on Sonnet) cost less than Chain C (136 turns on Opus).

### 4. Split vs All-in-One: Split Can Be Better or Worse

Splitting the workflow into separate sessions doesn't guarantee savings. It depends entirely on how many turns the execute phase takes:

- **Chain C (split, `$24.78`)** < **Chain A (all-in-one, `$32.09`)** — split was cheaper because execute only needed 70 turns
- **Chain B (split, `$117.55`)** > **Chain A (all-in-one, `$32.09`)** — split was 3.7x more expensive because execute ballooned to 317 turns

The advantage of splitting is **context isolation** — each phase starts fresh. The risk is **turn count explosion** in the execute phase when the agent struggles with implementation.

### 5. Compaction Is Consistently Late or Absent

| Chain | Peak Context Before Compaction | Compaction Used |
|-------|-------------------------------|-----------------|
| A | 156K | Auto at turn 62 |
| B (execute) | 167K | Auto at turn 208 |
| D (execute) | 166K | Auto at turn 274 |
| F (execute) | 148K | None |
| G (brainstorm) | — | Auto at turn 140 |
| G (execute) | — | Auto at turns 215, 517 |
| H (execute) | — | Auto at turn 372 |

No session used proactive `/compact`. Every compaction was automatic, triggered after context had already grown to 150K+ tokens.

### 6. Cache Creation Is the Hidden Cost on Opus

On Opus, cache creation costs `$18.75/M` — **10x more than cache reads** (`$1.875/M`). Every time context changes (new messages, tool results), the changed portion is re-written to cache. On long sessions with many tool calls, this dominates.

| Chain | Cache Create Cost | Cache Read Cost | Create as % of Total |
|-------|------------------|----------------|---------------------|
| A | `$18.34` | `$13.44` | 57% |
| B | — | — | — |
| D (execute) | `$18.56` | `$84.92` | 18% |
| F (execute) | `$16.38` | `$46.92` | 26% |

## Recommendations

### Immediate: Model Selection

The single highest-impact change. Based on the data:

| If you... | Expected savings |
|-----------|-----------------|
| Run execute phase on Sonnet instead of Opus | 75–80% on execute cost |
| Run brainstorm + plan on Sonnet, execute on Opus | 40–60% overall |
| Run everything on Sonnet | 70–85% overall |

Reserve Opus for:
- Complex debugging (systematic-debugger)
- Architecturally complex feature implementation
- Sessions where Sonnet has already failed

### Immediate: Proactive Compaction

Run `/compact` when context exceeds 60–80K tokens. Based on the data, this would typically save `$5`–15 per execute session by reducing cache creation costs.

Recommended compaction checkpoints:
1. After Phase 1 brainstorm completes
2. After collecting parallel planning results
3. Mid-execute when context exceeds 80K
4. Before starting a new implementation sub-task within execute

### Structural: Turn Budget Enforcement

Set turn limits per phase and alert when exceeded:

| Phase | Target | Warning | Stop |
|-------|--------|---------|------|
| Brainstorm | 15–30 | 40 | 60 |
| Write plans | 15–30 | 40 | 50 |
| Execute plans | 50–100 | 150 | 300 |
| Per sub-task | 10–20 | 30 | 50 |

Chain C's 70-turn execute demonstrates that efficient execution is achievable. Chains D (439) and G (851) show what happens without turn discipline.

### Structural: Sub-Agent Model Selection

Pipeline skills (design-to-deploy, executing-plans) should specify model tier per stage:

| Stage | Model | Rationale |
|-------|-------|-----------|
| Scope validation | Haiku | Checklist-based |
| Test/feature planning | Sonnet | Structured output |
| Cross-check review | Sonnet | Comparison task |
| Test implementation | Sonnet | Code from plan |
| Feature implementation | Sonnet (Opus for complex) | Code from plan |
| Test verification | Sonnet | Run and read output |
| Systematic debugging | Opus | Complex reasoning |
| Final review | Haiku | Summarisation |

### Monitoring: Post-Session Analysis

Run `session-token-analysis` after expensive sessions. The updated script now correctly reports:
- Effective input (not raw `input_tokens`)
- Estimated cost with model-specific pricing
- Compaction events
- Per-turn cost
- Context growth using peak (not last turn)

## Analysis Script Bugs Fixed

During this investigation, several bugs were found and fixed in `analyze_sessions.py`:

| Bug | Impact | Fix |
|-----|--------|-----|
| Context growth used raw `input_tokens` (162) instead of effective input (8.1M) | Reported "0.3x growth" instead of "5.0x" | Now uses per-turn effective input |
| Avg input/turn used raw `input_tokens` | Showed "2 tokens/turn" instead of "79,848" | Now uses effective input |
| No cost estimation | Most useful metric was missing | Added model-specific cost breakdown |
| No compaction detection | Auto-compaction events were invisible | Detects >50% context drops |
| User messages included tool results | Showed "67 user messages" instead of "17" | Separates real user messages from tool results |
| Recommendations missed high-cost sessions | Reported "all efficient" on a `$32` session | Added cost, turn count, and uncompacted context checks |

## Appendix: Pricing Reference

| Model | Input | Output | Cache Write | Cache Read |
|-------|-------|--------|-------------|------------|
| Opus 4.6 | `$15.00/M` | `$75.00/M` | `$18.75/M` | `$1.875/M` |
| Opus 4.5 | `$15.00/M` | `$75.00/M` | `$18.75/M` | `$1.875/M` |
| Sonnet 4.5 | `$3.00/M` | `$15.00/M` | `$3.75/M` | `$0.30/M` |
| Haiku 4.5 | `$0.80/M` | `$4.00/M` | `$1.00/M` | `$0.08/M` |
