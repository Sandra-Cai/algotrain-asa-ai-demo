# Algorand resources for AlgoTrain

Curated links from Algorand Foundation mentors (May 2026). Portal content is updating — check `dev.algorand.co` for the latest x402 tutorial branch.

## Core development

| Resource | URL |
|----------|-----|
| Developer portal | https://dev.algorand.co/ |
| TestNet dispenser | https://bank.testnet.algorand.network/ |
| Lora explorer (TestNet) | https://lora.algokit.io/testnet |
| AlgoKit Utils (TypeScript) | https://dev.algorand.co/algokit/ |

## Developer portal AI assistant

On [dev.algorand.co](https://dev.algorand.co/), click the **grey AI button** to open chat. Example prompts:

- `Show me in AlgoKit Utils TypeScript how to do an asset opt-in transaction`
- `How do I build a TestNet ALGO payment with algosdk and Pera Wallet?`
- `Explain x402 on Algorand for pay-per-API agent payments`

Copy snippets into this repo’s `src/lib/algorand.js` or new modules as needed.

## x402 (HTTP 402 micropayments)

| Resource | URL |
|----------|-----|
| Overview site | https://x402.goplausible.xyz/ |
| Portal guide | https://dev.algorand.co/resources/x402-on-algorand/ |
| Foundation demo repo | https://github.com/algorandfoundation/x402-demo |
| Algorand exact scheme spec | https://github.com/coinbase/x402/blob/main/specs/schemes/exact/scheme_exact_algo.md |
| GoPlausible docs index | https://github.com/GoPlausible/.github/blob/main/profile/algorand-x402-documentation/README.md |

**npm (TypeScript):** `@x402-avm/core`, `@x402-avm/avm`, `@x402-avm/fetch`, `@x402-avm/express`

**Note:** Tutorial may track Coinbase’s `algorand` branch until published on main — ask mentors if packages fail to resolve.

## Agentic commerce narrative

- https://algorand.co/agentic-commerce/x402
- https://algorand.co/blog/x402-unlocking-the-agentic-commerce-era

## Experimental (ask mentors)

- Algorand MCP server: `@goplausible/algorand-mcp`
- Claude / OpenClaw Algorand plugins (see x402.goplausible.xyz ecosystem page)

## Recommended setup

Work on a **laptop with an IDE** (Cursor / VS Code):

```bash
cd algotrain-asa-ai-demo
npm install
npm run dev
```

Use **Pera Wallet** on **TestNet** for all live demos.
