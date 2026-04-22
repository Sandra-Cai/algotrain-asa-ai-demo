export default function ReviewerPage({ activeAccount, network }) {
    return (
      <section className="page-shell content-section">
        <h2>Reviewer workspace</h2>
        <p className="lead">
          Inspect contributor submissions, approve payouts, and generate
          on-chain proof links for each task.
        </p>
        <p className="muted">
          Wallet: {activeAccount || 'Not connected'} · Network: {network}
        </p>
      </section>
    )
  }