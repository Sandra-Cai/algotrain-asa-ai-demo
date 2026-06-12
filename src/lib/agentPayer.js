// Agent payer — autonomous onchain action for the Dynamic agent track.
// An agent with its own wallet reviews pending submissions against a quality
// policy and settles USDC payouts on Arc with no human in the loop. The same
// rails registry the human Reviewer uses (src/lib/payouts.js) settles agent
// payments, so the agent works on any rail the engine supports.
//
// TESTNET ONLY: the agent key lives in VITE_AGENT_PRIVATE_KEY (.env.local,
// gitignored). Never fund this key with mainnet assets — a key in a Vite env
// var is readable by anyone with the bundle. Production design: a Dynamic
// server wallet or delegated session key with spend limits.

import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arcChain } from './chains/arc'
import { hederaConfigured, logDecisionToHCS, getHederaOperatorId } from './chains/hedera'
import { settlePayout } from './payouts'

// Agent rail: Hedera when configured (targets the AI & Agentic Payments
// track — the agent moves value autonomously via native CryptoTransfer),
// otherwise falls back to Arc with the local viem key.
const AGENT_RAIL = import.meta.env.VITE_AGENT_RAIL ||
  (hederaConfigured ? 'hedera' : 'arc')

const AGENT_KEY = import.meta.env.VITE_AGENT_PRIVATE_KEY || ''
const arcAgentConfigured = /^0x[a-fA-F0-9]{64}$/.test(AGENT_KEY)
export const agentConfigured =
  AGENT_RAIL === 'hedera' ? hederaConfigured : arcAgentConfigured
export const agentRail = AGENT_RAIL

export function getAgentAccount() {
  if (!agentConfigured) throw new Error('Set VITE_AGENT_PRIVATE_KEY (testnet key)')
  return privateKeyToAccount(AGENT_KEY)
}

export function getAgentWalletClient() {
  return createWalletClient({
    account: getAgentAccount(),
    chain: arcChain,
    transport: http(),
  })
}

/**
 * Quality policy — deterministic and explainable, so every agent decision
 * can be read back in the audit log. Returns { approve, score, reasons }.
 * Checks: parseable JSON object, >=1 labeled key, label strings are
 * non-trivial (3+ chars), no obvious placeholder text.
 */
export function evaluateSubmission(content) {
  const reasons = []
  let score = 0

  let parsed = null
  try {
    parsed = JSON.parse(content)
  } catch {
    return { approve: false, score: 0, reasons: ['Not valid JSON'] }
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { approve: false, score: 0, reasons: ['Expected a JSON object of labels'] }
  }
  score += 40
  reasons.push('Valid JSON object')

  const entries = Object.entries(parsed)
  if (entries.length === 0) {
    return { approve: false, score, reasons: [...reasons, 'No labels present'] }
  }
  score += 20
  reasons.push(`${entries.length} label${entries.length > 1 ? 's' : ''}`)

  const placeholderRe = /\b(todo|tbd|placeholder|asdf|test)\b/i
  const weak = entries.filter(
    ([, v]) => typeof v !== 'string' || v.trim().length < 3 || placeholderRe.test(v),
  )
  if (weak.length > 0) {
    return {
      approve: false,
      score,
      reasons: [...reasons, `${weak.length} label(s) empty or placeholder`],
    }
  }
  score += 40
  reasons.push('All labels substantive')

  return { approve: score >= 80, score, reasons }
}

/**
 * Process one pending submission end-to-end:
 * evaluate -> (approve + pay from the agent's own wallet) or reject.
 * Returns { decision, score, reasons, txId?, explorerUrl? }.
 */
export async function agentProcessSubmission({ submission, task }) {
  const verdict = evaluateSubmission(submission.content)
  if (!verdict.approve) {
    return { decision: 'rejected', ...verdict }
  }

  const noteText = `AlgoTrain agent payout | ${task.id.slice(0, 8)} | ${submission.id.slice(0, 8)}`

  let walletClient = null
  let agentAddress
  if (AGENT_RAIL === 'hedera') {
    agentAddress = getHederaOperatorId()
  } else {
    walletClient = getAgentWalletClient()
    agentAddress = walletClient.account.address
  }

  const { txId, explorerUrl } = await settlePayout({
    rail: AGENT_RAIL,
    walletClient,
    sender: agentAddress,
    receiver: submission.contributorAddress,
    amountBaseUnits: task.rewardAmount,
    noteText,
  })

  // Immutable public audit trail of the agent's decision (no-op if no topic).
  const hcsTxId = await logDecisionToHCS({
    submission: submission.id,
    task: task.id,
    decision: 'paid',
    score: verdict.score,
    reasons: verdict.reasons,
    txId,
  }).catch(() => null)

  return {
    decision: 'paid',
    ...verdict,
    txId,
    explorerUrl,
    agentAddress,
    rail: AGENT_RAIL,
    hcsTxId,
  }
}
