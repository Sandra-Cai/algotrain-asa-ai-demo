import { defaultDemoTask } from './demoData.js'

const STORAGE_KEY = 'algotrain-poc-v2'

const defaultState = {
  tasks: [defaultDemoTask],
  submissions: [],
  payoutAddress: '',
  verifiedHumans: {},
  auditLog: [
    {
      type: 'Demo ready',
      detail: 'Use the guided task for a 90-second live pitch.',
      at: new Date().toISOString(),
    },
  ],
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(defaultState)
    const parsed = JSON.parse(raw)
    return {
      tasks: parsed.tasks?.length ? parsed.tasks : defaultState.tasks,
      submissions: parsed.submissions ?? [],
      payoutAddress: parsed.payoutAddress ?? '',
      verifiedHumans: parsed.verifiedHumans ?? {},
      auditLog: parsed.auditLog?.length ? parsed.auditLog : defaultState.auditLog,
    }
  } catch {
    return structuredClone(defaultState)
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

let state = loadState()
const listeners = new Set()

export function getStore() {
  return state
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function emit() {
  saveState(state)
  listeners.forEach((fn) => fn(state))
}

export function appendAudit(type, detail) {
  state = {
    ...state,
    auditLog: [
      { type, detail, at: new Date().toISOString() },
      ...state.auditLog,
    ].slice(0, 10),
  }
  emit()
}

export function resetDemo() {
  state = structuredClone(defaultState)
  emit()
}

export function setVerifiedHuman(address, nullifierHash) {
  state = {
    ...state,
    verifiedHumans: { ...state.verifiedHumans, [address]: nullifierHash },
  }
  emit()
}

export function setPayoutAddress(address) {
  state = { ...state, payoutAddress: address }
  emit()
}

export function createTask(task) {
  const entry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...task,
  }
  state = { ...state, tasks: [entry, ...state.tasks] }
  emit()
  return entry
}

export function addSubmission(submission) {
  const entry = {
    id: crypto.randomUUID(),
    status: 'pending',
    createdAt: new Date().toISOString(),
    ...submission,
  }
  state = { ...state, submissions: [entry, ...state.submissions] }
  emit()
  return entry
}

export function updateSubmission(id, patch) {
  state = {
    ...state,
    submissions: state.submissions.map((s) =>
      s.id === id ? { ...s, ...patch } : s,
    ),
  }
  emit()
}

export function getTaskById(id) {
  return state.tasks.find((t) => t.id === id)
}

export function getPendingSubmissions() {
  return state.submissions.filter((s) => s.status === 'pending')
}

export function getApprovedAwaitingPayout() {
  return state.submissions.filter(
    (s) => s.status === 'approved' && !s.txId,
  )
}

export function getDemoTask() {
  return state.tasks.find((t) => t.id === defaultDemoTask.id) || state.tasks[0]
}
