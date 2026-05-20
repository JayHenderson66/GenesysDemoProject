# Session handoff

Update this at the end of every working session. Keep it short and factual.

---

## Last updated
2026-05-20 (session 3)

## Current focus
AVA updated to use native GC case management (create_case). Inbound message
flow needs one change to pass gc_external_contact_id to the bot flow.

## Done this session

- **All four caseplans published.** Delivery Delay and Credit Hold caseplans
  built and published. All IDs recorded in CLAUDE.md.

- **Customer Intents created.** Delivery Delay and Credit Hold intents created
  via API. All four intent IDs now in CLAUDE.md.

- **Replaced Create Work Item with Create Case.**
  - `ABCRetail-CreateCase-GC.custom.json` built and published in GC Admin.
    Uses `POST /api/v2/casemanagement/cases`. Returns `caseId` + `caseReference`
    (e.g. "SE-3"). Velocity template selects caseplanId based on workItemType.
  - AVA export updated on GitHub main: `create_work_item_gc` replaced with
    `create_case`, targeting `ABC Retail - Create Case`. New `GcExternalContactId`
    type and `gc_external_contact_id` added to InputData.
  - `create_case` tool manually recreated in AVA Bot Designer (capitalized input
    names WorkItemType/Subject/Description — GC UI restriction, monitor during testing).
  - `create_case_sb` tool recreated in AVA Bot Designer (was causing WorkItemSubject
    direction error).
  - Sequencing instruction updated in AVA: references `create_case` (not create_case_gc).
  - AVA published.

- **Inbound message flow YAML uploaded.** v220 on file at
  `8afc0719-ABC_Retail__Inbound_Message_Flow_v220.yaml` in uploads.
  `gc_external_contact_id` IS set as a participant attribute (from Get Customer
  Record - SB output → Flow.getExternalContactId → setParticipantData).

## In progress / next steps (do these in order)

### Step 1–4 ✅ DONE (see CLAUDE.md for all IDs)

### Step 5 — Wire gc_external_contact_id into AVA ← START HERE

**The problem:** `Flow.getExternalContactId` is set in the inbound message flow
and added to `setParticipantData`, but the `callDigitalBotFlow` block does NOT
pass it to AVA as a bot flow input variable. AVA needs it to populate
`externalContactId` when calling `create_case`.

**Key insight (confirmed this session):** Bot flow input variables in the
`callDigitalBotFlow` block do NOT come from `setParticipantData`. They must
be declared as input variables in the bot flow itself AND wired upstream in the
inbound flow before the bot call. The existing 7 inputs (activeTxnId, customerId,
etc.) are passed directly as `Flow.*` variables in the callDigitalBotFlow inputs
section — they don't come through participant data.

**What still needs to happen:**
- Determine the correct upstream block in Architect that feeds inputs into
  the `callDigitalBotFlow` block, and add `Flow.gcExternalContactId` =
  `Flow.getExternalContactId` there.
- Do NOT keep trying setParticipantData — that feeds the agent script, not AVA.

**Fallback:** `externalContactId` is optional in the Create Case data action.
If wiring proves too complex, skip it and test end-to-end without it. The case
will be created but not linked to the external contact.

### Step 6 — End-to-end test
Trigger a web messaging conversation as Philip Rivers (C1001). Ask AVA to create
a case. Verify: (1) GC native case created with correct caseplan, (2) Supabase
case record created, (3) customer open_case_id updated, (4) caseReference
confirmed to customer.

### Step 7 — Voice flow errors
Still unresolved. Get error trace from Performance → Interactions.

## Blocked / known issues

- **gc_external_contact_id not reaching AVA** — see Step 5 above.
- **Input field capitalization in AVA** — WorkItemType/Subject/Description are
  capitalized due to GC UI restriction. May cause Velocity template substitution
  to fail. Watch for empty fields in test.
- **`temp` status on Delivery Delay worktype** — leave it.
- **`after_hours_escalation` missing from Create Case data action** — no
  caseplanId mapped. Add once After Hours worktype is configured.
- **Other 9 demo customers have no GC External Contact.** Non-blocking.

## Useful references

- Inbound message flow YAML: `8afc0719-ABC_Retail__Inbound_Message_Flow_v220.yaml`
  (in uploads). callDigitalBotFlow block at line 1116.
- Inbound voice flow YAML: `9c761662-ABC_Retail__Inbound_Voice_v330.yaml` (in uploads).
- AVA export: `ava--abc-retail-customer-service-assistant-export.json` (on GitHub main).
- Create Case data action: `data-actions/ABCRetail-CreateCase-GC.custom.json`.
- GC Function Lambda: `gc-functions/update-workitem/index.js`.
