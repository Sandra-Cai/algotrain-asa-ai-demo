import { useState } from 'react'
import { useAlgoTrain } from '../context/AlgoTrainContext'
import FlowSteps from '../components/FlowSteps'
import ExplorerLink from '../components/ExplorerLink'
import { formatAddress } from '../lib/algorand'

export default function ReviewerPage() {
  const {
    activeAccount,
    network,
    busy,
    busyAction,
    submissions,
    tasks,
    approveSubmission,
    triggerPayout,
    rejectSubmission,
    formatReward,
    rewardAssetId,
  } = useAlgoTrain()

  const [error, setError] = useState('')
  const [lastTxId, setLastTxId] = useState(null)

  const pending = submissions.filter((s) => s.status === 'pending')
  const approvedUnpaid = submissions.filter(
    (s) => s.status === 'approved' && !s.txId,
  )
  const paid = submissions.filter((s) => s.txId)

  function taskFor(submission) {
    return tasks.find((t) => t.id === submission.taskId)
  }

  function handleApprove(id) {
    setError('')
    try {
      approveSubmission(id)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleAlgoPayout(id) {
    setError('')
    try {
      const txId = await triggerPayout(id, { useAsa: false })
      setLastTxId(txId)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleAsaPayout(id) {
    setError('')
    try {
      const txId = await triggerPayout(id, { useAsa: true })
      setLastTxId(txId)
    } catch (err) {
      setError(err.message)
    }
  }

  function handleReject(id) {
    setError('')
    try {
      rejectSubmission(id)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="page-shell content-section reviewer-layout">
      <p className="eyebrow">Stages 2–3 · Review & payment</p>
      <h2>Reviewer workspace</h2>
      <p className="lead">
        First approve the submission, then sign a separate TestNet payout in
        Pera. This mirrors the exact flow Algorand mentors requested for the
        competition demo.
      </p>

      <FlowSteps current="review" />

      {!activeAccount && (
        <p className="callout callout-warn">
          Connect the <strong>reviewer</strong> wallet here — it signs the payout
          (needs TestNet ALGO for reward + fees).
        </p>
      )}

      <p className="callout">
        Pitch tip: use two browsers — contributor submits first, then reviewer
        approves and pays 0.01 ALGO.
      </p>

      {error && <p className="form-error">{error}</p>}
      {lastTxId && (
        <p className="callout callout-success">
          Payout confirmed: <ExplorerLink txId={lastTxId} label="Open on Lora ↗" />
        </p>
      )}

      <div className="reviewer-grid">
        <div className="card-list">
          <h3>Stage 2 · Pending review ({pending.length})</h3>
          {pending.length === 0 ? (
            <p className="muted card-panel">
              No pending work. Submit from the Contributor page first.
            </p>
          ) : (
            pending.map((s) => {
              const task = taskFor(s)
              return (
                <article key={s.id} className="card-panel task-card">
                  <h4>{task?.title || 'Unknown task'}</h4>
                  <p className="sample-box">{s.content}</p>
                  <p className="task-meta">
                    Contributor: {formatAddress(s.contributorAddress)} · Reward:{' '}
                    {task
                      ? formatReward(task.rewardAmount, task.rewardAssetId)
                      : '—'}
                  </p>
                  <div className="inline-actions">
                    <button
                      type="button"
                      className="primary-button"
                      disabled={busy}
                      onClick={() => handleApprove(s.id)}
                    >
                      Approve submission
                    </button>
                    <button
                      type="button"
                      className="ghost-button"
                      disabled={busy}
                      onClick={() => handleReject(s.id)}
                    >
                      Reject
                    </button>
                  </div>
                </article>
              )
            })
          )}
        </div>

        <aside className="card-panel payout-card">
          <h3>Stage 3 · Payment trigger</h3>
          <p className="muted">
            After approval, sign the payout below. ALGO is the most reliable path
            for a live demo.
          </p>

          {approvedUnpaid.length === 0 ? (
            <p className="muted">Approve a submission to unlock payout.</p>
          ) : (
            approvedUnpaid.map((s) => {
              const task = taskFor(s)
              const algoLabel = task
                ? formatReward(task.rewardAmount, null)
                : 'ALGO'
              return (
                <div key={s.id} className="payout-block">
                  <p className="task-meta">
                    Pay {formatAddress(s.contributorAddress)} · {algoLabel}
                  </p>
                  <button
                    type="button"
                    className="primary-button"
                    disabled={!activeAccount || busy}
                    onClick={() => handleAlgoPayout(s.id)}
                  >
                    {busyAction === 'algo-payout'
                      ? 'Signing payout in Pera…'
                      : `Send ${algoLabel}`}
                  </button>
                  {rewardAssetId && (
                    <button
                      type="button"
                      className="ghost-button"
                      disabled={!activeAccount || busy}
                      onClick={() => handleAsaPayout(s.id)}
                    >
                      {busyAction === 'asa-payout'
                        ? 'Signing ASA payout…'
                        : 'Send reward ASA'}
                    </button>
                  )}
                </div>
              )
            })
          )}
        </aside>
      </div>

      {paid.length > 0 && (
        <div className="card-list">
          <h3>Completed payouts</h3>
          {paid.map((s) => (
            <article key={s.id} className="card-panel task-card">
              <p className="badge">Paid</p>
              <p className="muted">{s.content}</p>
              <ExplorerLink txId={s.txId} label="Open on Lora ↗" />
            </article>
          ))}
        </div>
      )}

      <p className="muted footer-note">
        Network: {network} · Reviewer:{' '}
        {activeAccount ? formatAddress(activeAccount) : 'Not connected'}
      </p>
    </section>
  )
}
