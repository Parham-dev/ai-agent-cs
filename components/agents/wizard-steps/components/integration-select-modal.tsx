import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalClose, ModalBody } from '@/components/ui/modal'
import { ShoppingBag, ShoppingCart, CreditCard, HelpCircle } from 'lucide-react'

const AVAILABLE_INTEGRATIONS = [
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Connect to your Shopify store for product catalog browsing, inventory management, and product inquiries',
    icon: <ShoppingBag className="w-6 h-6" />,
    category: 'E-commerce',
    status: 'available',
    color: 'from-green-500 to-emerald-600',
    tools: [
      { id: 'product_search', name: 'Product Search', description: 'Search through product catalog' },
      { id: 'inventory_check', name: 'Inventory Check', description: 'Check product availability' },
      { id: 'order_lookup', name: 'Order Lookup', description: 'Find and track orders' },
      { id: 'customer_info', name: 'Customer Info', description: 'Access customer details' }
    ]
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    description: 'WordPress e-commerce integration for order tracking and customer service',
    icon: <ShoppingCart className="w-6 h-6" />,
    category: 'E-commerce',
    status: 'coming-soon',
    color: 'from-purple-500 to-indigo-600',
    tools: []
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing and subscription management for customer billing support',
    icon: <CreditCard className="w-6 h-6" />,
    category: 'Payments',
    status: 'coming-soon',
    color: 'from-blue-500 to-cyan-600',
    tools: []
  },
  {
    id: 'zendesk',
    name: 'Zendesk',
    description: 'Ticket management and customer support workflow integration',
    icon: <HelpCircle className="w-6 h-6" />,
    category: 'Support',
    status: 'coming-soon',
    color: 'from-orange-500 to-red-600',
    tools: []
  }
]

interface IntegrationSelectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectIntegration: (integrationId: string) => void
  availableIntegrations?: Array<{
    id: string
    name: string
    description: string
    icon: React.ReactNode
    category: string
    status: string
    color: string
    tools: Array<{ id: string; name: string; description: string }>
  }>
}

export function IntegrationSelectModal({ open, onOpenChange, onSelectIntegration, availableIntegrations }: IntegrationSelectModalProps) {
  const integrationsToShow = availableIntegrations || AVAILABLE_INTEGRATIONS
  
  const handleSelectIntegration = (integrationId: string) => {
    const integration = integrationsToShow.find(i => i.id === integrationId)
    if (integration?.status !== 'available') return
    onSelectIntegration(integrationId)
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Choose an Integration</ModalTitle>
          <ModalClose onClose={() => onOpenChange(false)} />
        </ModalHeader>
        <ModalBody>
          <div className="space-y-3">
            {integrationsToShow.map((integration) => (
              <Card
                key={integration.id}
                className={`cursor-pointer transition-all duration-200 ${
                  integration.status === 'available'
                    ? 'hover:shadow-md hover:scale-[1.02] border-gray-200 dark:border-gray-700'
                    : 'opacity-60 cursor-not-allowed border-gray-100 dark:border-gray-800'
                }`}
                onClick={() => handleSelectIntegration(integration.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${integration.color} text-white shadow-lg flex-shrink-0`}>
                      <div className="w-6 h-6 flex items-center justify-center">
                        {integration.icon}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{integration.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {integration.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {integration.description}
                      </p>
                    </div>

                    <div className="flex-shrink-0">
                      {integration.status === 'available' ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                          Available
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
                          Coming Soon
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export { AVAILABLE_INTEGRATIONS }
export type { IntegrationSelectModalProps }
