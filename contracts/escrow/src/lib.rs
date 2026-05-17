//! PaySlip Escrow Contract
//!
//! Holds USDC on behalf of an employer for a single payroll.
//! Milestones are approved by the employer, releasing funds to the worker.
//! A 1% platform fee is routed to the treasury on every payment.
//!
//! Key invariants:
//!   - Only the stored employer can approve or reject milestones.
//!   - Only the stored admin can freeze/unfreeze the payroll.
//!   - Funds are never custodied by the PaySlip backend.

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    token, Address, Env, Map, String, Symbol, Vec,
};

// ── Storage keys ─────────────────────────────────────────────────────────────

const EMPLOYER: Symbol    = symbol_short!("EMPLOYER");
const ADMIN: Symbol       = symbol_short!("ADMIN");
const TREASURY: Symbol    = symbol_short!("TREASURY");
const TOKEN: Symbol       = symbol_short!("TOKEN");
const FROZEN: Symbol      = symbol_short!("FROZEN");
const MILESTONES: Symbol  = symbol_short!("MILESTONES");
const INITIALIZED: Symbol = symbol_short!("INIT");

// ── Data types ────────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone, PartialEq, Debug)]
pub enum MilestoneStatus {
    Active,
    Approved,
    Rejected,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Milestone {
    pub worker:  Address,
    pub amount:  i128,
    pub status:  MilestoneStatus,
    pub name:    String,
}

// ── Contract ──────────────────────────────────────────────────────────────────

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    /// Initialize the escrow for a specific payroll.
    /// Must be called once before any other function.
    ///
    /// # Arguments
    /// * `employer`  – Stellar address that owns this payroll.
    /// * `admin`     – PaySlip platform admin address (for freeze/dispute).
    /// * `treasury`  – Address that receives the 1% platform fee.
    /// * `token`     – USDC asset contract address.
    pub fn initialize(
        env: Env,
        employer: Address,
        admin: Address,
        treasury: Address,
        token: Address,
    ) {
        if env.storage().instance().has(&INITIALIZED) {
            panic!("already initialized");
        }

        employer.require_auth();

        env.storage().instance().set(&EMPLOYER, &employer);
        env.storage().instance().set(&ADMIN, &admin);
        env.storage().instance().set(&TREASURY, &treasury);
        env.storage().instance().set(&TOKEN, &token);
        env.storage().instance().set(&FROZEN, &false);
        env.storage().instance().set(&INITIALIZED, &true);

        let milestones: Map<u32, Milestone> = Map::new(&env);
        env.storage().instance().set(&MILESTONES, &milestones);
    }

    /// Deposit USDC from the employer into the escrow.
    /// Can be called multiple times (top-ups allowed).
    pub fn deposit(env: Env, from: Address, amount: i128) {
        from.require_auth();
        Self::assert_not_frozen(&env);

        let token_addr: Address = env.storage().instance().get(&TOKEN).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&from, &env.current_contract_address(), &amount);
    }

    /// Add a milestone to the payroll.
    /// Only callable by the employer before or after funding.
    ///
    /// # Arguments
    /// * `id`     – Unique u32 milestone ID (matches PaySlip DB ID, encoded).
    /// * `worker` – Worker's Stellar address.
    /// * `amount` – USDC amount (in stroops: 1 USDC = 10_000_000).
    /// * `name`   – Human-readable name (for event logs).
    pub fn add_milestone(
        env: Env,
        id: u32,
        worker: Address,
        amount: i128,
        name: String,
    ) {
        let employer: Address = env.storage().instance().get(&EMPLOYER).unwrap();
        employer.require_auth();
        Self::assert_not_frozen(&env);

        let mut milestones: Map<u32, Milestone> =
            env.storage().instance().get(&MILESTONES).unwrap();

        if milestones.contains_key(id) {
            panic!("milestone already exists");
        }

        milestones.set(
            id,
            Milestone {
                worker,
                amount,
                status: MilestoneStatus::Active,
                name,
            },
        );
        env.storage().instance().set(&MILESTONES, &milestones);
    }

    /// Employer approves a milestone, releasing USDC to the worker.
    /// 1% fee is sent to the treasury wallet.
    ///
    /// # Arguments
    /// * `id` – Milestone ID to approve.
    pub fn approve_milestone(env: Env, id: u32) {
        let employer: Address = env.storage().instance().get(&EMPLOYER).unwrap();
        employer.require_auth();
        Self::assert_not_frozen(&env);

        let mut milestones: Map<u32, Milestone> =
            env.storage().instance().get(&MILESTONES).unwrap();

        let mut milestone = milestones.get(id).unwrap_or_else(|| panic!("milestone not found"));

        if milestone.status != MilestoneStatus::Active {
            panic!("milestone not active");
        }

        let treasury: Address = env.storage().instance().get(&TREASURY).unwrap();
        let token_addr: Address = env.storage().instance().get(&TOKEN).unwrap();
        let token_client = token::Client::new(&env, &token_addr);

        // 1% platform fee (integer division; remainder stays in escrow)
        let fee = milestone.amount / 100;
        let worker_amount = milestone.amount - fee;

        token_client.transfer(
            &env.current_contract_address(),
            &milestone.worker,
            &worker_amount,
        );

        if fee > 0 {
            token_client.transfer(
                &env.current_contract_address(),
                &treasury,
                &fee,
            );
        }

        milestone.status = MilestoneStatus::Approved;
        milestones.set(id, milestone);
        env.storage().instance().set(&MILESTONES, &milestones);

        // Emit event for indexing
        env.events().publish(
            (symbol_short!("approved"), id),
            worker_amount,
        );
    }

    /// Employer rejects a milestone (funds remain in escrow).
    pub fn reject_milestone(env: Env, id: u32) {
        let employer: Address = env.storage().instance().get(&EMPLOYER).unwrap();
        employer.require_auth();
        Self::assert_not_frozen(&env);

        let mut milestones: Map<u32, Milestone> =
            env.storage().instance().get(&MILESTONES).unwrap();

        let mut milestone = milestones.get(id).unwrap_or_else(|| panic!("milestone not found"));

        if milestone.status != MilestoneStatus::Active {
            panic!("milestone not active");
        }

        milestone.status = MilestoneStatus::Rejected;
        milestones.set(id, milestone);
        env.storage().instance().set(&MILESTONES, &milestones);

        env.events().publish(
            (symbol_short!("rejected"), id),
            (),
        );
    }

    /// Admin-only: freeze the payroll (pause all approvals for dispute).
    pub fn freeze(env: Env) {
        let admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        admin.require_auth();
        env.storage().instance().set(&FROZEN, &true);
        env.events().publish((symbol_short!("frozen"),), ());
    }

    /// Admin-only: unfreeze the payroll.
    pub fn unfreeze(env: Env) {
        let admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        admin.require_auth();
        env.storage().instance().set(&FROZEN, &false);
        env.events().publish((symbol_short!("unfrozen"),), ());
    }

    /// Employer-only emergency withdrawal of remaining balance
    /// (only when payroll is completed or admin-approved for refund).
    pub fn withdraw(env: Env, amount: i128) {
        let employer: Address = env.storage().instance().get(&EMPLOYER).unwrap();
        employer.require_auth();

        // Ensure no active (unapproved) milestones remain
        let milestones: Map<u32, Milestone> =
            env.storage().instance().get(&MILESTONES).unwrap();

        let has_active = milestones
            .iter()
            .any(|(_, m)| m.status == MilestoneStatus::Active);

        if has_active {
            panic!("cannot withdraw: active milestones exist");
        }

        let token_addr: Address = env.storage().instance().get(&TOKEN).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&env.current_contract_address(), &employer, &amount);
    }

    // ── View functions ────────────────────────────────────────────────────

    pub fn get_milestone(env: Env, id: u32) -> Option<Milestone> {
        let milestones: Map<u32, Milestone> =
            env.storage().instance().get(&MILESTONES).unwrap();
        milestones.get(id)
    }

    pub fn is_frozen(env: Env) -> bool {
        env.storage().instance().get(&FROZEN).unwrap_or(false)
    }

    pub fn get_employer(env: Env) -> Address {
        env.storage().instance().get(&EMPLOYER).unwrap()
    }

    // ── Internal helpers ──────────────────────────────────────────────────

    fn assert_not_frozen(env: &Env) {
        let frozen: bool = env.storage().instance().get(&FROZEN).unwrap_or(false);
        if frozen {
            panic!("payroll is frozen");
        }
    }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env, String};

    #[test]
    fn test_initialize_and_deposit() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, EscrowContract);
        let client = EscrowContractClient::new(&env, &contract_id);

        let employer = Address::generate(&env);
        let admin = Address::generate(&env);
        let treasury = Address::generate(&env);

        // Deploy a mock token
        let token_id = env.register_stellar_asset_contract_v2(employer.clone());
        let token_addr = token_id.address();

        client.initialize(&employer, &admin, &treasury, &token_addr);

        assert_eq!(client.get_employer(), employer);
        assert!(!client.is_frozen());
    }

    #[test]
    fn test_add_and_approve_milestone() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, EscrowContract);
        let client = EscrowContractClient::new(&env, &contract_id);

        let employer = Address::generate(&env);
        let admin = Address::generate(&env);
        let treasury = Address::generate(&env);
        let worker = Address::generate(&env);

        let token_id = env.register_stellar_asset_contract_v2(employer.clone());
        let token_addr = token_id.address();
        let token_client = token::Client::new(&env, &token_addr);

        client.initialize(&employer, &admin, &treasury, &token_addr);

        // Mint USDC to employer and deposit
        token_client.mint(&employer, &1_000_000_000); // 100 USDC
        client.deposit(&employer, &1_000_000_000);

        // Add milestone: 50 USDC (500_000_000 stroops)
        client.add_milestone(
            &1u32,
            &worker,
            &500_000_000,
            &String::from_str(&env, "Wireframe"),
        );

        // Approve milestone
        client.approve_milestone(&1u32);

        // Worker receives 99% = 495_000_000
        let worker_balance = token_client.balance(&worker);
        assert_eq!(worker_balance, 495_000_000);

        // Treasury receives 1% = 5_000_000
        let treasury_balance = token_client.balance(&treasury);
        assert_eq!(treasury_balance, 5_000_000);

        let milestone = client.get_milestone(&1u32).unwrap();
        assert_eq!(milestone.status, MilestoneStatus::Approved);
    }

    #[test]
    #[should_panic(expected = "payroll is frozen")]
    fn test_frozen_blocks_approval() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, EscrowContract);
        let client = EscrowContractClient::new(&env, &contract_id);

        let employer = Address::generate(&env);
        let admin = Address::generate(&env);
        let treasury = Address::generate(&env);
        let worker = Address::generate(&env);
        let token_id = env.register_stellar_asset_contract_v2(employer.clone());
        let token_addr = token_id.address();
        let token_client = token::Client::new(&env, &token_addr);

        client.initialize(&employer, &admin, &treasury, &token_addr);
        token_client.mint(&employer, &1_000_000_000);
        client.deposit(&employer, &1_000_000_000);
        client.add_milestone(
            &1u32,
            &worker,
            &500_000_000,
            &String::from_str(&env, "Design"),
        );

        client.freeze();
        // Should panic here
        client.approve_milestone(&1u32);
    }
}
