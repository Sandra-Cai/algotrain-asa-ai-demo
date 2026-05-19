const steps = [
  { key: 'submit', label: '1. Submit data' },
  { key: 'review', label: '2. Review' },
  { key: 'pay', label: '3. Pay on-chain' },
]

export default function FlowSteps({ current = 'submit' }) {
  const activeIndex = steps.findIndex((s) => s.key === current)

  return (
    <div className="flow-steps" role="list" aria-label="POC flow">
      {steps.map((step, index) => {
        const state =
          index < activeIndex
            ? 'done'
            : index === activeIndex
              ? 'active'
              : 'upcoming'
        return (
          <div
            key={step.key}
            className={`flow-step flow-step--${state}`}
            role="listitem"
          >
            <span className="flow-step-dot" aria-hidden="true" />
            <span>{step.label}</span>
          </div>
        )
      })}
    </div>
  )
}
