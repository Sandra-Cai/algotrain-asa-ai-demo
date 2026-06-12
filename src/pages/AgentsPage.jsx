import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ALGORAND_RESOURCES,
  DEV_PORTAL_AI_PROMPTS,
} from '../lib/resources'
import { useAlgoTrain } from '../context/AlgoTrainContext'
import ExplorerLink from '../components/ExplorerLink'

export default function AgentsPage() {
  const { runAgentReviewer, agentConfigured, busyAction, submissions } =
    useAlgoTrain()
  const [results, setResults] = useState([])
  const [error, setError] = useState('')
  const pendingCount = submissions.filter((s) => s.status === 'pending').length

  async function handleAgentRun() {
    setError('')
    try {
      const run = await runAgentReviewer()
      setResults(run)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="page-shell content-section">
      <p className="eyebrow">Phase 2 · Agentic commerce</p>
      <h2>x402 & AI agents on Arc</h2>

      <div className="card-panel demo-highlight">
        <h3>Live demo · Agent reviewer with its own wallet</h3>
        <p className="muted">
          The agent holds its own Arc wallet, reviews pending submissions
          against an explainable quality policy, and pays approved work in
          USDC autonomously. Every decision lands in the audit log.
        </p>
        <div className="inline-actions">
          <button
            type="button"
            className="primary-button"
            disabled={!agentConfigured || busyAction === 'agent-run'}
            onClick={handleAgentRun}
          >
            {busyAction === 'agent-run'
              ? 'Agent reviewing…'
              : `Run agent on ${pendingCount} pending submission${pendingCount === 1 ? '' : 's'}`}
          </button>
        </div>
        {!agentConfigured && (
          <p className="muted" style={{ marginTop: '8px' }}>
            Set VITE_AGENT_PRIVATE_KEY (testnet) and fund the agent wallet
            with Arc testnet USDC to enable.
          </p>
        )}
        {error && <p className="form-error">{error}</p>}
        {results.length > 0 && (
          <ul className="card-list" style={{ marginTop: '12px' }}>
            {results.map((r) => (
              <li key={r.submissionId} className="task-meta">
                <span className="badge badge-muted">{r.decision}</span>{' '}
                score {r.score ?? 0}/100 · {r.reasons?.join('; ')}
                {r.txId && (
                  <>
                    {' · '}
                    <ExplorerLink txId={r.txId} label="tx ↗" />
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="lead">
        Today AlgoTrain settles human data work in USDC on Arc. Next,
        the same settlement layer plugs into{' '}
        <strong>x402</strong> — HTTP 402 micropayments so AI agents can pay per
        API call without accounts or subscriptions.
      </p>

      <div className="card-panel x402-flow">
        <h3>How x402 extends AlgoTrain</h3>
        <pre className="flow-diagram" aria-label="x402 flow diagram">
{`  AI Agent                    AlgoTrain API              Arc
      │                              │                        │
      │  GET /data/task-001          │                        │
      │ ───────────────────────────► │                        │
      │ ◄─────────────────────────── │  402 Payment Required  │
      │                              │                        │
      │  retry + X-PAYMENT (signed)  │                        │
      │ ───────────────────────────► │ ─── verify/settle ───► │
      │ ◄─────────────────────────── │  200 + labeled data    │
      │                              │                        │`}
        </pre>
        <p className="muted">
          Built on Coinbase&apos;s open x402 standard; USDC-native settlement via{' '}
          <code>@x402-avm/*</code> packages and Foundation tutorials.
        </p>
      </div>

      <div className="resource-grid">
        <a
          className="card-panel resource-card"
          href={ALGORAND_RESOURCES.devPortalX402}
          target="_blank"
          rel="noreferrer"
        >
          <h3>Developer portal · x402</h3>
          <p className="muted">Official Algorand tutorial (updating weekly)</p>
        </a>
        <a
          className="card-panel resource-card"
          href={ALGORAND_RESOURCES.x402Site}
          target="_blank"
          rel="noreferrer"
        >
          <h3>x402 Algorand hub</h3>
          <p className="muted">Live TestNet examples & ecosystem plugins</p>
        </a>
        <a
          className="card-panel resource-card"
          href={ALGORAND_RESOURCES.x402DemoRepo}
          target="_blank"
          rel="noreferrer"
        >
          <h3>Foundation demo repo</h3>
          <p className="muted">Reference implementation (more updates coming)</p>
        </a>
        <a
          className="card-panel resource-card"
          href={ALGORAND_RESOURCES.agenticCommerce}
          target="_blank"
          rel="noreferrer"
        >
          <h3>Agentic commerce</h3>
          <p className="muted">Why Algorand for agent payments</p>
        </a>
      </div>

      <div className="card-panel">
        <h3>Dev portal AI — try these prompts</h3>
        <p className="muted">
          Open the grey <strong>AI</strong> button on{' '}
          <a href={ALGORAND_RESOURCES.devPortal} target="_blank" rel="noreferrer">
            dev.algorand.co
          </a>
        </p>
        <ul className="prompt-list">
          {DEV_PORTAL_AI_PROMPTS.map((prompt) => (
            <li key={prompt}>
              <code>{prompt}</code>
            </li>
          ))}
        </ul>
      </div>

      <div className="card-panel roadmap-card">
        <h3>Competition POC today</h3>
        <p>
          Judges see the core value without x402 complexity:{' '}
          <strong>submit → review → on-chain payout</strong>.
        </p>
        <Link className="primary-button link-button" to="/contributor">
          Run live payout demo
        </Link>
        <p className="muted footer-note">
          Full technical roadmap: <code>docs/X402_ROADMAP.md</code> in this repo.
        </p>
      </div>
    </section>
  )
}
