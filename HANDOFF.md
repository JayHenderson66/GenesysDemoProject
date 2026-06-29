# Session Handoff

Update at natural checkpoints during a session, not just at the end.

---

## Last updated
2026-06-29 — Status relabel (Closed → Complete) validated end-to-end on SE-69; per-stage queue
routing confirmed; `case_outcome` built (Supabase column + CHECK, GC dropdown attribute).
NOTE: ran in the Claude **web app** (no GitHub MCP). Supabase changes (case_outcome column + CHECK)
are **LIVE** — applied directly via the Supabase MCP. The GC dropdown attribute was saved by Jay in
the console. This doc is for **manual commit** (not pushed).

## Current truths (don't relearn these)
- **Auto-advance works natively; Supabase never hears about it.** SE-69 is Stage 2 in GC but still
  `current_stage = 1` in Supabase. That sync gap is the real open defect — it's what Trigger-2 fixes.
- **Stage gating is solved by the work item name, no Supabase needed.** Auto-spawned stages are named
  `SE-XX {stepplan}` ("SE-69 Investigation and Review", "…Resolution and Closure"); the **Intake**
  work item is the generic **"ABC Retail"** (created at case open, not caseplan-named). So Notification 2
  gates on the name containing "Resolution and Closure"; Notification 1 gates by the *absence* of the
  stepplan markers. OnCreate fires once per stage, so ungated notifications fire 3×.
- **Per-stage queue routing is real (multi-team handoff).** Stage 1 → Order Management, Stage 2 →
  Logistics & Operations, Stage 3 → Customer Service (template-confirmed; corroborated by SE-69's
  Logistics workbin). Not a single-queue collapse.
- **Status model is live on SE and validated.** Universal 4-status set (Open / In Progress / Waiting on
  Customer / Complete). The terminal status is **"Complete"** sitting in the **Closed category** — the
  label was renamed but the category is intact, and auto-advance keys off the *category*, so the rename
  didn't disturb it. The word "Closed" an agent still sees is the immovable category header, not a status.

## Immediate next steps

### 1. Repoint the SE worktype to the new schema version (SE ONLY)
`case_outcome` was added to the shared **"ABC Demo - Base Case Schema"** (org-level, used by every
worktype/case type). Saving an attribute creates a **new schema version**, and worktypes pin a specific
version — they don't auto-follow. So `case_outcome` is invisible until you repoint.
- Worktype → **Schema Version** → select the new version.
- **SE only.** Leave RR/DD/CH on the old version; repointing them later means re-validating each
  worktype's workitem flow (the schema is a flow dependency).

### 2. Place `case_outcome` in the panel + fix editability
- Panel builder → Custom Attributes → drag `case_outcome` in → set **Editable**, ideally under its own
  divider so it reads as the one thing an agent sets.
- **Flip the four context fields back to Read-only:** Open Case ID, Customer ID, Case Order Number,
  Case Type. They're currently Editable — they're identity/linkage set at case creation, and every
  editable-but-unsynced field is a fresh drift surface. Editable is reserved for fields you sync
  (right now: `case_outcome`).
- Note: SE is one worktype/one schema/one panel, so `case_outcome` is editable on the Intake and Review
  work items too. Rely on convention (set only at Resolution) for now; the workitem flow could enforce
  it later if needed.

### 3. Build Trigger-2 — closes the GC→Supabase sync gap
On work item status change, read the case's fields and PATCH Supabase. Two fields to carry:
- `case_outcome` ← `Workitem.Workitem.customFields.case_outcome_enum` (the dropdown's locked key)
- `resolution` ← the free-text narrative ("the how")
Supabase side is ready: `case_outcome` column accepts only `approved/denied/partial/resolved/no_action/
cancelled` (or NULL) via CHECK; dropdown Item Keys match exactly, so PATCHes won't bounce.
Also have Trigger-2 advance `current_stage` / `stage_N_status` so the script and reporting stop reading
stale stage data. Known blocker to resolve: the `JsonSchema` vs `TopLevelPrimitives` input-mapping
conflict (see CLAUDE.md).

### 4. Build Notification 1 — tracking SMS (manual Architect) — CORRECTED RECIPE
Inside the **ABC Retail - Shipment Exception** workitem flow, after case context is set and before
Transfer to ACD. (Supersedes the old recipe, which used a retired data action and omitted `fromAddress`.)
1. Flow vars `Flow.customerPhone`, `Flow.customerFirstName`.
2. Call Data Action → **`ABC Retail - Get Customer Record - SB`** *(NOT `Get Customer Phone` — that one
   points at a retired Genesys Data Table)*
   - input `customerId` = `Workitem.Workitem.customFields.customer_id_identifier`
   - output `phone_normalized` → `Flow.customerPhone`  *(verify format matches what agentless SMS wants)*
   - output `first_name` → `Flow.customerFirstName`
3. Call Data Action → **`ABC Retail - Send SMS Confirmation`** (POST `/conversations/messages/agentless`)
   - input `fromAddress` = `+19495414956`  **(REQUIRED — was missing from the old recipe)**
   - input `customerPhone` = `Flow.customerPhone`
   - input `messageBody` (expression):
     `"Hi " + Flow.customerFirstName + "! Thanks for reaching out to ABC Retail. We've opened case " + Workitem.Workitem.customFields.open_case_id_text + " and our team is now tracking your order. We'll text you as soon as there's an update. — ABC Retail Customer Care"`
4. **Gate to Intake only:** fire when the work item name does NOT contain "Investigation and Review" or
   "Resolution and Closure" (Intake is the generic "ABC Retail" item; OnCreate fires once per stage).
5. Failure + Timeout on both actions → straight to Transfer to ACD. Disable the old ACW confirmation SMS.

### 5. Build Notification 2 — resolved-on-close SMS
Gate on work item name containing **"Resolution and Closure"** + a terminal (Complete) close. No Supabase
dependency, no Trigger-2 dependency. Mechanism: OnAttributeChange on statusId.

### 6. (Open, untouched this week) Worktype → script binding for SE
This is why SE-66 (script) vs SE-67 (native panel) mismatched — nothing passes the real `open_case_id`
into the script URL, so the script renders the standalone test value. Wire:
- associate the `JH-ABC Retail` script to the SE worktype,
- map a script **Input** variable to custom attribute `open_case_id_text`,
- pass it through the Web Page component URL as `open_case_id`.
The agent-script load-order fix is already in place (case_id present → Supabase hydrate first, URL params
as fallback), so once the real id arrives the pop fills out.

## Status model + case_outcome — DONE / REMAINING
**Done:**
- Universal 4-status set live on SE; terminal "Complete" in Closed category; auto-advance validated (SE-69).
- Supabase `case_outcome text` column + CHECK (`approved/denied/partial/resolved/no_action/cancelled` or NULL). LIVE.
- `resolution` confirmed as free-text narrative (the "how"); `case_outcome` is the categorical disposition.
- GC dropdown attribute saved on "ABC Demo - Base Case Schema": name `case_outcome`, **key `case_outcome_enum`**,
  six items with Item Keys matching the CHECK exactly.

**Remaining:** steps 1–3 above (repoint SE worktype, place + set editable, Trigger-2). Then roll the
status set + worktype repoint to RR/DD/CH.

## Known issues (lower priority)
- **`linked_transaction_id` null on all SE cases** — script reaches the shipment only via
  `customer.active_txn_id` (C1001 → TXN001 → FUL001). Fragile for multi-order/multi-persona. Durable
  fix: write `linked_transaction_id` at case creation (AVA create_case) and flip script precedence to
  prefer the case's own link over `active_txn_id`.
- **Multiple agent-script versions in repo** (`ABCRetail_agent_script_workitem_fallback.html` + v2–v5
  + `agent_script.html`) — confirm which is the deployed Start Page and that the load-order fix landed there.
- **9 demo customers have no GC External Contact** — only Philip Rivers (C1001) is wired.
- **GC schema is non-destructive by design** — attributes/schemas can't be deleted and field keys can't
  be changed once saved. `case_outcome_enum` is locked; anything mis-created is permanent clutter.
- Old test cases (RR-20/21/22/33, SE-66/67/68/69) — clean up in GC Case Management when convenient.

## Session (2026-06-29)
- **Status relabel validated.** Renamed terminal status "Closed" → "Complete" (kept in Closed category).
  Confirmed end-to-end on a fresh case (SE-69): stage-1 → Complete advanced the case to Stage 2, spawned
  "SE-69 Investigation and Review" Open in the Logistics workbin, Intake marked Completed. Rename did not
  disturb auto-advance (category unchanged). Agent script unaffected — it matches Supabase field values,
  not GC status labels.
- **Sync gap proven, not theoretical.** Re-queried SE-69 post-advance: `current_stage` still 1,
  `never_updated = true`. GC advances natively; nothing syncs it to Supabase. Trigger-2 owns this.
- **Per-stage queues confirmed** from `gc_demo_jh_shared_work_item_templates`: Order Management →
  Logistics & Operations → Customer Service.
- **`case_outcome` built.** Verified `resolution` is free-text (not categorical) so no redundancy.
  Added Supabase column + CHECK (LIVE via MCP). Chose single shared **disposition-axis** enum (one column
  = one axis; "how" stays in `resolution`). Created GC dropdown `case_outcome_enum` on the shared base
  schema; six Item Keys match the CHECK. Schema saved. **SE worktype not yet repointed to the new version.**
- **Data-action correction banked.** `Get Customer Phone` (per its export) reads a retired Genesys Data
  Table — replaced in the Notification 1 recipe by `Get Customer Record - SB` (Supabase; returns
  `phone_normalized` + `first_name` from `customerId`). `Send SMS Confirmation` requires `fromAddress`
  (+19495414956) as a third input.

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
- **Proactive SMS design** — two notifications, in-flow, agentless. Notification gating since resolved
  (name-based, see Current truths).
- Verified against Genesys docs: worktype→script binding, native caseplan auto-advance on terminal
  status, and workitem-flow launch rules (OnCreate / OnAttributeChange-on-statusId / Date).

## Session 8 (2026-05-28)
- Root cause of AVA exit-reason "error" identified: `ABC Retail - Save AVA Context` data action had `/conversations/calls/` in the URL template (voice-specific endpoint), which fails for messaging. Correct URL uses generic `/conversations/{id}/participants/{id}/attributes`.
- Confirmed: one data action covers both voice and messaging — no separate actions needed per channel.
- Fix not yet applied — Jay was mid-test when session ended.
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
