'use client'

import { Anchor } from '@mantine/core'
import { ExternalLink } from 'lucide-react'
import { BaseCredentialsForm } from './BaseCredentialsForm'
import type { ApiIntegration } from '@/lib/types'

interface StripeCredentialsFormProps {
  integration?: ApiIntegration | null
  onSaved?: (integration: ApiIntegration) => void
  tempIntegrationId?: string
}

const stripeConfig = {
  type: 'stripe' as const,
  displayName: 'Stripe',
  fields: [
    {
      key: 'environment',
      label: 'Environment',
      type: 'select' as const,
      options: [
        { label: 'Test Mode', value: 'test' },
        { label: 'Live Mode', value: 'live' }
      ]
    },
    {
      key: 'publishableKey',
      label: 'Publishable Key',
      type: 'text' as const,
      placeholder: 'pk_test_... or pk_live_...',
      validate: (value: string) => {
        if (!value.trim()) return 'Publishable key is required'
        if (!value.startsWith('pk_')) return 'Publishable key must start with pk_'
        return null
      }
    },
    {
      key: 'secretKey',
      label: 'Secret Key',
      type: 'password' as const,
      placeholder: 'sk_test_... or sk_live_...',
      validate: (value: string) => {
        if (!value.trim()) return 'Secret key is required'
        if (!value.startsWith('sk_')) return 'Secret key must start with sk_'
        return null
      }
    },
    {
      key: 'webhookSecret',
      label: 'Webhook Secret (Optional)',
      type: 'password' as const,
      placeholder: 'whsec_...'
    }
  ],
  helpText: (
    <>
      Need help getting your API credentials?{' '}
      <Anchor href="https://stripe.com/docs/keys" target="_blank">
        Learn how to find your Stripe API keys <ExternalLink size={12} style={{ display: 'inline' }} />
      </Anchor>
    </>
  )
}

export function StripeCredentialsForm({ 
  integration, 
  onSaved, 
  tempIntegrationId 
}: StripeCredentialsFormProps) {
  return (
    <BaseCredentialsForm
      config={stripeConfig}
      integration={integration}
      onSaved={onSaved}
      tempIntegrationId={tempIntegrationId}
    />
  )
}