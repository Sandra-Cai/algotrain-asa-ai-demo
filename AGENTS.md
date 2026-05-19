# AlgoTrain — agent & developer notes

## Project goal

Algorand-native POC for **AI data contributor payouts**: submit → review → wallet-signed TestNet transaction with Lora proof.

## Run locally

```bash
cd algotrain-asa-ai-demo
npm install
npm run dev
```

Open http://localhost:5173 — use **Pera on TestNet**.

## Key paths

| Path | Purpose |
|------|---------|
| `src/context/AlgoTrainContext.jsx` | Wallet, approve, payout orchestration |
| `src/lib/algorand.js` | algosdk client, txn build, Lora URLs |
| `src/lib/store.js` | localStorage tasks/submissions/audit |
| `src/pages/ReviewerPage.jsx` | Approve (off-chain) + Send ALGO (on-chain) |
| `docs/COMPETITION.md` | Pitch script & slide outline |
| `docs/X402_ROADMAP.md` | Phase 2 x402 integration plan |

## Algorand dev portal AI

Use https://dev.algorand.co/ → grey **AI** button. Example:

> Show me in AlgoKit Utils TypeScript how to do an asset opt-in transaction

## Constraints

- **No smart contracts** required for competition demo
- Default payout: **0.01 ALGO** (`VITE_REWARD_AMOUNT=10000`)
- Split **approve** vs **pay** on Reviewer page (do not merge)
- x402 npm integration is **Phase 2** until portal tutorial is on latest branch

## Before changing payout logic

- Keep `signed[0]` from Pera `signTransaction` before `sendRawTransaction`
- Use `response.txId ?? response.txid` after submit
- Check ASA opt-in before ASA payouts
