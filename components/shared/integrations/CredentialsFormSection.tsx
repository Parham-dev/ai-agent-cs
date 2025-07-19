'use client'

import { Card } from '@mantine/core'
import { ShopifyCredentialsForm, StripeCredentialsForm } from '@/components/shared/integrations/credentials'
import type { ApiIntegration } from '@/lib/types'

interface CredentialsFormSectionProps {
  integration: ApiIntegration
  onSave: (integration: ApiIntegration) => void
  onCancel?: () => void
}

export function CredentialsFormSection({
  integration,
  onSave
}: CredentialsFormSectionProps) {
  return (
    <Card withBorder p="lg">
      {integration.type === 'shopify' && (
        <ShopifyCredentialsForm
          integration={integration}
          onSaved={onSave}
        />
      )}
      
      {integration.type === 'stripe' && (
        <StripeCredentialsForm
          integration={integration}
          onSaved={onSave}
        />
      )}
    </Card>
  )
}
