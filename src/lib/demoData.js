export const DEMO_TASK_ID = 'demo-task-1'

export const defaultDemoTask = {
  id: DEMO_TASK_ID,
  title: 'Classify product-image training samples',
  description:
    'Label whether the image contains a high-quality e-commerce product shot suitable for model training.',
  sample:
    'Image batch #NYC-042: handbag, studio lighting, neutral background.',
  rewardAsaUnits: 1,
  rewardAmount: Number(import.meta.env.VITE_REWARD_AMOUNT || 10_000),
  rewardAssetId: Number(import.meta.env.VITE_REWARD_ASA_ID || 0) || null,
  requesterAddress: '',
  createdAt: new Date().toISOString(),
}

export const defaultSubmissionText =
  'Approved: product shot is usable for training. Label = high_quality_product_image.'

export const journeySteps = [
  {
    key: 'submit',
    label: 'Data submission',
    detail: 'Contributor records payout wallet and submits labeled data.',
  },
  {
    key: 'review',
    label: 'Review process',
    detail: 'Reviewer verifies quality and marks the submission approved.',
  },
  {
    key: 'pay',
    label: 'Payment trigger',
    detail: 'Wallet-signed TestNet transaction pays contributor with proof link.',
  },
]
