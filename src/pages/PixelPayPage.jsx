import { useState } from 'react'
import { useAccount } from '../lib/privyWallet'
import { COPY, usd } from '../lib/copy'
import { CONVERT_TARGETS, quoteConvert, buildConvertTx, executeConvert } from '../lib/convert'
import { quoteCashOut, buildCashOut, executeCashOut } from '../lib/cashOut'
import { useAlgoTrain } from '../context/AlgoTrainContext'

// Consumer surface: camera roll -> cash -> convert / cash out.
// Every approval is an explicit user tap that triggers the wallet's own
// confirmation prompt. Nothing auto-executes a swap or withdrawal.

export default function PixelPayPage() {
  const { ready, signedIn, email, address, login, logout, getProvider } = useAccount()
  const { tasks, submissions, submitData } = useAlgoTrain()
  const [photos, setPhotos] = useState([])
  const [stage, setStage] = useState('home') // home | convert | cashout
  const [quote, setQuote] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  // Demo balance = sum of paid submissions for this account.
  const myPaid = submissions.filter(
    (s) => s.txId && s.contributorAddress === address,
  )
  const balanceUnits = myPaid.reduce((sum, s) => {
    const t = tasks.find((tk) => tk.id === s.taskId)
    return sum + (t?.rewardAmount || 0)
  }, 0)

  function handlePick(e) {
    const files = Array.from(e.target.files || [])
    setPhotos(files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })))
  }

  async function handleEarn() {
    setMsg('')
    if (!address) {
      setMsg('Sign in first to get paid.')
      return
    }
    setBusy(true)
    try {
      const task = tasks[0]
      for (const p of photos) {
        await submitData({ taskId: task.id, content: `photo:${p.name}` })
      }
      setMsg(`${photos.length} photo(s) sent. ${COPY.pending} — you'll be paid when approved.`)
      setPhotos([])
    } catch (err) {
      setMsg(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function getWalletClient() {
    const provider = await getProvider()
    const { createWalletClient, custom } = await import('viem')
    // Let the wallet's own connected network define the chain. The user is on
    // the configured testnet (CHAIN_ID); we don't pin a hardcoded chain object
    // so this works for Sepolia or whatever chain the API key is enabled for.
    return createWalletClient({ account: address, transport: custom(provider) })
  }

  async function handleQuoteConvert(target) {
    setBusy(true); setMsg('')
    try {
      const q = await quoteConvert({
        fromAmount: balanceUnits,
        toAddress: target.address,
        account: address,
      })
      setQuote({ kind: 'convert', toSymbol: target.symbol, ...q })
    } catch (err) {
      setMsg(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleConfirmConvert() {
    setBusy(true); setMsg('')
    try {
      // Step 2: build the unsigned tx from the quote.
      const { transaction } = await buildConvertTx({ quote: quote.quote })
      // Step 3: the user's wallet shows its own confirm prompt; they tap to
      // approve. Nothing is sent without that explicit tap.
      const walletClient = await getWalletClient()
      const hash = await executeConvert({ walletClient, transaction })
      setMsg(`${COPY.moveDone}${hash ? ` · ${hash}` : ''}`)
      setQuote(null); setStage('home')
    } catch (err) {
      setMsg(err.message || 'Conversion not confirmed')
    } finally {
      setBusy(false)
    }
  }

  if (!ready) return <section className="page-shell content-section"><p>Loading…</p></section>

  return (
    <section className="page-shell content-section pixelpay">
      <header className="pp-hero">
        <h1>{COPY.appName}</h1>
        <p className="lead">{COPY.tagline}</p>
      </header>

      {!signedIn ? (
        <div className="card-panel pp-signin">
          <h3>{COPY.signIn}</h3>
          <p className="muted">{COPY.signInSub}</p>
          <button type="button" className="primary-button" onClick={login}>
            {COPY.signIn}
          </button>
        </div>
      ) : (
        <>
          <div className="card-panel pp-balance">
            <p className="muted">{COPY.signedInAs} {email || 'you'}</p>
            <p className="pp-balance-amount">{usd(balanceUnits)}</p>
            <p className="muted">{COPY.balance}</p>
            <div className="inline-actions">
              <button type="button" className="ghost-button" disabled={balanceUnits === 0}
                onClick={() => { setStage('convert'); setQuote(null) }}>
                {COPY.convert}
              </button>
              <button type="button" className="ghost-button" disabled={balanceUnits === 0}
                onClick={() => { setStage('cashout'); setQuote(null) }}>
                {COPY.cashOut}
              </button>
              <button type="button" className="ghost-button" onClick={logout}>Sign out</button>
            </div>
          </div>

          {stage === 'home' && (
            <div className="card-panel pp-upload">
              <h3>{COPY.upload}</h3>
              <p className="muted">{COPY.uploadSub}</p>
              <input type="file" accept="image/*" multiple onChange={handlePick} />
              {photos.length > 0 && (
                <div className="pp-thumbs">
                  {photos.map((p) => (
                    <img key={p.name} src={p.url} alt="" className="pp-thumb" />
                  ))}
                </div>
              )}
              <button type="button" className="primary-button" disabled={busy || photos.length === 0}
                onClick={handleEarn}>
                {busy ? 'Sending…' : `${COPY.earn} from ${photos.length || 0} photo(s)`}
              </button>
            </div>
          )}

          {stage === 'convert' && (
            <div className="card-panel">
              <h3>{COPY.convert}</h3>
              <p className="muted">{COPY.convertSub}</p>
              {!quote ? (
                <div className="inline-actions">
                  {CONVERT_TARGETS.map((t) => (
                    <button key={t.symbol} type="button" className="ghost-button" disabled={busy}
                      onClick={() => handleQuoteConvert(t)}>
                      {t.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="pp-quote">
                  <p>{COPY.youPay}: <strong>{usd(quote.youPay)}</strong></p>
                  <p>{COPY.youGet}: <strong>{quote.youGet ?? '—'} {quote.toSymbol}</strong></p>
                  <button type="button" className="primary-button" disabled={busy}
                    onClick={handleConfirmConvert}>
                    {busy ? COPY.moving : COPY.confirmMove}
                  </button>
                  <button type="button" className="ghost-button" onClick={() => setQuote(null)}>Back</button>
                </div>
              )}
              <button type="button" className="ghost-button" onClick={() => setStage('home')}>Cancel</button>
            </div>
          )}

          {stage === 'cashout' && (
            <CashOutPanel
              balanceUnits={balanceUnits}
              address={address}
              getWalletClient={getWalletClient}
              onDone={(m) => { setMsg(m); setStage('home') }}
            />
          )}

          {msg && <p className="callout">{msg}</p>}
        </>
      )}

      <p className="muted footer-note">
        Powered by Privy · Uniswap · 1inch. You approve every transfer with a tap — money never moves on its own.
      </p>
    </section>
  )
}

function CashOutPanel({ balanceUnits, address, getWalletClient, onDone }) {
  const [quote, setQuote] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  // Demo token addresses come from env; left empty until configured at venue.
  const USDC = import.meta.env.VITE_USDC_ADDRESS || ''
  const OUT = import.meta.env.VITE_CASHOUT_TOKEN || ''

  async function handleQuote() {
    setBusy(true); setErr('')
    try {
      const q = await quoteCashOut({ fromTokenAddress: USDC, toTokenAddress: OUT, amountBaseUnits: balanceUnits })
      setQuote(q)
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  async function handleConfirm() {
    setBusy(true); setErr('')
    try {
      const request = await buildCashOut({
        fromTokenAddress: USDC, toTokenAddress: OUT,
        amountBaseUnits: balanceUnits, account: address,
      })
      const walletClient = await getWalletClient()
      // Wallet shows its own confirm prompt; user taps to approve.
      await executeCashOut({ walletClient, request })
      onDone(COPY.moveDone)
    } catch (e) { setErr(e.message || 'Cash out not confirmed') } finally { setBusy(false) }
  }

  return (
    <div className="card-panel">
      <h3>{COPY.cashOut}</h3>
      <p className="muted">{COPY.cashOutSub}</p>
      {!quote ? (
        <button type="button" className="primary-button" disabled={busy} onClick={handleQuote}>
          {busy ? 'Getting best rate…' : `Get rate for ${usd(balanceUnits)}`}
        </button>
      ) : (
        <div className="pp-quote">
          <p>{COPY.youPay}: <strong>{usd(quote.youPay)}</strong></p>
          <p>{COPY.youGet}: <strong>{quote.youGet ?? '—'}</strong></p>
          <button type="button" className="primary-button" disabled={busy} onClick={handleConfirm}>
            {busy ? COPY.moving : COPY.confirmMove}
          </button>
        </div>
      )}
      {err && <p className="form-error">{err}</p>}
      <button type="button" className="ghost-button" onClick={() => onDone('')}>Cancel</button>
    </div>
  )
}
