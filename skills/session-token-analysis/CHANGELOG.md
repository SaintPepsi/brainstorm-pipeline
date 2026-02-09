# Changelog

All notable changes to this skill will be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-02-09

### Fixed

- Context growth now uses effective input per turn (cache_read + cache_creation + uncached) instead of raw `input_tokens` — previously reported "0.3x growth" on a session that actually grew 5.0x
- Avg input/turn now uses effective input — previously showed "2 tokens/turn" instead of "79,848"
- User message count now excludes tool result messages — previously counted tool results as user messages (67 reported vs 17 actual)
- Recommendations now trigger on sessions that previously passed as "all efficient" despite costing over `$30`

### Added

- Estimated cost breakdown per session using model-specific API pricing (Opus, Sonnet, Haiku)
- Auto-detection of model from session logs for correct pricing
- Compaction event detection (>50% context drop between consecutive turns)
- Peak context tracking with turn number — catches growth hidden by auto-compaction
- High cost recommendation (>`$5`) identifying biggest cost driver
- High turn count recommendation (>60) showing cost-per-turn
- Large context without compaction recommendation (>100K)
- Model name displayed in session report header
- Reports directory with workflow cost analysis report

### Changed

- Token Summary section restructured: effective input shown first as the headline number, with cache read/creation/uncached as indented sub-items with cost weighting notes
- "Avg input/turn" renamed to "Avg context/turn" to reflect it shows effective context window size
- Context Growth section now shows peak context and peak turn alongside first/mid/last
- Comparison table columns updated: raw Input replaced with Eff.Input, added Peak Ctx and Est.Cost columns
- Summary footer now shows effective input and estimated cost instead of raw input tokens
- Efficiency score for multi-session comparison now includes cost as a factor
- "Most efficient session" only shown for multi-session comparisons

## [0.1.0] - 2026-02-06

### Added

- Initial skill structure with SKILL.md and analysis script
- Per-session metrics: token summary, cache hit rate, turn analysis, tool usage, context growth curve
- Cross-session comparison table
- Efficiency recommendations for low cache hit rate, high context growth, high tool-to-turn ratio, high output per turn
- Session discovery from `~/.claude/projects/` sorted by modification time
- Support for `--sessions N` and `--file PATH` arguments
- No external dependencies — Python standard library only
