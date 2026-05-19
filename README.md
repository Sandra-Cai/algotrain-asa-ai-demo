# AlgoTrain — Algorand-native AI data payout rails

**Submit data → review → wallet-signed TestNet payout** with Lora proof. Built for the **Algorand Foundation 2026 competition**, with a clear path to **x402 agentic payments**.

---

## Quick start (laptop + IDE)

```bash
git clone https://github.com/Sandra-Cai/algotrain-asa-ai-demo.git
cd algotrain-asa-ai-demo
npm install
npm run dev
```

Open **http://localhost:5173** · connect **Pera on TestNet**.

> Run commands from the project folder, not your home directory (`~`).

---

## 90-second demo (one wallet)

1. Fund Pera on TestNet: https://bank.testnet.algorand.network/
2. **Contributor** → **Use connected wallet** → **Submit work for review**
3. **Reviewer** → **Approve submission** → **Send 0.010 ALGO** → sign in Pera
4. **Open on Lora ↗**

Full pitch guide: [`docs/COMPETITION.md`](docs/COMPETITION.md)

---

## Documentation

| Doc | Purpose |
|-----|---------|
| [`docs/COMPETITION.md`](docs/COMPETITION.md) | 8-slide outline, 5-min pitch, judge Q&A |
| [`docs/ALGORAND_RESOURCES.md`](docs/ALGORAND_RESOURCES.md) | Mentor links, dev portal AI, x402 |
| [`docs/X402_ROADMAP.md`](docs/X402_ROADMAP.md) | Phase 2 HTTP 402 / agent payments |
| [`AGENTS.md`](AGENTS.md) | Cursor / AI coding context |

In-app: **x402 / Agents** page + Overview vision panel.

---

## Algorand mentor resources

- **Developer portal:** https://dev.algorand.co/ (grey **AI** button for AlgoKit snippets)
- **x402 on Algorand:** https://dev.algorand.co/resources/x402-on-algorand/
- **x402 hub:** https://x402.goplausible.xyz/
- **Demo repo:** https://github.com/algorandfoundation/x402-demo

Portal x402 tutorial may track Coinbase’s `algorand` branch until published — ask mentors for latest.

---

## Tech stack

- React + Vite · Pera Wallet · algosdk · Algonode TestNet
- No smart contracts required for competition POC
- Optional ASA rewards via `VITE_REWARD_ASA_ID`

---

## Environment

```bash
cp .env.example .env
# VITE_REWARD_AMOUNT=10000  → 0.01 ALGO (default)
```

---

## Author

**Sandra Cai** — Algorand Foundation competition.
