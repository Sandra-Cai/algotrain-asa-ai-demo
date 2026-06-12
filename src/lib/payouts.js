// Payout engine with pluggable settlement rails. Arc (USDC) is the live rail;
// the registry pattern is what makes "chains are rails, the engine is the
// product" true in code. (Algorand rail retired to legacy/ — see git history.)

import {
  sendArcPayout,
  explorerTxUrl,
  formatReward,
  isValidEvmAddress,
} from './chains/arc'

const rails = {
  arc: {
    label: 'Arc · native USDC',
    validateAddress: isValidEvmAddress,
    explorerTxUrl,
    formatReward,
    settle: sendArcPayout,
  },
}

export const DEFAULT_RAIL = 'arc'

export function getRail(name = DEFAULT_RAIL) {
  const rail = rails[name]
  if (!rail) throw new Error(`Unknown settlement rail: ${name}`)
  return rail
}

/**
 * Settle a contributor payout.
 * { walletClient, sender, receiver, amountBaseUnits, noteText, rail? }
 * Returns { rail, txId, explorerUrl }
 */
export async function settlePayout({ rail = DEFAULT_RAIL, ...params }) {
  const r = getRail(rail)
  if (!r.validateAddress(params.receiver)) {
    throw new Error('Invalid contributor payout address')
  }
  const { txHash, explorerUrl } = await r.settle(params)
  return { rail, txId: txHash, explorerUrl }
}
