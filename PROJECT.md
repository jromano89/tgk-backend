# TGK Demo Portal

A configurable, multi-instance demo platform for showcasing DocuSign IAM products and Maestro workflows across industry verticals. Ships with 15 storyline presets across 6 verticals — swap terminology, branding, and workflows at runtime with zero code changes.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML/CSS/JS (no build step) |
| Frontend server | Node.js `http` (port 8080) |
| Backend | Express.js (port 3000) |
| Database | SQLite via `better-sqlite3` |
| Auth | DocuSign OAuth 2.0 (JWT bearer grant) |

---

## Project Structure

```
tgkportal/
├── backend/src/
│   ├── index.js                  # Entry point
│   ├── app.js                    # Express app, route mounting
│   ├── database.js               # SQLite schema + persistence
│   ├── docusign-auth.js          # JWT auth, token caching
│   ├── instance-configs.js       # Default instance configs (wealth, healthcare)
│   ├── storyline-presets.js      # 15 presets, 6 verticals, seed data
│   ├── maestro/                  # Maestro API bridge
│   │   ├── *-service.js          # Customer, employee, envelope, task services
│   │   ├── *-type-definitions.js # Concerto type definitions
│   │   └── manifest/             # Extension manifest template
│   ├── resources/                # Local data access layer (CRUD)
│   └── routes/                   # Express route handlers
│       ├── instances.js          # Instance CRUD + presets
│       ├── auth.js               # DocuSign OAuth
│       ├── maestro.js            # Maestro manifest + bridge
│       ├── proxy.js              # DocuSign API proxy
│       ├── resources.js          # Data endpoints
│       └── webhooks.js           # DocuSign Connect
│
├── frontend/
│   ├── index.html                # Launcher page
│   ├── config.js                 # Runtime config (fetches instance from backend)
│   ├── server.js                 # Static server with /i/:slug/ path rewriting
│   ├── advisor/                  # Advisor/employee portal
│   ├── investor/                 # Client/investor/patient portal
│   ├── wizard/                   # Instance creation wizard
│   └── shared/
│       ├── js/                   # Reusable modules (api-client, portal-state, etc.)
│       └── styles/               # Brand, launcher, UI styles
│
└── scripts/
    └── seed-demo-api.js          # Bulk data seeding
```

---

## Data Model

### Abstracted, not per-vertical

All entities share the same schema regardless of vertical. Four base tables, each scoped by `app_slug` for multi-tenancy:

| Table | Fixed Fields | Vertical-Specific |
|-------|-------------|-------------------|
| **employees** | id, name, email, phone, title | `data` (JSON) |
| **customers** | id, name, email, phone, organization, status | `data` (JSON) |
| **envelopes** | id, document_name, status, signers | `data` (JSON) |
| **tasks** | id, title, description, status, due_at | `data` (JSON) |

Vertical differences live entirely in configuration, not schema:
- **Terminology** — role labels ("Patient" vs "Policyholder" vs "Investor")
- **KPIs** — metric definitions computed from the same underlying data
- **Agreements** — document taxonomy (HIPAA forms vs insurance policies vs financial disclosures)
- **Seed data** — demo records with vertical-appropriate values in the `data` JSON column

Adding a new vertical = add config entries. No migrations, no schema changes.

---

## Instance Model (Multi-Tenancy)

An **instance** is a complete portal configuration stored as JSON:

```
instance config = {
  metadata      → name, vertical, preset key
  branding      → color
  terminology   → role labels, action names, portal names
  docusign      → userId, accountId, scopes, baseUrl
  workflows     → onboardingId, maintenanceId
  kpis          → advisor + client dashboard metrics
  agreements    → document type taxonomy
  iamProducts   → which DocuSign products to showcase
}
```

- **Frontend** — URL path `/i/:slug/advisor/` triggers config.js to fetch that instance's config
- **Backend** — `X-Demo-App` header scopes all data queries to the instance's `app_slug`
- **Database** — `app_slug` column on every table ensures strict data isolation

---

## Storyline Presets (15 across 6 verticals)

| Vertical | Presets |
|----------|--------|
| Healthcare | Patient Intake, Surgical Pre-Auth, Prescription Management |
| Insurance | Auto Policy Issuance, Homeowner Claim |
| Wealth Management | Account Opening, Asset Transfer |
| Public Sector | License Renewal, Benefit Application, Building Permit |
| Banking | Loan Origination, Account Maintenance |
| Education | Student Onboarding, Scholarship Application, Course Registration |

Each preset bundles: terminology, KPIs, agreements, brand color, highlighted IAM products, and a seed data profile with realistic employees, customers, envelopes, and tasks.

---

## Seed Data by Vertical

Every preset includes a seed descriptor (`SEED_DESCRIPTORS` in `storyline-presets.js`) that generates demo records on instance creation. The shape is the same across verticals — what changes is the content in each field and the `data` JSON payload.

### Common seed structure

Each descriptor provides:
- **2 employees** with vertical-appropriate titles
- **4 customers** with status spread (active, pending, review)
- **5 envelopes** with status spread (completed, sent, delivered)
- **4 task templates** with `{customer}` placeholder for personalization

### How vertical context shows up

The fixed columns (`name`, `org`, `status`, `title`) carry vertical flavor, while the `accounts` array inside `data` JSON carries domain-specific detail:

**Healthcare — Patient Intake**
```
Employee:  Dr. Sarah Chen, Lead Care Coordinator
Customer:  Maria Santos | Cardiology | active | $8,900
  accounts: [
    { name: "Cardiology Treatment", type: "Medical",  value: 6200 },
    { name: "Prescription Plan",    type: "Pharmacy", value: 2700 }
  ]
Envelopes: Patient Intake Form, HIPAA Consent, Records Transfer Request, Insurance Authorization
Tasks:     Patient intake, Records transfer, Insurance verification, Follow-up scheduling
```

**Insurance — Homeowner Claim**
```
Employee:  Patricia Marsh, Senior Claims Adjuster
Customer:  Larry Thompson | Residential | pending | $78,000
  accounts: [
    { name: "Fire Damage Claim",     type: "Property",          value: 65000 },
    { name: "Contents Replacement",  type: "Personal Property", value: 13000 }
  ]
Envelopes: Claim Report Form, Damage Documentation, Proof of Loss Statement, Settlement Offer Letter
Tasks:     Damage assessment, Documentation review, Settlement calculation, Follow-up inspection
```

**Wealth — Account Opening**
```
Employee:  Gordon Gecko, Senior Advisor
Customer:  Penny Worth | Compound Interest Partners | active | $16.8M
  accounts: [
    { name: "Strategic Growth Portfolio", type: "Brokerage",   value: 9900000, ytd: 0.074, eq: 49, fi: 14, alt: 25, cash: 12 },
    { name: "Private Credit Reserve",     type: "Alternative", value: 6900000, ytd: 0.056, eq: 10, fi: 33, alt: 45, cash: 12 }
  ]
Envelopes: Account Opening Packet, Transfer Authorization, Beneficiary Update, ACAT Transfer Packet
Tasks:     Asset transfer, KYC review, Suitability assessment, Account funding
```

**Banking — Business Account**
```
Employee:  Richard Lawson, Senior Relationship Manager
Customer:  TechStart Inc | Technology | active | $250,000
  accounts: [
    { name: "Business Checking", type: "Checking", value: 180000 },
    { name: "Business Savings",  type: "Savings",  value: 70000 }
  ]
Envelopes: Business Application, Entity Verification Package, Authorized Signer Forms, Operating Agreement
Tasks:     KYB verification, Signer setup, Treasury onboarding, Compliance review
```

**Public Sector — Building Permit**
```
Employee:  Janet Collins, Senior Case Officer
Customer:  Apex Builders LLC | Commercial Construction | pending | $2,500
  accounts: [
    { name: "Building Permit Fee", type: "Fee", value: 1800 },
    { name: "Impact Fee",          type: "Fee", value: 700 }
  ]
Envelopes: Permit Application Form, Site Plan Submission, Zoning Compliance Review, Inspection Schedule
Tasks:     Zoning review, Plan check, Inspection scheduling, Permit issuance
```

**Education — Financial Aid**
```
Employee:  Dr. Karen Phillips, Director of Financial Aid
Customer:  Emma Rodriguez | Undergraduate | active | $28,500
  accounts: [
    { name: "Pell Grant",                type: "Grant",       value: 7395 },
    { name: "Subsidized Loan",           type: "Loan",        value: 5500 },
    { name: "Institutional Scholarship", type: "Scholarship", value: 15605 }
  ]
Envelopes: FAFSA Verification, Award Letter, Loan Entrance Counseling, Master Promissory Note
Tasks:     FAFSA verification, Award packaging, Loan processing, Enrollment confirmation
```

### Account data fields by vertical

The `accounts` array entries use different fields depending on the vertical:

| Vertical | Key fields | Notes |
|----------|-----------|-------|
| Wealth | `value`, `ytd`, `eq`, `fi`, `alt`, `cash` | Asset allocation percentages, YTD returns |
| Healthcare | `value`, `fi`, `alt` | Treatment cost breakdown |
| Insurance | `value`, `fi`, `alt` | Coverage/claim amounts |
| Banking | `value`, `fi`, `alt` | Account balances |
| Public Sector | `value`, `fi`, `alt` | Fee amounts |
| Education | `value`, `fi`, `alt`, `cash` | Aid package breakdown |

All of these live in the generic `data` JSON column — the schema itself doesn't change.

---

## Instance Creation (Wizard Flow)

1. User selects a preset from the wizard UI
2. Enters company name (auto-slugified) and brand color
3. Optionally customizes terminology
4. `POST /api/instances/from-preset` with slug, presetKey, overrides
5. Backend merges preset + overrides → full config
6. Creates instance record + auto-seeds demo data
7. Portal available at `/i/:slug/advisor/`

---

## Portal UI

### Advisor Portal (`/advisor/`)
Dashboard, Customers, Documents, Tasks, Settings, plus IAM product views (Doc Gen, ID Verification, Monitor, Notary, Web Forms, Workspaces). Supports advanced vs normal mode.

### Client Portal (`/investor/`)
Simplified view: Dashboard with client-specific KPIs, Documents, Tasks.

### Launcher (`/`)
Instance selector grid with workflow picker and portal launch buttons.

---

## DocuSign Integration

### Auth Flow
1. Frontend redirects to DocuSign consent screen via `/api/auth/login`
2. User grants consent → callback to `/api/auth/callback`
3. Frontend fetches token via `POST /api/auth/token` (JWT bearer grant)
4. Token cached in localStorage (frontend) and in-memory (backend)

### API Proxy
All DocuSign API calls go through `POST /api/proxy` — backend injects auth headers and forwards to DocuSign REST API.

### Maestro Bridge
Local extension that maps SQLite records to Maestro resource types. Serves a dynamic manifest at `/maestro/manifest/clientCredentials.ReadWriteManifest.json` for extension registration.

---

## Environment Variables

### Backend (`backend/.env`)

```bash
PORT=3000
TGK_DB_PATH=./data/demo.db

# DocuSign OAuth (required)
DOCUSIGN_INTEGRATION_KEY=<app-key>
DOCUSIGN_RSA_PRIVATE_KEY=<private-key>
DOCUSIGN_OAUTH_BASE=account-d.docusign.com
DOCUSIGN_API_BASE=https://demo.docusign.net/restapi

# Maestro bridge (optional)
MAESTRO_PUBLIC_BASE_URL=https://your-backend.up.railway.app/maestro
MAESTRO_CLIENT_ID=tgk-maestro-demo-client
MAESTRO_CLIENT_SECRET=tgk-maestro-demo-secret
MAESTRO_ACCESS_TOKEN=tgk-maestro-demo-token
```

---

## Local Development

```bash
# Backend (terminal 1)
cd backend && npm install && npm run dev

# Frontend (terminal 2)
cd frontend && npm install && npm start

# Seed data (optional)
node scripts/seed-demo-api.js
```

- Launcher: http://localhost:8080/
- Advisor: http://localhost:8080/advisor/
- Client: http://localhost:8080/investor/
- Wizard: http://localhost:8080/wizard/
- API health: http://localhost:3000/api/health
