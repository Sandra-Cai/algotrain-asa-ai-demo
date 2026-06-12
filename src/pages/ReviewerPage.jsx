import { useState } from 'react'
import { useAlgoTrain } from '../context/AlgoTrainContext'
import FlowSteps from '../components/FlowSteps'
import ExplorerLink from '../components/ExplorerLink'
import { formatAddress } from '../lib/chains/arc'

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

  async function handlePayout(id) {
    setError('')
    try {
      const txId = await triggerPayout(id)
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
        First approve the submission, then sign a separate USDC payout on Arc.
        Approval and payment stay split so the audit trail shows two distinct
        decisions.
      </p>

      <FlowSteps current="review" />

      {!activeAccount && (
        <p className="callout callout-warn">
          Sign in as the <strong>reviewer</strong> here — your wallet signs the
          payout (needs Arc testnet USDC; gas is paid in USDC too).
        </p>
      )}

      <p className="callout">
        Pitch tip: use two browsers — contributor submits first, then reviewer
        approves and pays 0.01 USDC.
      </p>

      {error && <p className="form-error">{error}</p>}
      {lastTxId && (
        <p className="callout callout-success">
          Payout confirmed:{' '}
          <ExplorerLink txId={lastTxId} label="Open on Arc explorer ↗" />
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
                    {task ? formatReward(task.rewardAmount) : '—'}
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
            After approval, sign the payout below. Settlement is native USDC on
            Arc — contributors are paid in dollars, no gas token needed.
          </p>

          {approvedUnpaid.length === 0 ? (
            <p className="muted">Approve a submission to unlock payout.</p>
          ) : (
            approvedUnpaid.map((s) => {
              const task = taskFor(s)
              const usdcLabel = task ? formatReward(task.rewardAmount) : 'USDC'
              return (
                <div key={s.id} className="payout-block">
                  <p className="task-meta">
                    Pay {formatAddress(s.contributorAddress)} · {usdcLabel}
                  </p>
                  <button
                    type="button"
                    className="primary-button"
                    disabled={!activeAccount || busy}
                    onClick={() => handlePayout(s.id)}
                  >
                    {busyAction === 'usdc-payout'
                      ? 'Confirm in wallet…'
                      : `Send ${usdcLabel}`}
                  </button>
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
              <ExplorerLink txId={s.txId} label="Open on Arc explorer ↗" />
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
