---
name: demo-platform-context-load
description: >
  Instantly loads complete context for Jay Henderson's GC Demo Platform — a multi-vertical
  Genesys Cloud demo environment. Use this skill at the START of any session that touches
  the demo platform, including: adding or editing Supabase data, writing or modifying Data
  Actions, building Architect flows, updating the agent script, onboarding a new SC, creating
  a new vertical, debugging the Philip Rivers persona journey, or any other platform build
  work. Trigger whenever Jay mentions "the demo," "demo platform," "ABC Retail," "Philip
  Rivers," "the Supabase schema," "data actions," "architect flow," "agent script," "demo
  config," "sc6," or "the platform." This skill replaces the need to re-paste context at the
  start of every session.
---

# GC Demo Platform — Context Load Skill

## Purpose

This skill arms Claude with the complete operating context for Jay's GC Demo Platform
so that every session starts at full speed — no re-explaining, no copy-pasting docs.

**IMMEDIATELY upon loading this skill, confirm context receipt to Jay with one line:**
> "GC Demo Platform context loaded — Supabase project `jwnmiakpxzbvjoxeqjde`, ABC Retail active, Philip Rivers ready. What are we working on?"

Then proceed with the task.

---

## Who Is Jay

- **Role:** Solution Consultant, Genesys (Enterprise West)
- **SC initials:** `jh`
- **Key accounts:** eBay, PayPal
- **Working constraint:** Uses Claude via browser only (Genesys IT blocks Claude Desktop)
- **Working style:** Not a programmer — always produce complete, ready-to-paste code. Never describe changes; make them.

---

## Platform Identity

| Item | Value |
|---|---|
| Platform name | GC Demo Platform — JH |
| Owner | Jay Henderson |
| Current vertical | Retail (ABC Retail) |
| Planned verticals | Finance, Healthcare, Insurance, Manufacturing, Telecom |
| Data layer | Supabase (PostgreSQL) — single source of truth |
| Genesys Data Tables | **Retired.** Do not reference or use. |

---

## Supabase

| Item | Value |
|---|---|
| Project ID | `jwnmiakpxzbvjoxeqjde` |
| REST base URL | `https://jwnmiakpxzbvjoxeqjde.supabase.co/rest/v1/` |
| Table prefix | `gc_demo_jh_` |
| Active demo config key | `abc-retail-v1` |

### Table Inventory

| Logical Name | Full Supabase Table Name |
|---|---|
| Demo config | `gc_demo_jh_shared_demo_config` |
| Customers by phone (ANI lookup) | `gc_demo_jh_shared_customers_by_phone` |
| Work item templates | `gc_demo_jh_shared_work_item_templates` |
| Customers | `gc_demo_jh_retail_customers` |
| Transactions | `gc_demo_jh_retail_transactions` |
| Fulfillment | `gc_demo_jh_retail_fulfillment` |
| Cases | `gc_demo_jh_retail_cases` |
| Journey events | `gc_demo_jh_retail_journey_events` |

---

## Naming Conventions (NEVER deviate without explicit confirmation)

| Object | Pattern | Example |
|---|---|---|
| Supabase tables | `gc_demo_jh_{vertical/shared}_{entity}` | `gc_demo_jh_retail_customers` |
| Data Actions | `ABC Retail - {Action Description}` | `ABC Retail - Get Customer Record` |
| Architect flows | `ABC Retail {Channel} {Flow type}` | `ABC Retail Inbound Voice Flow` |
| Demo config key | `{brand}-{vertical}-v{n}` | `abc-retail-v1` |
| Customer IDs | `C{nnnn}` | `C1001` |
| Transaction IDs | `TXN{nnn}` | `TXN001` |
| Fulfillment IDs | `FUL{nnn}` | `FUL001` |
| Case IDs | `CASE-{YYYY}-{nnnn}` | `CASE-2026-0042` |
| Journey event IDs | `EVT{nnn}` | `EVT001` |
| Work item keys | `WI-{TYPE}` | `WI-EXCEPTION-CASE` |

**Terminology rule:** It is always "Web Messaging." Never "Web Chat."

---

## Anchor Persona — Philip Rivers

| Field | Value |
|---|---|
| Name | Philip Rivers |
| Customer ID | `C1001` |
| ANI (phone) | `9492955945` |
| Role | Primary demo customer — used across ALL verticals and journey stages |
| Lookup method | ANI-based dynamic lookup via Supabase. **Never hardcode customer IDs.** |

Philip is the customer who calls in, chats in, or triggers any demo interaction. His record
drives the screen pop, the agent script, and the AI guide content.

---

## Data Actions

Six Data Actions call Supabase REST (retired from Genesys Data Tables):

1. ABC Retail - Get Customer ID by Phone
2. ABC Retail - Get Customer Phone
3. ABC Retail - Get Customer Record
4. ABC Retail - Get Transaction
5. ABC Retail - Get Fulfillment
6. ABC Retail - Get Case

Data Actions call the Supabase REST URL directly. Use `apiKey` header with the Supabase anon key. Always filter by the active `demo_config_key` where relevant.

---

## Workflow Rules

- **ACW / SMS post-call workflow** — After a voice interaction, an After Call Work step triggers an outbound SMS to Philip confirming resolution. This is a key demo moment.
- **Screen pop** — Agent desktop pops Philip's full record (name, tier, recent transaction, open case) on call connect, sourced from Supabase via Data Action.
- **AI Guide** — Genesys AI Guides surface the appropriate guide based on intent detected during the call/chat.
- **Agent Copilot** — Surfaces suggested responses and next-best-action throughout the interaction.

---

## What Is Out of Scope

- **Composites One** — Completely separate project. Never reference it in the context of the demo platform.
- **Genesys Data Tables** — Retired. All data lives in Supabase.

---

## Where to Get More Detail

If you need column-level schema detail, current row data, or the full Data Action JSON,
check the Project knowledge base files:
- `gc_demo_platform_overview.md` — full architecture, data actions, ACW/SMS workflow, roadmap
- `gc_demo_platform_schema_reference.md` — every table, every column, FK relationships

If those aren't in context, ask Jay to paste the relevant section or pull from the Project.
