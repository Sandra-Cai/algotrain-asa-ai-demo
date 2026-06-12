# AlgoTrain — agent & developer notes

## Project goal

Stablecoin-native POC for **AI data contributor payouts**: submit → review →
wallet-signed USDC transaction on **Arc testnet** with explorer proof.
(Migrated from Algorand for ETHGlobal NY 2026 Continuity Track — the old
rail lives in `legacy/algorand/` and git history.)

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173 — sign in via **Dynamic** (email or wallet).

## Key paths

| Path | Purpose |
|------|---------|
| `src/context/AlgoTrainContext.jsx` | Wallet (Dynamic), approve, payout orchestration |
| `src/lib/chains/arc.js` | viem clients, USDC payout txn, explorer URLs |
| `src/lib/payouts.js` | Rails registry — `settlePayout({ rail: 'arc', ... })` |
| `src/lib/dynamicWallet.jsx` | DynamicProvider (Arc network override) + re-exports |
| `src/lib/worldId.jsx` + `worldIdConfig.js` | World ID human-verification gate |
| `src/lib/store.js` | localStorage tasks/submissions/audit |
| `docs/ETHGLOBAL_NY_2026.md` | Bounty mapping, env vars, demo script |

## Env vars (.env.local)

- `VITE_DYNAMIC_ENV_ID` — required; app.dynamic.xyz environment
- `VITE_ARC_RPC_URL`, `VITE_ARC_CHAIN_ID`, `VITE_ARC_EXPLORER` — verify
  against Circle's official Arc testnet docs before demoing
- `VITE_REWARD_AMOUNT` — USDC base units, default 10000 = 0.01 USDC
- `VITE_WORLD_APP_ID` / `VITE_WORLD_ACTION` — optional; World ID gate hides
  itself if unset, so the core demo never depends on it

## Constraints

- **No smart contracts** required for the demo (native USDC transfers;
  payout memo preserved in calldata for the audit trail)
- Keep **approve** vs **pay** split on the Reviewer page (do not merge)
- Default payout: **0.01 USDC** (`VITE_REWARD_AMOUNT=10000`, 6 decimals)
- Amounts everywhere are USDC base units (6 decimals), not 18

## Before changing payout logic

- `settlePayout` validates the receiver per-rail — keep validation in the rail
- Wait for 1 confirmation via `waitForTransactionReceipt` before marking paid
- Dynamic wallets expose viem wallet clients via `primaryWallet.getWalletClient()`
