# Session handoff

Update this at the end of every working session. Keep it short and factual.

---

## Last updated
2026-05-19 (session 2)

## Current focus
Shipment Exception caseplan published. Next: verify/fix Create Work Item data
action, then evaluate replacing with native POST /api/v2/casemanagement/cases.

## Done this session

- **Diagnosed broken case creation.** AVA's 3-step sequence
  (create_work_item_gc → create_case_sb → update_customer_case_id) was failing
  because: (1) status data actions had stale hardcoded statusIds, (2) three of
  the four data actions AVA depends on were never exported to the repo.

- **Rebuilt data-actions folder.** Deleted 5 stale status actions. Created:
  - `ABCRetail-SetWIStatus-InProgress.custom.json` — Shipment Exception only
  - `ABCRetail-SetWIStatus-Waiting.custom.json` — Shipment Exception only
  - `ABCRetail-SetWIStatus-Closed.custom.json` — Shipment Exception only
  - `ABCRetail-CreateCase-SB.custom.json` — POSTs to Supabase retail_cases
  - `ABCRetail-UpdateCustomerCaseID-SB.custom.json` — PATCHes customer open_case_id
  - `ABCRetail-SaveAVAContext.custom.json` — PATCHes conversation participant attributes

- **Worktype statuses added in GC Admin.** All four worktypes (Shipment Exception,
  Delivery Delay, Refund Request, Credit Hold) now have: Open, In Progress,
  Waiting on Customer, Closed.

- **Supabase migration applied.** Added GC tracking columns to
  `gc_demo_jh_shared_work_item_templates`:
  `gc_ava_type`, `gc_worktype_id`, `gc_workbin_id`,
  `gc_status_open_id`, `gc_status_in_progress_id`,
  `gc_status_waiting_id`, `gc_status_closed_id`.
  All four worktypes populated. WI-DELIVERY-DELAY inserted as a new row
  (was previously merged into WI-EXCEPTION-CASE).

## GC Object IDs — collected this session

| Worktype | gc_ava_type | gc_worktype_id | gc_status_closed_id |
|---|---|---|---|
| Shipment Exception | shipment_exception | 267bd390-039f-4bd3-a5c6-e1b1da1a93b6 | 111437de-8d2a-406a-97eb-517bbe1e7d8a |
| Delivery Delay | delivery_delay | d0267631-f569-4f7b-b6d0-8a7c5dd56c4a | 5f07caa8-efb0-469b-84f4-9de17d903fa3 |
| Refund Request | refund_request | b26019fa-26c7-4cc3-a9a9-6f2891bbf0c8 | 43201ca6-f14b-4fce-b93d-8652af75cb88 |
| Credit Hold | credit_hold | 946798a0-ad9a-4f66-bc2d-51e677554527 | ecb5efb9-00ab-4145-b341-fa76d888f0c3 |

Full status ID set in Supabase `gc_demo_jh_shared_work_item_templates`.

## In progress / next steps (do these in order)

### Step 1 — Custom Attribute Schema ✅ DONE
Schema ID: `14be6266-5533-466e-b79f-7a66bedf3135`

### Step 2 — Assign Schema to Worktypes ✅ DONE
All four worktypes assigned in GC Admin → Schema Display tab.

### Step 3 — Customer Intents ✅ DONE
- Refund Request: `c65ccaa9-dbd4-481f-80f5-4e4a2304d404` (pre-existing)
- Shipment Exception: `8965dd02-a41e-4849-b80d-e43d3786bf20` (created this session)
- API: POST/GET `/api/v2/intents/customerintents` (use flat `categoryId` field)
- Category ID: `299bfb92-c2c7-45b3-8b1a-c00e7729a78a`

### Step 4 — Shipment Exception Caseplan ✅ DONE
ID: `4adc4d54-597e-415f-9aad-ec764684baa2` — Published 2026-05-19
3 stages: Intake → Review → Resolution. All stepplans set to Workitem type,
Shipment Exception worktype. Full stageplan/stepplan IDs in CLAUDE.md.

### Step 5 — Fix Create Work Item data action ← START HERE
Verify `ABC Retail - Create Work Item` in GC tester. Evaluate replacing with
native POST /api/v2/casemanagement/cases once caseplan is published.

### Step 6 — Voice flow errors
Still unresolved. Get error trace from Performance → Interactions.

## Blocked / known issues

- **`temp` status on Delivery Delay worktype** — cannot be deleted because a
  workitem references it. Leave it. It doesn't affect the demo.
- **`after_hours_escalation` missing from Create Work Item data action** — no
  worktypeId mapped for this type. Add once the After Hours worktype is configured.
- **Other 9 demo customers have no GC External Contact.** Block 34 fails for
  them (failure branch keeps flow running). Fix later.

## Useful references

- Inbound message flow YAML: `6819fda8-ABC_Retail__Inbound_Message_Flow_v190.yaml`
  (re-upload if needed — check `~/uploads/`).
- Scripter export: `ec016c04-JHABC_Retail.script` (re-upload if needed).
- GC Function Lambda: `gc-functions/update-workitem/index.js`. ZIP at
  `gc-functions/update-workitem.zip`.
- AVA export: `ava--abc-retail-customer-service-assistant-export.json` (in repo).
- Data action (customer lookup): `data-actions/ABCRetail-GetCustomerRecord-SB.custom.json`.
