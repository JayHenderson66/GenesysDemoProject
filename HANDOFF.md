# Session Handoff

Update at natural checkpoints during a session, not just at the end.

---

## Last updated
2026-05-27 (session 7) — Live E2E web messaging test passed; three follow-up items identified

## Immediate next steps

### 1. Disconnect messaging conversation after case creation (manual Architect)
In the **Inbound Message Flow**, the happy path after `callDigitalBotFlow` currently routes to `Transfer to ACD`. Change it to a **Disconnect** action.
- The demo story is: customer contacts → AVA creates case → "we'll be in touch" → conversation ends → back-office works the case as a workitem.
- The AVA failure/timeout paths inside the Digital Bot Flow already `Transfer to ACD` for live-agent escalation — leave those alone.

### 2. Screen pop on workitem delivery (manual Architect — all four workitem flows)
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

### 3. "No orders found" in agent script (debug)
TXN001 isn't rendering in the agent script after screen pop. Root cause unknown — chase down the data action response / URL param mapping.

## Known issues (lower priority)
- **"No Attributes Defined"** on workitem view — the 20 custom case attributes exist on the schema but aren't displaying. Separate from screen pop.
- **`temp` status on Delivery Delay worktype** — can't delete (workitem references it). Leave it, doesn't affect demo.
- **`after_hours_escalation`** — no caseplanId mapped in Create Case data action. Add once After Hours worktype is configured.
- **9 demo customers have no GC External Contact** — only Philip Rivers (C1001) is wired.
- **Test cases RR-20, RR-21, RR-22** — created during testing; clean up in GC Case Management when convenient.

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
