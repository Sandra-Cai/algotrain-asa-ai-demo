import { explorerTxUrl } from '../lib/algorand'

export default function ExplorerLink({ txId, label = 'View on explorer' }) {
  if (!txId) return null
  return (
    <a
      className="explorer-link"
      href={explorerTxUrl(txId)}
      target="_blank"
      rel="noreferrer"
    >
      {label}
    </a>
  )
}
