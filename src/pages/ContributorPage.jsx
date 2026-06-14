import { useState } from 'react'
import { useAlgoTrain } from '../context/AlgoTrainContext'
import FlowSteps from '../components/FlowSteps'
import ExplorerLink from '../components/ExplorerLink'
import { formatAddress } from '../lib/chains/arc'
import { DynamicWidget } from '../lib/privyWallet'
import { VerifyHumanGate } from '../lib/worldId'
import { worldConfigured } from '../lib/worldIdConfig'
import { DEMO_TASK_ID, defaultSubmissionText } from '../lib/demoData'

export default function ContributorPage() {
  const {
    activeAccount,
    network,
    busy,
    tasks,
    submissions,
    payoutAddress,
    submitData,
    recordPayoutWallet,
    recordHumanVerification,
    verifiedHumans,
    formatReward,
  } = useAlgoTrain()

  const isVerifiedHuman = Boolean(
    verifiedHumans?.[payoutAddress] || verifiedHumans?.[activeAccount],
  )

  const demoTask = tasks.find((t) => t.id === DEMO_TASK_ID) || tasks[0]
  const [taskId, setTaskId] = useState(
    () => tasks.find((t) => t.id === DEMO_TASK_ID)?.id || tasks[0]?.id || '',
  )
  const [content, setContent] = useState(defaultSubmissionText)
  const [error, setError] = useState('')

  const mySubmissions = submissions.filter(
    (s) =>
      s.contributorAddress === payoutAddress ||
      s.contributorAddress === activeAccount,
  )

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await submitData({ taskId, content })
    } catch (err) {
      setError(err.message)
    }
  }

  const payoutReady = Boolean(payoutAddress || activeAccount)

  return (
    <section className="page-shell content-section">
      <p className="eyebrow">Stage 1 · Data submission</p>
      <h2>Contributor workspace</h2>
      <p className="lead">
        Sign in with email or a wallet — Dynamic creates an embedded wallet if
        you don&apos;t have one. Submit labeled data, get paid in USDC on Arc.
      </p>

      <FlowSteps current="submit" />

      <div className="card-panel">
        <h3>Your wallet</h3>
        <p className="muted">
          No seed phrases, no extensions required. Email sign-in gives you a
          real onchain wallet that receives your USDC rewards.
        </p>
        <DynamicWidget />
        {worldConfigured && (
          <div style={{ marginTop: '12px' }}>
            {isVerifiedHuman ? (
              <p className="badge">Verified human · World ID</p>
            ) : (
              <VerifyHumanGate
                onVerified={(result) => {
                  try {
                    recordHumanVerification(result)
                  } catch (err) {
                    setError(err.message)
                  }
                }}
              >
                {(open) => (
                  <button
                    type="button"
                    className="ghost-button"
                    disabled={!activeAccount}
                    onClick={open}
                  >
                    Verify I&apos;m human (World ID)
                  </button>
                )}
              </VerifyHumanGate>
            )}
            <p className="muted" style={{ fontSize: '0.85rem', marginTop: '6px' }}>
              One verification per human — keeps sybil accounts out of the
              labeling pool and the dataset clean.
            </p>
          </div>
        )}
      </div>

      {demoTask && (
        <article className="card-panel task-card demo-highlight">
          <span className="badge">Guided demo task</span>
          <h3>{demoTask.title}</h3>
          <p className="muted">{demoTask.description}</p>
          {demoTask.sample && <p className="sample-box">{demoTask.sample}</p>}
          <p className="task-meta">Reward: {formatReward(demoTask.rewardAmount)}</p>
        </article>
      )}

      <form className="task-form card-panel" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="payout-wallet">Contributor payout wallet</label>
          <input
            id="payout-wallet"
            readOnly
            value={
              payoutAddress
                ? `${payoutAddress} (${formatAddress(payoutAddress)})`
                : 'Click “Use my wallet” below'
            }
          />
          <div className="inline-actions">
            <button
              type="button"
              className="ghost-button"
              disabled={!activeAccount || busy}
              onClick={() => {
                try {
                  recordPayoutWallet()
                } catch (err) {
                  setError(err.message)
                }
              }}
            >
              Use my wallet
            </button>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="pick-task">Task</label>
          <select
            id="pick-task"
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            required
          >
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} — {formatReward(t.rewardAmount)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="submission">Your labeled data</label>
          <textarea
            id="submission"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            required
          />
        </div>

        {error && <p className="form-error">{error}</p>}

        <button
          type="submit"
          className="primary-button"
          disabled={busy || !payoutReady || !taskId}
        >
          Submit work for review
        </button>
      </form>

      {mySubmissions.length > 0 && (
        <div className="card-list">
          <h3>Your submissions</h3>
          {mySubmissions.map((s) => (
            <article key={s.id} className="card-panel task-card">
              <p className="badge badge-muted">
                {s.status}
                {s.txId ? ' · paid' : ''}
              </p>
              <p>{s.content}</p>
              {s.txId && (
                <p className="proof-line">
                  Payout: <ExplorerLink txId={s.txId} label="Open on Arc explorer ↗" />
                </p>
              )}
            </article>
          ))}
        </div>
      )}

      <p className="muted footer-note">
        Network: {network} · Wallet:{' '}
        {activeAccount ? formatAddress(activeAccount) : 'Not connected'}
      </p>
    </section>
  )
}
