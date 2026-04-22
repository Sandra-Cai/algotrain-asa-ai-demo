export default function ContributorPage({ activeAccount, network }) {
    return (
      <section className="page-shell content-section">
        <h2>Contributor workspace</h2>
        <p className="lead">
          Pick up a sample AI labeling task, submit your result, and
          receive a reward once the reviewer approves.
        </p>
        <p className="muted">
          Wallet: {activeAccount || 'Not connected'} · Network: {network}
        </p>
      </section>
    )
  }