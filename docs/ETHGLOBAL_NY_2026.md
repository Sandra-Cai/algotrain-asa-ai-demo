# ETHGlobal New York 2026 — Continuity Track build notes

Track: Continuity / Extend Open Source. New feature shipped on the existing
AlgoTrain repo: multi-rail stablecoin settlement. Contributor payouts can now
settle in USDC on Arc (Circle) in addition to ALGO/ASA on Algorand, with
Dynamic handling wallet onboarding for contributors who do not have one.

## New files

| Path | Purpose |
|------|---------|
| `src/lib/chains/arc.js` | Arc client, USDC payout txn, explorer URLs (mirrors `algorand.js`) |
| `src/lib/payouts.js` | Unified payout router: `settlePayout({ rail, ... })` |
| `src/lib/dynamicWallet.jsx` | Dynamic provider wrapper + `useArcWallet()` hook |

## Env vars (.env.local)

```
VITE_ARC_RPC_URL=        # from Circle's Arc testnet docs / sponsor booth
VITE_ARC_CHAIN_ID=       # same source — DO NOT guess, verify before demo
VITE_ARC_EXPLORER=       # Arc testnet explorer base URL
VITE_ARC_PAYOUT_TOKEN=   # leave empty: native USDC payouts
VITE_DYNAMIC_ENV_ID=     # from app.dynamic.xyz (add Arc as custom EVM network)
```

## Wiring (3 edits)

1. `src/main.jsx` — wrap the tree:
   `<DynamicProvider> <AlgoTrainProvider> ... </AlgoTrainProvider> </DynamicProvider>`
2. `src/pages/ContributorPage.jsx` — next to "record payout wallet", render
   `<DynamicWidget />`; when `useArcWallet().connected`, save
   `{ rail: 'arc', address }` instead of the Pera address.
3. `src/context/AlgoTrainContext.jsx` — in `triggerPayout`, branch on the
   stored rail and call `settlePayout` from `src/lib/payouts.js`. Keep the
   existing approve/pay split (per AGENTS.md). Keep `signed[0]` from Pera.

## Bounty mapping (3 sponsor SDKs max — we use 2, ENS optional 3rd)

- Circle / Arc: USDC settlement rail for AI data-labeling payouts; payout
  memo preserved on-chain in calldata for the audit trail.
- Dynamic ("upgrade an existing app's wallets"): embedded-wallet onboarding
  for non-crypto contributors; payout address sourced from Dynamic.
- Optional ENS: resolve contributor ENS names as payout identities
  (one `getEnsAddress` call in `arc.js` via a mainnet public client).

## Demo script (90 seconds)

1. Requester posts a labeling task (existing flow).
2. Contributor signs in with email via Dynamic — no wallet, no seed phrase —
   submits work.
3. Reviewer approves, hits Pay → USDC lands on Arc, explorer link on screen.
4. Flip the rail toggle → same flow settles on Algorand. One engine, two rails.

Record a backup video of step 3 — live testnets die during judging.

## Pre-demo checklist

- [ ] Confirm Arc RPC/chain id/explorer from Circle's official event page
- [ ] Fund reviewer wallet with Arc testnet USDC (faucet at sponsor booth)
- [ ] Add Arc network to Dynamic dashboard environment
- [ ] `npm run build` passes; lint clean
- [ ] Backup video recorded
