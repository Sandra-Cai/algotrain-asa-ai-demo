import { useState } from 'react'
import { useAlgoTrain } from '../context/AlgoTrainContext'
import FlowSteps from '../components/FlowSteps'
import { formatAddress } from '../lib/chains/arc'

export default function RequesterPage() {
  const {
    activeAccount,
    network,
    busy,
    createDataTask,
    tasks,
    formatReward,
    defaultRewardAmount,
  } = useAlgoTrain()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [rewardAmount, setRewardAmount] = useState(String(defaultRewardAmount))
  const [error, setError] = useState('')

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    try {
      await createDataTask({ title, description, rewardAmount })
      setTitle('')
      setDescription('')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="page-shell content-section">
      <p className="eyebrow">Stage 0 · Requester</p>
      <h2>Requester workspace</h2>
      <p className="lead">
        For the 90-second pitch, use the pre-loaded guided demo task on the
        Contributor page. Create extra tasks here only if you need them.
      </p>

      <FlowSteps current="submit" />

      {!activeAccount && (
        <p className="callout callout-warn">
          Sign in with Dynamic in the header to create tasks tied to your address.
        </p>
      )}

      <form className="task-form card-panel" onSubmit={handleCreate}>
        <div className="form-field">
          <label htmlFor="task-title">Task title</label>
          <input
            id="task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Classify product review sentiment"
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="task-desc">Instructions</label>
          <textarea
            id="task-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What should contributors label or verify?"
            rows={3}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="task-reward">
            Reward amount (USDC base units · 6 decimals)
          </label>
          <input
            id="task-reward"
            type="number"
            min={1}
            value={rewardAmount}
            onChange={(e) => setRewardAmount(e.target.value)}
          />
          <p className="field-hint">
            Default demo: {formatReward(Number(rewardAmount))}
          </p>
        </div>
        {error && <p className="form-error">{error}</p>}
        <button
          type="submit"
          className="primary-button"
          disabled={busy || !activeAccount}
        >
          Create task
        </button>
      </form>

      <div className="card-list">
        <h3>Active tasks</h3>
        {tasks.length === 0 ? (
          <p className="muted">No tasks yet.</p>
        ) : (
          tasks.map((task) => (
            <article key={task.id} className="card-panel task-card">
              <h4>{task.title}</h4>
              <p className="muted">{task.description}</p>
              <p className="task-meta">
                Reward: {formatReward(task.rewardAmount)} ·
                Requester:{' '}
                {task.requesterAddress
                  ? formatAddress(task.requesterAddress)
                  : 'Demo task'}
              </p>
            </article>
          ))
        )}
      </div>

      <p className="muted footer-note">
        Network: {network} · Wallet:{' '}
        {activeAccount ? formatAddress(activeAccount) : 'Not connected'}
      </p>
    </section>
  )
}
