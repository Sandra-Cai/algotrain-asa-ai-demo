import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'

import HomePage from './pages/HomePage'
import RequesterPage from './pages/RequesterPage'
import ContributorPage from './pages/ContributorPage'
import ReviewerPage from './pages/ReviewerPage'
import './styles/app.css'

const navItems = [
  { to: '/', label: 'Overview' },
  { to: '/requester', label: 'Requester' },
  { to: '/contributor', label: 'Contributor' },
  { to: '/reviewer', label: 'Reviewer' },
]

export default function App() {
  const location = useLocation()
  const [accounts, setAccounts] = useState([])
  const [network] = useState(import.meta.env.VITE_ALGOD_NETWORK || 'testnet')
  const [theme, setTheme] = useState('dark')
  const [status, setStatus] = useState('Disconnected')

  // placeholder until we wire real Pera
  const activeAccount = useMemo(() => accounts?.[0] || '', [accounts])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  function handleConnect() {
    // fake address just so the UI reacts;
    // we can replace with real Pera later.
    const fake = 'TESTACCOUNT1234567890TESTACCOUNT'
    setAccounts([fake])
    setStatus('Wallet connected (placeholder)')
  }

  function handleDisconnect() {
    setAccounts([])
    setStatus('Disconnected')
  }

  return (
    <div className="app-shell premium-shell">
      <a className="skip-link" href="#content">
        Skip to content
      </a>

      <div className="ambient-orb ambient-orb-left" aria-hidden="true" />
      <div className="ambient-orb ambient-orb-right" aria-hidden="true" />
      <div className="ambient-grid" aria-hidden="true" />

      <header className="site-header premium-header">
        <div className="brand-lockup brand-lockup-premium">
          <div className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 64 64" role="img" aria-label="AlgoTrain logo">
              <path
                d="M12 49 28 15h8l16 34h-9l-3-7H24l-3 7h-9Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinejoin="round"
              />
              <path
                d="M29 34h9"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="brand-copy">
            <h1>AlgoTrain</h1>
            <p className="brand-subtitle">
              Algorand-native AI data payout rails
            </p>
          </div>
        </div>

        <nav
          className="top-nav top-nav-premium"
          aria-label="Primary navigation"
        >
          {navItems.map((item) => {
            const isActive =
              item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to)

            return (
              <Link
                key={item.to}
                to={item.to}
                className={isActive ? 'nav-link is-active' : 'nav-link'}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="header-actions header-actions-premium">
          <div
            className="network-chip"
            title={`Connected environment: ${network}`}
          >
            <span className="network-dot" aria-hidden="true" />
            <span>Algorand {network}</span>
          </div>

          <button
            className="theme-toggle"
            onClick={() =>
              setTheme(theme === 'dark' ? 'light' : 'dark')
            }
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>

          {activeAccount ? (
            <>
              <div
                className="wallet-pill wallet-pill-live"
                title={activeAccount}
              >
                <span className="wallet-pill-label">Pera</span>
                <span>
                  {activeAccount.slice(0, 6)}...
                  {activeAccount.slice(-4)}
                </span>
              </div>
              <button
                className="ghost-button"
                onClick={handleDisconnect}
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              className="primary-button"
              onClick={handleConnect}
            >
              Connect Pera
            </button>
          )}
        </div>
      </header>

      <section
        className="status-ribbon"
        aria-label="Application status"
      >
        <div className="status-ribbon-inner">
          <span className="status-kicker">Live POC status</span>
          <span className="status-message">{status}</span>
          <span className="status-separator" aria-hidden="true">
            •
          </span>
          <span className="status-meta">
            Stable-style ASA rewards · Wallet-signed payout proof ·
            TestNet flow
          </span>
        </div>
      </section>

      <main id="content" className="main-shell">
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                activeAccount={activeAccount}
                network={network}
                status={status}
              />
            }
          />
          <Route
            path="/requester"
            element={
              <RequesterPage
                activeAccount={activeAccount}
                network={network}
              />
            }
          />
          <Route
            path="/contributor"
            element={
              <ContributorPage
                activeAccount={activeAccount}
                network={network}
              />
            }
          />
          <Route
            path="/reviewer"
            element={
              <ReviewerPage
                activeAccount={activeAccount}
                network={network}
              />
            }
          />
        </Routes>
      </main>

      <footer className="site-footer premium-footer">
        <div>
          <p>Built for the Algorand Foundation competition</p>
          <p className="footer-muted">Founder: Sandra Cai</p>
        </div>

        <div className="footer-proof">
          <span>Wallet flow: Pera (placeholder)</span>
          <span>Settlement: Algorand TestNet</span>
          <span>Reward model: ASA-based payouts</span>
        </div>
      </footer>
    </div>
  )
}