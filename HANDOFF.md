# Session handoff

Update this at the end of every working session. Keep it short and factual.

---

## Last updated
2026-05-15

## Current focus
AVA (Digital Bot Flow) is not yet working for work items, and inbound
chat/voice interactions aren't routing to an agent. Routing + AVA are the
next two things to troubleshoot.

## Done this session

- **Active Case card** added to the Start Page (`ABCRetail_agent_script.html`):
  stage pipeline, priority, metadata, Intake/Review/Resolution quick-open
  buttons. Wired into both widget-mode screen pop and standalone customer
  search. Merged to `main` in PR #11.
- **External Contact lookup fixed.** The inbound flow's "Get External Contact"
  block was failing because of a hardcoded UUID. Replaced with a dynamic
  lookup driven by `Flow.getExternalContactId`, which is populated from the
  Supabase customer record.
- **New data action** `ABC Retail - Get Customer Record - SB` exported and
  committed at `data-actions/ABCRetail-GetCustomerRecord-SB.custom.json` —
  adds `gc_external_contact_id` to the response translation map, success
  template, and output schema. **Imported and republished in GC.**
- **Block 12 (customer lookup) re-bound** to the new data action; its new
  output `gc_external_contact_id` is mapped to `Flow.getExternalContactId`.
- **Block 34 (Get External Contact)** updated: `External Contact ID` =
  `Flow.getExternalContactId`, `External Contact Result` =
  `Flow.getExternalId` (ExternalContact type).
- **Supabase `customers.gc_external_contact_id`** populated for Philip Rivers
  (`C1001` → `a92d57ff-0eda-464a-9f8d-f17c68728d90`). Other 9 customers are
  still empty — flow needs a failure branch on block 34 to avoid stalling.

## In progress / pending

- **Block 34 Failure branch.** Not yet confirmed wired. On failure, continue
  into the same transaction lookup that Success leads to so a missing contact
  doesn't stall the flow.
- **Republish the inbound message flow** once the failure branch is added.
- **Test a chat interaction** with Philip Rivers (`customerId=C1001`) end to
  end — verify the screen pop populates the agent script and the Active Case
  card appears.

## Blocked / known issues

- **Chat + voice not routing to agent.** Tried earlier this session — neither
  hit the agent. Root cause not yet identified. Candidates:
  - Agent not on-queue or not a member of `ABC Retail` queue
  - Required skills / ACD config mismatch
  - Flow not publishing successfully (data action mapping errors stall it)
  - Bot flow erroring before `transferToAcd`
- **AVA not yet configured for work items.** Today AVA is called inside the
  inbound message flow before ACD transfer, but its behavior for workitem
  interactions hasn't been designed or implemented.

## Open questions

- **What should AVA do on a workitem?** Options: deflect / summarize the
  case / coach the agent through the script / draft customer comms. Need to
  decide before designing the bot flow.
- **External contact handling for the other 9 demo customers.** Do we create
  contacts for all of them in GC and populate `gc_external_contact_id`, or
  rely on the failure branch indefinitely?

## Next session — start here

1. **Read `CLAUDE.md` and this `HANDOFF.md`** to load full context.
2. **Verify Block 34 has a Failure branch** wired to continue into the
   transaction lookup (same as Success).
3. **Republish the inbound message flow**, then test a chat interaction with
   Philip Rivers (`C1001`).
4. **If routing still fails**, walk down this list:
   - Is the test agent on-queue?
   - Is the agent a member of the `ABC Retail` queue?
   - Does the published flow validate cleanly in Architect?
   - Does the digital bot flow publish + invoke without errors?
   - Open the conversation in GC's Performance > Interactions view and look
     at the flow execution to see where it stops.
5. **Then move to AVA.** Pick a goal for the bot on workitems (start with
   "summarize the open case and offer to advance the stage") and design the
   bot flow around it.

## Useful references

- Inbound flow YAML export: most recent at `~/uploads/...` (re-upload if
  needed).
- Scripter export: `ec016c04-JHABC_Retail.script` (re-upload if needed).
- GC Function Lambda: `gc-functions/update-workitem/index.js`. ZIP at
  `gc-functions/update-workitem.zip`.
