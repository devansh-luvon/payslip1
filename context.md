# PaySlip — Project Context

## What It Is

PaySlip is a **zero-crypto UX payroll platform** built on the Stellar blockchain. It allows employers to pay global employees using only phone numbers, hiding all blockchain complexity from end users. Every salary payment is an on-chain Stellar transaction, but neither employer nor employee ever sees a wallet address, seed phrase, or crypto concept.

---

## The Three Roles

### Employer
- Signs up and creates a company workspace
- Adds employees via phone numbers or CSV upload
- Funds their payroll wallet with stablecoins (USDC on Stellar)
- Triggers one-click salary payouts
- Payslips and payment records are auto-generated
- Never touches a seed phrase — their wallet is platform-managed (custodial)

### Employee
- Receives an SMS claim link after payroll is run
- Verifies identity via OTP (phone number as identity anchor)
- Gets an auto-created Stellar wallet via SEP-30 social recovery onboarding
- Accesses a salary dashboard: balance, transaction history, send, local withdrawal
- Never manages seed phrases or crypto keys
- Funds are already on-chain before they even open the SMS link

### Admin (Platform Operator)
- Approves employers (KYC/KYB gatekeeping)
- Monitors all on-chain transactions across the platform
- Manages compliance/KYC thresholds and transaction limits
- Configures payroll processing fees
- Handles SEP-30 recovery requests
- Maintains treasury liquidity (XLM for base reserves, operational wallets)

---

## Stellar Protocol Stack

| Protocol | Role in PaySlip |
|---|---|
| **Stellar Core** | Settlement layer — all salary payments are Stellar transactions |
| **USDC on Stellar** | Payment asset — stable, fiat-denominated salary |
| **SEP-30** | Account recovery for employees — phone/email as recovery signers, no seed phrase |
| **SEP-10** | Wallet-based authentication for the employee dashboard |
| **SEP-6 / SEP-24** | Local withdrawal (off-ramp via Stellar anchors) |
| **Stellar Horizon API** | Transaction submission, account queries, payment history |
| **Fee Bump Transactions** | Platform pays network fees so employees never need XLM |

---

## Core Flows

### Payroll Execution
```
Employer funds wallet (USDC deposit)
  → Platform validates KYC/balance
  → Payroll job created (per-employee records)
  → For each employee:
      → Check if Stellar account exists
      → If not: create account (fund base reserve), register via SEP-30
      → Submit Stellar payment transaction (USDC)
      → Store payslip record in DB
      → Send SMS claim link to employee
```

### Employee Wallet Provisioning
```
Employee clicks SMS claim link
  → OTP verification (phone number confirmed)
  → Platform generates Stellar keypair server-side
  → Account created on Stellar (platform funds minimum base reserve: ~1 XLM)
  → SEP-30 registration: recovery servers tied to phone number
  → Platform is initial signer (custodial until employee upgrades)
  → Employee sees dashboard with balance
```

### Local Withdrawal
```
Employee requests withdrawal
  → Platform submits SEP-6/SEP-24 off-ramp to local anchor
  → Stellar payment sent to anchor's Stellar account
  → Anchor delivers local currency (mobile money, bank transfer)
```

---

## Architecture Layers

### Data Layer
- **Users** — employers, employees, admins with role flags
- **Wallets** — maps user ID to Stellar account public key
- **Payroll Runs** — batch records with status tracking
- **Payslips** — individual payment records (amount, asset, tx hash, timestamp)
- **KYC Records** — compliance tiers per user

### Service Layer
- `WalletService` — account creation, SEP-30 registration, balance queries via Horizon
- `PayrollService` — payroll run orchestration, transaction batching
- `StellarService` — transaction building, signing, submission to Horizon
- `SMSService` — claim link generation, OTP dispatch
- `ComplianceService` — KYC checks, transaction limit enforcement

### Blockchain Layer
- All signing happens server-side (custodial model)
- Payment operations use USDC asset
- Fee bump transactions wrap employee-side operations (platform pays fees)
- Stellar DEX pathfinding available if asset conversion is needed

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **Custodial model** | Required for zero-crypto UX — platform holds signing keys for all wallets |
| **Fee bump transactions** | Employees never need XLM — platform wraps and pays all network fees |
| **Phone number as identity** | Phone → OTP → user record → Stellar account is the full identity stack |
| **SMS claim pattern** | Funds are pushed on-chain at payroll time; employee claims by completing onboarding |
| **SEP-30 for recovery** | No seed phrase required — recovery tied to phone/email via recovery servers |

---

## Hard Engineering Challenges

1. **Account creation at scale** — every new employee needs a funded Stellar account (base reserve in XLM); requires an operational XLM treasury
2. **SEP-30 integration** — running/integrating recovery servers, managing multi-signer setup per account
3. **Transaction batching** — large payroll runs need efficient batching to minimize fees and latency
4. **Off-ramp coverage** — local withdrawal depends on which Stellar anchors operate in each employee's country
5. **Custodial compliance** — platform bears KYC/AML responsibility for all wallets it manages

---

## Platform Flow Summary

```
Employer → funds wallet → runs payroll
  ↓
Platform → validates → creates employee wallets (SEP-30) → submits Stellar payments → sends SMS
  ↓
Employee → clicks link → OTP → dashboard → view / send / withdraw
  ↓
Admin → approves employers → monitors txns → manages fees/KYC/recovery/treasury
```

---

## Notes
- No crypto jargon is exposed to any end user at any point
- The platform is the custodian and compliance owner for all wallets
- Stellar chosen for: low fees, fast finality (3-5s), native USDC support, SEP standards for recovery and off-ramp
