# Session Handoff

Update at natural checkpoints during a session, not just at the end.

---

## Last updated
2026-05-21 (session 5) — AVA case creation, caseKey source fix pending

## Immediate next step

### Fix `caseKey` source on `create_case_sb` in AVA Bot Designer
GC validation error: source is `User` but value comes from `create_case_gc` output.

**Fix:** Bot Designer → `create_case_sb` → delete `caseKey` input → add fresh:
- Source: **Tool Input**
- Tool: `create_case_gc`
- Output field: `caseReference`

Then apply the `openedDate` removal to the live `ABC Retail - Create Case - SB` data action in GC Admin (remove `opened_date: ${input.openedDate}` from request template + remove `openedDate` from input contract, save and republish).

Then publish AVA and run the messaging E2E test:
- Web message as Philip Rivers (C1001) → ask AVA to create a case
- Verify: GC case created + linked to external contact + Supabase row with GC reference as key (e.g. SE-4) + customer `open_case_id` updated + caseReference confirmed to customer

Once E2E passes: delete `ABC Retail - Create Work Item` from GC Admin.

### After messaging E2E — Step 6: Voice external-contact wiring
Mirror messaging wiring using `Call.*` namespace:
- Inbound Call Flow: `Flow.gcExternalContactId = Call.ExternalContactId` (Update Data block before call-bot-flow block)
- Bot Flow (voice): add Input-direction var `Flow.gcExternalContactId`, pass into AVA via Call Agentic Virtual Agent block
- Also: pull error trace from Performance → Interactions for original voice flow errors

## This session (session 5)
- `opened_date` Supabase default changed from hardcoded timestamp to `NOW()`
- `ABCRetail-CreateCase-SB.custom.json` updated — `openedDate` removed from request template + input schema (GitHub updated; live GC data action still needs this applied)
- AVA export updated — stale `CASE-{conversationId}` references replaced with GC reference format throughout
- `create_case_sb` tool: all 6 inputs confirmed present; caseKey instruction correct but source still `User` (GC blocked save)

## Blocked / known issues
- **`caseKey` source** — must delete + recreate in Bot Designer (see above)
- **`temp` status on Delivery Delay worktype** — can't delete (workitem references it). Leave it, doesn't affect demo.
- **`after_hours_escalation`** — no caseplanId mapped in Create Case data action. Add once After Hours worktype is configured.
- **9 demo customers have no GC External Contact** — only Philip Rivers (C1001) is wired. Cases for others created without external-contact link until contacts are populated.
