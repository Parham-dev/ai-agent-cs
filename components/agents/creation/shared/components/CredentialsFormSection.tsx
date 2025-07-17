'use client'

import { Card } from '@mantine/core'
import { ShopifyCredentialsForm, StripeCredentialsForm } from '../credentials'
import type { ApiIntegration } from '@/lib/types'

interface CredentialsFormSectionProps {
  integration: ApiIntegration
  onSave: (integration: ApiIntegration) => void
  onCancel: () => void
}

export function CredentialsFormSection({
  integration,
  onSave,
  onCancel
}: CredentialsFormSectionProps) {
  return (
    <Card withBorder p="lg">
      {integration.type === 'shopify' && (
        <ShopifyCredentialsForm
          integration={integration}
          onSave={onSave}
          onCancel={onCancel}
        />
      )}
      
      {integration.type === 'stripe' && (
        <StripeCredentialsForm
          integration={integration}
          onSave={onSave}
          onCancel={onCancel}
        />
      )}
    </Card>
  )
}
