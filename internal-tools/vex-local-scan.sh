#!/bin/bash
# Vex — Local ClamAV Scan
# Runs via launchd daily at 12:00 Helsinki

LOG="$HOME/Desktop/Ven AI/Team/Vex/vex_reports.log"
DATE=$(date '+%Y-%m-%d %H:%M')

echo "[$DATE] Vex Local Scan — starting" >> "$LOG"

# Update signatures
freshclam --quiet 2>/dev/null

# Run scan
RESULT=$(clamscan --quiet --recursive \
  ~/Downloads ~/Desktop ~/Documents \
  /tmp /var/tmp \
  2>&1)

EXIT_CODE=$?

# Check LaunchAgents for unknowns
KNOWN_AGENTS="com.apple com.google com.microsoft com.adobe com.dropbox homebrew org.pqrs com.bjango com.logi com.logitech"
UNKNOWN_AGENTS=""
while IFS= read -r -d '' plist; do
  NAME=$(basename "$plist" .plist)
  KNOWN=false
  for k in $KNOWN_AGENTS; do
    [[ "$NAME" == $k* ]] && KNOWN=true && break
  done
  $KNOWN || UNKNOWN_AGENTS="$UNKNOWN_AGENTS $NAME"
done < <(find ~/Library/LaunchAgents -name "*.plist" -print0 2>/dev/null)

# Build status
if [ $EXIT_CODE -eq 0 ]; then
  SCAN_STATUS="CLEAN"
  TELEGRAM_STATUS="🟢"
elif [ $EXIT_CODE -eq 1 ]; then
  SCAN_STATUS="INFECTED — $RESULT"
  TELEGRAM_STATUS="🔴 CRITICAL"
else
  SCAN_STATUS="SCAN ERROR (exit $EXIT_CODE)"
  TELEGRAM_STATUS="🟡"
fi

AGENT_STATUS="OK"
[ -n "$UNKNOWN_AGENTS" ] && AGENT_STATUS="UNKNOWN:$UNKNOWN_AGENTS"

# Log
echo "[$DATE] ClamAV: $SCAN_STATUS | LaunchAgents: $AGENT_STATUS" >> "$LOG"

# Telegram report
source "$HOME/Business/AI/AI FOLDER/.env" 2>/dev/null

MESSAGE="Vex Local Scan — $DATE
$TELEGRAM_STATUS ClamAV: $SCAN_STATUS
LaunchAgents: $AGENT_STATUS"

curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -d chat_id="1927638797" \
  -d text="$MESSAGE" > /dev/null 2>&1

echo "[$DATE] Vex Local Scan — done" >> "$LOG"
