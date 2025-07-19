'use client'

import { Anchor } from '@mantine/core'
import { ExternalLink } from 'lucide-react'
import { BaseCredentialsForm } from './BaseCredentialsForm'
import type { ApiIntegration } from '@/lib/types'

interface ShopifyCredentialsFormProps {
  integration?: ApiIntegration | null
  onSaved?: (integration: ApiIntegration) => void
  tempIntegrationId?: string
}

const shopifyConfig = {
  type: 'shopify' as const,
  displayName: 'Shopify',
  fields: [
    {
      key: 'shopUrl',
      label: 'Store URL',
      type: 'text' as const,
      placeholder: 'your-store.myshopify.com',
      validate: (value: string) => {
        if (!value.trim()) return 'Store URL is required'
        if (!value.includes('.myshopify.com') && !value.includes('.shopify.com')) {
          return 'Please enter a valid Shopify store URL'
        }
        return null
      }
    },
    {
      key: 'accessToken',
      label: 'Admin API Token',
      type: 'password' as const,
      placeholder: 'shpat_...',
      validate: (value: string) => value.trim() ? null : 'Admin API Token is required'
    }
  ],
  helpText: (
    <>
      Need help getting your API credentials?{' '}
      <Anchor href="https://help.shopify.com/en/manual/apps/custom-apps" target="_blank">
        Learn how to create a Custom App <ExternalLink size={12} style={{ display: 'inline' }} />
      </Anchor>
    </>
  )
}

export function ShopifyCredentialsForm({ 
  integration, 
  onSaved, 
  tempIntegrationId 
}: ShopifyCredentialsFormProps) {
  return (
    <BaseCredentialsForm
      config={shopifyConfig}
      integration={integration}
      onSaved={onSaved}
      tempIntegrationId={tempIntegrationId}
    />
  )
}