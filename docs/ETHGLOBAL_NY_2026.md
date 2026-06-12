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
VITE_WORLD_APP_ID=       # from developer.worldcoin.org (app_...)
VITE_WORLD_ACTION=label-data  # incognito action name in the World dev portal
VITE_AGENT_PRIVATE_KEY=  # TESTNET-ONLY key for the agent's Arc fallback rail
VITE_HEDERA_ACCOUNT_ID=  # 0.0.x testnet operator (portal.hedera.com)
VITE_HEDERA_PRIVATE_KEY= # TESTNET-ONLY ECDSA key for the agent's Hedera rail
VITE_HEDERA_TOPIC_ID=    # optional HCS topic for the agent decision log
VITE_AGENT_RAIL=         # optional override: hedera | arc
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

## SDK cap decision (3 sponsor SDKs max)

Active stack: Circle/Arc + Dynamic + Hedera. World ID code remains in the
repo but stays DISABLED (leave VITE_WORLD_APP_ID unset) to respect the cap.
To run World instead of Hedera, set VITE_WORLD_APP_ID and leave the Hedera
vars unset. Never enable all four for the judged submission.

## Bounty mapping

- Circle / Arc: USDC settlement rail for AI data-labeling payouts; payout
  memo preserved on-chain in calldata for the audit trail.
- Dynamic ("upgrade an existing app's wallets"): embedded-wallet onboarding
  for non-crypto contributors; payout address sourced from Dynamic.
- Hedera AI & Agentic Payments ($6k, $3k x 2): the autonomous agent moves
  HBAR via native CryptoTransfer with first-class transaction memos
  (`src/lib/chains/hedera.js`); decisions logged to HCS; Schedule Service
  helper included for the automation track. No Solidity anywhere.
- Dynamic agent track ($2k, "give your AI agent a wallet"): autonomous
  reviewer agent with its own Arc wallet — policy-evaluates submissions and
  pays USDC with no human in the loop (`src/lib/agentPayer.js`, Agents page).
- World (third SDK): World ID proof-of-personhood gate on the Contributor
  page — sybil-resistant labeling pool, "verified human" badge flows through
  to the Reviewer's approval view (`src/lib/worldId.jsx`).

## Hedera workshop tooling (run on your laptop, from the slides)

```bash
# Hedera Docs MCP for Claude Code (terminal, not inside Claude Code):
claude mcp add --transport http hedera-docs https://docs.hedera.com/mcp
claude mcp list   # verify

# Hedera Skills plugin (inside Claude Code):
/plugin marketplace add hedera-dev/hedera-skills
/plugin
/reload-plugins
```
Repo: github.com/hedera-dev/hedera-skills · docs.hedera.com (MCP rate limit
200 req/hr/IP).

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
