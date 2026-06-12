import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from 'react'
import {
  useDynamicContext,
  isEthereumWallet,
} from '../lib/dynamicWallet'
import {
  buildArcWalletClient,
  formatReward,
  isValidEvmAddress,
  DEFAULT_REWARD_AMOUNT,
} from '../lib/chains/arc'
import { settlePayout } from '../lib/payouts'
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
  const { primaryWallet, setShowAuthFlow, handleLogOut } = useDynamicContext()
  const [status, setStatus] = useState('Disconnected — sign in to get a wallet')
  const [busyAction, setBusyAction] = useState('')
  const [store, setStore] = useState(getStore())
  const network = 'arc-testnet'

  const walletReady = Boolean(primaryWallet && isEthereumWallet(primaryWallet))
  const activeAccount = walletReady ? primaryWallet.address : ''
  const busy = Boolean(busyAction)

  useEffect(() => subscribe(setStore), [])

  const displayStatus =
    walletReady && status.startsWith('Disconnected')
      ? `Connected: ${activeAccount.slice(0, 6)}…${activeAccount.slice(-4)}`
      : status

  const connect = useCallback(() => {
    setShowAuthFlow(true)
  }, [setShowAuthFlow])

  const disconnect = useCallback(async () => {
    await handleLogOut()
    setStatus('Disconnected')
  }, [handleLogOut])

  const getWalletClient = useCallback(async () => {
    if (!walletReady) throw new Error('Sign in with Dynamic first')
    // Dynamic's EVM wallets expose a viem wallet client directly.
    if (typeof primaryWallet.getWalletClient === 'function') {
      return primaryWallet.getWalletClient()
    }
    const provider = await primaryWallet.connector.getProvider()
    return buildArcWalletClient(provider, activeAccount)
  }, [walletReady, primaryWallet, activeAccount])

  const recordPayoutWallet = useCallback(() => {
    if (!activeAccount) throw new Error('Sign in first — Dynamic creates your wallet')
    setPayoutAddress(activeAccount)
    appendAudit(
      'Payout wallet set',
      `${activeAccount.slice(0, 6)}…${activeAccount.slice(-4)} will receive USDC rewards.`,
    )
    setStatus('Contributor payout wallet recorded')
  }, [activeAccount])

  const createDataTask = useCallback(
    async ({ title, description, rewardAmount }) => {
      if (!activeAccount) throw new Error('Sign in first')
      const task = createTask({
        title,
        description,
        rewardAmount: Number(rewardAmount) || DEFAULT_REWARD_AMOUNT,
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
        throw new Error('Sign in and click “Use my wallet” first')
      }
      const submission = addSubmission({ taskId, contributorAddress, content })
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
      appendAudit('Submission approved', 'Payment unlocked — sign USDC payout.')
      setStatus('Approved — ready to trigger on-chain payout')
    },
    [activeAccount, store.submissions],
  )

  const triggerPayout = useCallback(
    async (submissionId) => {
      if (!activeAccount) throw new Error('Sign in with the reviewer wallet first')

      const submission = store.submissions.find((s) => s.id === submissionId)
      if (!submission) throw new Error('Submission not found')
      if (submission.status !== 'approved' || submission.txId) {
        throw new Error('Approve the submission before triggering payout')
      }

      const task = store.tasks.find((t) => t.id === submission.taskId)
      if (!task) throw new Error('Task not found')

      const amount = task.rewardAmount || DEFAULT_REWARD_AMOUNT
      const receiver = submission.contributorAddress
      if (!isValidEvmAddress(receiver)) {
        throw new Error('Invalid contributor payout address')
      }

      setBusyAction('usdc-payout')
      setStatus('Confirm the USDC payout in your wallet…')

      try {
        const walletClient = await getWalletClient()
        const noteText = `AlgoTrain payout | ${task.id.slice(0, 8)} | ${submission.id.slice(0, 8)}`
        const { txId } = await settlePayout({
          walletClient,
          sender: activeAccount,
          receiver,
          amountBaseUnits: amount,
          noteText,
        })

        updateSubmission(submissionId, {
          txId,
          paidAt: new Date().toISOString(),
        })
        appendAudit('Payment triggered', `${formatReward(amount)} confirmed. Tx: ${txId}`)
        setStatus(`Payout confirmed on-chain · ${txId.slice(0, 10)}…`)
        return txId
      } finally {
        setBusyAction('')
      }
    },
    [activeAccount, getWalletClient, store.submissions, store.tasks],
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
      activeAccount,
      network,
      status: displayStatus,
      setStatus,
      busy,
      busyAction,
      connect,
      disconnect,
      recordPayoutWallet,
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
      defaultRewardAmount: DEFAULT_REWARD_AMOUNT,
      formatReward,
    }),
    [
      activeAccount,
      network,
      displayStatus,
      busy,
      busyAction,
      connect,
      disconnect,
      recordPayoutWallet,
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
