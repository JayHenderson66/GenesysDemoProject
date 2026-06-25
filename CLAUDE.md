# ABC Retail — Genesys Cloud Demo

A demo Genesys Cloud (GC) implementation for "ABC Retail" — a fictional retailer.
Showcases voice + web messaging routing, a custom agent script (Scripter), a
work-item-based case management workflow, a bot flow (AVA), and Supabase as the
system of record for customer / order / case data.

## Terminology
- **AVA** = **Agentic Virtual Agent**. Always use this full name (or AVA for short).
  Never refer to it as "bot", "chatbot", or "digital bot" — those are the Architect
  flow types that sit in front of AVA, not AVA itself.
- **Web Messaging** — never "web chat".

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
| `gc_demo_jh_retail_cases`             | Open cases + per-stage state             |
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
land in the workbin but are NOT pushed to agents. All five flows built and
published 2026-05-19. Each routes to the **ABC Retail** queue on `workitemCreated`.

| Flow name | Worktype |
|---|---|
| ABC Retail - Shipment Exception Flow | ABC Retail - Shipment Exception |
| ABC Retail - Delivery Delay Flow | ABC Retail - Delivery Delay |
| ABC Retail - Refund Request Flow | ABC Retail - Refund Request |
| ABC Retail - Credit Hold Flow | ABC Retail - Credit Hold |
| ABC Retail - After Hours Escalation Flow | ABC Retail - After Hours Escalation |

YAML exports in `case-management/workitem-flows/` (reference only — Architect does not support import).

### Customer Intents

| Intent name | ID |
|---|---|
| Refund Request | `c65ccaa9-dbd4-481f-80f5-4e4a2304d404` |
| Shipment Exception | `8965dd02-a41e-4849-b80d-e43d3786bf20` |
| Delivery Delay | `0828b8ce-0c2a-4aae-aa7f-f73de192cbd6` |
| Credit Hold | `560709cd-7e82-47af-ac98-e0fcfb31934f` |

Category ID (shared): `299bfb92-c2c7-45b3-8b1a-c00e7729a78a`
API: POST/GET `/api/v2/intents/customerintents` (use flat `categoryId` field, not nested object)
Required fields: `name`, `description`, `expiryTime` (integer, hours, 24–720), `categoryId`

### Caseplans

API base: `/api/v2/casemanagement/caseplans`

| Caseplan | ID | Reference Prefix | Status |
|---|---|---|---|
| ABC Retail - Refund Request | `be556187-8de5-45a9-a2ae-a66e242c296e` | `RR` | published |
| ABC Retail - Shipment Exception | `4adc4d54-597e-415f-9aad-ec764684baa2` | `SE` | published |
| ABC Retail - Delivery Delay | `26711806-9002-474d-926d-bc2d38a12196` | `DD` | published |
| ABC Retail - Credit Hold | `e1246b01-dcc6-4fb8-a97b-8dfbdf07178f` | `CH` | published |

The GC-generated case reference (e.g. `SE-4`, `RR-2`) is the canonical case identifier used
across GC, Supabase, and AVA. It is stored as the `key` in `gc_demo_jh_retail_cases` and
as `open_case_id` in `gc_demo_jh_retail_customers`.

Shared fields across all caseplans:
- `divisionId`: `80bc1594-6886-47ed-a2b2-d8b2fa5471cc`
- `defaultCaseOwnerId`: `b1c110a2-30df-405d-aee5-7028983843f4`
- `defaultDueDurationInSeconds`: 432000
- `dataSchemas`: `[{"id": "14be6266-5533-466e-b79f-7a66bedf3135"}]`

After POST, configure stageplans then publish via POST `.../caseplans/{id}/publish`.

GC auto-creates 3 stageplans (Stage 1/2/3) and 1 stepplan per stage on caseplan POST.
PATCH each stageplan/stepplan to set names and `workitemSettings.worktypeId`.

#### ABC Retail - Shipment Exception stageplan/stepplan IDs

| Stage | Stageplan ID | Stepplan ID | Stepplan name |
|---|---|---|---|
| Intake | `90e52f84-97c4-425a-974e-5e76847f5f7e` | `a996860e-901f-4079-bbd8-c2b6e57eab29` | Intake and Triage |
| Review | `31d5097b-a116-4e7c-99f2-289ecf0dd0fe` | `dc079195-e2be-48bd-aaab-ea839a1fca64` | Investigation and Review |
| Resolution | `c1ef0432-f1a7-423a-b30a-8ac2bd0ed90e` | `6e633624-600e-4a33-8c06-ac5907184ec7` | Resolution and Closure |

**All three SE stages point at the SAME worktype** (`ABC Retail - Shipment Exception`).
One worktype → one workitem flow → its OnCreate / OnAttributeChange rules fire at *every*
stage (Intake, Review, Resolution). Detect the stage from the work item **name** or from
`current_stage` (Supabase) — `Workitem.eventType` only tells you created vs statusChanged,
not which stage. The native work item status stays a flat `Open`; the stage shows only in
the agent script (read from Supabase).

#### ABC Retail - Delivery Delay stageplan/stepplan IDs

| Stage | Stageplan ID | Stepplan ID | Stepplan name |
|---|---|---|---|
| Intake | `c658bfbc-aace-4dec-933a-9986a33c6c84` | `de7771f0-f3cf-49fb-9f47-5336470c8ae0` | Intake and Triage |
| Review | `8f9d1981-b3b8-4854-b8c1-8806e7c87512` | `d7d72fd0-0ca0-40ff-9505-bb3b4933d0d0` | Investigation and Review |
| Resolution | `2c2b2f85-f27b-4d77-90a9-59d5517d2dab` | `379e4a3b-fd8f-4ed1-9e99-59be6d058864` | Resolution and Closure |

#### ABC Retail - Credit Hold stageplan/stepplan IDs

| Stage | Stageplan ID | Stepplan ID | Stepplan name |
|---|---|---|---|
| Intake | `f6e63804-f966-41e7-aa30-52be844e452c` | `f345f628-68e0-4110-881e-2831f05899ae` | Intake and Triage |
| Review | `ccd19af7-1348-4800-8d38-2ff340703af1` | `d475cad8-6d4f-463b-8ae0-652e53b55a11` | Investigation and Review |
| Resolution | `0a60ec92-2800-486c-b877-310320aece9b` | `067fed68-b68e-4677-9732-e27fd042366b` | Resolution and Closure |

## GC integration topology

- **Integration:** `ABC Retail - Supabase` (Custom REST). Holds the Supabase URL
  and `apikey` / `Authorization` bearer of the anon key.
- **Data actions** (under that integration):
  - `ABC Retail - Get Customer Record - SB`
  - `ABC Retail - Get Transaction - SB`
  - `ABC Retail - Get Fulfillment - SB`
  - `ABC Retail - Get Case - SB`
  - `ABC Retail - Create Case - SB`
  - `ABC Retail - Update Customer Case ID - SB`
- **Data actions** (GC native / purecloud-data-actions integration):
  - `ABC Retail - Create Case` (POSTs to `/api/v2/casemanagement/cases`)
  - `ABC Retail - Save AVA Context` (PATCHes `/api/v2/conversations/{conversationId}/participants/{participantId}/attributes` — sets `ava_exit_reason` and `ava_intent`; works for both voice and messaging)
- **Integration:** GC Function for `update-workitem` (separate, with its own
  OAuth client-credentials integration providing `${credentials.clientId}` and
  `${credentials.clientSecret}` to the request body template).
- **Architect flows:**
  - `ABC Retail - Inbound Message Flow` (web messaging)
  - `ABC Retail Digital Bot Flow` (intermediary in front of AVA — messaging)
  - `ABC Retail - Inbound Voice Flow` (voice)
  - Voice Bot Flow (intermediary in front of AVA — voice)
- **Agentic Virtual Agent (AVA):** `ABC Retail Customer Service Assistant`
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
- **External Contact ID in Architect = `Message.ExternalContactId`** (String,
  read-only built-in). NOT `Session.ExternalContactId` (doesn't exist). Available
  on message-type flows (Inbound/In-queue Message, chat, bot, digital bot). Note:
  Architect does not support multiple external contact IDs — it selects the first
  contact on the conversation by `startDate`. To pass it to a bot, store it in a
  `Flow.*` var in an Update Data block upstream of `callDigitalBotFlow`, then map
  that var as a bot input (bot inputs come from flow vars, NOT setParticipantData).
  Other useful message built-ins: `Message.ConversationID`, `Message.ContactID`,
  `Message.IsAuthenticated`. System min/max constants: `System.MinDateTime` etc.
  **Voice/call flows use the `Call.*` namespace instead**: `Call.ExternalContactId`
  (same first-contact-by-startDate behavior), `Call.Ani` (caller's number),
  `Call.CalledAddress` / `Call.CalledAddressOriginal`, `Call.ConversationID`,
  `Call.Language`, `Call.UUIData` (note: UUIData does NOT follow across flow
  transfers/disconnects). So when wiring the inbound voice flow, use
  `Call.ExternalContactId`, not `Message.ExternalContactId`.
- **AVA `caseKey` inputs must use source ToolInput, not User.** GC validation
  blocks saving if a value comes from another tool's output but is marked as
  `source: User`. In Bot Designer, you cannot change source type in-place —
  delete the input and recreate it with the correct source.
- **`Save AVA Context` URL must use the generic conversations path.** The correct
  request URL is `/api/v2/conversations/{id}/participants/{id}/attributes` — no
  `/calls/` or `/messages/` segment. The type-specific variants (e.g. `/calls/`)
  reject messaging conversations with a 400. To find a participant ID for testing,
  call `GET /api/v2/conversations/{conversationId}` in API Explorer and look in
  the `participants` array for the entry with `"purpose": "customer"`.

## Status & stage model (decision — 2026-06-25)

Keep three concepts **orthogonal** — never let one encode another. The old per-stage
status names (`Intake Complete`, `Approved`/`Denied`, `Resolved-Refund Issued`) conflated
all three, which is why nothing was reusable.

- **Stage** = caseplan stage (Intake / Review / Resolution). Lives in `current_stage`.
- **Status** = the work item's lifecycle *within* a stage.
- **Outcome** = what was decided → a **data attribute**, never a status.

**Universal status set** — identical on every stage worktype, every case type (one config
for all verticals, by design):

| Status | Category | Role |
|---|---|---|
| Open | Open | initial (auto on create) |
| In Progress | In Progress | agent working the stage |
| Waiting on Customer | On Hold | blocked, pending customer |
| Complete | Closed | stage done → caseplan advances (terminal) |

- One terminal (`Complete`); advance-vs-close is **positional/automatic** in the published
  caseplan, not wired per stage.
- **Auto-advance is native.** Ending the active stage's work item at a terminal (Closed)
  status advances the case; the final stage's terminal closes the case. Nothing to build.
  Every SE case stuck at stage 1 = never exercised, not missing.
- **Outcome → `case_outcome`** (Option 1, chosen): new Small Text attribute, per-type
  constrained values. Add a matching `case_outcome` column to `gc_demo_jh_retail_cases`
  and to the Trigger-2 PATCH. Keep `case_resolution_notes` for human detail.
- **Caseplans stay linear — never branch on outcome.** A denied case still walks to
  Resolution and records the no-action outcome as data. Branching is what forces per-type
  statuses and breaks the single config.

## Proactive SMS notifications (design — 2026-06-25)

Two agentless SMS notifications, both built **inside the worktype's workitem flow** (not a
standalone Trigger). Workitem flows expose `Workitem.Workitem.customFields.*` natively,
which sidesteps the parked `JsonSchema` vs `TopLevelPrimitives` trigger conflict and needs
no Get-Work-Item lookup.

- **Notification 1 — tracking** ("we've opened case SE-xx, we're tracking it"), on case
  open. Replaces the old ACW confirmation SMS (which sent `conversationId` instead of the
  case ref — disable that ACW trigger).
- **Notification 2 — resolved** ("shipped / case closed"), when the Resolution stage's work
  item reaches terminal `Complete`. Launch via an **OnAttributeChange** rule (statusId
  start→end transition; only `statusId` is supported for these rules).

Reused data actions (both exist):
- `ABC Retail - Get Customer Phone` — input `customerId` → outputs `customerPhone`, `firstName`.
- `ABC Retail - Send SMS Confirmation` — inputs `customerPhone`, `messageBody` → `confirmationId`;
  agentless outbound, from-number `+19495414956`.

**Best-effort:** wire both data actions' Failure + Timeout outputs onward to Transfer to ACD.
A phone/SMS hiccup must never block case creation or routing.

**Stage-detection caveat:** the single SE worktype/flow fires its rules at every stage, so
both notifications must gate on the stage (work item name or `current_stage`) — see the SE
caseplan note above. PENDING: confirm the actual SE work item name.

## Working agreements

- Push directly to `main` using the GitHub MCP `create_or_update_file` tool. No PRs needed.
- Commit messages end with the session link footer.
- The web-execution container is ephemeral — anything worth keeping must be
  committed and pushed.
- The GitHub MCP tool scope is limited to `jayhenderson66/genesysdemoproject`.
- **Web-app (claude.ai) sessions have NO GitHub MCP** — they can read the public repo but
  cannot push. Doc/file updates from a web session are produced for manual commit (GitHub
  UI) or for Claude Code to commit. Pushing works only from Claude Code.

## Where state of the work lives

See `HANDOFF.md` for the current snapshot — what's done, what's in flight,
what's blocked, and where to start the next session.
