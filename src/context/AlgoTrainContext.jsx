import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import algosdk from 'algosdk'
import {
  REWARD_ASA_ID,
  DEFAULT_REWARD_AMOUNT,
  accountHasAsset,
  buildOptInTxn,
  buildRewardTxn,
  formatReward,
  getSuggestedParams,
  submitSignedTransaction,
} from '../lib/algorand'
import {
  connectPeraWallet,
  disconnectPeraWallet,
  peraWallet,
  reconnectPeraWallet,
} from '../lib/wallet'
import {
  addSubmission,
  appendAudit,
  createTask,
  getStore,
  resetDemo,
  setPayoutAddress,
  subscribe,
  updateSubmission,
} from '../lib/store'

const AlgoTrainContext = createContext(null)

export function AlgoTrainProvider({ children }) {
  const [accounts, setAccounts] = useState([])
  const [status, setStatus] = useState('Disconnected — connect Pera on TestNet')
  const [busyAction, setBusyAction] = useState('')
  const [store, setStore] = useState(getStore())
  const network = import.meta.env.VITE_ALGOD_NETWORK || 'testnet'

  const activeAccount = accounts[0] || ''
  const busy = Boolean(busyAction)

  useEffect(() => subscribe(setStore), [])

  useEffect(() => {
    reconnectPeraWallet()
      .then((reconnected) => {
        if (reconnected?.length) {
          setAccounts(reconnected)
          setStatus('Pera wallet reconnected')
        }
      })
      .catch(() => {})

    const connector = peraWallet.connector
    if (connector?.on) {
      connector.on('disconnect', () => {
        setAccounts([])
        setStatus('Wallet disconnected')
      })
    }
  }, [])

  const connect = useCallback(async () => {
    try {
      setBusyAction('connect')
      setStatus('Opening Pera Wallet…')
      const connected = await connectPeraWallet()
      setAccounts(connected)
      setStatus(`Connected: ${connected[0].slice(0, 6)}…${connected[0].slice(-4)}`)
    } catch (err) {
      setStatus(err?.message || 'Wallet connection cancelled')
    } finally {
      setBusyAction('')
    }
  }, [])

  const disconnect = useCallback(async () => {
    await disconnectPeraWallet()
    setAccounts([])
    setStatus('Disconnected')
  }, [])

  const signTxn = useCallback(async (txn) => {
    const signed = await peraWallet.signTransaction([
      [{ txn, signers: [txn.sender.toString()] }],
    ])
    return signed[0]
  }, [])

  const recordPayoutWallet = useCallback(() => {
    if (!activeAccount) throw new Error('Connect your wallet first')
    setPayoutAddress(activeAccount)
    appendAudit(
      'Payout wallet set',
      `${activeAccount.slice(0, 6)}…${activeAccount.slice(-4)} will receive rewards.`,
    )
    setStatus('Contributor payout wallet recorded')
  }, [activeAccount])

  const optInToRewardAsset = useCallback(async () => {
    if (!activeAccount) throw new Error('Connect your wallet first')
    if (!REWARD_ASA_ID) {
      throw new Error('No reward ASA configured — use ALGO payout for the live demo')
    }

    const hasAsset = await accountHasAsset(activeAccount, REWARD_ASA_ID)
    if (hasAsset) {
      setStatus('Already opted in to reward ASA')
      return null
    }

    setBusyAction('opt-in')
    setStatus('Sign opt-in in Pera Wallet…')
    try {
      const suggestedParams = await getSuggestedParams()
      const txn = buildOptInTxn(activeAccount, REWARD_ASA_ID, suggestedParams)
      const signed = await signTxn(txn)
      const txId = await submitSignedTransaction(signed)
      appendAudit('ASA opt-in confirmed', `Tx: ${txId}`)
      setStatus(`Opted in · tx ${txId.slice(0, 8)}…`)
      return txId
    } finally {
      setBusyAction('')
    }
  }, [activeAccount, signTxn])

  const createDataTask = useCallback(
    async ({ title, description, rewardAmount }) => {
      if (!activeAccount) throw new Error('Connect your wallet first')
      const task = createTask({
        title,
        description,
        rewardAmount: Number(rewardAmount) || DEFAULT_REWARD_AMOUNT,
        rewardAssetId: REWARD_ASA_ID,
        requesterAddress: activeAccount,
      })
      appendAudit('Task created', title)
      setStatus(`Task created: ${title}`)
      return task
    },
    [activeAccount],
  )

  const submitData = useCallback(
    async ({ taskId, content }) => {
      const contributorAddress = store.payoutAddress || activeAccount
      if (!contributorAddress) {
        throw new Error('Connect wallet and click “Use connected wallet” first')
      }
      const submission = addSubmission({
        taskId,
        contributorAddress,
        content,
      })
      appendAudit('Data submitted', 'Work queued for reviewer approval.')
      setStatus('Submission saved — awaiting reviewer')
      return submission
    },
    [activeAccount, store.payoutAddress],
  )

  const approveSubmission = useCallback(
    (submissionId) => {
      const submission = store.submissions.find((s) => s.id === submissionId)
      if (!submission) throw new Error('Submission not found')
      if (submission.status !== 'pending') {
        throw new Error('Submission already processed')
      }

      updateSubmission(submissionId, {
        status: 'approved',
        reviewedAt: new Date().toISOString(),
        reviewerAddress: activeAccount || '',
      })
      appendAudit(
        'Submission approved',
        'Payment unlocked — sign payout in Pera Wallet.',
      )
      setStatus('Approved — ready to trigger on-chain payout')
    },
    [activeAccount, store.submissions],
  )

  const triggerPayout = useCallback(
    async (submissionId, { useAsa = false } = {}) => {
      if (!activeAccount) throw new Error('Connect reviewer wallet first')

      const submission = store.submissions.find((s) => s.id === submissionId)
      if (!submission) throw new Error('Submission not found')
      if (submission.status !== 'approved' || submission.txId) {
        throw new Error('Approve the submission before triggering payout')
      }

      const task = store.tasks.find((t) => t.id === submission.taskId)
      if (!task) throw new Error('Task not found')

      const assetId = useAsa ? task.rewardAssetId || REWARD_ASA_ID : null
      if (useAsa && !assetId) {
        throw new Error('Set VITE_REWARD_ASA_ID for ASA payouts')
      }

      const amount = task.rewardAmount || DEFAULT_REWARD_AMOUNT
      const receiver = submission.contributorAddress

      if (!algosdk.isValidAddress(receiver)) {
        throw new Error('Invalid contributor payout address')
      }

      if (assetId) {
        const optedIn = await accountHasAsset(receiver, assetId)
        if (!optedIn) {
          throw new Error(
            'Contributor must opt in to the reward ASA on the Contributor page first.',
          )
        }
      }

      setBusyAction(useAsa ? 'asa-payout' : 'algo-payout')
      setStatus('Signing payout in Pera Wallet…')

      try {
        const suggestedParams = await getSuggestedParams()
        const noteText = `AlgoTrain payout | ${task.id.slice(0, 8)} | ${submission.id.slice(0, 8)}`
        const txn = buildRewardTxn({
          sender: activeAccount,
          receiver,
          amount,
          assetId,
          suggestedParams,
          noteText,
        })

        const signed = await signTxn(txn)
        const txId = await submitSignedTransaction(signed)

        updateSubmission(submissionId, {
          txId,
          paidAt: new Date().toISOString(),
        })

        const label = useAsa
          ? `${amount} ASA units`
          : `${(amount / 1_000_000).toFixed(3)} TestNet ALGO`
        appendAudit('Payment triggered', `${label} confirmed. Tx: ${txId}`)
        setStatus(`Payout confirmed on-chain · ${txId.slice(0, 10)}…`)
        return txId
      } finally {
        setBusyAction('')
      }
    },
    [activeAccount, signTxn, store.submissions, store.tasks],
  )

  const rejectSubmission = useCallback(
    (submissionId) => {
      updateSubmission(submissionId, {
        status: 'rejected',
        reviewedAt: new Date().toISOString(),
        reviewerAddress: activeAccount || '',
      })
      appendAudit('Submission rejected', 'No payment sent.')
      setStatus('Submission rejected')
    },
    [activeAccount],
  )

  const handleResetDemo = useCallback(() => {
    resetDemo()
    setStatus('Demo reset — ready for rehearsal')
  }, [])

  const value = useMemo(
    () => ({
      accounts,
      activeAccount,
      network,
      status,
      setStatus,
      busy,
      busyAction,
      connect,
      disconnect,
      recordPayoutWallet,
      optInToRewardAsset,
      createDataTask,
      submitData,
      approveSubmission,
      triggerPayout,
      rejectSubmission,
      resetDemo: handleResetDemo,
      tasks: store.tasks,
      submissions: store.submissions,
      payoutAddress: store.payoutAddress,
      auditLog: store.auditLog,
      rewardAssetId: REWARD_ASA_ID,
      defaultRewardAmount: DEFAULT_REWARD_AMOUNT,
      formatReward,
    }),
    [
      accounts,
      activeAccount,
      network,
      status,
      busy,
      busyAction,
      connect,
      disconnect,
      recordPayoutWallet,
      optInToRewardAsset,
      createDataTask,
      submitData,
      approveSubmission,
      triggerPayout,
      rejectSubmission,
      handleResetDemo,
      store.tasks,
      store.submissions,
      store.payoutAddress,
      store.auditLog,
    ],
  )

  return (
    <AlgoTrainContext.Provider value={value}>
      {children}
    </AlgoTrainContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- hook colocated with provider
export function useAlgoTrain() {
  const ctx = useContext(AlgoTrainContext)
  if (!ctx) throw new Error('useAlgoTrain must be used within AlgoTrainProvider')
  return ctx
}
