# AlgoTrain × x402 roadmap

## Today (competition POC)

AlgoTrain proves the **human workflow**:

```
Requester defines task → Contributor submits data → Reviewer approves → Pera signs ALGO/ASA payout → Lora proof
```

This maps to mentor feedback: *data submission → review → payment trigger* with real Algorand integration.

## Tomorrow (x402 agentic layer)

[x402](https://x402.goplausible.xyz/) activates **HTTP 402 Payment Required** so clients (including **AI agents**) pay for API access without accounts or OAuth.

```
┌─────────┐     GET /labeled-batch      ┌──────────────┐
│ AI Agent│ ──────────────────────────► │ Data API     │
└─────────┘                             │ (AlgoTrain)  │
     ▲                                  └──────┬───────┘
     │ 402 + payment requirements               │
     │                                         ▼
     │         X-PAYMENT header          ┌─────────────┐
     └──────── signed Algorand tx ◄──────│ Facilitator │
              200 + data payload         └─────────────┘
```

### How AlgoTrain evolves

| Today | With x402 |
|-------|-----------|
| Human contributor submits in UI | Agent submits via API |
| Human reviewer approves | Automated quality gate + policy |
| Reviewer clicks “Send ALGO” | Agent or middleware pays via `@x402-avm/fetch` |
| Lora link as proof | Same chain proof + HTTP payment receipt |

### Packages to integrate (when portal tutorial is stable)

```bash
npm install @x402-avm/core @x402-avm/avm @x402-avm/fetch
# Optional backend: @x402-avm/express or @x402-avm/hono
```

Reference: [Algorand Foundation x402 demo](https://github.com/algorandfoundation/x402-demo) (updates incoming).

### Suggested Phase 2 tasks

1. **Protected endpoint** — `GET /api/task/:id/labels` returns 402 until paid
2. **Agent client** — wrap `fetch` with x402 AVM scheme + Pera signer
3. **Facilitator** — TestNet facilitator from GoPlausible / portal tutorial
4. **Unified proof** — store txId alongside submission id (already done for manual payout)

## Why this wins strategically

- Positions AlgoTrain in **agentic commerce** (Algorand’s 2026 narrative)
- Same settlement layer (Algorand) for humans today and agents tomorrow
- Aligns with Coinbase x402 standard + Algorand AVM implementation
