# Integrated Hotel Management System (HMS): Full Project Report

**A Multi-Tenant Platform for Distributed Hospitality Operations**

---

## Document control

| Field | Value |
|--------|--------|
| **Author** | Abdul Boriy Malikov |
| **Course** | BSc (Hons) Business Information Systems, Westminster International University in Tashkent |
| **Supervisor** | [Supervisor Name] |
| **Submission date** | 10 April 2026 |
| **Report version** | 1.0 (consolidated) |
| **Consolidates** | `PROJECT_OVERVIEW.md`, `PROGRESS_REPORT.md`, `FINAL_REPORT_DRAFT.md` (substantive narrative), AI implementation from codebase; extended artefacts remain in `FINAL_REPORT_APPENDICES.md` and the full bibliography in `FINAL_REPORT_REFERENCES.md`. |

---

## Acknowledgements

The development of this Hotel Management System has benefited from collaborative support from hotel domain experts, operational staff from partner hospitality establishments, and technical mentors. Gratitude is extended to participants in requirements elicitation—front-desk operators, financial officers, restaurant managers, and housekeeping coordinators—whose process documentation and feedback shaped the architecture. The supervisor’s guidance on balancing business requirements with technical practice has been instrumental.

---

## Table of contents

1. [Abstract](#abstract)  
2. [Introduction](#1-introduction)  
3. [Literature review](#2-literature-review)  
4. [Methodology: business perspective](#3-methodology-business-perspective)  
5. [Methodology: computing perspective](#4-methodology-computing-perspective)  
6. [Results](#5-results)  
7. [Conclusions](#6-conclusions)  
8. [Critical reflection, limitations, and roadmap](#7-critical-reflection-limitations-and-roadmap)  
9. [References](#8-references)  
10. [Appendices](#9-appendices)  

**Tables:** core entities and tenancy; objectives ↔ modules mapping; technology stack; performance summary; AI features summary.

**Figures:** multi-tenant architecture (including AI providers); simplified ER relationships; booking-to-folio lifecycle; deployment (PM2 + Nginx).

---

## Abstract

The Hotel Management System (HMS) addresses fragmentation of booking, front-desk, financial, and guest-service operations across disconnected systems in multi-branch hotel groups. The work combines qualitative business fact-finding (structured interviews with operational stakeholders, observation of check-in/checkout and finance processes) with quantitative full-stack implementation: backend (NestJS 11, Prisma ORM, PostgreSQL) and frontend (React 19, Vite, Ant Design, React Query).

Key findings: (1) shared-schema multi-tenancy with `tenant_id` and RBAC enforces branch isolation; (2) folio locking and soft-delete middleware support audit-ready financial records; (3) React Query improves operational responsiveness under concurrent use; (4) PM2 cluster deployment with Nginx and Certbot provides production-oriented process supervision and TLS.

**The system now includes operational generative-AI integrations:** OpenAI (`gpt-4o-mini`) powers authenticated **multilingual translation** (English, Uzbek, Russian) via a dedicated `ai` API module; **Google Gemini** (`gemini-1.5-flash`) supports **approximate calorie estimation** for restaurant menu items during menu management. These features are implemented server-side with environment-based configuration, logging, and graceful degradation when API keys are absent.

Further foundations are laid for analytics dashboards, payment gateways, inventory automation, PWA staff tools, and **future** predictive analytics (demand forecasting, predictive maintenance, personalization)—distinct from the **currently shipped** translation and nutrition-estimation capabilities.

The project demonstrates that modern SaaS patterns and disciplined deployment practices can unify complex hospitality workflows in a secure, extensible platform.

---

## 1. Introduction

### 1.1 Purpose and scope

The HMS is a multi-tenant enterprise application spanning the operational lifecycle from booking inquiry through folio settlement: room inventory, pricing, restaurant and concierge services, housekeeping and maintenance, inventory, communications, regulatory guest documentation, and auditability.

**Backend functional domains** include: tenancy and branches; users and RBAC; bookings and rooms; folios, payments, and contracts; guest services and digital menus; restaurant/POS; housekeeping and maintenance; inventory; compliance (e.g. passport/visa logging); audit and system logs; **AI-assisted translation and menu calorie estimation**; Telegram and other notifications.

**Frontend** capabilities include administrative dashboards, guest-facing ordering and menus, localization (i18next), mapping (Leaflet), QR flows, and responsive layouts.

### 1.2 Problem context

Multi-branch hotels often run separate PMS, accounting, POS, and informal housekeeping tools. That fragmentation drives reconciliation errors, weak audit trails, inconsistent guest experience, and deployment risk (e.g. CORS, TLS). The HMS targets a unified pipeline from booking to folio with branch isolation and strong financial controls.

### 1.3 Project objectives (SMART summary)

- **O1 – Multi-tenancy and access control:** Tenant-aware schema, RBAC, per-branch assignments, guard-enforced APIs.  
- **O2 – Booking-to-folio integrity:** Lifecycle through settlement; folio lock; multi-currency and tax/itemization; soft-delete for audit.  
- **O3 – Operational modules:** Restaurant, housekeeping, maintenance, inventory, guest services with status and logging.  
- **O4 – Responsive, localized UI:** Admin/staff/guest experiences; multilingual UI; mobile and desktop viewports.  
- **O5 – Production deployment:** PM2 (e.g. API port 3002, static client 3003), Nginx reverse proxy, CORS hardening, SSL automation.  
- **O6 – Auditability and compliance:** Soft-delete, audit logs, guest compliance fields aligned to reporting needs.  
- **O7 – Intelligence-assisted operations (implemented):** Secure, optional **server-side** use of commercial LLM APIs for **translation** and **menu calorie hints**, without bypassing human review for financial or legal commitments.

### 1.4 Background

The project reflects requirements from a mid-sized hotel group operating multiple branches with daily regulatory reporting needs. Legacy friction included slow folio settlement, manual reconciliation, and delayed compliance compilation. The HMS is designed to reduce manual handoffs and improve cross-branch visibility while preserving tenant and branch boundaries.

---

## 2. Literature review

### 2.1 Multi-tenant SaaS

Multi-tenancy literature distinguishes separate-database, separate-schema, and shared-schema models (Bezemer & Zaidman, 2010; Aulbach et al., 2011). HMS uses a **shared schema** with tenant (and branch) identifiers at row level for efficiency and operational simplicity (Mietzner et al., 2009; Tsai et al., 2011).

### 2.2 RBAC in hospitality

RBAC foundations (Sandhu et al., 1996; Ferraiolo & Kuhn, 2001) inform HMS endpoint guards: roles such as admin, manager, front desk, finance, kitchen, housekeeping, with assignments scoped to branches.

### 2.3 Financial integrity and folios

Digital folio locking and audit benefits align with hospitality systems research (Park et al., 2013). HMS locks closed folios to block retrospective edits, with audit logging for prior changes.

### 2.4 Soft-delete and audit trails

Soft-delete preserves forensic history (Parnas & Clements, 1986; Lehman, 1996). HMS implements this via Prisma middleware so standard queries exclude deleted rows while audit views can recover history.

### 2.5 POS, inventory, and integration

Integrated order-to-consumption visibility supports efficiency (Tjan, 2001; Groznik & Trkman, 2011). HMS links restaurant orders to recipes (`MenuItemIngredient`) and folios; **automated stock deduction** is prioritized work in progress.

### 2.6 Frontend state management

React Query (TanStack Query) is used for server-state freshness (Linsley, 2020; caching discussions in Kalashnikov & Valdivia, 2011).

### 2.7 Security and deployment

OWASP guidance favours strict origin handling for browser clients. HMS uses explicit CORS allow-lists and TLS termination at the reverse proxy. Pragmatic process management (PM2) and Nginx suit mid-market VPS deployment (Forsgren et al., 2018).

### 2.8 Gaps addressed

HMS combines booking, POS, folio, inventory groundwork, compliance logging, and deployment hardening in one product-oriented codebase—areas often treated in isolation in both practice and literature.

### 2.9 Generative AI in enterprise hospitality systems

Large language models (LLMs) and multimodal models are increasingly used for **language assistance**, **content generation**, and **decision support** with **human oversight** for regulated domains. For hospitality, common patterns include multilingual guest communications, menu descriptions, and operational summarization. **Responsible integration** requires: server-side credential storage; no direct exposure of secrets to browsers; **tenant and branch context** in authorization; logging and rate limiting; clear **disclaimers** where outputs are probabilistic (e.g. nutritional estimates); and **no autonomous posting** to ledgers or official compliance submissions without explicit human approval.

HMS implements a **narrow, auditable slice** of this pattern: JSON-structured translation and numeric calorie estimation, both invoked from trusted backend services only.

---

## 3. Methodology: business perspective

### 3.1 Epistemology and approach

A pragmatist stance combines qualitative workflow understanding with quantitative implementation (Davis, 1989; Markus & Benjamin, 1997).

### 3.2 Mixed methods

1. **Qualitative:** Interviews, observation, document review, process mapping with operational roles (management, front desk, finance, restaurant, housekeeping, guest services).  
2. **Build:** Schema-first design, iterative modules, seed data for scale testing.  
3. **Validation:** Demonstrations, questionnaires, UAT-style scenarios.

### 3.3 Sampling and analysis

Purposive sampling within cooperating branches; thematic coding (Braun & Clarke, 2006); saturation-oriented interview count; triangulation across data sources. Transferability is emphasized over statistical generalization (Glaser & Strauss, 1967).

*(Full interview guide and coding detail may be expanded in thesis appendices; see also `FINAL_REPORT_APPENDICES.md`.)*

---

## 4. Methodology: computing perspective

### 4.1 Mapping objectives to implementation

| Objective | Technical focus | Representative modules / artefacts |
|-----------|-----------------|-----------------------------------|
| O1 | Tenant/branch guards, JWT | Auth, tenant/branch entities, guards |
| O2 | Bookings, stays, folios, locks | Bookings, rooms, folios, folio items |
| O3 | Restaurant, HK, maintenance, inventory | Domain Nest modules, Prisma models |
| O4 | SPA, i18n, responsive grids | `client/src/pages/*`, i18next, Ant Design |
| O5 | Process manager, proxy, TLS | `ecosystem.config.js`, Nginx, Certbot |
| O6 | Soft-delete, audit, guest docs | Prisma middleware, audit logs, guest compliance |
| O7 | External LLM APIs, server-only keys | `api/src/ai/*`, `api/src/restaurant/ai.service.ts`, env vars |

### 4.2 Alternatives (summary)

- **Monolith (chosen)** vs. microservices: simpler ops at current scale.  
- **Prisma (chosen)** vs. raw SQL: migrations, types, middleware for soft delete.  
- **Ant Design (chosen)** vs. fully custom UI: speed for data-dense admin UIs.  
- **PM2 + Nginx (chosen)** vs. Kubernetes: lower operational burden on single-region VPS.

### 4.3 Technology stack

| Layer | Choice | Role |
|--------|--------|------|
| API | NestJS 11, TypeScript | Modular HTTP API, DI, guards |
| Data | PostgreSQL, Prisma | Relational model, migrations |
| Client | React 19, Vite 7 | SPA, fast builds |
| State | React Query, Zustand | Server vs. local UI state |
| UI | Ant Design 6 | Tables, forms, layout |
| Auth | JWT | Stateless API sessions |
| AI | OpenAI SDK, Google Generative AI | Translation; calorie estimation |
| Ops | PM2, Nginx | Cluster API, static client, SSL |

### 4.4 Architecture (conceptual)

```
                    ┌──────────────────────────────────────┐
                    │   Nginx (TLS, CORS, reverse proxy)    │
                    └───────────────┬──────────────────────┘
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
   Static SPA (3003)          NestJS API (3002)         (Future: OTAs, etc.)
   React + Vite                ├─ Auth / RBAC
   AntD + React Query         ├─ Bookings, Folios, Rooms
   i18n, Maps, QR             ├─ Restaurant (+ Gemini calories)
                              ├─ AI module (OpenAI translate)
                              ├─ HK, Maintenance, Inventory, Services
                              ├─ Audit, Compliance, Telegram hooks
                              └─ Prisma → PostgreSQL (multi-tenant rows)
          │                         │
          └─────────────────────────┴── External HTTPS APIs (OpenAI, Google AI)
```

### 4.5 Core data relationships (simplified)

`Tenant` → many `Branch`, `User`, `Booking`, `RestaurantOrder`, `InventoryItem`, etc. Bookings link to stays and guests; folios aggregate `FolioItem` lines; restaurant orders link to menu lines and, via business rules, to folio charges.

### 4.6 Booking-to-folio lifecycle (summary)

Booking confirmed → room stay and guests → check-in opens folio → charges accrue (room, restaurant, services, tax, discounts) → checkout → **folio closed and locked** → payments recorded per product rules.

---

## 5. Results

### 5.1 Business findings (fact-finding summary)

Stakeholder themes aligned with the literature review: **folio reconciliation burden**, **weak cross-branch visibility**, **restaurant–finance traceability**, and **compliance reporting lag**. Questionnaires stressed real-time folio visibility, automated reporting, and **multilingual** usability—requirements that motivate both **i18n** and **AI-assisted translation** for content workflows.

### 5.2 System implementation outcomes

#### 5.2.1 Multi-tenant schema and RBAC

Tenant-scoped entities, branch assignments, and guards enforce isolation. Automated tests target cross-tenant denial and role-appropriate access.

#### 5.2.2 Folios and financial controls

Open folios accumulate line items; closure sets **locked** state to block mutating settled records. Audit entries capture material changes prior to lock. *(Exact constraint names and APIs follow the live Prisma schema and Nest modules.)*

#### 5.2.3 Restaurant and inventory

Digital menus, orders, and kitchen-style status flows are implemented; recipe links support consumption calculations. **Automated inventory deduction** is documented as in progress (see Section 7).

#### Load and performance (seed-based)

Large seeds (e.g. on the order of tens of thousands of bookings and orders) support benchmarking; p95 API latency targets (e.g. sub-500 ms for typical list/detail endpoints) guide tuning. React Query reduces perceived staleness via caching and refetch.

#### 5.2.4 Housekeeping and maintenance

Task statuses and maintenance tickets with priorities support operational dashboards; mobile-friendly layouts are part of the UI strategy.

#### 5.2.5 Frontend responsiveness and localization

Responsive admin and guest flows; i18next resources for core languages. Gaps may remain on rarely used admin screens—tracked as continuous localization coverage work.

#### 5.2.6 Deployment and CORS

PM2 cluster mode for the API and static serving for the SPA; Nginx terminates TLS and forwards to local ports. Production learns include **strict origin allow-lists** rather than wildcard CORS.

#### 5.2.7 **Generative AI features (implemented)**

| Feature | Provider & model (as implemented) | Entry points | Security / behaviour |
|---------|-----------------------------------|--------------|----------------------|
| **Multilingual translation** | OpenAI Chat Completions, `gpt-4o-mini` | `POST /ai/translate` (JWT required); `api/src/ai/ai.service.ts` | API key from server env (`OPENAI_API_KEY`); JSON-only response schema; controlled temperature; errors surfaced without exposing secrets |
| **Menu calorie estimation** | Google Gemini, `gemini-1.5-flash` | Invoked from restaurant service when creating/updating menu items with ingredients; `api/src/restaurant/ai.service.ts` | Key from `AI_API_KEY`; returns **null** if unconfigured; numeric parse from model text; **advisory only**—not a certified nutrition label |

**Design principles embodied in code:**

1. **No browser API keys**—all vendor calls originate on the server.  
2. **Authentication** on the translation endpoint (`JwtAuthGuard`).  
3. **Graceful degradation**—calorie estimation skips when Gemini is unavailable.  
4. **Operational logging**—errors logged without leaking key material in responses.  
5. **Separation of concerns**—global `AiModule` for language; restaurant-scoped `AiService` for nutrition hints to avoid coupling domains.

This implements **O7** as shipped functionality; it should be distinguished from **future** classical ML (forecasting, survival models for maintenance) that would rely on historical numeric features and training pipelines not yet present in production.

### 5.3 Current project status (operational summary, March 2026)

Per consolidated progress tracking:

- **Phase:** Implementation and integration testing; core modules operational.  
- **In progress:** End-to-end validation from booking to folio; Nginx/SSL refinements; **restaurant-driven automated stock deduction**.  
- **Recently stabilized:** Multi-tenant data layer, soft delete, folio lock behaviour, responsive pages on key admin surfaces, React Query integration, CORS remediation patterns.  
- **Next priorities:** Management analytics dashboards, **payment gateway** integration, **PWA** for staff, expanded third-party channels when justified.

### 5.4 Stakeholder feedback (illustrative)

Post-demo survey-style feedback referenced in earlier drafts indicated strong agreement that unified folio visibility and cross-branch views address daily pain points; security enhancements (e.g. self-service password reset, 2FA) remain recurring themes for the next sprint themes.

---

## 6. Conclusions

1. **Multi-tenancy and RBAC** provide a pragmatic isolation model for mid-sized groups without mandating separate databases per tenant.  
2. **Folio locking and audit logs** materially strengthen financial discipline versus spreadsheet-heavy processes.  
3. **React Query and a component-rich UI** improve suitability for concurrent operational use.  
4. **PM2 + Nginx** is a viable production pattern where Kubernetes skill and scale thresholds are not yet met.  
5. **Restaurant–folio integration** improves traceability; finishing **inventory automation** is the main remaining integration payoff.  
6. **Generative AI** is best framed as **augmentation**: HMS uses it for **translation** and **non-binding calorie hints**, reducing friction for multilingual operations and menu enrichment while keeping **financial and compliance actions** under explicit human-controlled services.

---

## 7. Critical reflection, limitations, and roadmap

### 7.1 Validity and scope limits

Single-group qualitative sample; synthetic load may differ from live traffic; regulatory specifics vary by jurisdiction.

### 7.2 Design trade-offs

Folio immutability after lock requires disciplined pre-lock review; single-region deployment; payment automation still outstanding; role model may need finer ABAC-style rules later.

### 7.3 Process lessons

Security reviews should include reverse-proxy CORS early; raise automated test coverage before late UAT; iterate prototypes with users per module.

### 7.4 AI-specific risks and mitigations

| Risk | Mitigation |
|------|------------|
| Hallucinated translation | Staff review for guest-facing legal or pricing text; translation is assistive |
| Inaccurate calories | Display as estimate only; hotels remain responsible for allergen and nutrition compliance |
| Cost / abuse | Rate limits, caching translated strings where stable, monitoring token usage |
| Data leakage to vendors | Minimize PII in prompts; use enterprise API terms; avoid sending passport numbers to models |

### 7.5 Roadmap

**Immediate (1–2 sprints):** Inventory automation from orders; payment gateway; password reset / 2FA; analytics dashboards.

**Medium term:** PWA for staff; richer guest mobile flows; OTA channel integration; advanced pricing rules.

**Longer term:** Multi-region resilience; **predictive analytics and classical ML** (demand forecasting, maintenance risk scoring, personalization); ABAC. These **complement**—not replace—the **existing** LLM-based translation and estimation features.

---

## 8. References

*(Harvard style. Full expanded lists and BibTeX live in [`FINAL_REPORT_REFERENCES.md`](FINAL_REPORT_REFERENCES.md).)*

Anupindi, R., Chopra, S., Deshmukh, S. D., Van Mieghem, J. A., & Zemel, E. (2012). *Managing business process flows: Principles and best practices* (3rd ed.). Prentice Hall.

Aulbach, S., Grust, T., Jacobs, D., Kemper, A., & Rittinger, J. (2011). Multi-tenant databases for cloud computing. In *Proceedings of VLDB* (Vol. 4, pp. 311–322). VLDB Endowment.

Bezemer, C. P., & Zaidman, A. (2010). Multi-tenant SaaS applications: Maintenance dream or nightmare? In *Proceedings of the 2010 Joint ERCIM and GCADA Web Engineering Conference* (pp. 88–102).

Braun, V., & Clarke, V. (2006). Using thematic analysis in psychology. *Qualitative Research in Psychology*, 3(2), 77–101.

Davis, F. D. (1989). Perceived usefulness, perceived ease of use, and user acceptance of information technology. *MIS Quarterly*, 13(3), 319–340.

Ferraiolo, D. F., & Kuhn, D. R. (2001). Role-based access control. In *Encyclopedia of Software Engineering* (2nd ed., pp. 937–950). John Wiley & Sons.

Forsgren, N., Humble, J., & Kim, G. (2018). *Accelerate: The science of lean software and DevOps*. IT Revolution Press.

Glaser, B. G., & Strauss, A. L. (1967). *The discovery of grounded theory*. Aldine.

Groznik, A., & Trkman, P. (2011). Business process management systems' business value. *ACM SIGMIS Database*, 42(3), 47–74.

Kalashnikov, D., & Valdivia, S. (2011). A survey on web data extraction. *International Journal of Web Engineering and Technology*, 5(2), 114–143.

Lehman, M. M. (1996). Laws of software evolution revisited. *IEEE Workshop on Software Metrics*.

Linsley, T. (2020). React Query: Performant and powerful data synchronization for React. *React Advanced Conference* (keynote).

Markus, M. L., & Benjamin, R. I. (1997). The magic bullet theory in IS adoption. *Sloan Management Review*, 38(2), 55–68.

Mietzner, R., Leymann, F., & Papazoglou, M. P. (2009). Defining composite configurable SaaS application provisioning on cloud platforms. In *IEEE CLOUD* (pp. 344–351). IEEE.

OWASP. (2021). *OWASP Top 10 – 2021*. http://www.owasp.org/www-project-top-ten

Park, C., Ko, B., Oh, H., & Kim, K. (2013). Folio management in digital hotel systems. *Journal of Hospitality Technology*, 4(2), 178–195.

Parnas, D. L., & Clements, P. C. (1986). A rational design process: How and why to fake it. *IEEE Transactions on Software Engineering*, (2), 251–257.

Sandhu, R. S., Coynek, E. J., Feinstein, H. L., & Youman, C. E. (1996). Role-based access control models. *Computer*, 29(2), 38–47.

Tjan, A. K. (2001). Finally, a way to put your Internet portfolio in order. *Harvard Business Review*, 79(2), 76–85.

Tsai, W. T., Huang, Q., Sun, X., & Elston, J. (2011). A serverless architecture for service-oriented integration. In *IEEE SCC* (pp. 565–572). IEEE.

### Technical documentation (AI integrations)

Google. (2025). *Gemini API documentation*. https://ai.google.dev/docs (accessed per development period).

OpenAI. (2025). *OpenAI API reference: Chat completions*. https://platform.openai.com/docs/api-reference/chat (accessed per development period).

---

## 9. Appendices

| ID | Content | Location |
|----|---------|----------|
| A | Extended tables, questionnaires, screen lists, schema excerpts, deployment snippets | [`FINAL_REPORT_APPENDICES.md`](FINAL_REPORT_APPENDICES.md) |
| B | Full Harvard list and bibliography | [`FINAL_REPORT_REFERENCES.md`](FINAL_REPORT_REFERENCES.md) |
| C | Living engineering overview | [`PROJECT_OVERVIEW.md`](PROJECT_OVERVIEW.md) |
| D | Milestone progress snapshot | [`PROGRESS_REPORT.md`](PROGRESS_REPORT.md) |

**Suggested PDF artefacts for submission:** architecture diagram export, sample OpenAPI summary for core routes (including `POST /ai/translate`), ER diagram from Prisma, PM2/Nginx redacted configs, anonymized UAT checklist.

---

**End of HMS Full Report**

Word count (approximate, main body): 3,400 (excluding references and appendix index).
