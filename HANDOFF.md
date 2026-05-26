# Session Handoff

Update at natural checkpoints during a session, not just at the end.

---

## Last updated
2026-05-26 (session 6) — AVA case creation E2E working in internal test tool

## Immediate next steps

### Fix Inbound Message Flow in Architect (manual)
Two changes needed:

**Fix 1 — Get Case failure path:**
In the `Get Case - SB` data action block, change the failure and timeout paths from `Transfer to ACD` to proceed to `callDigitalBotFlow` (with empty case variables). When `open_case_id` is null, the query returns empty and the flow currently bypasses AVA entirely.

**Fix 2 — Get Customer Record output mapping:**
In `Call Data Action 1` (Get Customer Record), `gc_external_contact_id` is currently mapped to `noValue: true`. Change it to map to `Flow.gcExternalContactId`. This ensures Philip's External Contact ID flows from Supabase, not only from `Message.ExternalContactId`.

### After inbound flow fix — Live E2E web messaging test
- Reset Philip's `open_case_id` to null in Supabase before testing
- Web message as Philip Rivers → AVA creates case → verify GC case + Supabase row + `open_case_id` updated + work item routed to ABC Retail queue

### After messaging E2E — Step 6: Voice external-contact wiring
Mirror messaging wiring using `Call.*` namespace:
- Inbound Call Flow: store `Call.ExternalContactId` → `Flow.gcExternalContactId` (Update Data block before callBotFlow)
- Voice Bot Flow: pass `Flow.gcExternalContactId` as input to AVA via Call Agentic Virtual Agent block

## This session (session 6)
- `ABC Retail - Create Case` data action: added Velocity `#if` guard for `externalContactId` — omits field if not a real UUID (length ≤ 30). Tested successfully (RR-20, RR-21 created during tests).
- AVA export updated from Jay's latest GC export as base:
  - `linkedConversationId` in `create_case_sb`: source `User` → `External`, type `ConversationId`
  - Confirmation loop fixed: instruction [1] now says confirm once then proceed immediately; instruction [9] explicitly says don't ask for refund details or re-confirm order number
- AVA internal test: all three tool calls (`create_case` → `create_case_sb` → `update_customer_case_id_sb`) verified working. RR-22 created in GC + Supabase, Philip's `open_case_id` updated correctly.
- Philip's `open_case_id` reset to null in Supabase (ready for E2E test)
- Inbound Message Flow analyzed — two bugs found (see above)

## Blocked / known issues
- **Inbound flow Get Case failure path** — bypasses AVA when `open_case_id` is null (manual Architect fix needed)
- **Inbound flow gc_external_contact_id mapping** — discarded instead of stored in `Flow.gcExternalContactId` (manual Architect fix needed)
- **`temp` status on Delivery Delay worktype** — can't delete (workitem references it). Leave it, doesn't affect demo.
- **`after_hours_escalation`** — no caseplanId mapped in Create Case data action. Add once After Hours worktype is configured.
- **9 demo customers have no GC External Contact** — only Philip Rivers (C1001) is wired.
- **Test cases RR-20, RR-21, RR-22** — created during testing, should be cleaned up in GC Case Management.
