#!/bin/bash
set -euo pipefail

# Only run in remote web environment
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo "=== ABC Retail Demo — Session Start ==="
echo ""
echo "IMPORTANT: Supabase MCP (project jwnmiakpxzbvjoxeqjde, us-east-2) is available."
echo "Query tables directly using the MCP tools. Do not ask the user about database"
echo "contents or schema — consult Supabase directly or refer to CLAUDE.md."
echo ""
echo "=== HANDOFF.md (current project state) ==="
cat "$CLAUDE_PROJECT_DIR/HANDOFF.md"
echo ""
echo "=== End of session context ==="
