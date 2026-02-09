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

            # Count tool uses and tool results in content blocks
            tool_use_count = 0
            has_tool_result = False
            has_user_text = False
            if isinstance(content, list):
                for block in content:
                    if isinstance(block, dict):
                        if block.get("type") == "tool_use":
                            tool_use_count += 1
                        elif block.get("type") == "tool_result":
                            has_tool_result = True
                        elif block.get("type") == "text" and block.get("text", "").strip():
                            has_user_text = True
            elif isinstance(content, str) and content.strip():
                has_user_text = True

            # Classify user messages: tool_result-only vs real user input
            is_tool_result_only = (role == "user" and has_tool_result and not has_user_text)

            messages.append({
                "role": role,
                "is_tool_result_only": is_tool_result_only,
                "model": msg.get("model", ""),
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

    # Filter message types
    assistant_msgs = [m for m in messages if m["role"] == "assistant"]
    all_user_msgs = [m for m in messages if m["role"] == "user"]
    real_user_msgs = [m for m in all_user_msgs if not m.get("is_tool_result_only")]
    tool_result_msgs = [m for m in all_user_msgs if m.get("is_tool_result_only")]

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

    # Per-turn effective input (the real context window size each turn)
    per_turn_effective = []
    for m in assistant_msgs:
        eff = m["input_tokens"] + m["cache_creation_input_tokens"] + m["cache_read_input_tokens"]
        per_turn_effective.append(eff)

    # Tokens per turn (using effective input, not raw input_tokens)
    avg_effective_per_turn = effective_input / turn_count if turn_count > 0 else 0
    assistant_output = sum(m["output_tokens"] for m in assistant_msgs)
    avg_output_per_turn = assistant_output / turn_count if turn_count > 0 else 0

    # Tool use count
    total_tool_uses = sum(m["tool_use_count"] for m in assistant_msgs)

    # Tool-to-turn ratio
    tool_to_turn = total_tool_uses / turn_count if turn_count > 0 else 0.0

    # Context growth curve (using effective input per turn)
    if per_turn_effective:
        first_effective = per_turn_effective[0]
        mid_effective = per_turn_effective[len(per_turn_effective) // 2]
        last_effective = per_turn_effective[-1]
        peak_effective = max(per_turn_effective)
        peak_turn = per_turn_effective.index(peak_effective) + 1
    else:
        first_effective = mid_effective = last_effective = peak_effective = 0
        peak_turn = 0

    # Context growth: use peak vs first to capture growth before compaction
    context_growth = peak_effective / first_effective if first_effective > 0 else 0.0

    # Detect compaction events (>50% drop between consecutive turns)
    compaction_events = []
    for i in range(1, len(per_turn_effective)):
        if per_turn_effective[i] < per_turn_effective[i - 1] * 0.5:
            compaction_events.append({
                "turn": i + 1,
                "before": per_turn_effective[i - 1],
                "after": per_turn_effective[i],
                "reduction_pct": (1 - per_turn_effective[i] / per_turn_effective[i - 1]) * 100,
            })

    # Detect model from assistant messages
    model = "unknown"
    for m in assistant_msgs:
        if m.get("model"):
            model = m["model"]
            break

    # Pricing per million tokens by model family
    if "opus" in model:
        price_input, price_output = 15.0, 75.0
        price_cache_create, price_cache_read = 18.75, 1.875
    elif "haiku" in model:
        price_input, price_output = 0.80, 4.0
        price_cache_create, price_cache_read = 1.0, 0.08
    else:  # sonnet or unknown — use sonnet pricing
        price_input, price_output = 3.0, 15.0
        price_cache_create, price_cache_read = 3.75, 0.30

    cost_input = total_input * price_input / 1_000_000
    cost_output = total_output * price_output / 1_000_000
    cost_cache_create = total_cache_creation * price_cache_create / 1_000_000
    cost_cache_read = total_cache_read * price_cache_read / 1_000_000
    cost_total = cost_input + cost_output + cost_cache_create + cost_cache_read

    return {
        "file_path": str(file_path),
        "project_dir": project_dir,
        "model": model,
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
        "avg_effective_per_turn": avg_effective_per_turn,
        "avg_output_per_turn": avg_output_per_turn,
        "total_tool_uses": total_tool_uses,
        "tool_to_turn": tool_to_turn,
        "first_effective": first_effective,
        "mid_effective": mid_effective,
        "last_effective": last_effective,
        "peak_effective": peak_effective,
        "peak_turn": peak_turn,
        "context_growth": context_growth,
        "compaction_events": compaction_events,
        "per_turn_effective": per_turn_effective,
        "cost_input": cost_input,
        "cost_output": cost_output,
        "cost_cache_create": cost_cache_create,
        "cost_cache_read": cost_cache_read,
        "cost_total": cost_total,
        "total_messages": len(messages),
        "user_messages": len(real_user_msgs),
        "tool_result_messages": len(tool_result_msgs),
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

    print(f"\n  File:     {m['file_path']}")
    print(f"  Model:    {m['model']}")
    print(f"  Start:    {format_timestamp(m['start_time'])}")
    print(f"  End:      {format_timestamp(m['end_time'])}")
    print(f"  Duration: {format_duration(m['duration'])}")

    print(f"\n  --- Token Summary ---")
    print(f"  Effective input:       {m['effective_input']:>12,}  (total context processed)")
    print(f"    Cache read:          {m['total_cache_read']:>12,}  ({m['cache_hit_rate']:.0f}% — cheapest)")
    print(f"    Cache creation:      {m['total_cache_creation']:>12,}  (1.25x input price)")
    print(f"    Uncached input:      {m['total_input']:>12,}  (full input price)")
    print(f"  Output tokens:         {m['total_output']:>12,}")

    print(f"\n  --- Estimated Cost ---")
    print(f"  Cache read:            ${m['cost_cache_read']:>11.2f}")
    print(f"  Cache creation:        ${m['cost_cache_create']:>11.2f}")
    print(f"  Uncached input:        ${m['cost_input']:>11.2f}")
    print(f"  Output:                ${m['cost_output']:>11.2f}")
    print(f"  TOTAL:                 ${m['cost_total']:>11.2f}")

    print(f"\n  --- Turn Analysis ---")
    print(f"  Total messages:        {m['total_messages']:>12,}")
    print(f"  User messages:         {m['user_messages']:>12,}")
    print(f"  Tool result messages:  {m['tool_result_messages']:>12,}")
    print(f"  Assistant turns:       {m['assistant_messages']:>12,}")
    print(f"  Avg context/turn:      {m['avg_effective_per_turn']:>12,.0f}")
    print(f"  Avg output/turn:       {m['avg_output_per_turn']:>12,.0f}")

    print(f"\n  --- Tool Usage ---")
    print(f"  Total tool calls:      {m['total_tool_uses']:>12,}")
    print(f"  Tool-to-turn ratio:    {m['tool_to_turn']:>12.1f}")

    print(f"\n  --- Context Growth ---")
    print(f"  First turn context:    {m['first_effective']:>12,}")
    print(f"  Mid turn context:      {m['mid_effective']:>12,}")
    print(f"  Last turn context:     {m['last_effective']:>12,}")
    print(f"  Peak context:          {m['peak_effective']:>12,}  (turn {m['peak_turn']})")
    print(f"  Peak growth factor:    {m['context_growth']:>12.1f}x")

    if m["compaction_events"]:
        print(f"\n  --- Compaction Events ---")
        for evt in m["compaction_events"]:
            print(f"  Turn {evt['turn']:>3}: {evt['before']:>10,} → {evt['after']:>10,}  "
                  f"(-{evt['reduction_pct']:.0f}%)")


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
    header = f"  {'Session':<{label_w}} {'Duration':>{col_w}} {'Eff.Input':>{col_w}} {'Output':>{col_w}} {'Cache%':>{col_w}} {'Turns':>{col_w}} {'Ctx/Turn':>{col_w}} {'Peak Ctx':>{col_w}} {'Growth':>{col_w}} {'Est.Cost':>{col_w}}"
    print(header)
    print(f"  {'-' * (len(header) - 2)}")

    for i, m in enumerate(all_metrics):
        label = labels[i]
        dur = format_duration(m["duration"])
        eff_inp = format_tokens(m["effective_input"])
        out = format_tokens(m["total_output"])
        cache = f"{m['cache_hit_rate']:.0f}%"
        turns = str(m["turn_count"])
        ctx_turn = format_tokens(int(m["avg_effective_per_turn"]))
        peak = format_tokens(m["peak_effective"])
        growth = f"{m['context_growth']:.1f}x"
        cost = f"${m['cost_total']:.2f}"

        print(f"  {label:<{label_w}} {dur:>{col_w}} {eff_inp:>{col_w}} {out:>{col_w}} {cache:>{col_w}} {turns:>{col_w}} {ctx_turn:>{col_w}} {peak:>{col_w}} {growth:>{col_w}} {cost:>{col_w}}")


def print_recommendations(all_metrics):
    """Print efficiency recommendations based on the data."""
    print(f"\n{'=' * 78}")
    print("  EFFICIENCY RECOMMENDATIONS")
    print(f"{'=' * 78}\n")

    recommendations = []

    for i, m in enumerate(all_metrics):
        session_label = f"Session {i + 1} ({m['project_dir']})"

        # High estimated cost
        if m["cost_total"] > 5:
            biggest = max(
                ("Cache creation", m["cost_cache_create"]),
                ("Cache read", m["cost_cache_read"]),
                ("Output", m["cost_output"]),
                ("Uncached input", m["cost_input"]),
                key=lambda x: x[1],
            )
            recommendations.append(
                f"  [{session_label}] HIGH ESTIMATED COST (${m['cost_total']:.2f})\n"
                f"    Biggest cost driver: {biggest[0]} (${biggest[1]:.2f}).\n"
                f"    Consider:\n"
                f"    - Use Sonnet for exploratory/routine work, Opus only for hard reasoning\n"
                f"    - Use /compact before context exceeds 80K tokens\n"
                f"    - Reduce turn count by batching instructions"
            )

        # Low cache hit rate
        if m["cache_hit_rate"] < 50:
            recommendations.append(
                f"  [{session_label}] LOW CACHE HIT RATE ({m['cache_hit_rate']:.0f}%)\n"
                f"    Cache hit rate is below 50%. Most input tokens are being processed\n"
                f"    fresh each turn. Consider:\n"
                f"    - Review prompt structure for unnecessary variation\n"
                f"    - Use /compact to reduce context size\n"
                f"    - Check if large files are being re-read unnecessarily"
            )

        # High context growth (using peak, which accounts for compaction)
        if m["context_growth"] > 5:
            compact_note = ""
            if m["compaction_events"]:
                compact_note = (
                    f"\n    Note: auto-compaction occurred at turn(s) "
                    f"{', '.join(str(e['turn']) for e in m['compaction_events'])} "
                    f"— context hit {format_tokens(m['peak_effective'])} before compaction."
                )
            recommendations.append(
                f"  [{session_label}] HIGH CONTEXT GROWTH ({m['context_growth']:.1f}x peak)\n"
                f"    Context peaked at {format_tokens(m['peak_effective'])} tokens "
                f"(turn {m['peak_turn']}).{compact_note}\n"
                f"    Consider:\n"
                f"    - Use /compact proactively when context exceeds 60-80K tokens\n"
                f"    - Break large tasks into smaller sessions\n"
                f"    - Avoid reading very large files repeatedly"
            )

        # High turn count
        if m["turn_count"] > 60:
            cost_per_turn = m["cost_total"] / m["turn_count"] if m["turn_count"] > 0 else 0
            recommendations.append(
                f"  [{session_label}] HIGH TURN COUNT ({m['turn_count']} turns)\n"
                f"    Each turn re-sends the full context. At avg "
                f"{format_tokens(int(m['avg_effective_per_turn']))} tokens/turn, "
                f"that's ~${cost_per_turn:.2f}/turn.\n"
                f"    Consider:\n"
                f"    - Batch multiple instructions into single messages\n"
                f"    - Use sub-agents (Task tool) for multi-step work\n"
                f"    - Split into separate sessions for distinct tasks"
            )

        # High tool-to-turn ratio
        if m["tool_to_turn"] > 3:
            recommendations.append(
                f"  [{session_label}] HIGH TOOL-TO-TURN RATIO ({m['tool_to_turn']:.1f})\n"
                f"    More than 3 tool calls per turn on average. Each tool result adds\n"
                f"    to context size. Consider:\n"
                f"    - Combine related operations where possible\n"
                f"    - Use more targeted searches instead of broad exploration\n"
                f"    - Delegate multi-step research to sub-agents"
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

        # Large peak context without compaction
        if m["peak_effective"] > 100_000 and not m["compaction_events"]:
            recommendations.append(
                f"  [{session_label}] LARGE CONTEXT WITHOUT COMPACTION\n"
                f"    Context peaked at {format_tokens(m['peak_effective'])} tokens "
                f"and was never compacted.\n"
                f"    Use /compact when context exceeds 80K to avoid escalating costs."
            )

    if not recommendations:
        print("  All sessions look efficient! No specific concerns found.\n")
    else:
        for rec in recommendations:
            print(rec)
            print()

    # Overall pattern: find most efficient session (only for multi-session)
    if len(all_metrics) > 1:
        # Score: lower cost per turn + higher cache rate + lower growth = better
        def efficiency_score(m):
            cache_score = m["cache_hit_rate"] / 100
            growth_penalty = min(m["context_growth"] / 10, 1)
            tool_penalty = min(m["tool_to_turn"] / 5, 1)
            cost_penalty = min(m["cost_total"] / 50, 1)
            return cache_score - growth_penalty * 0.3 - tool_penalty * 0.2 - cost_penalty * 0.3

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
        if best["cost_total"] < 10:
            reasons.append(f"low cost (${best['cost_total']:.2f})")
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
    total_all_effective = sum(m["effective_input"] for m in all_metrics)
    total_all_output = sum(m["total_output"] for m in all_metrics)
    total_all_turns = sum(m["turn_count"] for m in all_metrics)
    total_all_cost = sum(m["cost_total"] for m in all_metrics)
    print(f"  {'─' * 74}")
    print(f"  Total across all sessions: {format_tokens(total_all_effective)} effective input, "
          f"{format_tokens(total_all_output)} output, {total_all_turns} turns, "
          f"~${total_all_cost:.2f}")
    print(f"{'#' * 78}\n")


if __name__ == "__main__":
    main()
