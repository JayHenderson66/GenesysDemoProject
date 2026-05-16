# Session handoff

Update this at the end of every working session. Keep it short and factual.

---

## Last updated
2026-05-16

## Current focus
Inbound voice flow is generating errors. AVA (Digital Bot Flow) behavior
also needs review. Both are next up after the case page work completed today.

## Done this session

- **Inbound message flow unblocked.** Fixed the cascade of failures:
  - Block 34 (Get External Contact): was hardcoded to a single UUID, now
    reads `Flow.getExternalContactId` dynamically. Failure branch confirmed
    wired to continue into transaction lookup (block 33 Set Participant Data).
  - Philip Rivers (`C1001`) `open_case_id` corrected from nonexistent `RR-16`
    to `CASE-2026-0042` ("Shipment Delayed 11 Days"). Case now resolves in
    Supabase and the flow completes through to ACD transfer.
  - Chat interaction successfully routed to agent with screen pop populating
    the agent script. AVA handled order status inquiry and escalated to agent.

- **Case page navigation fixed (PR #13, #14).** GC Scripter intercepts all
  external navigation from its iframe. Replaced `window.open()` and
  `window.location.href` approaches with a full-screen overlay iframe
  embedded inside the Start Page. Clicking Intake/Review/Resolution opens
  the case page in the overlay; "← Overview" button dismisses it and returns
  to the Start Page. All three case pages also have "← Overview" back buttons
  in their topbars (for standalone/direct URL access).

## In progress / pending

- **Voice flow** — generating errors, root cause not yet investigated.
  Need the flow export or error trace from Performance → Interactions.
- **AVA review** — user will share the Digital Bot Flow JSON. Behavior is
  described as similar to the inbound message flow. Need to review and
  confirm it works end to end.

## Blocked / known issues

- **Other 9 demo customers have no GC External Contact.** Block 34 will fail
  for them (but failure branch keeps the flow running). To fully support them,
  create GC External Contacts and populate `gc_external_contact_id` in Supabase.

## Open questions

- **AVA for workitems** — what should the bot do when a workitem interaction
  lands? Not yet designed. User will share AVA JSON to inform the discussion.

## Next session — start here

1. **Read `CLAUDE.md` and this `HANDOFF.md`** to load full context.
2. **Voice flow** — get the error message or Performance → Interactions trace
   and share it. Likely similar issues to the message flow (data action
   mapping, missing case record, hardcoded values).
3. **AVA** — user will share the Digital Bot Flow JSON. Review it, identify
   gaps, and align on what AVA should do end to end.
4. **After voice + AVA are stable** — consider creating GC External Contacts
   for the remaining 9 demo customers.

## Useful references

- Inbound message flow YAML: `6819fda8-ABC_Retail__Inbound_Message_Flow_v190.yaml`
  (re-upload if needed — check `~/uploads/`).
- Scripter export: `ec016c04-JHABC_Retail.script` (re-upload if needed).
- GC Function Lambda: `gc-functions/update-workitem/index.js`. ZIP at
  `gc-functions/update-workitem.zip`.
- Data action (customer lookup): `data-actions/ABCRetail-GetCustomerRecord-SB.custom.json`.
