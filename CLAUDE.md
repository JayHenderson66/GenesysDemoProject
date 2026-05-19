# ABC Retail — Genesys Cloud Demo

A demo Genesys Cloud (GC) implementation for "ABC Retail" — a fictional retailer.
Showcases voice + web messaging routing, a custom agent script (Scripter), a
work-item-based case management workflow, a bot flow (AVA), and Supabase as the
system of record for customer / order / case data.

## Architecture at a glance

```
┌────────────────┐      ┌─────────────────────┐      ┌──────────────────┐
│ Customer       │─────▶│ GC Architect flows  │─────▶│ GC ACD → Agent   │
│ (voice / chat) │      │  - Inbound Message  │      │  Scripter loads  │
└────────────────┘      │  - AVA Digital Bot  │      │  agent_script    │
                        └─────────┬───────────┘      └────────┬─────────┘
                                  │                           │
                                  ▼                           ▼
                        ┌─────────────────────┐      ┌──────────────────┐
                        │ Supabase (Postgres) │      │ Case pages       │
                        │  via data actions   │      │  intake / review │
                        └─────────────────────┘      │  resolution      │
                                                     │  + GC Function   │
                                                     │  update-workitem │
                                                     └──────────────────┘
```

- **GitHub Pages** serves all HTML from `main`. To deploy, merge to `main`.
- **Supabase** is *only* a database (no Edge Functions). All GC ↔ Supabase
  traffic goes through GC Custom REST Data Actions.
- **GC Functions** (Lambda) handle GC-side mutations that need OAuth client
  credentials (e.g. `update-workitem` PATCHes work item status).

## Key files

| Path                                                | Purpose                                                                 |
|-----------------------------------------------------|-------------------------------------------------------------------------|
| `ABCRetail_agent_script.html`                       | Start Page loaded in Scripter iframe. Widget mode + standalone mode.    |
| `case_intake.html` / `case_review.html` / `case_resolution.html` | Per-stage case workspaces opened from the Start Page         |
| `index.html`                                        | Repo landing page (GH Pages)                                            |
| `abc-retail-mobile.html`                            | Customer-facing mobile mock                                             |
| `data-actions/*.custom.json`                        | Exported GC Data Actions (canonical copies)                             |
| `gc-functions/update-workitem/index.js`             | GC Function Lambda — PATCHes workitem statusId via OAuth client creds  |
| `gc-functions/update-workitem.zip`                  | Deployable ZIP (index.js at root via `zip -j`)                          |

## Supabase tables (`public` schema)

| Table                                  | What it holds                            |
|----------------------------------------|------------------------------------------|
| `gc_demo_jh_retail_customers`          | Customer master (10 demo rows)           |
| `gc_demo_jh_retail_transactions`       | Orders / transactions                    |
| `gc_demo_jh_retail_fulfillment`        | Shipping / fulfillment records           |
| `gc_demo_jh_retail_cases`              | Open cases + per-stage state             |
| `gc_demo_jh_retail_journey_events`     | Customer journey timeline                |
| `gc_demo_jh_shared_demo_config`        | Demo-wide config                         |
| `gc_demo_jh_shared_customers_by_phone` | Phone-keyed customer view                |
| `gc_demo_jh_shared_work_item_templates`| Work item templates                      |

Supabase project: `jwnmiakpxzbvjoxeqjde` (region `us-east-2`).

The customers table has a `gc_external_contact_id` column used by the inbound
flow's `Get External Contact` block to link conversations to GC contacts.
Only `C1001` (Philip Rivers) is currently populated.

## Native Case Management — GC objects

### Custom Attribute Schema — `ABC Retail - Case Attributes`
Schema ID: **`14be6266-5533-466e-b79f-7a66bedf3135`**

All 20 attributes (attribute name → field ID → type):

| Attribute name | Field ID | Type | Description |
|---|---|---|---|
| `case_amount_requested` | `case_amount_requested_number` | Number | Refund amount requested (USD), 0–100,000 |
| `case_approved_amount` | `case_approved_amount_number` | Number | Amount approved for refund, 0–100,000 |
| `case_channel` | `channel_text` | Small Text (1–20) | Contact channel: voice, web_messaging, sms |
| `case_customer_id` | `customer_id_identifier` | Identifier (1–20) | Customer ID, e.g. C1001 |
| `case_customer_notified` | `case_customer_notified_checkbox` | Checkbox | Whether customer has been notified |
| `case_intent` | `intent_text` | Small Text (1–50) | AVA-detected intent: refund_request, delivery_delay, etc. |
| `case_notification_method` | `case_notification_method_text` | Small Text (1–20) | sms, email, or phone |
| `case_order_number` | `order_number_text` | Small Text (1–50) | Order / PO number, e.g. PO-2026-7890 |
| `case_policy_check_passed` | `case_policy_check_passed_checkbox` | Checkbox | Refund passes policy validation |
| `case_priority` | `case_priority_text` | Small Text (1–10) | low, medium, high, urgent |
| `case_refund_amount_processed` | `case_refund_amount_processed_number` | Number | Final refund amount processed, 0–100,000 |
| `case_refund_method` | `case_refund_method_text` | Small Text (1–30) | original_payment, store_credit, or check |
| `case_refund_reference` | `case_refund_reference_text` | Small Text (1–100) | Payment system external reference number |
| `case_resolution_notes` | `case_resolution_notes_longtext` | Large Text (1–1000) | Final resolution notes |
| `case_review_decision` | `case_review_decision_text` | Small Text (1–20) | approve, deny, or escalate |
| `case_review_notes` | `case_review_notes_longtext` | Large Text (1–1000) | Reviewer's justification for decision |
| `case_review_reason` | `case_review_reason_text` | Small Text (1–50) | damaged, not_as_described, late_delivery, changed_mind, other |
| `case_summary` | `case_summary_longtext` | Large Text (1–1000) | Customer issue summary captured by AVA |
| `case_triage_notes` | `case_triage_notes_longtext` | Large Text (1–1000) | Intake stage notes for the Review team |
| `case_type` | `case_type_text` | Small Text (1–50) | refund_request, shipment_exception, delivery_delay, credit_hold |

**This schema must be assigned to ALL four worktypes before any workitems are created.**
Worktypes: ABC Retail - Shipment Exception, Delivery Delay, Refund Request, Credit Hold.

### Worktypes & status IDs

| Worktype | gc_worktype_id | gc_status_closed_id |
|---|---|---|
| ABC Retail - Shipment Exception | `267bd390-039f-4bd3-a5c6-e1b1da1a93b6` | `111437de-8d2a-406a-97eb-517bbe1e7d8a` |
| ABC Retail - Delivery Delay | `d0267631-f569-4f7b-b6d0-8a7c5dd56c4a` | `5f07caa8-efb0-469b-84f4-9de17d903fa3` |
| ABC Retail - Refund Request | `b26019fa-26c7-4cc3-a9a9-6f2891bbf0c8` | `43201ca6-f14b-4fce-b93d-8652af75cb88` |
| ABC Retail - Credit Hold | `946798a0-ad9a-4f66-bc2d-51e677554527` | `ecb5efb9-00ab-4145-b341-fa76d888f0c3` |

Full status ID set (open/in-progress/waiting/closed) lives in Supabase
`gc_demo_jh_shared_work_item_templates` columns `gc_status_*`.

### Workitem Flows (Architect)
One flow per worktype — required for ACD routing. Without a flow, workitems
land in the workbin but are NOT pushed to agents. Status as of 2026-05-19:
**not yet built** — building Shipment Exception flow next.

### Caseplans
Not yet created. Requires: schema assigned to worktypes + customer intent +
workitem flows published. Then POST /api/v2/taskmanagement/caseplans.

## GC integration topology

- **Integration:** `ABC Retail - Supabase` (Custom REST). Holds the Supabase URL
  and `apikey` / `Authorization` bearer of the anon key.
- **Data actions** (under that integration):
  - `ABC Retail - Get Customer Record - SB`
  - `ABC Retail - Get Transaction - SB`
  - `ABC Retail - Get Fulfillment - SB`
  - `ABC Retail - Get Case - SB`
- **Integration:** GC Function for `update-workitem` (separate, with its own
  OAuth client-credentials integration providing `${credentials.clientId}` and
  `${credentials.clientSecret}` to the request body template).
- **Architect flows:**
  - `ABC Retail - Inbound Message Flow` (web messaging)
  - `ABC Retail Digital Bot Flow` (AVA)
- **Script:** `JH-ABC Retail` (Scripter) — loads `ABCRetail_agent_script.html`.

## Inbound flow contract

The inbound message flow looks up customer → transaction → fulfillment → case
from Supabase, sets a large set of participant attributes, then calls
`Set Screen Pop` with all the values as inputs. The Start Page expects every
field the flow sets — see `loadFromUrlParams` in `ABCRetail_agent_script.html`
(around line 700–790) for the full URL-param contract.

## Important conventions / gotchas

- **No `loginImplicitGrant()` on page load** in case pages. The SDK always
  redirects when there's no session, which breaks Scripter preview *and*
  standalone testing. Pages render fully without auth. Status updates that
  require GC auth silently no-op when no token is present.
- **`gc-functions/update-workitem.zip` must have `index.js` at root.** Build
  with `zip -j` to flatten; nested paths produce `InvalidFormat` on upload.
- **GC Functions credentials live on the Integration, not in env vars.**
  Pass them through the Data Action's Request Body Template using
  `${credentials.clientId}` / `${credentials.clientSecret}`.
- **Widget Mode = inside Scripter iframe.** Disables the search box and the
  Supabase fetch; data only comes from URL params / postMessage from
  Architect's screen pop. Standalone Mode (browser tab) does OAuth + GC Data
  Tables fetches.
- **Don't hardcode UUIDs in flow actions.** Especially external contact IDs.
  Pull dynamic values from Supabase.
- **GC Scripter intercepts all iframe navigation.** Any `window.open()` or
  `window.location.href` change from inside the Scripter iframe is forced into
  a new browser tab by GC. To keep navigation self-contained, embed target
  pages in an overlay `<iframe>` within the Start Page instead of navigating.

## Working agreements

- All work happens on a `claude/*` branch, then merges to `main` via PR.
- Commit messages and PR bodies end with the session link footer.
- The web-execution container is ephemeral — anything worth keeping must be
  committed and pushed.
- The GitHub MCP tool scope is limited to `jayhenderson66/genesysdemoproject`.

## Where state of the work lives

See `HANDOFF.md` for the current snapshot — what's done, what's in flight,
what's blocked, and where to start the next session.
