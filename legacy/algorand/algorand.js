import algosdk from 'algosdk'

const network = import.meta.env.VITE_ALGOD_NETWORK || 'testnet'

const servers = {
  testnet: {
    server: import.meta.env.VITE_ALGOD_SERVER || 'https://testnet-api.algonode.cloud',
    port: Number(import.meta.env.VITE_ALGOD_PORT || 443),
    token: import.meta.env.VITE_ALGOD_TOKEN || '',
  },
  mainnet: {
    server: import.meta.env.VITE_ALGOD_SERVER || 'https://mainnet-api.algonode.cloud',
    port: Number(import.meta.env.VITE_ALGOD_PORT || 443),
    token: import.meta.env.VITE_ALGOD_TOKEN || '',
  },
}

const cfg = servers[network] || servers.testnet

export const algodClient = new algosdk.Algodv2(cfg.token, cfg.server, cfg.port)

export const REWARD_ASA_ID = Number(import.meta.env.VITE_REWARD_ASA_ID || 0) || null
export const DEFAULT_REWARD_AMOUNT = Number(
  import.meta.env.VITE_REWARD_AMOUNT || 10_000,
)

const EXPLORER_BASE = {
  testnet: 'https://lora.algokit.io/testnet/transaction',
  mainnet: 'https://lora.algokit.io/mainnet/transaction',
}

export function explorerTxUrl(txId) {
  const base = EXPLORER_BASE[network] || EXPLORER_BASE.testnet
  return `${base}/${txId}`
}

export function formatAddress(address) {
  if (!address) return ''
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export function formatReward(amount, assetId = REWARD_ASA_ID) {
  if (assetId) {
    return `${amount} ASA units (asset ${assetId})`
  }
  return `${(amount / 1_000_000).toFixed(3)} ALGO`
}

export async function getSuggestedParams() {
  return algodClient.getTransactionParams().do()
}

export async function accountHasAsset(address, assetId) {
  if (!assetId) return true
  try {
    await algodClient.accountAssetInformation(address, assetId).do()
    return true
  } catch {
    return false
  }
}

export function buildOptInTxn(sender, assetId, suggestedParams) {
  return algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    sender,
    receiver: sender,
    amount: 0,
    assetIndex: assetId,
    suggestedParams,
    note: new TextEncoder().encode('AlgoTrain: opt in to reward ASA'),
  })
}

export function buildRewardTxn({
  sender,
  receiver,
  amount,
  assetId,
  suggestedParams,
  noteText,
}) {
  const note = noteText
    ? new TextEncoder().encode(noteText)
    : new TextEncoder().encode('AlgoTrain: contributor payout')

  if (assetId) {
    return algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender,
      receiver,
      amount,
      assetIndex: assetId,
      suggestedParams,
      note,
    })
  }

  return algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender,
    receiver,
    amount,
    suggestedParams,
    note,
  })
}

export async function waitForConfirmation(txId, rounds = 8) {
  return algosdk.waitForConfirmation(algodClient, txId, rounds)
}

export async function submitSignedTransaction(signedTxn) {
  const response = await algodClient.sendRawTransaction(signedTxn).do()
  const txId = response.txId ?? response.txid
  if (!txId) throw new Error('No transaction id returned from algod')
  await waitForConfirmation(txId)
  return txId
}
