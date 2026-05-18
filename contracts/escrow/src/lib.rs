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
    contract, contractimpl, contracttype,
    token, Address, Env, Map, String,
};

// ── Storage keys (enum avoids the 9-char symbol_short! limit) ────────────────

#[contracttype]
enum DataKey {
    Employer,
    Admin,
    Treasury,
    Token,
    Frozen,
    Milestones,
    Initialized,
}

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
    pub worker: Address,
    pub amount: i128,
    pub status: MilestoneStatus,
    pub name:   String,
}

// ── Contract ──────────────────────────────────────────────────────────────────

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    /// Initialize the escrow for a specific payroll.
    /// Must be called once before any other function.
    ///
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
        if env.storage().instance().has(&DataKey::Initialized) {
            panic!("already initialized");
        }

        employer.require_auth();

        env.storage().instance().set(&DataKey::Employer, &employer);
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Treasury, &treasury);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::Frozen, &false);
        env.storage().instance().set(&DataKey::Initialized, &true);

        let milestones: Map<u32, Milestone> = Map::new(&env);
        env.storage().instance().set(&DataKey::Milestones, &milestones);
    }

    /// Deposit USDC from the employer into the escrow.
    /// Can be called multiple times (top-ups allowed).
    pub fn deposit(env: Env, from: Address, amount: i128) {
        from.require_auth();
        Self::assert_not_frozen(&env);

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&from, &env.current_contract_address(), &amount);
    }

    /// Add a milestone to the payroll. Only callable by the employer.
    ///
    /// * `id`     – Unique u32 milestone ID (matches PaySlip DB record).
    /// * `worker` – Worker's Stellar address.
    /// * `amount` – USDC amount in stroops (1 USDC = 10_000_000).
    /// * `name`   – Human-readable label stored for event logs.
    pub fn add_milestone(
        env: Env,
        id: u32,
        worker: Address,
        amount: i128,
        name: String,
    ) {
        let employer: Address = env.storage().instance().get(&DataKey::Employer).unwrap();
        employer.require_auth();
        Self::assert_not_frozen(&env);

        let mut milestones: Map<u32, Milestone> =
            env.storage().instance().get(&DataKey::Milestones).unwrap();

        if milestones.contains_key(id) {
            panic!("milestone already exists");
        }

        milestones.set(id, Milestone { worker, amount, status: MilestoneStatus::Active, name });
        env.storage().instance().set(&DataKey::Milestones, &milestones);
    }

    /// Employer approves a milestone — releases 99% USDC to worker, 1% to treasury.
    pub fn approve_milestone(env: Env, id: u32) {
        let employer: Address = env.storage().instance().get(&DataKey::Employer).unwrap();
        employer.require_auth();
        Self::assert_not_frozen(&env);

        let mut milestones: Map<u32, Milestone> =
            env.storage().instance().get(&DataKey::Milestones).unwrap();

        let mut milestone = milestones.get(id).unwrap_or_else(|| panic!("milestone not found"));

        if milestone.status != MilestoneStatus::Active {
            panic!("milestone not active");
        }

        let treasury: Address  = env.storage().instance().get(&DataKey::Treasury).unwrap();
        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);

        // Integer 1% fee; remainder stays in escrow
        let fee          = milestone.amount / 100;
        let worker_amount = milestone.amount - fee;

        token_client.transfer(&env.current_contract_address(), &milestone.worker, &worker_amount);
        if fee > 0 {
            token_client.transfer(&env.current_contract_address(), &treasury, &fee);
        }

        milestone.status = MilestoneStatus::Approved;
        milestones.set(id, milestone);
        env.storage().instance().set(&DataKey::Milestones, &milestones);

        env.events().publish((soroban_sdk::symbol_short!("approved"), id), worker_amount);
    }

    /// Employer rejects a milestone — funds remain in escrow.
    pub fn reject_milestone(env: Env, id: u32) {
        let employer: Address = env.storage().instance().get(&DataKey::Employer).unwrap();
        employer.require_auth();
        Self::assert_not_frozen(&env);

        let mut milestones: Map<u32, Milestone> =
            env.storage().instance().get(&DataKey::Milestones).unwrap();

        let mut milestone = milestones.get(id).unwrap_or_else(|| panic!("milestone not found"));

        if milestone.status != MilestoneStatus::Active {
            panic!("milestone not active");
        }

        milestone.status = MilestoneStatus::Rejected;
        milestones.set(id, milestone);
        env.storage().instance().set(&DataKey::Milestones, &milestones);

        env.events().publish((soroban_sdk::symbol_short!("rejected"), id), ());
    }

    /// Admin-only: freeze the payroll (pauses all approvals for dispute).
    pub fn freeze(env: Env) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        env.storage().instance().set(&DataKey::Frozen, &true);
        env.events().publish((soroban_sdk::symbol_short!("frozen"),), ());
    }

    /// Admin-only: unfreeze the payroll.
    pub fn unfreeze(env: Env) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        env.storage().instance().set(&DataKey::Frozen, &false);
        env.events().publish((soroban_sdk::symbol_short!("unfrozn"),), ());
    }

    /// Employer emergency withdrawal of remaining balance.
    /// Only allowed when no Active milestones remain.
    pub fn withdraw(env: Env, amount: i128) {
        let employer: Address = env.storage().instance().get(&DataKey::Employer).unwrap();
        employer.require_auth();

        let milestones: Map<u32, Milestone> =
            env.storage().instance().get(&DataKey::Milestones).unwrap();

        let has_active = milestones.iter().any(|(_, m)| m.status == MilestoneStatus::Active);
        if has_active {
            panic!("cannot withdraw: active milestones exist");
        }

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&env.current_contract_address(), &employer, &amount);
    }

    // ── View functions ────────────────────────────────────────────────────────

    pub fn get_milestone(env: Env, id: u32) -> Option<Milestone> {
        let milestones: Map<u32, Milestone> =
            env.storage().instance().get(&DataKey::Milestones).unwrap();
        milestones.get(id)
    }

    pub fn is_frozen(env: Env) -> bool {
        env.storage().instance().get(&DataKey::Frozen).unwrap_or(false)
    }

    pub fn get_employer(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Employer).unwrap()
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    fn assert_not_frozen(env: &Env) {
        let frozen: bool = env.storage().instance().get(&DataKey::Frozen).unwrap_or(false);
        if frozen {
            panic!("payroll is frozen");
        }
    }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, token::StellarAssetClient, Env, String};

    fn setup_token<'a>(env: &'a Env, admin: &'a Address) -> (Address, StellarAssetClient<'a>) {
        let token_id = env.register_stellar_asset_contract_v2(admin.clone());
        let addr = token_id.address();
        let client = StellarAssetClient::new(env, &addr);
        (addr, client)
    }

    #[test]
    fn test_initialize_and_deposit() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, EscrowContract);
        let client = EscrowContractClient::new(&env, &contract_id);

        let employer = Address::generate(&env);
        let admin    = Address::generate(&env);
        let treasury = Address::generate(&env);

        let (token_addr, token_admin) = setup_token(&env, &employer);

        client.initialize(&employer, &admin, &treasury, &token_addr);

        assert_eq!(client.get_employer(), employer);
        assert!(!client.is_frozen());

        // Deposit 100 USDC
        token_admin.mint(&employer, &1_000_000_000);
        client.deposit(&employer, &1_000_000_000);
    }

    #[test]
    fn test_add_and_approve_milestone() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, EscrowContract);
        let client = EscrowContractClient::new(&env, &contract_id);

        let employer = Address::generate(&env);
        let admin    = Address::generate(&env);
        let treasury = Address::generate(&env);
        let worker   = Address::generate(&env);

        let (token_addr, token_admin) = setup_token(&env, &employer);
        let token_client = token::Client::new(&env, &token_addr);

        client.initialize(&employer, &admin, &treasury, &token_addr);

        // Mint and deposit 100 USDC (1_000_000_000 stroops)
        token_admin.mint(&employer, &1_000_000_000);
        client.deposit(&employer, &1_000_000_000);

        // Add milestone: 50 USDC
        client.add_milestone(
            &1u32,
            &worker,
            &500_000_000,
            &String::from_str(&env, "Wireframe"),
        );

        client.approve_milestone(&1u32);

        // Worker receives 99% = 495_000_000 stroops
        assert_eq!(token_client.balance(&worker), 495_000_000);
        // Treasury receives 1% = 5_000_000 stroops
        assert_eq!(token_client.balance(&treasury), 5_000_000);

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
        let admin    = Address::generate(&env);
        let treasury = Address::generate(&env);
        let worker   = Address::generate(&env);

        let (token_addr, token_admin) = setup_token(&env, &employer);

        client.initialize(&employer, &admin, &treasury, &token_addr);
        token_admin.mint(&employer, &1_000_000_000);
        client.deposit(&employer, &1_000_000_000);
        client.add_milestone(
            &1u32,
            &worker,
            &500_000_000,
            &String::from_str(&env, "Design"),
        );

        client.freeze();
        client.approve_milestone(&1u32); // should panic: "payroll is frozen"
    }
}
