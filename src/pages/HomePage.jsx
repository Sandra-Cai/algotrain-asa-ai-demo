export default function HomePage({ activeAccount, network, status }) {
    return (
      <section className="page-shell hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Algorand-native AI data infrastructure</p>
          <h2>
            Pay data contributors instantly with
            <span className="block">stable-style ASA rewards.</span>
          </h2>
          <p className="lead">
            AlgoTrain helps AI teams launch verified data tasks, settle
            contributor rewards on Algorand TestNet, and prove every
            payout with a wallet-signed transaction.
          </p>
  
          <div className="hero-actions">
            <button className="primary-button">
              Run contributor flow
            </button>
            <button className="ghost-button">
              Run reviewer payout
            </button>
          </div>
  
          <div className="signal-grid">
            <div>
              <p className="section-label">Network</p>
              <p>Algorand {network}</p>
            </div>
            <div>
              <p className="section-label">Wallet</p>
              <p>{activeAccount ? 'Pera connected' : 'Not connected'}</p>
            </div>
            <div>
              <p className="section-label">Status</p>
              <p>{status}</p>
            </div>
          </div>
        </div>
  
        <aside className="hero-panel">
          <div className="panel-header">
            <span className="badge">Live POC narrative</span>
            <p className="muted">Sandra Cai</p>
          </div>
          <ol className="journey-list">
            <li>Connect Pera Wallet on Algorand TestNet.</li>
            <li>Opt in to the reward ASA.</li>
            <li>Complete a verified AI labeling task.</li>
            <li>Approve payout and settle on-chain.</li>
            <li>Open the explorer link as proof.</li>
          </ol>
        </aside>
      </section>
    )
  }