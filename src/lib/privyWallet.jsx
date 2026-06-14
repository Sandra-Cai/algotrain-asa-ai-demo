/* eslint-disable react-refresh/only-export-components -- wallet provider, hooks, and Dynamic-compat shims colocated by design */
// Privy wallet layer — embedded wallets from email/social login, the user
// never sees a seed phrase or signs raw crypto. Replaces the Dynamic layer
// (the two are competitors; we run one). Targets Privy's wallet-infra track.
//
// Consumer framing: this is "your account" and "your balance", never "wallet"
// or "chain" in any user-facing string — see src/lib/copy.js for the mapping.
//
// Setup: create an app at dashboard.privy.io, enable embedded wallets +
// email/Google login, set VITE_PRIVY_APP_ID in .env.local.

import { PrivyProvider, usePrivy, useWallets } from '@privy-io/react-auth'
import { arcChain } from './chains/arc'

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || ''
export const privyConfigured = Boolean(PRIVY_APP_ID)

export function WalletProvider({ children }) {
  if (!privyConfigured) {
    console.warn(
      '[PixelPay] VITE_PRIVY_APP_ID not set — sign-in disabled. ' +
        'Create an app at dashboard.privy.io and enable embedded wallets.',
    )
    return children
  }
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        // Auto-create an embedded wallet on first login: no seed phrase shown.
        embeddedWallets: { createOnLogin: 'users-without-wallets' },
        loginMethods: ['email', 'google'],
        defaultChain: arcChain,
        supportedChains: [arcChain],
        appearance: {
          theme: 'light',
          accentColor: '#00C244', // Cash-App-style green
          logo: undefined,
          showWalletLoginFirst: false, // lead with email, not "connect wallet"
        },
      }}
    >
      {children}
    </PrivyProvider>
  )
}

export { usePrivy, useWallets }

/**
 * Consumer-friendly account hook. Returns the funded address, a ready flag,
 * a viem-style wallet client getter for transactions, and login/logout.
 * Nothing here leaks chain vocabulary to the UI.
 */
export function useAccount() {
  const { ready, authenticated, user, login, logout } = usePrivy()
  const { wallets } = useWallets()

  const wallet = wallets?.find((w) => w.walletClientType === 'privy') || wallets?.[0]
  const address = wallet?.address || null

  return {
    ready,
    signedIn: authenticated,
    email: user?.email?.address || user?.google?.email || null,
    address,
    login,
    logout,
    // Resolves an EIP-1193 provider for building a viem wallet client.
    getProvider: wallet ? () => wallet.getEthereumProvider() : null,
    wallet,
  }
}

// ---------------------------------------------------------------------------
// Compatibility shims: the existing AlgoTrainContext and ContributorPage were
// written against the Dynamic API. These adapters back those same names with
// Privy so the rest of the app keeps working without edits.

import { usePrivy as _usePrivy, useWallets as _useWallets } from '@privy-io/react-auth'

// Mirrors Dynamic's useDynamicContext() shape.
export function useDynamicContext() {
  const { ready, authenticated, login, logout } = _usePrivy()
  const { wallets } = _useWallets()
  const primaryWallet =
    wallets?.find((w) => w.walletClientType === 'privy') || wallets?.[0] || null

  return {
    primaryWallet: primaryWallet
      ? {
          address: primaryWallet.address,
          // viem wallet client built from Privy's EIP-1193 provider
          getWalletClient: async () => {
            const provider = await primaryWallet.getEthereumProvider()
            const { createWalletClient, custom } = await import('viem')
            const { arcChain } = await import('./chains/arc')
            return createWalletClient({
              account: primaryWallet.address,
              chain: arcChain,
              transport: custom(provider),
            })
          },
          connector: { getProvider: () => primaryWallet.getEthereumProvider() },
        }
      : null,
    setShowAuthFlow: (show) => { if (show && !authenticated) login() },
    handleLogOut: logout,
    ready,
  }
}

// Dynamic's isEthereumWallet(): Privy embedded wallets are always EVM here.
export function isEthereumWallet(wallet) {
  return Boolean(wallet && wallet.address)
}

// Drop-in for <DynamicWidget/>: a Privy sign-in / account button.
export function DynamicWidget() {
  const { ready, authenticated, user, login, logout } = _usePrivy()
  if (!ready) return null
  if (!authenticated) {
    return (
      <button type="button" className="primary-button" onClick={login}>
        Sign in
      </button>
    )
  }
  const label = user?.email?.address || user?.google?.email || 'Signed in'
  return (
    <div className="inline-actions">
      <span className="badge badge-muted">{label}</span>
      <button type="button" className="ghost-button" onClick={logout}>Sign out</button>
    </div>
  )
}
