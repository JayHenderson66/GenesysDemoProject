# Session Handoff

Update at natural checkpoints during a session, not just at the end.

---

## Last updated
2026-06-25 — Shipment Exception agent-script pop, status→stage model, and proactive SMS notifications.
NOTE: this session ran in the Claude **web app** (no GitHub MCP) — these doc updates were produced
for **manual commit**, not pushed. Work-item custom attributes now populate the native panel; the
agent-script load-order bug is fixed (delivered as a file; commit status unconfirmed).

## Immediate next steps

### 1. Get the SE work item Name (Task List) — BLOCKS Notification 2
Menu → Workspace → Task List → open an SE work item → read the **Name** column.
- If it carries the step (e.g. "SE-67 Intake and Triage") → branch notifications on the name (free).
- If it's just "SE-67" → add a Supabase Get Case lookup and branch on `current_stage`.

### 2. Build Notification 1 — tracking SMS (manual Architect)
Inside the **ABC Retail - Shipment Exception** workitem flow, main path, *after* the case context
is set and *before* Transfer to ACD:
1. Create flow vars `Flow.customerPhone`, `Flow.customerFirstName`.
2. Call Data Action → `ABC Retail - Get Customer Phone`
   - input `customerId` = `Workitem.Workitem.customFields.customer_id_identifier`
   - outputs: `customerPhone` → `Flow.customerPhone`, `firstName` → `Flow.customerFirstName`
3. Call Data Action → `ABC Retail - Send SMS Confirmation`
   - input `customerPhone` = `Flow.customerPhone`
   - input `messageBody` (expression):
     `"Hi " + Flow.customerFirstName + "! Thanks for reaching out to ABC Retail. We've opened case " + Workitem.Workitem.customFields.open_case_id_text + " and our team is now tracking your order. We'll text you as soon as there's an update. — ABC Retail Customer Care"`
4. **Best-effort:** point both actions' Failure + Timeout outputs straight at Transfer to ACD.
5. Disable the old ACW confirmation SMS so Philip doesn't get two texts.
Gate it to fire only at **Intake (stage 1)** using the stage signal from step 1 (the one SE flow
fires at every stage).

### 3. Worktype → script binding for SE (gates the live work item pop)
This is why SE-66 (script) vs SE-67 (native panel) mismatched — nothing passes the real
`open_case_id` into the script URL, so the script renders the standalone test value, not the live
work item. Wire:
- associate the `JH-ABC Retail` script to the SE worktype,
- map a script **Input** variable to custom attribute `open_case_id_text`,
- pass it through the Web Page component URL as `open_case_id`.
The agent-script load-order fix is already in place (case_id present → Supabase hydrate first, URL
params as fallback), so once the real id arrives the pop fills out.

### 4. Status model + case_outcome (rollout)
Adopt the universal 4-status set (Open / In Progress / Waiting on Customer / Complete) on every stage
worktype — see CLAUDE.md "Status & stage model". Add `case_outcome` (GC schema + Supabase column +
Trigger-2 PATCH). Option 1 chosen: outcome in data, not status; caseplan stays linear.

### 5. Retest auto-advance
Native to the published caseplan. End an SE stage-1 work item at a terminal/Closed status and confirm
the stage-2 work item spawns. Every SE case sitting at stage 1 looks untested, not broken.

## Known issues (lower priority)
- **SE-66 vs SE-67 mismatch** — explained: worktype→script binding not yet passing the real
  `open_case_id` (step 3). Not a data bug.
- **`linked_transaction_id` null on all SE cases** — script reaches the shipment only via
  `customer.active_txn_id` (C1001 → TXN001 → FUL001). Fragile for multi-order/multi-persona. Durable
  fix: write `linked_transaction_id` at case creation (AVA create_case) and flip script precedence to
  prefer the case's own link over `active_txn_id`.
- **Multiple agent-script versions in repo** (`ABCRetail_agent_script_workitem_fallback.html` + v2–v5
  + `agent_script.html`) — confirm which is the deployed Start Page and that the load-order fix landed there.
- **9 demo customers have no GC External Contact** — only Philip Rivers (C1001) is wired.
- Old test cases (RR-20/21/22/33, SE-66/67) — clean up in GC Case Management when convenient.

## Session (2026-06-25)
- **Agent script load-order fix.** Init now forces Supabase hydration when a `case_id`/`open_case_id`
  is present (was short-circuiting on `customer_id` in `loadFromUrlParams` and never hydrating); URL
  params kept as a degraded baseline. Mirrored in the postMessage handler. Delivered as a file.
- **Native/script division agreed.** Native owns the task (status lifecycle + Interactions Panel +
  Case panel); the HTML owns read-only context (customer 360, shipment exception detail, talk track).
  Only the Cases tab genuinely duplicates native (retire candidate); everything else stays.
- **Status & stage model decided** — universal 4-status set; decouple stage/status/outcome; outcome →
  `case_outcome`; linear caseplan; auto-advance is native. See CLAUDE.md.
- **Structural finding:** Shipment Exception is a published 3-stage caseplan whose three stages all
  point at the SINGLE `ABC Retail - Shipment Exception` worktype → one flow, rules fire at every stage.
- **Proactive SMS design** — two notifications, in-flow, agentless, reusing Get Customer Phone + Send
  SMS. Notification 1 spec ready (step 2). Notification 2 mechanism verified (OnAttributeChange on
  statusId), blocked on the work item Name / stage signal.
- Verified against Genesys docs: worktype→script binding, native caseplan auto-advance on terminal
  status, and workitem-flow launch rules (OnCreate / OnAttributeChange-on-statusId / Date).

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
