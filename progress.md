# PaySlip — Build Progress

Last updated: 2026-05-18

---

## What PaySlip Is

A zero-crypto UX payroll platform built on Stellar + Soroban.
- Employers pay workers using only a phone number.
- Workers never see a wallet, seed phrase, or crypto concept.
- Funds are held non-custodially in a Soroban smart contract.
- Payments settle on-chain in USDC via Stellar.

---

## Current Status: MVP Backend + Frontend Complete ✅

The full MVP has been architected and implemented. The app runs locally at `localhost:3000`.

---

## What Is Done

### Infrastructure
- [x] Next.js 16 project (App Router) — was a blank starter, now fully built
- [x] NeonDB (PostgreSQL) connected — `DATABASE_URL` filled in `.env`
- [x] Prisma schema pushed to database (`pnpm db:push` done)
- [x] All npm/pnpm packages installed (`pnpm install` done)
- [x] JWT authentication working (httpOnly cookie, `jose` library)
- [x] Route protection middleware (`middleware.ts`) for employer/worker/admin routes
- [x] Freighter wallet detection fixed for `@stellar/freighter-api` v3.1.0

### Database Schema (`prisma/schema.prisma`)
- [x] `Employer` — email, hashed password, wallet address, KYB status
- [x] `KybDocument` — company proof + ID verification uploads
- [x] `Workspace` — multi-workspace per employer
- [x] `Payroll` — milestone or scheduled type, escrow contract tracking
- [x] `Worker` — hashed phone, claim token, Stellar wallet address (created on claim)
- [x] `Milestone` — name, amount, assigned worker, full status lifecycle
- [x] `ScheduledTask` — fixed task/amount per worker
- [x] `Admin` — RBAC admin accounts

### Library Layer (`lib/`)
- [x] `lib/db.ts` — Prisma singleton (dev-safe)
- [x] `lib/auth.ts` — JWT sign/verify, session cookie helpers
- [x] `lib/stellar.ts` — Stellar SDK: account creation, USDC transfer, balance query, tx verification
- [x] `lib/sep30.ts` — AES-256-GCM encryption of worker private keys at rest
- [x] `lib/sms.ts` — Twilio OTP + claim SMS (logs to console in dev — no Twilio needed yet)
- [x] `lib/utils.ts` — phone hashing (SHA-256), claim tokens, fee calculation, API helpers

### API Routes (18 endpoints)

| Route | Method | What it does |
|---|---|---|
| `/api/auth/signup` | POST | Create employer account (wallet + email/password) |
| `/api/auth/login` | POST | Login employer or admin |
| `/api/auth/me` | GET | Get current session user |
| `/api/auth/logout` | POST | Clear session cookie |
| `/api/employer/kyb` | POST/PATCH/GET | Submit KYB info + upload documents |
| `/api/workspaces` | GET/POST | List or create workspaces |
| `/api/workspaces/[id]` | GET/DELETE | Get or delete a workspace |
| `/api/payroll` | GET/POST | List or create payrolls |
| `/api/payroll/[id]` | GET/DELETE | Get or delete a payroll |
| `/api/payroll/[id]/workers` | GET/POST/PUT | Upload workers CSV, list, notify via SMS |
| `/api/payroll/[id]/milestones` | GET/POST | Bulk create or list milestones |
| `/api/payroll/[id]/scheduled-tasks` | GET/POST | Bulk create or list scheduled tasks |
| `/api/payroll/[id]/fund` | POST | Confirm on-chain funding (verifies Stellar tx hash) |
| `/api/milestones/[id]/submit` | POST | Worker submits a milestone |
| `/api/milestones/[id]/review` | POST | Employer approves or rejects a milestone |
| `/api/worker/claim/[token]` | GET/POST | Validate claim link / send OTP |
| `/api/worker/otp` | POST | Verify OTP → silently create Stellar wallet → issue JWT |
| `/api/worker/me` | GET | Worker dashboard data (balance, milestones) |
| `/api/admin/employers` | GET | List employers (filterable by KYB status) |
| `/api/admin/employers/[id]/approve` | POST | Approve or reject employer KYB |
| `/api/admin/payrolls` | GET/PATCH | List payrolls, freeze/unfreeze |

### Frontend Pages

| URL | Who sees it | What it is |
|---|---|---|
| `/` | Public | Landing page (marketing site — was already built) |
| `/signup` | Employer | Connect Freighter wallet → set email + password |
| `/login` | Employer / Admin | Email + password login |
| `/onboarding` | Employer | Multi-step KYB: company info → document upload → pending screen |
| `/dashboard` | Employer | Main SaaS dashboard — workspaces + payroll overview |
| `/dashboard/workspace/[id]` | Employer | Workspace detail — list of payrolls |
| `/dashboard/payroll/create` | Employer | 4-step payroll wizard (type → CSV workers → milestones/tasks → fund) |
| `/dashboard/payroll/[id]` | Employer | Payroll detail — milestone approval/rejection actions |
| `/claim/[token]` | Worker | Claim flow: phone → OTP → silent wallet creation → redirect |
| `/worker/dashboard` | Worker | Balance, locked earnings, milestone list, submit button |
| `/admin` | Admin | KYB queue + recent payrolls overview |

### UI Component Library (`app/components/ui/`)
- [x] `Button` — primary / secondary / ghost / danger variants, loading spinner
- [x] `Input` / `Textarea` / `Select` — with label, error, hint
- [x] `Card` — with Header, Title, Description, Content, Footer
- [x] `Badge` — status-aware colour variants (success/warning/danger/muted)
- [x] `Modal` — keyboard-dismissable overlay
- [x] `FileUpload` — drag-and-drop with file preview
- [x] `WalletConnect` — Freighter v3.1.0 detection + connect + error states

### Soroban Smart Contract (`contracts/escrow/`)
- [x] Written in Rust with `soroban-sdk 21.0.0`
- [x] `initialize(employer, admin, treasury, token)` — sets up per-payroll escrow
- [x] `deposit(from, amount)` — employer funds the contract
- [x] `add_milestone(id, worker, amount, name)` — registers a milestone
- [x] `approve_milestone(id)` — releases 99% USDC to worker, 1% to treasury
- [x] `reject_milestone(id)` — funds stay in escrow
- [x] `freeze()` / `unfreeze()` — admin dispute management
- [x] `withdraw()` — employer reclaims after all milestones resolved
- [x] Unit tests included (initialize, approve, frozen state)

---

## What Is NOT Done Yet (Next Steps)

### Blockers Before First Real Test
- [ ] **Fill 2 Stellar keypairs in `.env`** — `PLATFORM_TREASURY_WALLET`, `PLATFORM_TREASURY_SECRET`, `PLATFORM_OPERATIONAL_SECRET`
  - Generate at: `https://laboratory.stellar.org/#account-creator?network=test`
  - Fund with: `https://friendbot.stellar.org/?addr=<G...key>`
- [ ] **Create an Admin account in the database** (no signup UI for admin — needs a seed script or direct DB insert)

### Features Not Yet Built
- [ ] **File upload storage** — KYB documents currently save a placeholder URL. Need real file storage (Cloudflare R2, AWS S3, or Uploadthing)
- [ ] **Soroban contract deployment** — contract is written but not compiled or deployed to testnet. Frontend currently just verifies a Stellar tx hash (direct USDC transfer works as fallback)
- [ ] **Employer-side milestone funding via Freighter** — the UI has a manual "paste tx hash" step. Next: build the client-side XDR builder that signs via Freighter and submits automatically
- [ ] **Worker withdrawal (SEP-24 off-ramp)** — worker dashboard shows balance but no "withdraw to bank" flow yet
- [ ] **Payroll workspaces list page** (`/dashboard/workspaces`) — the sidebar link exists but no dedicated page
- [ ] **Email notifications** — no email on KYB approval, milestone approval, etc.
- [ ] **Real Twilio SMS** — works in dev via console.log, needs real Twilio credentials for production
- [ ] **Admin employers list page** (`/admin/employers`) — the link exists in sidebar but no dedicated page built

---

## Environment Variables Status

| Variable | Status |
|---|---|
| `DATABASE_URL` / `DIRECT_URL` | ✅ Filled (NeonDB) |
| `JWT_SECRET` | ✅ Filled |
| `STELLAR_NETWORK` | ✅ `testnet` |
| `USDC_ISSUER_TESTNET` | ✅ Circle's official address — correct |
| `USDC_ISSUER_MAINNET` | ✅ Circle's official address — correct |
| `NEXT_PUBLIC_APP_URL` | ✅ `http://localhost:3000` |
| `PLATFORM_TREASURY_WALLET` | ❌ Needs a real Stellar keypair (testnet) |
| `PLATFORM_TREASURY_SECRET` | ❌ Needs a real Stellar keypair (testnet) |
| `PLATFORM_OPERATIONAL_SECRET` | ❌ Needs a real Stellar keypair (testnet) |
| `ENCRYPTION_KEY` | ⚠️ All-zeros works for dev, generate real one for prod |
| `TWILIO_*` | ⚠️ Not needed yet — dev uses console.log |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.6 (App Router) |
| Database | NeonDB (PostgreSQL) via Prisma 6 |
| Auth | JWT (`jose`) + httpOnly cookies |
| Blockchain | Stellar (testnet) |
| Smart Contract | Soroban (Rust, `soroban-sdk 21`) |
| Wallet | Freighter browser extension (`@stellar/freighter-api 3.1.0`) |
| Payments | USDC on Stellar |
| Worker identity | Phone number → SHA-256 hash → OTP → SEP-30 pattern |
| Worker wallet | Auto-created server-side, AES-256-GCM encrypted secret at rest |
| SMS / OTP | Twilio (console.log in dev) |
| Styling | Tailwind CSS v4 |
| Forms | react-hook-form + zod |
| CSV parsing | papaparse |
| Icons | lucide-react |

---

## File Count

| Category | Files |
|---|---|
| Frontend pages | 13 |
| API routes | 21 |
| UI components | 7 |
| Library utilities | 6 |
| Smart contract | 3 (Cargo.toml × 2 + lib.rs) |
| Config / schema | 6 (package.json, prisma, middleware, next.config, .env.example, tsconfig) |
| **Total new files** | **56** |
