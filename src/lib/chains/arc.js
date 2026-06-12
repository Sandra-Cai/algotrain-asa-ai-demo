// Arc (Circle) settlement adapter for AlgoTrain payouts.
// Mirrors the interface of src/lib/algorand.js so the payout router
// (src/lib/payouts.js) can treat both rails identically.
//
// Arc uses USDC as the native gas/value token, so the default payout path
// is a plain native-value transfer. An optional ERC-20 mode is included in
// case a bounty track asks for a specific token contract.
//
// IMPORTANT (hackathon): confirm VITE_ARC_RPC_URL and VITE_ARC_CHAIN_ID
// against Circle's ETHGlobal NY sponsor page / Arc testnet docs before the
// demo. Both are env-driven so nothing here needs to change.

import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  defineChain,
  parseUnits,
  formatUnits,
  stringToHex,
  erc20Abi,
} from 'viem'

const ARC_RPC_URL =
  import.meta.env.VITE_ARC_RPC_URL || 'https://rpc.testnet.arc.network'
const ARC_CHAIN_ID = Number(import.meta.env.VITE_ARC_CHAIN_ID || 0)
const ARC_EXPLORER =
  import.meta.env.VITE_ARC_EXPLORER || 'https://explorer.testnet.arc.network'

// Optional ERC-20 payout token (leave unset to pay in native USDC)
export const ARC_PAYOUT_TOKEN = import.meta.env.VITE_ARC_PAYOUT_TOKEN || null

// USDC has 6 decimals — both native-on-Arc and the ERC-20 representation.
export const USDC_DECIMALS = 6

// Default payout: 10,000 base units = 0.01 USDC (same magnitude as the old
// 0.01 ALGO demo default, now dollar-denominated).
export const DEFAULT_REWARD_AMOUNT = Number(
  import.meta.env.VITE_REWARD_AMOUNT || 10_000,
)

export const arcChain = defineChain({
  id: ARC_CHAIN_ID,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: USDC_DECIMALS },
  rpcUrls: { default: { http: [ARC_RPC_URL] } },
  blockExplorers: { default: { name: 'Arc Explorer', url: ARC_EXPLORER } },
  testnet: true,
})

export const arcPublicClient = createPublicClient({
  chain: arcChain,
  transport: http(ARC_RPC_URL),
})

export function explorerTxUrl(txHash) {
  return `${ARC_EXPLORER}/tx/${txHash}`
}

export function formatAddress(address) {
  if (!address) return ''
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export function formatReward(amountBaseUnits) {
  return `${formatUnits(BigInt(amountBaseUnits), USDC_DECIMALS)} USDC`
}

export function toUsdcBaseUnits(humanAmount) {
  return parseUnits(String(humanAmount), USDC_DECIMALS)
}

export function isValidEvmAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address || '')
}

/**
 * Build a wallet client from an EIP-1193 provider.
 * With Dynamic, get the provider via the primary wallet connector
 * (see src/lib/dynamicWallet.jsx → useArcWalletClient).
 */
export function buildArcWalletClient(eip1193Provider, account) {
  return createWalletClient({
    account,
    chain: arcChain,
    transport: custom(eip1193Provider),
  })
}

/**
 * Send a contributor payout on Arc.
 * Native mode (default): plain value transfer in USDC with the payout memo
 * encoded in calldata, so the audit trail survives on-chain like the
 * Algorand note field does.
 * ERC-20 mode: standard transfer() if VITE_ARC_PAYOUT_TOKEN is set
 * (no memo — calldata is the function call).
 *
 * Returns { txHash, explorerUrl } after 1 confirmation.
 */
export async function sendArcPayout({
  walletClient,
  sender,
  receiver,
  amountBaseUnits,
  noteText,
}) {
  if (!isValidEvmAddress(receiver)) {
    throw new Error('Invalid contributor payout address (expected 0x…)')
  }

  let txHash
  if (ARC_PAYOUT_TOKEN) {
    txHash = await walletClient.writeContract({
      account: sender,
      address: ARC_PAYOUT_TOKEN,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [receiver, BigInt(amountBaseUnits)],
    })
  } else {
    txHash = await walletClient.sendTransaction({
      account: sender,
      to: receiver,
      value: BigInt(amountBaseUnits),
      data: noteText ? stringToHex(noteText) : undefined,
    })
  }

  await arcPublicClient.waitForTransactionReceipt({
    hash: txHash,
    confirmations: 1,
  })

  return { txHash, explorerUrl: explorerTxUrl(txHash) }
}

/** Native USDC balance (or ERC-20 balance if a token is configured). */
export async function getArcBalance(address) {
  if (ARC_PAYOUT_TOKEN) {
    return arcPublicClient.readContract({
      address: ARC_PAYOUT_TOKEN,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [address],
    })
  }
  return arcPublicClient.getBalance({ address })
}
