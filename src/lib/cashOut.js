// Cash-out feature, powered by 1inch. The user sees "send your balance out at
// the best available rate"; under the hood this uses 1inch's aggregator to
// find the best route across DEXes.
//
// SAME EXECUTION BOUNDARY AS convert.js: quote + build only. The user taps
// Confirm and their wallet prompts for approval. Nothing auto-executes; no
// withdrawal happens without the explicit per-action tap.
//
// 1inch API requires a key (portal.1inch.dev). Set VITE_1INCH_API_KEY.

import { arcPublicClient } from './chains/arc'

const ONEINCH_API = import.meta.env.VITE_1INCH_API || 'https://api.1inch.dev/swap/v6.0'
const ONEINCH_API_KEY = import.meta.env.VITE_1INCH_API_KEY || ''
const CHAIN_ID = arcPublicClient.chain.id

function authHeaders() {
  return ONEINCH_API_KEY ? { Authorization: `Bearer ${ONEINCH_API_KEY}` } : {}
}

/**
 * Best-rate quote across DEXes. Returns { youPay, youGet, rate } for display.
 * Quote only — no transaction is built or sent here.
 */
export async function quoteCashOut({ fromTokenAddress, toTokenAddress, amountBaseUnits }) {
  const params = new URLSearchParams({
    src: fromTokenAddress,
    dst: toTokenAddress,
    amount: String(amountBaseUnits),
  })
  const res = await fetch(`${ONEINCH_API}/${CHAIN_ID}/quote?${params}`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Best rate unavailable right now')
  const data = await res.json()
  return {
    youPay: amountBaseUnits,
    youGet: data?.dstAmount ?? null,
    rate: data?.dstAmount && amountBaseUnits
      ? Number(data.dstAmount) / Number(amountBaseUnits)
      : null,
  }
}

/**
 * Build the swap transaction for the user to confirm. Returns the unsigned
 * transaction request only. Execution happens in executeCashOut after the
 * user taps Confirm.
 */
export async function buildCashOut({ fromTokenAddress, toTokenAddress, amountBaseUnits, account, slippage = 1 }) {
  const params = new URLSearchParams({
    src: fromTokenAddress,
    dst: toTokenAddress,
    amount: String(amountBaseUnits),
    from: account,
    slippage: String(slippage),
  })
  const res = await fetch(`${ONEINCH_API}/${CHAIN_ID}/swap?${params}`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Could not prepare cash out')
  const data = await res.json()
  return data?.tx ?? null // unsigned tx for user confirmation
}

/**
 * Hand the prepared cash-out to the user's wallet for confirmation. The wallet
 * shows its own approve/reject prompt; this does not send without the user's
 * tap. Returns tx hash on approval, throws on rejection.
 */
export async function executeCashOut({ walletClient, request }) {
  if (!request) throw new Error('No prepared cash out to confirm')
  return walletClient.sendTransaction({
    to: request.to,
    data: request.data,
    value: request.value ? BigInt(request.value) : undefined,
  })
}
