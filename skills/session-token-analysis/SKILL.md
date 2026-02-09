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
| Session overview | Start time, end time, duration, project directory |
| Total tokens | Input, output, cache_creation, cache_read |
| Effective input tokens | input + cache_creation + cache_read (real context window size) |
| Cache hit rate | cache_read / (cache_read + cache_creation + input) * 100 |
| Turn count | Number of assistant messages (API calls) |
| Tokens per turn | Average input and output per assistant response |
| Tool use count | Content blocks with type: "tool_use" |
| Tool-to-turn ratio | Tool uses / turns |
| Token growth curve | Input tokens at 1st, middle, and last turn |

### Cross-Session Comparison

Side-by-side table of all sessions with duration, tokens, cache rates, turns, and context growth.

### Efficiency Recommendations

Based on the data, the script flags:

- **Low cache hit rate (<50%):** Review prompt structure or use `/compact`
- **High context growth (>5x):** Use `/compact` mid-session
- **High tool-to-turn ratio (>3):** Potential inefficiency from excessive tool calling
- **High avg output tokens/turn (>2000):** Expensive turns, outputs could be more targeted
- **Overall pattern:** Identifies the most efficient session and explains why

## Technical Details

- **No external dependencies** — uses only Python standard library
- **Input format:** JSONL files with `message` field containing role, usage, content, and timestamp
- **Output format:** ASCII tables to stdout
- **Session discovery:** Finds `.jsonl` files in `~/.claude/projects/` sorted by modification time

## Key Concepts

### Cache Hit Rate

Higher is better. When Claude reads the same context repeatedly, cached reads are cheaper than fresh processing. A rate above 70% is good; below 50% suggests context is changing too often.

### Context Growth

Measured as `last_turn_input / first_turn_input`. Values above 5x indicate the context window is growing fast and `/compact` should be used. Values above 10x suggest the session should have been split.

### Token Growth Curve

Shows input tokens at the first, middle, and last assistant turn. A steep curve means context is accumulating fast. Flat curves indicate good context management.
