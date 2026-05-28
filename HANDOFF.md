# Session Handoff

Update at natural checkpoints during a session, not just at the end.

---

## Last updated
2026-05-28 (session 8) — Root cause of AVA exit-reason error found; fix identified but not yet applied

## Immediate next steps

### 1. Fix `save_ava_context` data action URL (GC Admin — 2 min)
The live data action has `/conversations/calls/` hardcoded in the URL, which fails for messaging conversations.

**Fix:** Admin → Integrations → Actions → `ABC Retail - Save AVA Context` → Setup → change Request URL to:
```
/api/v2/conversations/${input.conversationId}/participants/${input.participantId}/attributes
```
(Remove `/calls/` — the generic endpoint works for both voice and messaging.)

After saving, re-test the action with a live conversation's IDs to confirm 200.

### 2. Reset Philip's `open_case_id` before next test
RR-33 was created during today's test. Reset `open_case_id` to null in Supabase `gc_demo_jh_retail_customers` for `key = 'C1001'` before the next E2E run.

### 3. Fix Inbound Message Flow happy path (manual Architect)
After `callDigitalBotFlow` succeeds, the flow currently routes to `Transfer to ACD`. Change to **Disconnect**.
- The demo story: customer contacts → AVA creates case → "we'll be in touch" → conversation ends.
- AVA handles agent escalation internally (Digital Bot Flow routes `agent_requested` to Transfer to ACD before exiting).
- The AVA failure/timeout paths inside the Digital Bot Flow already `Transfer to ACD` — leave those alone.

### 4. Screen pop on workitem delivery (manual Architect — all four workitem flows)
The `workitemCreated` task in each workitem flow currently does:
```
transferToAcd → ABC Retail
endTask
```
Change to **Option B (full data)**:
```
callData → Get Customer Record - SB  (using workitem attribute case_customer_id)
setScreenPop → JH-ABC Retail         (full name, account, txn data)
transferToAcd → ABC Retail
endTask
```
Apply to all four flows: Shipment Exception, Delivery Delay, Refund Request, Credit Hold.

### 5. "No orders found" in agent script (debug)
TXN001 isn't rendering in the agent script after screen pop. Root cause unknown — chase down the data action response / URL param mapping.

## Known issues (lower priority)
- **"No Attributes Defined"** on workitem view — the 20 custom case attributes exist on the schema but aren't displaying. Separate from screen pop.
- **`temp` status on Delivery Delay worktype** — can't delete (workitem references it). Leave it, doesn't affect demo.
- **`after_hours_escalation`** — no caseplanId mapped in Create Case data action. Add once After Hours worktype is configured.
- **9 demo customers have no GC External Contact** — only Philip Rivers (C1001) is wired.
- **Test cases RR-20, RR-21, RR-22, RR-33** — created during testing; clean up in GC Case Management when convenient.

## Session 8 (2026-05-28)
- Root cause of AVA exit-reason "error" identified: `ABC Retail - Save AVA Context` data action had `/conversations/calls/` in the URL template (voice-specific endpoint), which fails for messaging. Correct URL uses generic `/conversations/{id}/participants/{id}/attributes`.
- Confirmed: one data action covers both voice and messaging — no separate actions needed per channel.
- Fix not yet applied — Jay was mid-test when session ended. Start next session with step 1 above.
- Philip's `open_case_id` not yet reset — RR-33 created during today's test.

## Session 7 (2026-05-27)
- Confirmed Architect Fix 1 (Get Case failure path) and Fix 2 (gc_external_contact_id mapping) done by Jay manually.
- Live E2E web messaging test passed:
  - External contact fix confirmed working — "Customer: Rivers, Philip" showing in Case panel ✅
  - Workitem ACD routing working — workitem delivered to queue ✅
- Three follow-up items identified (see above).

## Session 6 (2026-05-26)
- `ABC Retail - Create Case` data action: added Velocity `#if` guard for `externalContactId`.
- AVA export updated: `linkedConversationId` source fixed, confirmation loop tightened.
- AVA internal test: all three tool calls verified working (RR-22 created E2E).
- Philip's `open_case_id` reset to null in Supabase.
- Inbound Message Flow analyzed — two bugs found and subsequently fixed manually by Jay.
