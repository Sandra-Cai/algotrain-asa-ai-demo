// Hedera settlement rail — native services JS (@hashgraph/sdk), no Solidity.
// Same interface as src/lib/chains/arc.js so the rails registry treats both
// rails identically. Three native services, each mapping to a Hedera track:
//   CryptoTransfer (HBAR payout + first-class transaction memo) — agentic payments
//   Consensus Service (HCS) — immutable public log of agent decisions
//   Schedule Service — on-chain scheduled payouts, no off-chain infra
//
// Contributors keep their Dynamic (EVM) wallets: transfers to an 0x address
// use Hedera's EVM alias mechanism (auto-creates the matching account).
//
// TESTNET ONLY. Operator credentials live in .env.local (gitignored); free
// testnet account + HBAR at portal.hedera.com. Anything in a Vite env var
// ships in the bundle — never reuse these keys for real funds.
//
// Units: tasks store rewards in 6-decimal base units (10000 = 0.01). HBAR
// uses 8-decimal tinybars, so this rail multiplies by 100 for a 1:1 notional
// mapping (0.01 "units" pays 0.01 HBAR). Deliberate demo simplification.

import {
  Client,
  TransferTransaction,
  TopicMessageSubmitTransaction,
  ScheduleCreateTransaction,
  Hbar,
  AccountId,
  PrivateKey,
} from '@hashgraph/sdk'

const HEDERA_ACCOUNT_ID = import.meta.env.VITE_HEDERA_ACCOUNT_ID || ''
const HEDERA_PRIVATE_KEY = import.meta.env.VITE_HEDERA_PRIVATE_KEY || ''
const HEDERA_TOPIC_ID = import.meta.env.VITE_HEDERA_TOPIC_ID || ''
const HEDERA_NETWORK = import.meta.env.VITE_HEDERA_NETWORK || 'testnet'

export const hederaConfigured = Boolean(HEDERA_ACCOUNT_ID && HEDERA_PRIVATE_KEY)

const UNIT_TO_TINYBAR = 100n

let cachedClient = null
function getClient() {
  if (!hederaConfigured) {
    throw new Error('Set VITE_HEDERA_ACCOUNT_ID and VITE_HEDERA_PRIVATE_KEY (testnet)')
  }
  if (!cachedClient) {
    cachedClient =
      HEDERA_NETWORK === 'mainnet' ? Client.forMainnet() : Client.forTestnet()
    cachedClient.setOperator(
      AccountId.fromString(HEDERA_ACCOUNT_ID),
      PrivateKey.fromStringECDSA(HEDERA_PRIVATE_KEY),
    )
  }
  return cachedClient
}

export function isValidHederaReceiver(address) {
  return (
    /^0x[a-fA-F0-9]{40}$/.test(address || '') ||
    /^\d+\.\d+\.\d+$/.test(address || '')
  )
}

function toAccountId(address) {
  if (/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return AccountId.fromEvmAddress(0, 0, address)
  }
  return AccountId.fromString(address)
}

export function formatAddress(address) {
  if (!address) return ''
  return address.startsWith('0x')
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : address
}

export function formatReward(amountBaseUnits) {
  const tinybars = BigInt(amountBaseUnits) * UNIT_TO_TINYBAR
  const whole = tinybars / 100_000_000n
  const frac = (tinybars % 100_000_000n).toString().padStart(8, '0').slice(0, 4)
  return `${whole}.${frac} HBAR`
}

export function explorerTxUrl(txId) {
  // SDK tx ids look like 0.0.x@1718200000.123456789; HashScan wants dashes.
  const formatted = String(txId).replace('@', '-').replace(/\.(\d+)$/, '-$1')
  return `https://hashscan.io/${HEDERA_NETWORK}/transaction/${formatted}`
}

/**
 * Settle a payout via native CryptoTransfer with the audit memo attached.
 * Sender is always the configured operator (the agent's own account), so the
 * shared-interface walletClient/sender params are ignored on this rail.
 * Returns { txHash, explorerUrl } like the Arc rail.
 */
export async function sendHederaPayout({ receiver, amountBaseUnits, noteText }) {
  if (!isValidHederaReceiver(receiver)) {
    throw new Error('Invalid receiver (expected 0.0.x account id or 0x address)')
  }
  const client = getClient()
  const amount = Hbar.fromTinybars(
    (BigInt(amountBaseUnits) * UNIT_TO_TINYBAR).toString(),
  )

  const tx = new TransferTransaction()
    .addHbarTransfer(AccountId.fromString(HEDERA_ACCOUNT_ID), amount.negated())
    .addHbarTransfer(toAccountId(receiver), amount)
    .setTransactionMemo((noteText || 'AlgoTrain payout').slice(0, 100))

  const response = await tx.execute(client)
  await response.getReceipt(client)
  const txId = response.transactionId.toString()
  return { txHash: txId, explorerUrl: explorerTxUrl(txId) }
}

/**
 * Log an agent decision to Hedera Consensus Service — ordered, immutable,
 * publicly auditable. No-ops (returns null) when no topic is configured so
 * the core demo never depends on it. Create a topic once via Hedera portal
 * or SDK and set VITE_HEDERA_TOPIC_ID.
 */
export async function logDecisionToHCS(decision) {
  if (!HEDERA_TOPIC_ID || !hederaConfigured) return null
  const client = getClient()
  const tx = new TopicMessageSubmitTransaction()
    .setTopicId(HEDERA_TOPIC_ID)
    .setMessage(JSON.stringify(decision).slice(0, 1024))
  const response = await tx.execute(client)
  await response.getReceipt(client)
  return response.transactionId.toString()
}

export function getHederaOperatorId() {
  return HEDERA_ACCOUNT_ID
}

/**
 * Schedule Service: register a payout that executes on-chain — recurring
 * contributor payments with no bots or off-chain infra. Returns the
 * schedule entity id.
 */
export async function schedulePayout({ receiver, amountBaseUnits, noteText }) {
  if (!isValidHederaReceiver(receiver)) {
    throw new Error('Invalid receiver (expected 0.0.x account id or 0x address)')
  }
  const client = getClient()
  const amount = Hbar.fromTinybars(
    (BigInt(amountBaseUnits) * UNIT_TO_TINYBAR).toString(),
  )
  const inner = new TransferTransaction()
    .addHbarTransfer(AccountId.fromString(HEDERA_ACCOUNT_ID), amount.negated())
    .addHbarTransfer(toAccountId(receiver), amount)

  const tx = new ScheduleCreateTransaction()
    .setScheduledTransaction(inner)
    .setScheduleMemo((noteText || 'AlgoTrain scheduled payout').slice(0, 100))

  const response = await tx.execute(client)
  const receipt = await response.getReceipt(client)
  return receipt.scheduleId?.toString() || response.transactionId.toString()
}
