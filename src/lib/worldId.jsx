// World ID proof-of-personhood gate (component only — config in worldIdConfig.js).
// Why it matters for AlgoTrain: data-labeling marketplaces are sybil targets —
// one person running many accounts farms payouts and poisons dataset quality.
// World ID is one-verification-per-human, so the "verified human" badge on a
// submission is a real data-quality signal, not decoration.
//
// Pinned to @worldcoin/idkit@2 (classic widget API). v4 introduces an
// rp_context / Relying Party registration flow — heavier setup than a 36h
// build needs. If the World booth recommends v4, the swap is isolated here.
//
// Setup (developer.worldcoin.org): create app -> copy app_id (app_...),
// create an incognito action matching VITE_WORLD_ACTION, set env vars.

import { IDKitWidget, VerificationLevel } from '@worldcoin/idkit'
import { WORLD_APP_ID, WORLD_ACTION, worldConfigured, verifyProof } from './worldIdConfig'

/**
 * Render-prop gate. Usage:
 *   <VerifyHumanGate onVerified={({ nullifierHash }) => ...}>
 *     {(open) => <button onClick={open}>Verify I am human</button>}
 *   </VerifyHumanGate>
 */
export function VerifyHumanGate({ onVerified, children }) {
  if (!worldConfigured) return null
  return (
    <IDKitWidget
      app_id={WORLD_APP_ID}
      action={WORLD_ACTION}
      verification_level={VerificationLevel.Device}
      handleVerify={verifyProof}
      onSuccess={(result) =>
        onVerified({ nullifierHash: result.nullifier_hash })
      }
    >
      {({ open }) => children(open)}
    </IDKitWidget>
  )
}
