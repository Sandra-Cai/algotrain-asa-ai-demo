# AlgoTrain — Algorand‑native AI data payout rails

AlgoTrain is a proof‑of‑concept web app that shows how AI teams can pay data contributors instantly in stable‑style Algorand Standard Assets (ASAs), with on‑chain proof of every reward.

This project is built for the **Algorand Foundation 2026 competition**.

---

## Problem

AI models depend on huge amounts of labeled and verified data, but today:

- Contributors are usually paid off‑chain, batched, and delayed.
- There is little transparency around who got paid for which data.
- It is hard to prove that a specific dataset was funded and rewarded fairly.

---

## Solution

AlgoTrain turns Algorand into the **settlement and proof layer** for AI data work:

- Requesters define AI data tasks and fund them in a **stable‑style ASA treasury**.
- Contributors complete tasks and submit results through a simple UI.
- Reviewers approve or reject work, then trigger **on‑chain ASA payouts on Algorand TestNet**.
- Each payout produces a transaction URL that acts as **verifiable proof of reward**.

The app focuses on the core user journeys the Algorand tokenization POC guide recommends: wallet connection, ASA opt‑in, task lifecycle, and settlement on Algorand. [file:2]

---

## What this POC shows

- A premium, single‑page interface that walks through the flow:

  1. Connect Pera Wallet on Algorand TestNet.
  2. Opt in to the reward ASA.
  3. Complete an AI labeling or data‑verification task.
  4. Reviewer approves and triggers a payout.
  5. Open the Algorand explorer link as proof.

- Clear separation of **Requesters**, **Contributors** and **Reviewers** in the UI.
- A live “POC status” ribbon that can be wired to real transaction state.

---

## Tech stack

- **Frontend:** Vite + React
- **Styling:** Custom CSS (no UI framework)
- **Wallet Integration:** Pera Wallet (via `@perawallet/connect`) — placeholder wired, ready for TestNet connect
- **Blockchain:** Algorand TestNet, ASA‑based reward asset (`stable‑style`)

---

## Running locally

```bash
git clone https://github.com/Sandra-Cai/algotrain-asa-ai-demo.git
cd algotrain-asa-ai-demo

npm install
npm run dev
```

Then open the URL Vite prints (e.g. `http://localhost:5173` or `5175`) in your browser.

---

## How it uses Algorand

In a production version, AlgoTrain would:

- Use **Pera Wallet** for account connection and signing. [file:2]
- Create or reference a **stable‑style Algorand Standard Asset (ASA)** that acts as the reward token.
- Store **task metadata off‑chain**, but record:
  - Treasury funding (ASA into the task pool).
  - Individual contributor payouts.
  - Optional reputation / credential events per contributor address.
- Expose Algorand **explorer URLs** for every payout as trustable proof for contributors and AI customers.

This aligns with the Algorand tokenization POC reference flow: token creation, opt‑in, transfer, and proof of ownership/history. [file:2]

---

## Roadmap

- Wire full Pera Wallet TestNet connection and ASA opt‑in.
- Implement a minimal backend or indexer integration for task and payout history.
- Add contributor reputation scoring based on on‑chain completions.
- Extend to support multiple AI data task types (classification, RLHF, evaluation).

---

## Author

**Sandra Cai**

Built as a submission for the **Algorand Foundation** competition.