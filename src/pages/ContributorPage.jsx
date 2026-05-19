import { useState } from 'react'
import { useAlgoTrain } from '../context/AlgoTrainContext'
import FlowSteps from '../components/FlowSteps'
import ExplorerLink from '../components/ExplorerLink'
import { formatAddress } from '../lib/algorand'
import { DEMO_TASK_ID, defaultSubmissionText } from '../lib/demoData'

export default function ContributorPage() {
  const {
    activeAccount,
    network,
    busy,
    busyAction,
    tasks,
    submissions,
    payoutAddress,
    submitData,
    recordPayoutWallet,
    optInToRewardAsset,
    rewardAssetId,
    formatReward,
  } = useAlgoTrain()

  const demoTask = tasks.find((t) => t.id === DEMO_TASK_ID) || tasks[0]
  const [taskId, setTaskId] = useState(
    () => tasks.find((t) => t.id === DEMO_TASK_ID)?.id || tasks[0]?.id || '',
  )
  const [content, setContent] = useState(defaultSubmissionText)
  const [error, setError] = useState('')
  const [optInTx, setOptInTx] = useState(null)

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

  async function handleOptIn() {
    setError('')
    try {
      const txId = await optInToRewardAsset()
      if (txId) setOptInTx(txId)
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
        Record your payout wallet, submit labeled data for the guided demo task,
        then wait for reviewer approval and on-chain payment.
      </p>

      <FlowSteps current="submit" />

      {!activeAccount && (
        <p className="callout callout-warn">
          Connect Pera Wallet on TestNet to participate.
        </p>
      )}

      {demoTask && (
        <article className="card-panel task-card demo-highlight">
          <span className="badge">Guided demo task</span>
          <h3>{demoTask.title}</h3>
          <p className="muted">{demoTask.description}</p>
          {demoTask.sample && (
            <p className="sample-box">{demoTask.sample}</p>
          )}
          <p className="task-meta">
            Reward: {formatReward(demoTask.rewardAmount, demoTask.rewardAssetId)}
          </p>
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
                : 'Click “Use connected wallet” below'
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
              Use connected wallet
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
                {t.title} — {formatReward(t.rewardAmount, t.rewardAssetId)}
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

      {rewardAssetId && (
        <aside className="card-panel">
          <h3>Optional ASA opt-in</h3>
          <p className="muted">
            For the live pitch, use ALGO payout on the Reviewer page. Opt in here
            only if you configured a TestNet ASA.
          </p>
          <button
            type="button"
            className="ghost-button"
            onClick={handleOptIn}
            disabled={!activeAccount || busyAction === 'opt-in'}
          >
            {busyAction === 'opt-in' ? 'Signing opt-in…' : 'Opt in to ASA'}
          </button>
          {optInTx && <ExplorerLink txId={optInTx} />}
        </aside>
      )}

      {mySubmissions.length > 0 && (
        <div className="card-list">
          <h3>Your submissions</h3>
          {mySubmissions.map((s) => (
            <article key={s.id} className="card-panel task-card">
              <p className="badge badge-muted">{s.status}{s.txId ? ' · paid' : ''}</p>
              <p>{s.content}</p>
              {s.txId && (
                <p className="proof-line">
                  Payout: <ExplorerLink txId={s.txId} label="Open on Lora ↗" />
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
