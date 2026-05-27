# Session Handoff

Update at natural checkpoints during a session, not just at the end.

---

## Last updated
2026-05-27 (session 7) — Web messaging E2E working end-to-end. Agent script, Copilot, and external contact linking all confirmed working.

## Immediate next steps

### 1. Disconnect messaging conversation after case creation (Inbound Message Flow)
Currently after `callDigitalBotFlow` exits, the inbound flow `Transfer to ACD` routes the live messaging conversation to the agent — resulting in two simultaneous interactions (workitem + messaging). The right demo story is to disconnect the messaging conversation after AVA creates the case and only deliver the workitem.

**Fix:** In the Inbound Message Flow, change the `Transfer to ACD` block that comes immediately after `callDigitalBotFlow` to a **Disconnect** action. The AVA failure/timeout paths inside the Digital Bot Flow already Transfer to ACD for genuine agent escalation scenarios — those stay as-is.

### 2. Screen pop on workitem delivery (all four workitem flows)
The workitem reaches the agent via ACD routing (worktype routing enabled) but no script pops. The screen pop must be set in each Architect workitem flow's `workitemCreated` task, before the `Transfer to ACD`.

**Fix:** In each of the four workitem flows (Refund Request, Delivery Delay, Shipment Exception, Credit Hold), add to the `workitemCreated` task:
1. `callData` → `Get Customer Record - SB` using the workitem's `case_customer_id` attribute as the lookup key
2. `setScreenPop` → `JH-ABC Retail` script with full customer + case data inputs
3. Existing `transferToAcd` → ABC Retail (unchanged)

### 3. "No orders found" in agent script
The ORDERS tab shows "NO ORDERS FOUND" even though Philip has `active_txn_id = TXN001` in Supabase. Transaction data is being fetched by the flow (Get Transaction runs successfully) but isn't rendering in the script. Needs investigation — likely a script-side rendering issue or the txn vars being overwritten before the screen pop fires.

### 4. "No Attributes Defined" on workitem view
The 20 custom case attributes aren't displaying in the workitem interaction view. May be a schema assignment issue or the attributes not being populated by AVA correctly.

### 5. Voice flow — external contact wiring
After messaging E2E is fully clean, mirror the wiring for voice using `Call.*` namespace:
- Inbound Call Flow: store `Call.ExternalContactId` → `Flow.gcExternalContactId` (Update Data block before callBotFlow)
- Voice Bot Flow: pass `Flow.gcExternalContactId` as input to AVA via Call Agentic Virtual Agent block

## This session (session 7)
- **Inbound Message Flow fixes (manual in Architect):**
  - Get Case failure + timeout paths now route to `callDigitalBotFlow` instead of Transfer to ACD ✅
  - `gc_external_contact_id` output correctly mapped to `Flow.gcExternalContactId` ✅
  - Three `Store ExternalContactId` Update Data blocks removed (were overwriting Supabase value with empty `Message.ExternalContactId`) ✅
  - `Set Screen Pop` moved to after `callDigitalBotFlow` (before Transfer to ACD) ✅
  - `callDigitalBotFlow` input mappings re-entered after AVA remap reset them ✅
- **Digital Bot Flow:** AVA remapped; confirmed YAML is correctly passing all inputs including `gc_external_contact_id` to AVA ✅
- **Worktype routing:** Routing enabled on all four worktypes with Default Queue: ABC Retail ✅; script `JH-ABC Retail` assigned at worktype level ✅
- **Workitem flows:** Confirmed all four YAML files have `transferToAcd → ABC Retail` on `workitemCreated` ✅ (flows were correct; routing was just disabled on worktypes)
- **E2E web messaging test result (RR-28):**
  - AVA engaged, case created ✅
  - Philip's `open_case_id` updated in Supabase ✅
  - External contact (Rivers, Philip) linked to GC case ✅
  - Workitem routed to agent via ACD ✅
  - Agent script loaded in widget mode with Philip's customer data ✅
  - Copilot / AI Guide loaded correctly ✅
  - Two interactions delivered to agent (workitem + messaging) — needs disconnect fix (see above)
  - Script not popping on workitem delivery — needs screen pop in workitem flow (see above)
- Philip's `open_case_id` reset to null in Supabase (ready for next test)

## Blocked / known issues
- **Messaging conversation not disconnecting after case creation** — agent receives two interactions (fix: Disconnect in inbound flow after callDigitalBotFlow)
- **No screen pop on workitem delivery** — needs setScreenPop in workitem flows' workitemCreated task
- **No orders in agent script** — txn data not rendering (TXN001 exists in Supabase)
- **No Attributes Defined on workitem** — custom attributes not displaying
- **`temp` status on Delivery Delay worktype** — can't delete (workitem references it). Leave it, doesn't affect demo.
- **`after_hours_escalation`** — no caseplanId mapped in Create Case data action. Add once After Hours worktype is configured.
- **9 demo customers have no GC External Contact** — only Philip Rivers (C1001) is wired.
- **Test cases RR-20 through RR-28** — created during testing, should be cleaned up in GC Case Management.
