# Session handoff

Update this at the end of every working session. Keep it short and factual.

---

## Last updated
2026-05-16

## Current focus
AVA case creation flow is now built and published. End-to-end test not yet
completed — that's the first thing to do next session.

## Done this session

- **All data action exports saved to `data-actions/`.** Canonical copies now
  in repo for every action in the org:
  - `ABCRetail-CreateCase-SB.custom.json`
  - `ABCRetail-UpdateCase-SB.custom.json`
  - `ABCRetail-UpdateCustomerCaseID-SB.custom.json`
  - `ABCRetail-GetWorkItem.custom.json`
  - `ABCRetail-GetCase-GC.custom.json`
  - `ABCRetail-CreateWorkItem.custom.json` ← new, key file with all
    Worktype/Workbin UUIDs baked into Velocity template

- **Create Work Item data action Worktype/Workbin UUIDs (from the export):**
  - `delivery_delay`: typeId `d0267631-f569-4f7b-b6d0-8a7c5dd56c4a`, workbinId `1f0741f7-e67d-4c7d-9d07-a245d73f1be7`
  - `shipment_exception`: typeId `267bd390-039f-4bd3-a5c6-e1b1da1a93b6`, workbinId `1f0741f7-e67d-4c7d-9d07-a245d73f1be7`
  - `refund_request`: typeId `b26019fa-26c7-4cc3-a9a9-6f2891bbf0c8`, workbinId `b345afee-802d-48d4-a786-dd40efabd867`
  - `credit_hold`: typeId `946798a0-ad9a-4f66-bc2d-51e677554527`, workbinId `4e465dbf-7239-466c-9b9f-723d0422dca0`

- **AVA updated with three new case creation tools** (`bot-flows/AVA-ABCRetailCustomerServiceAssistant.json`).
  AVA now imports, saves, and publishes successfully. Tools added:
  - `create_work_item_gc` → `ABC Retail - Create Work Item`
    action ID: `custom_-_5f8cb07b-4b38-4a17-9f66-8a3dba94b1f2`
  - `create_case_sb` → `ABC Retail - Create Case - SB`
    action ID: `custom_-_b54158da-7bb1-445a-acc4-5490193a6e6f`
  - `update_customer_case_id` → `ABC Retail - Update Customer Case ID - SB`
    action ID: `custom_-_251514e8-79ad-4ad0-b9ee-caa4a67506d5`

- **Case creation sequence AVA follows:**
  1. `create_work_item_gc` — creates GC work item, routes to correct workbin
  2. `create_case_sb` — creates Supabase case with key `CASE-{first8ofConvId}`
  3. `update_customer_case_id` — links case to customer record
  4. `save_ava_context` with `exitReasonValue = create_work_item`
  5. Confirms case reference to customer, advises 72-hour follow-up

- **Digital Bot Flow resynced.** AVA was deleted and recreated so the Digital
  Bot Flow needed the bot re-selected and all Start Context inputs remapped.
  User completed this step.

## Important lessons learned this session

- GC AVA publish rule: if a field is `required: true` in the tool inputs
  array, it must also be `required` in the data action's inputSchema.
  Supabase data actions have no required fields → all tool inputs must be
  `required: false`.
- ToolOutput chaining (source: "ToolOutput") causes silent save failures in
  the current GC AVA builder. Use User inputs instead and let the LLM carry
  values forward via inputInstructions.
- `additionalProperties: true` must be present in all tool schemas.inputs
  and schemas.outputs blocks.

## In progress / pending

- **End-to-end test of AVA case creation** — not yet tested in a live
  conversation. Test by placing a chat and asking AVA to create a case for
  a shipment delay. Verify: GC work item created in correct workbin, Supabase
  case record created, customer open_case_id updated.
- **Voice flow** — was generating errors before this session; not addressed
  today. Needs the flow export or Performance → Interactions error trace.

## Blocked / known issues

- **Other 9 demo customers have no GC External Contact.** Block 34 in the
  inbound flow will fail for them (but failure branch keeps flow running).
  Only Philip Rivers (C1001) is fully wired.

## Open questions

- Does the Digital Bot Flow `create_work_item` exit reason route correctly
  to the workbin queue in Architect? Verify after end-to-end test.

## Next session — start here

1. **Read `CLAUDE.md` and this `HANDOFF.md`** to load full context.
2. **Test AVA case creation end-to-end** — place a chat, trigger the
   create_work_item path, verify all three tool calls succeed and records
   appear in GC Task Management and Supabase.
3. **Voice flow** — get the error trace and fix.
4. **After both are stable** — consider creating GC External Contacts for
   the remaining 9 demo customers.

## Key action IDs (GC org)

| Data Action | Integration | Action ID |
|---|---|---|
| ABC Retail - Save AVA Context | purecloud-data-actions | `custom_-_a584bc77-7f3c-443c-a005-fd7524ac308a` |
| ABC Retail - Get Case - SB | custom-rest-actions | `custom_-_f0047eb8-9273-46a8-ae44-c75b87c3b269` |
| ABC Retail - Get Transaction - SB | custom-rest-actions | `custom_-_3471dde1-d65b-4ef2-8d6a-4f3652db76d0` |
| ABC Retail - Get Fulfillment - SB | custom-rest-actions | `custom_-_a6104ede-7cc5-4af4-8547-5d0c080be2d4` |
| ABC Retail - Create Work Item | purecloud-data-actions | `custom_-_5f8cb07b-4b38-4a17-9f66-8a3dba94b1f2` |
| ABC Retail - Create Case - SB | custom-rest-actions | `custom_-_b54158da-7bb1-445a-acc4-5490193a6e6f` |
| ABC Retail - Update Customer Case ID - SB | custom-rest-actions | `custom_-_251514e8-79ad-4ad0-b9ee-caa4a67506d5` |
| ABC Retail - Update Customer Case ID - SB | custom-rest-actions | `custom_-_251514e8-79ad-4ad0-b9ee-caa4a67506d5` |
| ABC Retail - Get Work Item | purecloud-data-actions | `custom_-_1bb43a76-8e74-4114-b54c-4aa378b5c963` |
| ABC Retail - Update Work Item Status | purecloud-data-actions | (export only, check GC for ID) |
| ABC Retail - Update Case - SB | custom-rest-actions | `custom_-_251514e8-79ad-4ad0-b9ee-caa4a67506d5` (verify) |

## Useful references

- AVA bot definition: `bot-flows/AVA-ABCRetailCustomerServiceAssistant.json`
- All data actions: `data-actions/` directory
- GC Function Lambda: `gc-functions/update-workitem/index.js`
- GC KB: `ee0257d8-09c9-4647-b205-86e8bfa80f6a` (ABC Retail KB)
