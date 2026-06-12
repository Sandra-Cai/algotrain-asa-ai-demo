import { explorerTxUrl } from '../lib/chains/arc'

export default function ExplorerLink({ txId, label = 'View on Arc explorer' }) {
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
