# Competition pitch guide (AlgoTrain)

## One-liner

**AlgoTrain is the payout rail for AI data labor: submit work, review quality, settle rewards on Algorand with on-chain proof.**

## Why Algorand

- **Instant finality** — payout proof in seconds, not T+2 batches
- **Low fees** — real micro-rewards (0.01 ALGO demo) are economical
- **Wallet-native trust** — Pera-signed transactions, Lora explorer proof
- **Agentic future** — same flow extends to **x402** pay-per-API for autonomous AI buyers

## 8-slide deck outline (max ~8 slides)

1. **Problem** — AI teams need labeled data; contributors paid slowly/off-chain
2. **Solution** — AlgoTrain: task → submit → review → on-chain payout
3. **Live flow diagram** — 3 stages (screenshot of app journey strip)
4. **POC demo** — screenshot of Lora transaction proof
5. **Tech** — React + Pera + algosdk TestNet (no smart contract required)
6. **Traction / vision** — x402 roadmap for agent-paid data APIs
7. **Market** — AI data labeling, RLHF, evaluation micro-work
8. **Ask** — Algorand Foundation competition / partnership

## 5-minute presentation split

| Time | Content |
|------|---------|
| 0:00–3:30 | Pitch (slides above) |
| 3:30–5:00 | **Live POC** — one-wallet or two-wallet demo |
| 5:00–7:00 | Q&A |

## 90-second live POC (one wallet)

1. Connect Pera (TestNet, funded)
2. **Contributor** → Use connected wallet → Submit
3. **Reviewer** → Approve → Send 0.010 ALGO → Sign in Pera
4. **Open on Lora ↗**

Backup: screen recording with voiceover.

## 90-second live POC (two wallets — stronger story)

Same flow; contributor and reviewer are different addresses.

## Judge questions — short answers

**Why not a smart contract?**  
Mentors recommended proving wallet flow first; contracts add scope without improving the core “pay contributor with proof” story.

**How is this different from Stripe?**  
On-chain settlement + public proof per task; agents can verify payment without trusting a central payroll DB.

**x402?**  
Phase 2: HTTP 402 gates data APIs; AI agents pay per request. See `/agents` page and `docs/X402_ROADMAP.md`.

## Pre-demo checklist

- [ ] Pera on **TestNet**
- [ ] Reviewer wallet ≥ 0.05 ALGO from dispenser
- [ ] `npm run dev` from project folder (not `~`)
- [ ] Rehearse once; hit **Reset demo** between runs
