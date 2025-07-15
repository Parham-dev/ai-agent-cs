'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/layout'

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'available' | 'coming-soon';
  category: string;
}

const integrations: Integration[] = [
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Connect to your Shopify store for product catalog browsing, inventory management, and product inquiries',
    icon: '🛍️',
    status: 'available',
    category: 'E-commerce'
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    description: 'WordPress e-commerce integration for order tracking and customer service',
    icon: '🛒',
    status: 'coming-soon',
    category: 'E-commerce'
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing and subscription management for customer billing support',
    icon: '💳',
    status: 'coming-soon',
    category: 'Payments'
  },
  {
    id: 'zendesk',
    name: 'Zendesk',
    description: 'Ticket management and customer support workflow integration',
    icon: '🎧',
    status: 'coming-soon',
    category: 'Support'
  }
];

export default function DashboardPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(integrations.map(i => i.category)))];
  const filteredIntegrations = selectedCategory === 'all' 
    ? integrations 
    : integrations.filter(i => i.category === selectedCategory);

  return (
    <DashboardLayout 
      title="AI Customer Service Platform" 
      subtitle="Connect your business platforms and let AI handle customer inquiries"
    >
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Welcome to Your Dashboard
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Connect your business platforms and let AI handle customer inquiries with intelligent routing, 
            real-time data access, and automated support workflows.
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Real-time Integration</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Multi-Agent System</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Open Source</span>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex justify-center">
          <div className="flex space-x-2 bg-white dark:bg-gray-800 rounded-full p-1 shadow-lg">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Integration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIntegrations.map((integration) => (
            <div
              key={integration.id}
              className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 transition-all duration-300 ${
                integration.status === 'available'
                  ? 'border-transparent hover:border-blue-500 hover:shadow-xl cursor-pointer'
                  : 'border-gray-200 dark:border-gray-600 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-4xl">{integration.icon}</div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  integration.status === 'available'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {integration.status === 'available' ? 'Available' : 'Coming Soon'}
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {integration.name}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 leading-relaxed">
                {integration.description}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {integration.category}
                </span>
                
                {integration.status === 'available' ? (
                  <Link
                    href={`/dashboard/integrations/${integration.id}`}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Setup →
                  </Link>
                ) : (
                  <button
                    disabled
                    className="bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed"
                  >
                    Soon
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-2xl mx-auto shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Start with Shopify Integration
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Connect your Shopify store and let our AI agents handle customer inquiries about orders, 
              products, shipping, and more using your real store data.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard/integrations/shopify"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-3 rounded-lg font-medium transition-all"
              >
                <span>Setup Integration</span>
                <span>→</span>
              </Link>
              <Link
                href="/chat/shopify"
                className="inline-flex items-center space-x-2 bg-white dark:bg-gray-800 border-2 border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 px-8 py-3 rounded-lg font-medium transition-all"
              >
                <span>Try Demo Chat</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}