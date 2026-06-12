// World ID configuration + proof verification (non-component exports).
// Verification hits World's public verify API (v2). In production this call
// belongs on a backend so proofs can't be replayed client-side; for the 36h
// demo, client-side verify is accepted and the nullifier_hash de-dupes humans.

export const WORLD_APP_ID = import.meta.env.VITE_WORLD_APP_ID || ''
export const WORLD_ACTION = import.meta.env.VITE_WORLD_ACTION || 'label-data'
export const worldConfigured = Boolean(WORLD_APP_ID)

export async function verifyProof(proof) {
  const res = await fetch(
    `https://developer.worldcoin.org/api/v2/verify/${WORLD_APP_ID}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...proof, action: WORLD_ACTION }),
    },
  )
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || 'World ID verification failed')
  }
  return res.json()
}
