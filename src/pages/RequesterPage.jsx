export default function RequesterPage({ activeAccount, network }) {
    return (
      <section className="page-shell content-section">
        <h2>Requester workspace</h2>
        <p className="lead">
          Configure AI data tasks, set budgets in your stable-style ASA
          treasury, and spin up contributor jobs on Algorand TestNet.
        </p>
        <p className="muted">
          Wallet: {activeAccount || 'Not connected'} · Network: {network}
        </p>
      </section>
    )
  }