# Session handoff

Update this at the end of every working session. Keep it short and factual.

---

## Last updated
2026-05-21 (session 4)

## Current focus
Native Case Management migration is essentially done. `ABC Retail - Create Case`
data action (native POST /api/v2/casemanagement/cases) built, tested (returns
caseReference e.g. "SE-3"), and exported. AVA updated to call `create_case`.
External-contact wiring into the inbound flow is complete. Next: end-to-end test,
then delete the old `ABC Retail - Create Work Item` action.

## Done in earlier sessions

- **Diagnosed and rebuilt broken case creation** (status data actions, Supabase
  data actions exported to repo).
- **Worktype statuses + Supabase tracking columns** added for all four worktypes.
- **All four caseplans published** (Refund Request, Shipment Exception, Delivery
  Delay, Credit Hold). 3 stages each: Intake → Review → Resolution. IDs in CLAUDE.md.
- **Customer intents** created for all four worktypes. IDs in CLAUDE.md.
- **Create Case data action built** and AVA migrated from create_work_item to
  create_case (see Step 5).

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

### Step 5 — Replace Create Work Item with native Create Case ✅ MOSTLY DONE
- Built `ABC Retail - Create Case` (`data-actions/ABCRetail-CreateCase-GC.custom.json`)
  using native `POST /api/v2/casemanagement/cases`. Velocity template selects
  caseplanId from `$input.workItemType`. Returns `caseId` ($.id) +
  `caseReference` ($.reference, e.g. "SE-3"). Includes `externalContactId` input.
- AVA updated: tool `create_case` (manually rebuilt in Bot Designer), `create_case_sb`
  recreated, sequencing instruction updated, AVA published. NOTE: GitHub export
  still labels the tool `create_case_gc` — reconcile when convenient. AVA tool's
  `targetId` was a placeholder needing relink in UI (done in UI).
- Capitalized input names (`WorkItemType`/`Subject`/`Description`) in AVA — verify
  during E2E test that Velocity `${input.workItemType}` substitution still resolves.
- **External contact wiring COMPLETE.** The GC External Contact for the live
  conversation is `Message.ExternalContactId` (Architect built-in — NOT
  `Session.ExternalContactId`, which doesn't exist). Wired in the inbound message
  flow as: Block 37 "Store External Contact ID" Update Data sets
  `Flow.gcExternalContactId = Message.ExternalContactId`, placed after Set
  Participant Data (Block 29) / Update Data (Block 31) and before Set Screen Pop /
  Call Digital Bot Flow. `callDigitalBotFlow` passes input
  `gc_external_contact_id = Flow.gcExternalContactId`.
  This supersedes the old `Flow.getExternalContactId` (Supabase column from
  Block 14 customer lookup, only populated for C1001) — that output is now
  dead/unused but harmless. Block 14 itself is still required (primary customer
  lookup feeding Set Participant Data + screen pop).

  Remaining for Step 5:
  - Publish inbound message flow (if not already).
  - End-to-end test: web message as Philip Rivers (C1001) → ask AVA to create a
    case → verify native GC case created + linked to external contact + Supabase
    row created + customer open_case_id updated + caseReference returned.
  - Delete `ABC Retail - Create Work Item` from GC Admin once E2E passes.

### Step 6 — Voice flow errors
Still unresolved. Get error trace from Performance → Interactions.

## Blocked / known issues

- **`temp` status on Delivery Delay worktype** — cannot be deleted because a
  workitem references it. Leave it. It doesn't affect the demo.
- **`after_hours_escalation` missing from Create Case data action** — no
  caseplanId mapped. Add once the After Hours worktype is configured.
- **Other 9 demo customers have no GC External Contact.** Block 34 (Get External
  Contact) fails for them (failure branch keeps flow running). For case creation
  this no longer relies on the Supabase column — `Message.ExternalContactId` is
  empty when GC hasn't matched a contact, so cases for those customers will be
  created without an external-contact link until contacts are populated.

## Useful references

- Inbound message flow YAML: `8afc0719-ABC_Retail__Inbound_Message_Flow_v220.yaml`
  (in uploads). callDigitalBotFlow block at line 1116; Block 37 stores ext contact.
- Inbound voice flow YAML: `9c761662-ABC_Retail__Inbound_Voice_v330.yaml` (in uploads).
- AVA export: `ava--abc-retail-customer-service-assistant-export.json` (on GitHub main).
- Create Case data action: `data-actions/ABCRetail-CreateCase-GC.custom.json`.
- Customer lookup data action: `data-actions/ABCRetail-GetCustomerRecord-SB.custom.json`.
- GC Function Lambda: `gc-functions/update-workitem/index.js`.
