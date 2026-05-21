# Session handoff

Update this at the end of every working session. Keep it short and factual.

---

## Last updated
2026-05-21 (session 5)

## Terminology
The bot is the **Agentic Virtual Agent (AVA)**. Always use this name going forward.

## Current focus
AVA is one task away from being publishable. The `create_case_sb` tool has a
validation error: `caseKey` is set to `source: User` but GC requires it to be
`source: ToolInput` since the value comes from `create_case_gc`'s output.
Jay needs to delete and recreate the `caseKey` input in Bot Designer (GC won't
let you change source type in-place — must delete and add fresh). Once fixed,
publish AVA and run the messaging E2E test.

## What was done in session 5

- **`opened_date` Supabase default fixed** — changed from a hardcoded timestamp
  to `NOW()`. Done directly in Supabase via SQL.
- **`ABCRetail-CreateCase-SB.custom.json` updated** — removed `openedDate` from
  the request template and input schema. GitHub reference updated. **Still need
  to apply this change in GC Admin** (open the live data action, remove
  `opened_date: ${input.openedDate}` from the request template, remove
  `openedDate` from input contract, save and republish).
- **AVA export updated on GitHub** — all three stale `CASE-{conversationId}`
  references replaced with GC reference format (SE-4, RR-2, etc.) in:
  sequencing instruction, `create_case_sb` inputInstructions, `CaseKey` type
  description, `CreatedCaseResult` type description, `OpenCaseId` type description.
- **`create_case_sb` tool in Bot Designer** — all 6 inputs confirmed present.
  `caseKey` instruction correctly says to use `caseReference` from `create_case_gc`.
  BUT: source is still `User` — GC validation blocked save. Must fix (see below).

## Immediate next step (start here tomorrow)

### Fix `caseKey` source on `create_case_sb` in AVA Bot Designer

GC validation error:
> "Tool input 'caseKey' for tool 'create_case_sb' has a source of 'User' which
> is defined by another tool. Check if this tool input should have a source of
> 'ToolInput'."

**Fix:** In Bot Designer → `create_case_sb` tool → delete the `caseKey` input
entirely → add it back fresh with:
- Source: **Tool Input**
- Tool: `create_case_gc`
- Output field: `caseReference`

You cannot change source type in-place — GC requires delete + recreate.

After saving, also apply the GC Admin data action update (remove `openedDate`
from `ABC Retail - Create Case - SB` request template + input contract).

Then publish AVA and run the messaging E2E test.

## Flow topology (clarified session 4 — important)
AVA is ONE Agentic Virtual Agent serving both channels. Each channel has its own
pair of Architect flows in front of AVA:
- Messaging: Inbound Message Flow → Digital Bot Flow → AVA
- Voice:     Inbound Call Flow    → Bot Flow         → AVA
The middle "bot flow" is a separate intermediary, NOT AVA. Any value passed to
AVA must traverse EVERY hop: inbound flow → bot flow (needs an Input-direction
var + pass-through mapping in the Call Agentic Virtual Agent block) → AVA.

## Done in earlier sessions

- **Diagnosed and rebuilt broken case creation** (status data actions, Supabase
  data actions exported to repo).
- **Worktype statuses + Supabase tracking columns** added for all four worktypes.
- **All four caseplans published** (Refund Request, Shipment Exception, Delivery
  Delay, Credit Hold). 3 stages each: Intake → Review → Resolution. IDs in CLAUDE.md.
- **Customer intents** created for all four worktypes. IDs in CLAUDE.md.
- **Create Case data action built** and AVA migrated from create_work_item to
  create_case_gc.
- **External contact wiring COMPLETE** on the messaging side (all three flows
  verified). `Message.ExternalContactId` → Inbound Msg Flow
  `Flow.gcExternalContactId` → callDigitalBotFlow input → Digital Bot Flow input
  var → Call Agentic VA → AVA InputData `gc_external_contact_id` →
  `create_case_gc` externalContactId.

## GC Object IDs

| Worktype | gc_ava_type | gc_worktype_id | gc_status_closed_id |
|---|---|---|---|
| Shipment Exception | shipment_exception | 267bd390-039f-4bd3-a5c6-e1b1da1a93b6 | 111437de-8d2a-406a-97eb-517bbe1e7d8a |
| Delivery Delay | delivery_delay | d0267631-f569-4f7b-b6d0-8a7c5dd56c4a | 5f07caa8-efb0-469b-84f4-9de17d903fa3 |
| Refund Request | refund_request | b26019fa-26c7-4cc3-a9a9-6f2891bbf0c8 | 43201ca6-f14b-4fce-b93d-8652af75cb88 |
| Credit Hold | credit_hold | 946798a0-ad9a-4f66-bc2d-51e677554527 | ecb5efb9-00ab-4145-b341-fa76d888f0c3 |

Full status ID set in Supabase `gc_demo_jh_shared_work_item_templates`.

## In progress / next steps (do these in order)

### Step 1–4 ✅ DONE (see CLAUDE.md for all IDs)
Schema, schema-to-worktype assignment, customer intents, and all four caseplans
built and published.

### Step 5 — Replace Create Work Item with native Create Case — ALMOST DONE

**AVA tool chain (all configured in Bot Designer):**
1. `create_case_gc` — creates GC native case, returns `caseId` + `caseReference`
2. `create_case_sb` — inserts Supabase row. **`caseKey` input needs to be
   recreated as source ToolInput from `create_case_gc → caseReference`** (see
   Immediate next step above). All other 5 inputs correct.
3. `update_customer_case_id` — links `createdKey` to customer `open_case_id`. No changes needed.
4. `save_ava_context` — exits with `create_work_item`. No changes needed.

**After caseKey fix + AVA published, run E2E test:**
- Web message as Philip Rivers (C1001) → ask AVA to create a case
- Verify: GC native case created + linked to external contact + Supabase row
  inserted with GC reference as key (e.g. SE-4) + customer `open_case_id`
  updated + caseReference confirmed to customer
- Delete `ABC Retail - Create Work Item` from GC Admin once E2E passes

**Also still needed:**
- Apply `openedDate` removal to the live `ABC Retail - Create Case - SB` data
  action in GC Admin (GitHub reference already updated this session)

### Step 6 — Voice side external-contact wiring (do after messaging E2E passes)
Mirror the messaging wiring on voice, using the `Call.*` namespace:
- Inbound Call Flow: Update Data block `Flow.gcExternalContactId = Call.ExternalContactId`
  (NOT Message.* — voice uses Call.*), placed before the call-bot-flow block,
  then map it as an input on that block.
- Bot Flow (voice): add Input-direction var `Flow.gcExternalContactId` and pass it
  into AVA in the Call Agentic Virtual Agent block (same as Digital Bot Flow).
- AVA is shared — already done.
Also: original voice flow errors still unresolved — get error trace from
Performance → Interactions.

## Blocked / known issues

- **`temp` status on Delivery Delay worktype** — cannot be deleted because a
  workitem references it. Leave it. It doesn't affect the demo.
- **`after_hours_escalation` missing from Create Case data action** — no
  caseplanId mapped. Add once the After Hours worktype is configured.
- **Other 9 demo customers have no GC External Contact.** Cases for those
  customers will be created without an external-contact link until contacts
  are populated. Philip Rivers (C1001) is the only one wired.

## Useful references

- Inbound message flow YAML: `8afc0719-ABC_Retail__Inbound_Message_Flow_v220.yaml`
  (in uploads). callDigitalBotFlow block at line 1116; Block 37 stores ext contact.
- Inbound voice flow YAML: `9c761662-ABC_Retail__Inbound_Voice_v330.yaml` (in uploads).
- Digital Bot Flow YAML: `aa5b0058-ABC_Retail_Digital_Bot_Flow_v90.yaml` (in uploads).
- AVA export: `ava--abc-retail-customer-service-assistant-export.json` (on GitHub main).
- Create Case (GC) data action: `data-actions/ABCRetail-CreateCase-GC.custom.json`.
- Create Case (SB) data action: `data-actions/ABCRetail-CreateCase-SB.custom.json`.
- GC Function Lambda: `gc-functions/update-workitem/index.js`.
