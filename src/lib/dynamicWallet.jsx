// Dynamic wallet layer — the only wallet system in the app post-migration.
// Contributors and reviewers both onboard via Dynamic (email/social/passkey →
// embedded EVM wallet, or connect an existing one), then transact on Arc.

import {
  DynamicContextProvider,
  useDynamicContext,
  DynamicWidget,
} from '@dynamic-labs/sdk-react-core'
import { EthereumWalletConnectors, isEthereumWallet } from '@dynamic-labs/ethereum'
import { arcChain } from './chains/arc'

const DYNAMIC_ENV_ID = import.meta.env.VITE_DYNAMIC_ENV_ID

export function DynamicProvider({ children }) {
  if (!DYNAMIC_ENV_ID) {
    console.warn(
      '[AlgoTrain] VITE_DYNAMIC_ENV_ID is not set — wallet features disabled. ' +
        'Create an environment at app.dynamic.xyz and add Arc as a custom EVM network.',
    )
  }
  return (
    <DynamicContextProvider
      settings={{
        environmentId: DYNAMIC_ENV_ID || 'missing-env-id',
        walletConnectors: [EthereumWalletConnectors],
        overrides: {
          evmNetworks: [
            {
              chainId: arcChain.id,
              networkId: arcChain.id,
              name: arcChain.name,
              nativeCurrency: arcChain.nativeCurrency,
              rpcUrls: arcChain.rpcUrls.default.http,
              blockExplorerUrls: [arcChain.blockExplorers.default.url],
              iconUrls: [],
            },
          ],
        },
      }}
    >
      {children}
    </DynamicContextProvider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- thin re-exports colocated with provider
export { DynamicWidget, useDynamicContext, isEthereumWallet }
