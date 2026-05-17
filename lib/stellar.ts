import {
  Keypair,
  Networks,
  Asset,
  TransactionBuilder,
  Operation,
  Memo,
  BASE_FEE,
  Horizon,
  FeeBumpTransaction,
} from "@stellar/stellar-sdk";

const NETWORK = process.env.STELLAR_NETWORK === "mainnet" ? "mainnet" : "testnet";
const HORIZON_URL =
  NETWORK === "mainnet"
    ? "https://horizon.stellar.org"
    : "https://horizon-testnet.stellar.org";

export const horizon = new Horizon.Server(HORIZON_URL);

export const networkPassphrase =
  NETWORK === "mainnet" ? Networks.PUBLIC : Networks.TESTNET;

export const USDC_ASSET = new Asset(
  "USDC",
  NETWORK === "mainnet"
    ? (process.env.USDC_ISSUER_MAINNET ?? "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN")
    : (process.env.USDC_ISSUER_TESTNET ?? "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5")
);

const PLATFORM_OPERATIONAL_SECRET = process.env.PLATFORM_OPERATIONAL_SECRET ?? "";
const PLATFORM_TREASURY_WALLET = process.env.PLATFORM_TREASURY_WALLET ?? "";
const XLM_BASE_RESERVE = "1.5"; // XLM to fund new accounts

// ─── Account helpers ─────────────────────────────────────────────────────────

export function generateKeypair(): { publicKey: string; secretKey: string } {
  const kp = Keypair.random();
  return { publicKey: kp.publicKey(), secretKey: kp.secret() };
}

export async function accountExists(publicKey: string): Promise<boolean> {
  try {
    await horizon.loadAccount(publicKey);
    return true;
  } catch {
    return false;
  }
}

/** Create a Stellar account by sending minimum XLM from the operational wallet */
export async function createWorkerAccount(workerPublicKey: string): Promise<string> {
  const operationalKp = Keypair.fromSecret(PLATFORM_OPERATIONAL_SECRET);
  const operationalAccount = await horizon.loadAccount(operationalKp.publicKey());

  const tx = new TransactionBuilder(operationalAccount, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      Operation.createAccount({
        destination: workerPublicKey,
        startingBalance: XLM_BASE_RESERVE,
      })
    )
    .setTimeout(30)
    .build();

  tx.sign(operationalKp);

  const result = await horizon.submitTransaction(tx);
  return result.hash;
}

/** Add USDC trustline to a newly created worker account */
export async function addUsdcTrustline(workerSecret: string): Promise<string> {
  const workerKp = Keypair.fromSecret(workerSecret);
  const workerAccount = await horizon.loadAccount(workerKp.publicKey());

  const tx = new TransactionBuilder(workerAccount, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      Operation.changeTrust({
        asset: USDC_ASSET,
      })
    )
    .setTimeout(30)
    .build();

  const operationalKp = Keypair.fromSecret(PLATFORM_OPERATIONAL_SECRET);

  // Fee bump so worker doesn't need XLM for fees
  const feeBumpTx = TransactionBuilder.buildFeeBumpTransaction(
    operationalKp,
    BASE_FEE,
    tx,
    networkPassphrase
  );

  tx.sign(workerKp);
  (feeBumpTx as FeeBumpTransaction).sign(operationalKp);

  const result = await horizon.submitTransaction(feeBumpTx as FeeBumpTransaction);
  return result.hash;
}

/** Transfer USDC from platform treasury to a worker (used after milestone approval via contract) */
export async function sendUsdc(
  fromSecret: string,
  toPublicKey: string,
  amount: string,
  memo?: string
): Promise<string> {
  const fromKp = Keypair.fromSecret(fromSecret);
  const fromAccount = await horizon.loadAccount(fromKp.publicKey());

  const builder = new TransactionBuilder(fromAccount, {
    fee: BASE_FEE,
    networkPassphrase,
  }).addOperation(
    Operation.payment({
      destination: toPublicKey,
      asset: USDC_ASSET,
      amount,
    })
  );

  if (memo) builder.addMemo(Memo.text(memo.slice(0, 28)));

  const tx = builder.setTimeout(30).build();
  tx.sign(fromKp);

  const result = await horizon.submitTransaction(tx);
  return result.hash;
}

/** Get USDC balance for an account */
export async function getUsdcBalance(publicKey: string): Promise<string> {
  try {
    const account = await horizon.loadAccount(publicKey);
    const usdcBalance = account.balances.find(
      (b) =>
        b.asset_type === "credit_alphanum4" &&
        (b as Horizon.HorizonApi.BalanceLine<"credit_alphanum4">).asset_code === "USDC" &&
        (b as Horizon.HorizonApi.BalanceLine<"credit_alphanum4">).asset_issuer === USDC_ASSET.getIssuer()
    );
    return usdcBalance ? (usdcBalance as Horizon.HorizonApi.BalanceLine<"credit_alphanum4">).balance : "0";
  } catch {
    return "0";
  }
}

/** Verify a submitted transaction exists on-chain */
export async function verifyTransaction(txHash: string): Promise<boolean> {
  try {
    await horizon.transactions().transaction(txHash).call();
    return true;
  } catch {
    return false;
  }
}

export { PLATFORM_TREASURY_WALLET };
