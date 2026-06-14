// Convert feature, powered by Uniswap. The user sees "convert your balance to
// X at the live rate"; under the hood this quotes and prepares a Uniswap swap.
//
// IMPORTANT EXECUTION BOUNDARY: this module fetches quotes and builds the
// transaction request, but NEVER auto-sends. executeConvert() hands the built
// request to the user's wallet, which shows its own confirmation prompt; the
// user taps to approve. No funds move without that explicit per-action tap.
//
// Uses Uniswap's public quoting; set VITE_UNISWAP_API_KEY if you have one,
// otherwise the trading API works with rate limits for the demo.

import { arcPublicClient } from './chains/arc'

const UNISWAP_API = import.meta.env.VITE_UNISWAP_API || 'https://trade-api.gateway.uniswap.org/v1'
const UNISWAP_API_KEY = import.meta.env.VITE_UNISWAP_API_KEY || ''

// Tokens offered in the consumer "Convert to…" list. Labels are plain words.
export const CONVERT_TARGETS = [
  { symbol: 'ETH', label: 'Ethereum' },
  { symbol: 'WBTC', label: 'Bitcoin' },
  { symbol: 'DAI', label: 'Dai dollars' },
]

/**
 * Fetch a live quote. Returns { youPay, youGet, rate, request } where request
 * is the unsigned transaction to be confirmed by the user. Throws on failure
 * so the UI can show "rate unavailable, try again".
 */
export async function quoteConvert({ fromAmountUsd, toSymbol, account }) {
  const res = await fetch(`${UNISWAP_API}/quote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(UNISWAP_API_KEY ? { 'x-api-key': UNISWAP_API_KEY } : {}),
    },
    body: JSON.stringify({
      type: 'EXACT_INPUT',
      tokenInChainId: arcPublicClient.chain.id,
      tokenOutChainId: arcPublicClient.chain.id,
      amount: fromAmountUsd,
      swapper: account,
      tokenOutSymbol: toSymbol,
    }),
  })
  if (!res.ok) throw new Error('Rate unavailable right now')
  const data = await res.json()
  return {
    youPay: fromAmountUsd,
    youGet: data?.quote?.output?.amount ?? null,
    rate: data?.quote?.rate ?? null,
    request: data?.quote?.transaction ?? null, // unsigned tx for user confirm
  }
}

/**
 * Hand the prepared swap to the user's wallet for confirmation. The wallet
 * renders its own approve/reject UI — this function does not and cannot send
 * on the user's behalf without their tap. Returns the tx hash after they
 * approve, or throws if they reject.
 */
export async function executeConvert({ walletClient, request }) {
  if (!request) throw new Error('No prepared conversion to confirm')
  // sendTransaction surfaces the wallet's confirmation prompt to the user.
  return walletClient.sendTransaction(request)
}
