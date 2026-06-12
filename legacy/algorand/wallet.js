import { PeraWalletConnect } from '@perawallet/connect'

const CHAIN_IDS = {
  testnet: 416002,
  mainnet: 416001,
  betanet: 416003,
}

const network = import.meta.env.VITE_ALGOD_NETWORK || 'testnet'

export const peraWallet = new PeraWalletConnect({
  chainId: CHAIN_IDS[network] ?? CHAIN_IDS.testnet,
  shouldShowSignTxnToast: true,
})

export async function connectPeraWallet() {
  const accounts = await peraWallet.connect()
  return accounts
}

export async function disconnectPeraWallet() {
  await peraWallet.disconnect()
}

export async function reconnectPeraWallet() {
  const accounts = await peraWallet.reconnectSession()
  return accounts ?? []
}
