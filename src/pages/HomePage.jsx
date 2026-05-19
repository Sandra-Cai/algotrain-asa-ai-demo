import { Link } from 'react-router-dom'
import { useAlgoTrain } from '../context/AlgoTrainContext'
import ExplorerLink from '../components/ExplorerLink'
import { formatAddress } from '../lib/algorand'
import { DEMO_TASK_ID, journeySteps } from '../lib/demoData'
import { ALGORAND_RESOURCES } from '../lib/resources'

export default function HomePage() {
  const {
    activeAccount,
    network,
    status,
    tasks,
    submissions,
    rewardAssetId,
    defaultRewardAmount,
    formatReward,
    auditLog,
    resetDemo,
  } = useAlgoTrain()

  const demoTask = tasks.find((t) => t.id === DEMO_TASK_ID) || tasks[0]
  const paid = submissions.filter((s) => s.txId)
  const pending = submissions.filter((s) => s.status === 'pending')
  const approved = submissions.filter((s) => s.status === 'approved' && !s.txId)
  const latestTx = paid[0]?.txId

  const stageIndex = latestTx
    ? 2
    : approved.length
      ? 1
      : pending.length
        ? 0
        : 0

  return (
    <section className="page-shell hero-section">
      <div className="hero-copy">
        <p className="eyebrow">Algorand-native AI data infrastructure</p>
        <h2>
          Pay data contributors instantly with
          <span className="block">wallet-signed TestNet proof.</span>
        </h2>
        <p className="lead">
          Run the 90-second competition demo: submit data, approve quality, then
          sign a live Algorand transaction judges can verify on Lora.
        </p>

        <div className="hero-actions">
          <Link className="primary-button link-button" to="/contributor">
            1 · Submit data
          </Link>
          <Link className="ghost-button link-button" to="/reviewer">
            2–3 · Review & pay
          </Link>
          <button type="button" className="ghost-button" onClick={resetDemo}>
            Reset demo
          </button>
        </div>

        <div className="signal-grid">
          <div>
            <p className="section-label">Network</p>
            <p>Algorand {network}</p>
          </div>
          <div>
            <p className="section-label">Wallet</p>
            <p>
              {activeAccount
                ? `Pera · ${formatAddress(activeAccount)}`
                : 'Not connected'}
            </p>
          </div>
          <div>
            <p className="section-label">Demo reward</p>
            <p>
              {demoTask
                ? formatReward(demoTask.rewardAmount, demoTask.rewardAssetId)
                : formatReward(defaultRewardAmount, rewardAssetId)}
            </p>
          </div>
        </div>
      </div>

      <aside className="hero-panel">
        <div className="panel-header">
          <span className="badge">Live POC status</span>
          <p className="muted">{status}</p>
        </div>

        <div className="stat-row">
          <div className="stat-card">
            <p className="section-label">Pending review</p>
            <p className="stat-value">{pending.length}</p>
          </div>
          <div className="stat-card">
            <p className="section-label">Approved (unpaid)</p>
            <p className="stat-value">{approved.length}</p>
          </div>
          <div className="stat-card">
            <p className="section-label">On-chain payouts</p>
            <p className="stat-value">{paid.length}</p>
          </div>
        </div>

        {latestTx && (
          <p className="proof-line">
            Latest proof:{' '}
            <ExplorerLink txId={latestTx} label="Open on Lora ↗" />
          </p>
        )}
      </aside>

      <div className="journey-strip full-width">
        {journeySteps.map((step, index) => (
          <article
            key={step.key}
            className={
              index <= stageIndex
                ? 'journey-card journey-card--active'
                : 'journey-card'
            }
          >
            <h3>{step.label}</h3>
            <p>{step.detail}</p>
          </article>
        ))}
      </div>

      <div className="vision-panel full-width card-panel">
        <p className="eyebrow">Why Algorand · Why now</p>
        <h3>Human payouts today. AI agent payments via x402 tomorrow.</h3>
        <p className="muted">
          Algorand&apos;s instant finality and low fees make micro-rewards for
          labeling and verification economical. The same rails extend to
          autonomous agents paying per API call with HTTP 402.
        </p>
        <div className="hero-actions">
          <Link className="ghost-button link-button" to="/agents">
            x402 & agent roadmap
          </Link>
          <a
            className="ghost-button link-button"
            href={ALGORAND_RESOURCES.devPortal}
            target="_blank"
            rel="noreferrer"
          >
            Developer portal ↗
          </a>
        </div>
      </div>

      <div className="audit-panel full-width card-panel">
        <h3>Audit trail</h3>
        {auditLog.length === 0 ? (
          <p className="muted">No events yet.</p>
        ) : (
          <ul className="audit-list">
            {auditLog.map((item) => (
              <li key={`${item.type}-${item.at}`}>
                <strong>{item.type}</strong>
                <span>{item.detail}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
