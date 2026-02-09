---
name: session-token-analysis
description: "Use when the user wants to analyse Claude Code session token usage, review session efficiency, check cache hit rates, or understand token consumption patterns. Analyses the most recent JSONL session logs from ~/.claude/projects/."
allowed-tools:
  - Bash
  - Read
  - Task
argument-hint: "[number-of-sessions]"
---

# Session Token Analysis

Analyse Claude Code session logs for token usage efficiency, cache performance, and context growth patterns.

## Overview

This skill parses JSONL session logs from `~/.claude/projects/` and produces a detailed efficiency report covering per-session metrics, cross-session comparisons, and actionable recommendations.

## When to Use

- After a long coding session to review token spend
- When sessions feel slow or expensive and you want data
- To compare efficiency across recent sessions
- To decide when to use `/compact` more aggressively
- To identify patterns in tool use and context growth

## How to Run

Run the analysis script. By default it analyses the 5 most recent sessions:

```bash
python3 skills/session-token-analysis/scripts/analyze_sessions.py
```

To analyse a different number of sessions:

```bash
python3 skills/session-token-analysis/scripts/analyze_sessions.py --sessions 10
```

To analyse a specific session file:

```bash
python3 skills/session-token-analysis/scripts/analyze_sessions.py --file ~/.claude/projects/some-project/session.jsonl
```

## What It Reports

### Per-Session Metrics

| Metric | Description |
|--------|-------------|
| Session overview | Start time, end time, duration, model, project directory |
| Effective input | cache_read + cache_creation + uncached input (real context processed) |
| Token breakdown | Cache read, cache creation, uncached input shown separately with cost weighting |
| Estimated cost | Per-category cost breakdown using model-specific API pricing |
| Cache hit rate | cache_read / effective_input * 100 |
| Turn count | Number of assistant messages (API calls) |
| Avg context/turn | Average effective input per turn (real context window size) |
| Tool use count | Content blocks with type: "tool_use" |
| Tool-to-turn ratio | Tool uses / turns |
| Context growth curve | Effective input at 1st, middle, and last turn + peak context and peak turn |
| Compaction events | Detected auto-compaction (>50% context drop between consecutive turns) |

### Cross-Session Comparison

Side-by-side table of all sessions with duration, effective input, cache rates, turns, peak context, growth, and estimated cost.

### Efficiency Recommendations

Based on the data, the script flags:

- **High estimated cost (>$5):** Identifies biggest cost driver, suggests model selection and compaction
- **Low cache hit rate (<50%):** Review prompt structure or use `/compact`
- **High context growth (>5x peak):** Uses peak context (not last turn) to catch growth hidden by compaction
- **High turn count (>60):** Shows cost-per-turn to illustrate the compounding effect
- **High tool-to-turn ratio (>3):** Potential inefficiency from excessive tool calling
- **High avg output tokens/turn (>2000):** Expensive turns, outputs could be more targeted
- **Large context without compaction (>100K):** Context never compacted despite exceeding 100K tokens

## Technical Details

- **No external dependencies** — uses only Python standard library
- **Input format:** JSONL files with `message` field containing role, usage, content, and timestamp
- **Output format:** ASCII tables to stdout
- **Session discovery:** Finds `.jsonl` files in `~/.claude/projects/` sorted by modification time

## Key Concepts

### Cache Hit Rate

Higher is better. When Claude reads the same context repeatedly, cached reads are cheaper than fresh processing. A rate above 70% is good; below 50% suggests context is changing too often.

### Context Growth

Measured as `peak_effective / first_effective` — the peak context size relative to the starting context. Uses peak rather than last turn to catch growth that was masked by auto-compaction. Values above 5x indicate the context window is growing fast and `/compact` should be used. Values above 10x suggest the session should have been split.

### Compaction Events

Detected when effective input drops by more than 50% between consecutive turns. Shows the before/after context size and reduction percentage. Late compaction (after context exceeds 100K+) is a major cost driver — proactive `/compact` at 60-80K is far cheaper.

### Estimated Cost

Calculated using model-specific API pricing (auto-detected from session logs):
- **Opus 4:** $15/M input, $75/M output, $18.75/M cache write, $1.875/M cache read
- **Sonnet 4.5:** $3/M input, $15/M output, $3.75/M cache write, $0.30/M cache read
- **Haiku 4.5:** $0.80/M input, $4/M output, $1/M cache write, $0.08/M cache read

Cache creation (writing new context to cache) is the most expensive input category — 1.25x the base input price. High cache creation costs indicate frequent context changes or growth.
