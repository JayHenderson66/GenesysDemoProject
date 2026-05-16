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
