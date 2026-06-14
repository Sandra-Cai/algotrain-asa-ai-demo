// Single source of truth for consumer-facing language. The rule: no user ever
// reads "wallet", "gas", "chain", "token", "sign", "blockchain", or a 0x hash.
// If a string shows up on screen, it comes from here.

export const COPY = {
  appName: 'PixelPay',
  tagline: 'Turn your camera roll into cash.',

  // account / wallet
  account: 'your account',
  balance: 'Balance',
  signIn: 'Sign in',
  signInSub: 'Use your email — no crypto app, no passwords to remember.',
  signedInAs: 'Signed in as',

  // earning
  upload: 'Add photos',
  uploadSub: 'Pick shots from your camera roll. Approved photos earn you cash.',
  earn: 'Earn',
  pending: 'In review',
  approved: 'Approved',
  earned: 'Earned',
  payoutArrived: 'Cash added to your balance',

  // moving money (Uniswap / 1inch under the hood)
  convert: 'Convert',
  convertSub: 'Change your balance into another currency at the live rate.',
  cashOut: 'Cash out',
  cashOutSub: 'Send your balance out at the best available rate.',
  rate: 'Rate',
  youGet: 'You get',
  youPay: 'You pay',
  reviewMove: 'Review',
  confirmMove: 'Confirm',
  moving: 'Working on it…',
  moveDone: 'Done',

  // never shown, but kept here so devs don't reintroduce jargon in the UI
  _bannedInUI: ['wallet', 'gas', 'chain', 'token', 'sign', 'blockchain', 'seed phrase', 'private key'],
}

// Money formatting: always dollars-and-cents, never base units.
export function usd(amountBaseUnits, decimals = 6) {
  const n = Number(BigInt(amountBaseUnits)) / 10 ** decimals
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}
