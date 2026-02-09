#!/usr/bin/env python3
"""
Claude Code Session Token Analysis

Analyses JSONL session logs from ~/.claude/projects/ for token usage
efficiency, cache performance, and context growth patterns.

No external dependencies — uses only Python standard library.
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path


def find_session_files(num_sessions=5):
    """Find the N most recent JSONL session files by modification time."""
    claude_dir = Path.home() / ".claude" / "projects"
    if not claude_dir.exists():
        print(f"Error: {claude_dir} does not exist.", file=sys.stderr)
        sys.exit(1)

    jsonl_files = []
    for root, _dirs, files in os.walk(claude_dir):
        for f in files:
            if f.endswith(".jsonl"):
                full_path = Path(root) / f
                mtime = full_path.stat().st_mtime
                jsonl_files.append((mtime, full_path))

    jsonl_files.sort(key=lambda x: x[0], reverse=True)

    if not jsonl_files:
        print("Error: No .jsonl session files found.", file=sys.stderr)
        sys.exit(1)

    return [path for _, path in jsonl_files[:num_sessions]]


def parse_session(file_path):
    """Parse a single JSONL session file and extract metrics."""
    messages = []
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue

            # Extract message data
            msg = entry.get("message")
            if not msg:
                continue

            role = msg.get("role", "")
            usage = msg.get("usage", {})
            content = msg.get("content", [])
            timestamp = entry.get("timestamp")

            # Parse timestamp
            ts = None
            if timestamp:
                try:
                    ts = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                except (ValueError, AttributeError):
                    pass

            # Count tool uses in content blocks
            tool_use_count = 0
            if isinstance(content, list):
                for block in content:
                    if isinstance(block, dict) and block.get("type") == "tool_use":
                        tool_use_count += 1

            messages.append({
                "role": role,
                "input_tokens": usage.get("input_tokens", 0),
                "output_tokens": usage.get("output_tokens", 0),
                "cache_creation_input_tokens": usage.get("cache_creation_input_tokens", 0),
                "cache_read_input_tokens": usage.get("cache_read_input_tokens", 0),
                "timestamp": ts,
                "tool_use_count": tool_use_count,
            })

    return messages


def compute_session_metrics(file_path, messages):
    """Compute all metrics for a single session."""
    # Derive project name from path
    # Path is like ~/.claude/projects/-home-user-project/session.jsonl
    project_dir = file_path.parent.name

    # Filter assistant messages
    assistant_msgs = [m for m in messages if m["role"] == "assistant"]
    user_msgs = [m for m in messages if m["role"] == "user"]

    # Timestamps
    all_timestamps = [m["timestamp"] for m in messages if m["timestamp"]]
    start_time = min(all_timestamps) if all_timestamps else None
    end_time = max(all_timestamps) if all_timestamps else None
    duration = (end_time - start_time) if (start_time and end_time) else None

    # Total tokens
    total_input = sum(m["input_tokens"] for m in messages)
    total_output = sum(m["output_tokens"] for m in messages)
    total_cache_creation = sum(m["cache_creation_input_tokens"] for m in messages)
    total_cache_read = sum(m["cache_read_input_tokens"] for m in messages)

    # Effective input tokens
    effective_input = total_input + total_cache_creation + total_cache_read

    # Cache hit rate
    cache_denominator = total_cache_read + total_cache_creation + total_input
    cache_hit_rate = (total_cache_read / cache_denominator * 100) if cache_denominator > 0 else 0.0

    # Turn count (assistant messages = API calls)
    turn_count = len(assistant_msgs)

    # Tokens per turn
    assistant_input = sum(m["input_tokens"] for m in assistant_msgs)
    assistant_output = sum(m["output_tokens"] for m in assistant_msgs)
    avg_input_per_turn = assistant_input / turn_count if turn_count > 0 else 0
    avg_output_per_turn = assistant_output / turn_count if turn_count > 0 else 0

    # Tool use count
    total_tool_uses = sum(m["tool_use_count"] for m in assistant_msgs)

    # Tool-to-turn ratio
    tool_to_turn = total_tool_uses / turn_count if turn_count > 0 else 0.0

    # Token growth curve
    assistant_inputs = [m["input_tokens"] for m in assistant_msgs if m["input_tokens"] > 0]
    if assistant_inputs:
        first_input = assistant_inputs[0]
        mid_input = assistant_inputs[len(assistant_inputs) // 2]
        last_input = assistant_inputs[-1]
    else:
        first_input = mid_input = last_input = 0

    context_growth = last_input / first_input if first_input > 0 else 0.0

    return {
        "file_path": str(file_path),
        "project_dir": project_dir,
        "start_time": start_time,
        "end_time": end_time,
        "duration": duration,
        "total_input": total_input,
        "total_output": total_output,
        "total_cache_creation": total_cache_creation,
        "total_cache_read": total_cache_read,
        "effective_input": effective_input,
        "cache_hit_rate": cache_hit_rate,
        "turn_count": turn_count,
        "avg_input_per_turn": avg_input_per_turn,
        "avg_output_per_turn": avg_output_per_turn,
        "total_tool_uses": total_tool_uses,
        "tool_to_turn": tool_to_turn,
        "first_input": first_input,
        "mid_input": mid_input,
        "last_input": last_input,
        "context_growth": context_growth,
        "total_messages": len(messages),
        "user_messages": len(user_msgs),
        "assistant_messages": len(assistant_msgs),
    }


def format_duration(td):
    """Format a timedelta as a human-readable string."""
    if td is None:
        return "N/A"
    total_seconds = int(td.total_seconds())
    hours, remainder = divmod(total_seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    if hours > 0:
        return f"{hours}h {minutes}m {seconds}s"
    elif minutes > 0:
        return f"{minutes}m {seconds}s"
    else:
        return f"{seconds}s"


def format_tokens(n):
    """Format token count with thousands separator."""
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f}M"
    elif n >= 1_000:
        return f"{n / 1_000:.1f}K"
    else:
        return str(n)


def format_timestamp(ts):
    """Format a datetime for display."""
    if ts is None:
        return "N/A"
    return ts.strftime("%Y-%m-%d %H:%M:%S")


def print_session_report(metrics, index):
    """Print detailed metrics for a single session."""
    m = metrics
    print(f"\n{'=' * 78}")
    print(f"  SESSION {index + 1}: {m['project_dir']}")
    print(f"{'=' * 78}")

    print(f"\n  File: {m['file_path']}")
    print(f"  Start:    {format_timestamp(m['start_time'])}")
    print(f"  End:      {format_timestamp(m['end_time'])}")
    print(f"  Duration: {format_duration(m['duration'])}")

    print(f"\n  --- Token Summary ---")
    print(f"  Input tokens:          {m['total_input']:>12,}")
    print(f"  Output tokens:         {m['total_output']:>12,}")
    print(f"  Cache creation:        {m['total_cache_creation']:>12,}")
    print(f"  Cache read:            {m['total_cache_read']:>12,}")
    print(f"  Effective input:       {m['effective_input']:>12,}")
    print(f"  Cache hit rate:        {m['cache_hit_rate']:>11.1f}%")

    print(f"\n  --- Turn Analysis ---")
    print(f"  Total messages:        {m['total_messages']:>12,}")
    print(f"  User messages:         {m['user_messages']:>12,}")
    print(f"  Assistant turns:       {m['assistant_messages']:>12,}")
    print(f"  Avg input/turn:        {m['avg_input_per_turn']:>12,.0f}")
    print(f"  Avg output/turn:       {m['avg_output_per_turn']:>12,.0f}")

    print(f"\n  --- Tool Usage ---")
    print(f"  Total tool calls:      {m['total_tool_uses']:>12,}")
    print(f"  Tool-to-turn ratio:    {m['tool_to_turn']:>12.1f}")

    print(f"\n  --- Context Growth ---")
    print(f"  First turn input:      {m['first_input']:>12,}")
    print(f"  Mid turn input:        {m['mid_input']:>12,}")
    print(f"  Last turn input:       {m['last_input']:>12,}")
    print(f"  Growth factor:         {m['context_growth']:>12.1f}x")


def print_comparison_table(all_metrics):
    """Print a cross-session comparison table."""
    print(f"\n{'=' * 78}")
    print("  CROSS-SESSION COMPARISON")
    print(f"{'=' * 78}\n")

    # Build session labels
    labels = []
    for m in all_metrics:
        date_str = m["start_time"].strftime("%m/%d") if m["start_time"] else "??/??"
        name = m["project_dir"]
        if len(name) > 20:
            name = name[:17] + "..."
        labels.append(f"{name} ({date_str})")

    # Column widths
    label_w = max(len(l) for l in labels) + 2
    col_w = 12

    # Header
    header = f"  {'Session':<{label_w}} {'Duration':>{col_w}} {'Input':>{col_w}} {'Output':>{col_w}} {'Cache%':>{col_w}} {'Turns':>{col_w}} {'Avg/Turn':>{col_w}} {'Tools':>{col_w}} {'Growth':>{col_w}}"
    print(header)
    print(f"  {'-' * (len(header) - 2)}")

    for i, m in enumerate(all_metrics):
        label = labels[i]
        dur = format_duration(m["duration"])
        inp = format_tokens(m["total_input"])
        out = format_tokens(m["total_output"])
        cache = f"{m['cache_hit_rate']:.0f}%"
        turns = str(m["turn_count"])
        avg_turn = format_tokens(int(m["avg_output_per_turn"]))
        tools = str(m["total_tool_uses"])
        growth = f"{m['context_growth']:.1f}x"

        print(f"  {label:<{label_w}} {dur:>{col_w}} {inp:>{col_w}} {out:>{col_w}} {cache:>{col_w}} {turns:>{col_w}} {avg_turn:>{col_w}} {tools:>{col_w}} {growth:>{col_w}}")


def print_recommendations(all_metrics):
    """Print efficiency recommendations based on the data."""
    print(f"\n{'=' * 78}")
    print("  EFFICIENCY RECOMMENDATIONS")
    print(f"{'=' * 78}\n")

    recommendations = []

    for i, m in enumerate(all_metrics):
        session_label = f"Session {i + 1} ({m['project_dir']})"

        # Low cache hit rate
        if m["cache_hit_rate"] < 50:
            recommendations.append(
                f"  [{session_label}] LOW CACHE HIT RATE ({m['cache_hit_rate']:.0f}%)\n"
                f"    Cache hit rate is below 50%. This means most input tokens are being\n"
                f"    processed fresh each turn. Consider:\n"
                f"    - Review prompt structure for unnecessary variation\n"
                f"    - Use /compact to reduce context size\n"
                f"    - Check if large files are being re-read unnecessarily"
            )

        # High context growth
        if m["context_growth"] > 5:
            recommendations.append(
                f"  [{session_label}] HIGH CONTEXT GROWTH ({m['context_growth']:.1f}x)\n"
                f"    Context grew more than 5x from first to last turn. The context window\n"
                f"    is accumulating fast. Consider:\n"
                f"    - Use /compact mid-session to reset context\n"
                f"    - Break large tasks into smaller sessions\n"
                f"    - Avoid reading very large files repeatedly"
            )

        # High tool-to-turn ratio
        if m["tool_to_turn"] > 3:
            recommendations.append(
                f"  [{session_label}] HIGH TOOL-TO-TURN RATIO ({m['tool_to_turn']:.1f})\n"
                f"    More than 3 tool calls per turn on average. Each tool call adds to\n"
                f"    context. Consider:\n"
                f"    - Combine related operations where possible\n"
                f"    - Use more targeted searches instead of broad exploration\n"
                f"    - Check if sub-agents could handle multi-step research"
            )

        # High average output per turn
        if m["avg_output_per_turn"] > 2000:
            recommendations.append(
                f"  [{session_label}] HIGH AVG OUTPUT/TURN ({m['avg_output_per_turn']:,.0f} tokens)\n"
                f"    Average output per turn exceeds 2000 tokens. These are expensive turns.\n"
                f"    Consider:\n"
                f"    - Request more concise responses\n"
                f"    - Break complex outputs into focused steps\n"
                f"    - Check if verbose explanations are being generated unnecessarily"
            )

    if not recommendations:
        print("  All sessions look efficient! No specific concerns found.\n")
    else:
        for rec in recommendations:
            print(rec)
            print()

    # Overall pattern: find most efficient session
    if all_metrics:
        # Score: higher cache rate + lower growth + lower tool ratio = better
        def efficiency_score(m):
            cache_score = m["cache_hit_rate"] / 100  # 0-1, higher is better
            growth_penalty = min(m["context_growth"] / 10, 1)  # 0-1, lower is better
            tool_penalty = min(m["tool_to_turn"] / 5, 1)  # 0-1, lower is better
            return cache_score - growth_penalty * 0.3 - tool_penalty * 0.2

        scored = [(efficiency_score(m), i, m) for i, m in enumerate(all_metrics)]
        scored.sort(key=lambda x: x[0], reverse=True)
        best_score, best_idx, best = scored[0]

        print(f"  MOST EFFICIENT SESSION: Session {best_idx + 1} ({best['project_dir']})")
        reasons = []
        if best["cache_hit_rate"] >= 50:
            reasons.append(f"good cache hit rate ({best['cache_hit_rate']:.0f}%)")
        if best["context_growth"] <= 5:
            reasons.append(f"controlled context growth ({best['context_growth']:.1f}x)")
        if best["tool_to_turn"] <= 3:
            reasons.append(f"reasonable tool usage ({best['tool_to_turn']:.1f} per turn)")
        if reasons:
            print(f"    Why: {', '.join(reasons)}")
        print()


def main():
    parser = argparse.ArgumentParser(
        description="Analyse Claude Code session logs for token usage efficiency."
    )
    parser.add_argument(
        "--sessions", "-n",
        type=int,
        default=5,
        help="Number of most recent sessions to analyse (default: 5)"
    )
    parser.add_argument(
        "--file", "-f",
        type=str,
        default=None,
        help="Analyse a specific JSONL session file instead of auto-discovering"
    )
    args = parser.parse_args()

    # Find session files
    if args.file:
        file_path = Path(args.file).expanduser().resolve()
        if not file_path.exists():
            print(f"Error: File not found: {file_path}", file=sys.stderr)
            sys.exit(1)
        session_files = [file_path]
    else:
        session_files = find_session_files(args.sessions)

    print(f"\n{'#' * 78}")
    print(f"#{'CLAUDE CODE SESSION TOKEN ANALYSIS':^76}#")
    print(f"{'#' * 78}")
    print(f"\n  Analysing {len(session_files)} session(s)...")
    print(f"  Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # Parse and compute metrics for each session
    all_metrics = []
    for file_path in session_files:
        messages = parse_session(file_path)
        if not messages:
            print(f"\n  Warning: No messages found in {file_path}, skipping.")
            continue
        metrics = compute_session_metrics(file_path, messages)
        all_metrics.append(metrics)

    if not all_metrics:
        print("\n  Error: No valid session data found.")
        sys.exit(1)

    # Print per-session reports
    for i, metrics in enumerate(all_metrics):
        print_session_report(metrics, i)

    # Print cross-session comparison
    if len(all_metrics) > 1:
        print_comparison_table(all_metrics)

    # Print recommendations
    print_recommendations(all_metrics)

    # Summary footer
    total_all_input = sum(m["total_input"] for m in all_metrics)
    total_all_output = sum(m["total_output"] for m in all_metrics)
    total_all_turns = sum(m["turn_count"] for m in all_metrics)
    print(f"  {'─' * 74}")
    print(f"  Total across all sessions: {format_tokens(total_all_input)} input, "
          f"{format_tokens(total_all_output)} output, {total_all_turns} turns")
    print(f"{'#' * 78}\n")


if __name__ == "__main__":
    main()
