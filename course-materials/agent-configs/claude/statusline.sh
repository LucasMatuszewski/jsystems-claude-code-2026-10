#!/usr/bin/env bash

# Claude Code Status Line Script
# Docs: https://code.claude.com/docs/en/statusline
#
# 2 lines:
#   line 1: git branch | shortened path
#   line 2: model+effort+fast | context bar | cost | 5h/7d usage | cache hit rate
#
# Design notes (please keep these properties when editing):
#  - ALWAYS exits 0 and always prints something. Claude Code blanks the status
#    line if the script exits non-zero or produces no output, so `set -e` is
#    deliberately NOT used and every value has an explicit default.
#  - Every JSON field is read in ONE jq call. Spawning jq per field measured
#    ~990ms per render on Windows vs ~106ms for a single call.
#  - Portable across Git Bash on Windows and Linux: no GNU-only flags, and all
#    money/percentage formatting uses integer math so a comma-decimal locale
#    (e.g. pl_PL) cannot corrupt the output.

set -uo pipefail

input=$(cat)

# ---------- Tokyo Night palette (truecolor, matches ~/.config/wezterm/omarchy.lua) ----------
# Built from a real ESC byte rather than the string "\033" so the final output
# can use printf '%s' — that way a backslash in a path or branch name is never
# re-interpreted as an escape sequence.
E=$(printf '\033')
FG="${E}[38;2;169;177;214m"      # #a9b1d6 foreground
DIM="${E}[38;2;120;124;153m"     # #787c99 comment/dim (separators, labels)
ACCENT="${E}[38;2;187;154;247m"  # #bb9af7 magenta (model name)
BLUE="${E}[38;2;122;162;247m"    # #7aa2f7 blue (path, context bar fill)
CYAN="${E}[38;2;68;157;171m"     # #449dab teal (git branch)
GOLD="${E}[38;2;224;175;104m"    # #e0af68 yellow (cost)
GREEN="${E}[38;2;158;206;106m"   # #9ece6a green   — good
ORANGE="${E}[38;2;255;158;100m"  # #ff9e64 orange  — warning
RED="${E}[38;2;247;118;142m"     # #f7768e red     — bad
BAR_FILLED="${E}[38;2;122;162;247m" # #7aa2f7 blue  — filled context
BAR_EMPTY="${E}[38;2;50;52;74m"     # #32344a       — empty context
RESET="${E}[0m"

# Themed separator used between segments
SEP="${DIM} | ${RESET}"

# ---------- Defaults (used if jq is missing or the payload is unexpected) ----------
model_id="-"
model_display="-"
context_used=0
cost_mills=0          # cost in thousandths of a dollar, as an integer
current_dir="-"
effort_level="-"
fast_mode=0
five_h_pct="-"
five_h_reset="-"
week_pct="-"
week_reset="-"
cache_pct="-"

# ---------- Parse the whole payload in a single jq call ----------
# Absent values are emitted as "-" rather than "": @tsv plus `read` with a tab
# IFS collapses runs of empty fields, which would silently shift every later
# value into the wrong variable.
parsed=""
jq_missing=0
if ! command -v jq >/dev/null 2>&1; then
    jq_missing=1
fi
if [ "$jq_missing" -eq 0 ]; then
    parsed=$(printf '%s' "$input" | jq -r '
      def dash(v): if v == null then "-" else v end;
      def pct(v):  if v == null then "-" else (v | floor) end;
      # Normalize Windows separators HERE, before @tsv: @tsv escapes a literal
      # backslash as \\, which would otherwise turn C:\Users into C://Users and
      # blank out the parent folder. Only real Windows paths (drive letter or
      # UNC) are touched, so a Linux name containing a backslash survives.
      def winnorm(p):
        if p == null then "-"
        elif (p | test("^[A-Za-z]:[\\\\/]")) or (p | startswith("\\\\"))
        then (p | gsub("\\\\"; "/"))
        else p end;
      [ dash(.model.id),
        dash(.model.display_name),
        ((.context_window.used_percentage // 0) | floor),
        (((.cost.total_cost_usd // 0) * 1000) | round),
        winnorm(.workspace.current_dir // .cwd),
        dash(.effort.level),
        (if (.fast_mode // false) then "1" else "0" end),
        pct(.rate_limits.five_hour.used_percentage),
        dash(.rate_limits.five_hour.resets_at),
        pct(.rate_limits.seven_day.used_percentage),
        dash(.rate_limits.seven_day.resets_at),
        (if .prompt_cache.hit_ratio == null then "-"
         else ((.prompt_cache.hit_ratio * 100) | round) end)
      ] | @tsv' 2>/dev/null) || parsed=""
fi

# jq on Windows can terminate the line with CRLF; a stray \r would land in the
# final field and fail the numeric guards below.
parsed=${parsed//$'\r'/}

if [ -n "$parsed" ]; then
    IFS=$'\t' read -r model_id model_display context_used cost_mills current_dir \
        effort_level fast_mode five_h_pct five_h_reset week_pct week_reset cache_pct \
        <<< "$parsed"
else
    # No jq (or malformed input): recover just the directory from the raw JSON so
    # line 1 still says something useful. Allows optional spaces after the colon
    # and unescapes the doubled backslashes of a Windows path.
    d=$(printf '%s' "$input" \
        | grep -o '"current_dir"[[:space:]]*:[[:space:]]*"[^"]*"' \
        | head -1 \
        | sed 's/.*:[[:space:]]*"//; s/"$//') || d=""
    d=${d//$'\r'/}
    if [ -n "$d" ]; then
        # JSON doubles every backslash; for a Windows path collapse them straight
        # to forward slashes, matching what winnorm() does on the jq path.
        case "$d" in
            [A-Za-z]:*|'\\'*) d=${d//\\\\//}; d=${d//\\//} ;;
        esac
        current_dir="$d"
    fi
fi

# Guard every value that is used in arithmetic or compared numerically.
case "$context_used" in ''|*[!0-9]*) context_used=0 ;; esac
case "$cost_mills"   in ''|*[!0-9]*) cost_mills=0 ;; esac
[ "$context_used" -gt 100 ] && context_used=100

# ---------- LINE 1: git | path ----------
# Normalize separators first: the result is reused for both the git lookup and
# the display, so a Windows path works with `git -C` too.
norm=""
dir_display="N/A"
if [ "$current_dir" != "-" ] && [ -n "$current_dir" ]; then
    # Already separator-normalized by winnorm() in the jq call above; the
    # no-jq fallback below normalizes its own value the same way.
    norm=${current_dir%/}
    if [ -z "$norm" ]; then
        dir_display="/"
    else
        dir_short=${norm##*/}
        parent_path=${norm%/*}
        parent_dir=${parent_path##*/}
        if [ -n "$parent_dir" ] && [ "$parent_path" != "$norm" ]; then
            dir_display="$parent_dir/$dir_short"
        else
            dir_display="$dir_short"
        fi
    fi
fi

# Ask git about the SESSION's directory, not whatever directory this script was
# started in.
git_branch=""
git_target="."
[ -n "$norm" ] && [ -d "$norm" ] && git_target="$norm"

# Cheap pure-bash pre-check before spawning git at all: walk up looking for a
# .git entry (a directory normally, a file for worktrees and submodules). In a
# non-repo folder like ~/.claude this saves a whole process launch on every
# single render, which is the most expensive thing this script can do on Windows.
has_git=0
probe="$git_target"
while [ -n "$probe" ]; do
    if [ -e "$probe/.git" ]; then has_git=1; break; fi
    parent=${probe%/*}
    [ "$parent" = "$probe" ] && break   # reached "C:" or a bare name
    probe="$parent"                     # reaching "" ends the loop
done

if [ "$has_git" -eq 1 ]; then
    git_branch=$(git -C "$git_target" --no-optional-locks rev-parse --abbrev-ref HEAD 2>/dev/null) || git_branch=""
fi

dir_part="${BLUE}${dir_display}${RESET}"
if [ -n "$git_branch" ]; then
    line1="${CYAN}git:${git_branch}${RESET}${SEP}${dir_part}"
else
    line1="$dir_part"
fi

# ---------- LINE 2: model | context | cost | usage | cache ----------
model_short="$model_display"
case "$model_id" in
    *sonnet*)   model_short="Sonnet" ;;
    *opus*)     model_short="Opus" ;;
    *haiku*)    model_short="Haiku" ;;
    *fable*)    model_short="Fable" ;;
    *deepseek*) model_short="DeepSeek" ;;
    *glm*)      model_short="GLM" ;;
esac
[ "$model_short" = "-" ] && model_short="?"

model_part="${ACCENT}${model_short}${RESET}"
[ "$effort_level" != "-" ] && model_part="${model_part} ${DIM}${effort_level}${RESET}"
[ "$fast_mode" = "1" ]     && model_part="${model_part} ${ORANGE}Fast${RESET}"

# Progress bar for context
BAR_WIDTH=10
FILLED=$((context_used * BAR_WIDTH / 100))
EMPTY=$((BAR_WIDTH - FILLED))

BAR=""
if [ "$FILLED" -gt 0 ]; then
    printf -v FILL "%${FILLED}s" ""
    BAR="${BAR}${BAR_FILLED}${FILL// /▓}${RESET}"
fi
if [ "$EMPTY" -gt 0 ]; then
    printf -v PAD "%${EMPTY}s" ""
    BAR="${BAR}${BAR_EMPTY}${PAD// /░}${RESET}"
fi
context_part="$BAR ${FG}${context_used}%${RESET}"

# Real session cost, reported by Claude Code (cost.total_cost_usd).
# cost_mills is thousandths of a dollar, so all formatting stays integer-only.
cost_part=""
if [ "$cost_mills" -gt 0 ]; then
    cost_dollars=$((cost_mills / 1000))
    if [ "$cost_dollars" -gt 0 ]; then
        printf -v cost_formatted '~$%d.%02d' "$cost_dollars" "$(((cost_mills % 1000) / 10))"
    else
        printf -v cost_formatted '~$0.%03d' "$((cost_mills % 1000))"
    fi
    cost_part="${GOLD}${cost_formatted}${RESET}"
fi

# ---------- Subscription usage (5h + weekly) + cache ----------
usage_color() {
    # $1 = integer percent -> more used is worse
    if   [ "$1" -ge 80 ]; then printf '%s' "$RED"
    elif [ "$1" -ge 50 ]; then printf '%s' "$ORANGE"
    else                       printf '%s' "$GREEN"; fi
}

cache_color() {
    # $1 = integer percent -> a HIGHER cache hit rate is better, so inverted
    if   [ "$1" -ge 80 ]; then printf '%s' "$GREEN"
    elif [ "$1" -ge 50 ]; then printf '%s' "$ORANGE"
    else                       printf '%s' "$RED"; fi
}

reset_in() {
    # $1 = unix epoch -> compact "3d4h" / "1h23m" / "45m" until reset
    now=$(date +%s)
    diff=$(( $1 - now ))
    [ "$diff" -le 0 ] && { printf 'now'; return; }
    d=$(( diff / 86400 )); h=$(( (diff % 86400) / 3600 )); m=$(( (diff % 3600) / 60 ))
    if   [ "$d" -gt 0 ]; then printf '%dd%dh' "$d" "$h"
    elif [ "$h" -gt 0 ]; then printf '%dh%02dm' "$h" "$m"
    else                      printf '%dm' "$m"; fi
}

usage_part=""
case "$five_h_pct" in
    ''|*[!0-9]*) ;;
    *)  seg="$(usage_color "$five_h_pct")5h:${five_h_pct}%"
        case "$five_h_reset" in
            ''|*[!0-9]*) ;;
            *) seg="${seg}(↻$(reset_in "$five_h_reset"))" ;;
        esac
        usage_part="${seg}${RESET}" ;;
esac
case "$week_pct" in
    ''|*[!0-9]*) ;;
    *)  seg="$(usage_color "$week_pct")7d:${week_pct}%"
        case "$week_reset" in
            ''|*[!0-9]*) ;;
            *) seg="${seg}(↻$(reset_in "$week_reset"))" ;;
        esac
        usage_part="${usage_part:+$usage_part }${seg}${RESET}" ;;
esac

# Prompt-cache hit rate: high is good (most of the context is being re-read from
# cache at a fraction of the price rather than re-sent).
cache_part=""
case "$cache_pct" in
    ''|*[!0-9]*) ;;
    *) cache_part="$(cache_color "$cache_pct")Cache: ${cache_pct}%${RESET}" ;;
esac

if [ "$jq_missing" -eq 1 ]; then
    # Without jq there is no data to show, so say what to do about it rather
    # than rendering a row of meaningless zeroes.
    line2="${RED}jq not found${RESET}${DIM} — ask Claude to install jq${RESET}"
else
    line2="${model_part}${SEP}${context_part}"
    [ -n "$cost_part" ]  && line2="${line2}${SEP}${cost_part}"
    [ -n "$usage_part" ] && line2="${line2}${SEP}${usage_part}"
    [ -n "$cache_part" ] && line2="${line2}${SEP}${cache_part}"
fi

# ---------- OUTPUT ----------
# '%s' (not '%b'/echo -e): the colors are already real ESC bytes, so nothing in
# a path or branch name can be misread as an escape sequence.
printf '%s\n%s\n' "$line1" "$line2"

# Always succeed - a non-zero exit blanks the status line.
exit 0

