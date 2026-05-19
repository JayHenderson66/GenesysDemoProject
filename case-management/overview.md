# ABC Retail — Native Case Management Overview

This document covers all GC objects built to support native Case Management
for the ABC Retail demo. Two caseplans are currently published: Refund Request
and Shipment Exception. Delivery Delay and Credit Hold follow the same pattern.

---

## Object hierarchy

```
╔══════════════════════════════════════════════════════════════════╗
║           GC CASE MANAGEMENT — SHIPMENT EXCEPTION SETUP         ║
╚══════════════════════════════════════════════════════════════════╝

── LAYER 1: CATEGORIZATION ────────────────────────────────────────

  Category (shared)  [299bfb92-c2c7-45b3-8b1a-c00e7729a78a]
    ├── Customer Intent: Refund Request      [c65ccaa9-dbd4-481f-80f5-4e4a2304d404]
    └── Customer Intent: Shipment Exception  [8965dd02-a41e-4849-b80d-e43d3786bf20]

── LAYER 2: WORKTYPE (Task Management) ────────────────────────────

  Worktype: ABC Retail - Shipment Exception  [267bd390-039f-4bd3-a5c6-e1b1da1a93b6]
    ├── Statuses:  Open → In Progress → Waiting on Customer → Closed
    ├── Data Schema: ABC Retail - Case Attributes (20 fields)
    │   ID: 14be6266-5533-466e-b79f-7a66bedf3135
    └── Workitem Flow (Architect)
          └── On workitemCreated → transferToAcd → ABC Retail Queue

── LAYER 3: CASEPLAN (Case Management) ────────────────────────────

  Caseplan: ABC Retail - Shipment Exception  [4adc4d54-597e-415f-9aad-ec764684baa2]
    ├── Reference prefix:  SE-XXXX
    ├── Status:            Published
    ├── Linked intent:     Shipment Exception [8965dd02-a41e-4849-b80d-e43d3786bf20]
    ├── Linked schema:     ABC Retail - Case Attributes [14be6266-5533-466e-b79f-7a66bedf3135]
    │
    ├── Stage 1: Intake     [90e52f84-97c4-425a-974e-5e76847f5f7e]
    │     └── Step: Intake and Triage [a996860e-901f-4079-bbd8-c2b6e57eab29]
    │           └── Workitem → Worktype: Shipment Exception [267bd390]
    │
    ├── Stage 2: Review     [31d5097b-a116-4e7c-99f2-289ecf0dd0fe]
    │     └── Step: Investigation and Review [dc079195-e2be-48bd-aaab-ea839a1fca64]
    │           └── Workitem → Worktype: Shipment Exception [267bd390]
    │
    └── Stage 3: Resolution [c1ef0432-f1a7-423a-b30a-8ac2bd0ed90e]
          └── Step: Resolution and Closure [6e633624-600e-4a33-8c06-ac5907184ec7]
                └── Workitem → Worktype: Shipment Exception [267bd390]
```

---

## Live case flow

```
╔══════════════════════════════════════════════════════════════════╗
║              HOW A LIVE CASE FLOWS THROUGH THIS                  ║
╚══════════════════════════════════════════════════════════════════╝

  Customer chats → AVA bot detects "shipment exception" intent
         │
         ▼
  AVA calls Create Work Item data action
  → POST /api/v2/taskmanagement/workitems
  → worktypeId: 267bd390-039f-4bd3-a5c6-e1b1da1a93b6
         │
         ▼
  GC creates Workitem → Workitem Flow fires (Architect)
  → Routes workitem to ABC Retail Queue
         │
         ├──► [parallel] AVA writes case record to Supabase retail_cases table
         │
         ▼
  Agent picks up workitem from My Work panel
  → Scripter loads agent script with full customer context
         │
         ▼
  ┌──────────────────────────────────────────────────────┐
  │  NATIVE CASE                                         │
  │  POST /api/v2/casemanagement/cases                   │
  │  → casePlanId: 4adc4d54-597e-415f-9aad-ec764684baa2  │
  │                                                      │
  │  Stage 1: Intake      ← agent triages                │
  │  Stage 2: Review      ← supervisor reviews           │
  │  Stage 3: Resolution  ← agent closes out             │
  └──────────────────────────────────────────────────────┘
```

---

## All caseplan IDs

| Caseplan | ID | Status |
|---|---|---|
| ABC Retail - Refund Request | `be556187-8de5-45a9-a2ae-a66e242c296e` | Published |
| ABC Retail - Shipment Exception | `4adc4d54-597e-415f-9aad-ec764684baa2` | Published |
| ABC Retail - Delivery Delay | TBD | Not created |
| ABC Retail - Credit Hold | TBD | Not created |

Shared caseplan fields:
- `divisionId`: `80bc1594-6886-47ed-a2b2-d8b2fa5471cc`
- `defaultCaseOwnerId`: `b1c110a2-30df-405d-aee5-7028983843f4`
- `defaultDueDurationInSeconds`: `432000`
- `dataSchemas`: `[{"id": "14be6266-5533-466e-b79f-7a66bedf3135"}]`

---

## All worktype IDs

| Worktype | ID | Closed status ID |
|---|---|---|
| ABC Retail - Shipment Exception | `267bd390-039f-4bd3-a5c6-e1b1da1a93b6` | `111437de-8d2a-406a-97eb-517bbe1e7d8a` |
| ABC Retail - Delivery Delay | `d0267631-f569-4f7b-b6d0-8a7c5dd56c4a` | `5f07caa8-efb0-469b-84f4-9de17d903fa3` |
| ABC Retail - Refund Request | `b26019fa-26c7-4cc3-a9a9-6f2891bbf0c8` | `43201ca6-f14b-4fce-b93d-8652af75cb88` |
| ABC Retail - Credit Hold | `946798a0-ad9a-4f66-bc2d-51e677554527` | `ecb5efb9-00ab-4145-b341-fa76d888f0c3` |

Full status ID set (open/in-progress/waiting/closed) is in Supabase
`gc_demo_jh_shared_work_item_templates` columns `gc_status_*`.

---

## Customer intents

| Intent | ID | Category ID |
|---|---|---|
| Refund Request | `c65ccaa9-dbd4-481f-80f5-4e4a2304d404` | `299bfb92-c2c7-45b3-8b1a-c00e7729a78a` |
| Shipment Exception | `8965dd02-a41e-4849-b80d-e43d3786bf20` | `299bfb92-c2c7-45b3-8b1a-c00e7729a78a` |

API endpoint: `POST /api/v2/intents/customerintents`
Use flat `categoryId` field (not nested object) when creating.

---

## Custom attribute schema

Schema name: `ABC Retail - Case Attributes`
Schema ID: `14be6266-5533-466e-b79f-7a66bedf3135`
Assigned to: all four worktypes

20 attributes — see CLAUDE.md for the full field ID / type table.

---

## Workitem flows

One Architect flow per worktype — required for ACD routing.
YAML exports in `case-management/workitem-flows/` (reference only — Architect
does not support YAML import; flows must be built manually in the UI).

| Flow | Worktype |
|---|---|
| ABC Retail - Shipment Exception Flow | ABC Retail - Shipment Exception |
| ABC Retail - Delivery Delay Flow | ABC Retail - Delivery Delay |
| ABC Retail - Refund Request Flow | ABC Retail - Refund Request |
| ABC Retail - Credit Hold Flow | ABC Retail - Credit Hold |

---

## API quick reference

| Operation | Method | Path |
|---|---|---|
| List caseplans | GET | `/api/v2/casemanagement/caseplans` |
| Create caseplan | POST | `/api/v2/casemanagement/caseplans` |
| Publish caseplan | POST | `/api/v2/casemanagement/caseplans/{id}/publish` |
| List stageplans | GET | `/api/v2/casemanagement/caseplans/{id}/stageplans` |
| Update stageplan | PATCH | `/api/v2/casemanagement/caseplans/{id}/stageplans/{stageId}` |
| Update stepplan | PATCH | `/api/v2/casemanagement/caseplans/{id}/stageplans/{stageId}/stepplans/{stepId}` |
| Create case | POST | `/api/v2/casemanagement/cases` |
| Get case | GET | `/api/v2/casemanagement/cases/{caseId}` |
| List customer intents | GET | `/api/v2/intents/customerintents` |
| Create customer intent | POST | `/api/v2/intents/customerintents` |

Key discovery: GC auto-creates 3 stageplans and 1 stepplan per stage when
a caseplan is POSTed. PATCH them to set names, descriptions, and
`workitemSettings.worktypeId`. There is no separate POST endpoint for stageplans.
