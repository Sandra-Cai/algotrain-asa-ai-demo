// Convert feature, powered by the Uniswap Trading API. The user sees
// "convert your balance to X at the live rate"; under the hood this quotes
// and prepares a Uniswap swap. No blockchain vocabulary reaches the UI.
//
// IMPORTANT EXECUTION BOUNDARY: this module fetches a quote and builds the
// unsigned transaction, but NEVER auto-sends. executeConvert() hands the
// built request to the user's wallet, which shows its own confirmation
// prompt; the user taps to approve. No funds move without that explicit tap.
//
// Flow matches the Uniswap Trading API (developers.uniswap.org):
//   1. POST /quote  -> returns a quote + routing (no transaction yet)
//   2. POST /swap   -> returns the unsigned `transaction` to be signed
// For CLASSIC/WRAP/UNWRAP routing the /swap step yields a normal tx the
// wallet can send. (UniswapX "DUTCH_*"/"PRIORITY" routing instead returns an
// order to sign via /order; we steer to CLASSIC routing for the demo so the
// output is always a plain wallet-signable transaction with a real tx hash.)

const UNISWAP_API =
  import.meta.env.VITE_UNISWAP_API || 'https://trade-api.gateway.uniswap.org/v1'
const UNISWAP_API_KEY = import.meta.env.VITE_UNISWAP_API_KEY || ''

// Chain + token config. Defaults target Ethereum Sepolia testnet (chainId
// 11155111) so a hackathon swap produces a real, verifiable testnet tx hash.
// Override via .env to point at whatever chain your API key is enabled for.
export const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || 11155111)

// The balance the user is converting FROM (their earned token). Must be a
// real ERC-20 address on CHAIN_ID. On Sepolia this defaults to test USDC;
// set VITE_CONVERT_FROM_TOKEN + decimals to match the token you actually hold.
const FROM_TOKEN = import.meta.env.VITE_CONVERT_FROM_TOKEN || ''
const FROM_DECIMALS = Number(import.meta.env.VITE_CONVERT_FROM_DECIMALS || 6)

// Consumer "Convert to…" list. `address` must be a real token on CHAIN_ID.
// Native ETH is represented by the zero address per the Trading API.
// Fill addresses from the Uniswap docs for your chain before the demo;
// targets with an empty address are hidden so the UI never offers a broken one.
export const CONVERT_TARGETS = [
  {
    symbol: 'ETH',
    label: 'Ethereum',
    address:
      import.meta.env.VITE_TOKEN_ETH ||
      '0x0000000000000000000000000000000000000000',
  },
  { symbol: 'WBTC', label: 'Bitcoin', address: import.meta.env.VITE_TOKEN_WBTC || '' },
  { symbol: 'DAI', label: 'Dai dollars', address: import.meta.env.VITE_TOKEN_DAI || '' },
].filter((t) => t.address)

// Convert a human dollar/þtoken amount to the token's smallest unit (wei-style
// string) without floating-point drift. e.g. 12.5 @ 6 decimals -> "12500000".
function toBaseUnits(amount, decimals) {
  const [whole, frac = ''] = String(amount).split('.')
  const fracPadded = (frac + '0'.repeat(decimals)).slice(0, decimals)
  const digits = (whole + fracPadded).replace(/^0+(?=\d)/, '')
  return digits === '' ? '0' : digits
}

function headers() {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(UNISWAP_API_KEY ? { 'x-api-key': UNISWAP_API_KEY } : {}),
  }
}

async function readError(res, fallback) {
  // Surface the API's own error text so a venue misconfig is debuggable
  // instead of a silent "rate unavailable".
  let detail = ''
  try {
    const body = await res.json()
    detail = body?.errorCode || body?.detail || body?.message || ''
  } catch {
    /* non-JSON error body */
  }
  return new Error(detail ? `${fallback} (${detail})` : fallback)
}

/**
 * Step 1 — fetch a live quote. Returns { youPay, youGet, rate, quote } where
 * `quote` is the raw quote object to pass to buildConvertTx(). Throws on
 * failure so the UI can show "rate unavailable, try again".
 */
export async function quoteConvert({ fromAmount, toAddress, account }) {
  if (!FROM_TOKEN) throw new Error('Convert source token not configured (VITE_CONVERT_FROM_TOKEN)')
  const amount = toBaseUnits(fromAmount, FROM_DECIMALS)

  const res = await fetch(`${UNISWAP_API}/quote`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      type: 'EXACT_INPUT',
      tokenInChainId: CHAIN_ID,
      tokenOutChainId: CHAIN_ID,
      tokenIn: FROM_TOKEN,
      tokenOut: toAddress,
      amount,
      swapper: account,
      autoSlippage: 'DEFAULT',
      // Prefer CLASSIC routing so /swap returns a plain signable transaction
      // (a real tx hash) rather than an off-chain UniswapX order.
      routingPreference: 'CLASSIC',
    }),
  })
  if (!res.ok) throw await readError(res, 'Rate unavailable right now')
  const data = await res.json()
  const quote = data?.quote
  if (!quote) throw new Error('Rate unavailable right now')

  return {
    youPay: fromAmount,
    // Output amount is in the target token's smallest unit; the UI formats it.
    youGet: quote?.output?.amount ?? quote?.quote ?? null,
    rate: quote?.rate ?? null,
    routing: data?.routing ?? null,
    quote, // pass straight through to buildConvertTx
  }
}

/**
 * Step 2 — turn a quote into an unsigned transaction via POST /swap.
 * Returns { transaction, permitData } where `transaction` is the unsigned
 * request for the wallet to confirm. `permitData`, if present, is a Permit2
 * typed-data payload the user must sign first (also via their wallet).
 */
export async function buildConvertTx({ quote }) {
  if (!quote) throw new Error('No quote to build from')
  const res = await fetch(`${UNISWAP_API}/swap`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ quote }),
  })
  if (!res.ok) throw await readError(res, 'Could not prepare the conversion')
  const data = await res.json()
  if (!data?.swap && !data?.transaction) {
    throw new Error('Could not prepare the conversion')
  }
  return {
    transaction: data?.swap ?? data?.transaction, // unsigned tx for the wallet
    permitData: quote?.permitData ?? null,
  }
}

/**
 * Step 3 — hand the prepared swap to the user's wallet for confirmation.
 * The wallet renders its own approve/reject UI; this function cannot send on
 * the user's behalf without their tap. If the quote required a Permit2
 * signature, the caller must obtain it via the wallet's signTypedData first
 * and the API/router consumes it as part of the prepared transaction.
 * Returns the tx hash after the user approves, or throws if they reject.
 */
export async function executeConvert({ walletClient, transaction }) {
  if (!transaction) throw new Error('No prepared conversion to confirm')
  // sendTransaction surfaces the wallet's confirmation prompt to the user.
  return walletClient.sendTransaction({
    to: transaction.to,
    data: transaction.data,
    value: transaction.value ? BigInt(transaction.value) : undefined,
    // gas / chainId are filled by the wallet from the connected network.
  })
}
