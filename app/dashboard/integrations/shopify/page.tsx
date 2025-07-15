'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/layout';

interface ShopifyCredentials {
  storeName: string;
  accessToken: string;
}

interface ValidationResult {
  isValid: boolean;
  message: string;
  storeInfo?: {
    name: string;
    domain: string;
    email: string;
  };
}

export default function ShopifyIntegrationPage() {
  const [credentials, setCredentials] = useState<ShopifyCredentials>({
    storeName: '',
    accessToken: ''
  });
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [step, setStep] = useState<'credentials' | 'tools' | 'ready'>('credentials');

  const validateCredentials = async () => {
    if (!credentials.storeName || !credentials.accessToken) {
      setValidationResult({
        isValid: false,
        message: 'Please fill in all required fields'
      });
      return;
    }

    setIsValidating(true);
    try {
      const response = await fetch('/api/integrations/shopify/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const result = await response.json();
      setValidationResult(result);
      
      if (result.isValid) {
        setStep('tools');
      }
    } catch {
      setValidationResult({
        isValid: false,
        message: 'Failed to validate credentials. Please check your connection.'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const setupTools = () => {
    // Store credentials in localStorage for now (in production, use secure storage)
    localStorage.setItem('shopify_credentials', JSON.stringify(credentials));
    setStep('ready');
  };

  const availableTools = [
    {
      name: 'Get Order Details',
      description: 'Retrieve order information by order ID or number',
      icon: '📦',
      enabled: true
    },
    {
      name: 'Get Product Info',
      description: 'Fetch product details, pricing, and inventory status',
      icon: '🛍️',
      enabled: false // We'll start with just one tool
    },
    {
      name: 'Customer Lookup',
      description: 'Find customer information and order history',
      icon: '👤',
      enabled: false
    },
    {
      name: 'Inventory Check',
      description: 'Check product availability and stock levels',
      icon: '📊',
      enabled: false
    }
  ];

  return (
    <DashboardLayout 
      title="Shopify Integration" 
      subtitle="Connect your Shopify store to enable AI customer service"
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link
            href="/dashboard"
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🛍️</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Connect Your Shopify Store
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Set up AI customer service for your Shopify store in just a few steps
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${step === 'credentials' ? 'text-blue-500' : 'text-green-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'credentials' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'}`}>
                {step !== 'credentials' ? <CheckCircle className="w-5 h-5" /> : '1'}
              </div>
              <span className="font-medium">Credentials</span>
            </div>
            
            <div className="w-8 h-0.5 bg-gray-300"></div>
            
            <div className={`flex items-center space-x-2 ${step === 'tools' ? 'text-blue-500' : step === 'ready' ? 'text-green-500' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'tools' ? 'bg-blue-500 text-white' : step === 'ready' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                {step === 'ready' ? <CheckCircle className="w-5 h-5" /> : '2'}
              </div>
              <span className="font-medium">Tools</span>
            </div>
            
            <div className="w-8 h-0.5 bg-gray-300"></div>
            
            <div className={`flex items-center space-x-2 ${step === 'ready' ? 'text-blue-500' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'ready' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                3
              </div>
              <span className="font-medium">Ready</span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          {step === 'credentials' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Enter Your Shopify Store Details
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Store Name
                  </label>
                  <input
                    type="text"
                    value={credentials.storeName}
                    onChange={(e) => setCredentials({...credentials, storeName: e.target.value})}
                    placeholder="your-store-name"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Just the store name from your-store-name.myshopify.com
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Private App Access Token
                  </label>
                  <input
                    type="password"
                    value={credentials.accessToken}
                    onChange={(e) => setCredentials({...credentials, accessToken: e.target.value})}
                    placeholder="shpat_..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Your private app access token with Admin API permissions
                  </p>
                </div>
              </div>

              {validationResult && (
                <div className={`p-4 rounded-lg flex items-start space-x-3 ${
                  validationResult.isValid 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}>
                  {validationResult.isValid ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-medium ${validationResult.isValid ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                      {validationResult.isValid ? 'Connection Successful!' : 'Connection Failed'}
                    </p>
                    <p className={`text-sm ${validationResult.isValid ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'}`}>
                      {validationResult.message}
                    </p>
                    {validationResult.storeInfo && (
                      <div className="mt-2 text-sm text-green-600 dark:text-green-300">
                        <p>Store: {validationResult.storeInfo.name}</p>
                        <p>Domain: {validationResult.storeInfo.domain}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                  Need help getting your credentials?
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  You&apos;ll need to create a private app in your Shopify admin to get an access token.
                </p>
                <a
                  href="https://help.shopify.com/en/manual/apps/app-types/private-apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                >
                  <span>View Shopify Guide</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <button
                onClick={validateCredentials}
                disabled={isValidating || !credentials.storeName || !credentials.accessToken}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {isValidating ? 'Validating...' : 'Validate & Continue'}
              </button>
            </div>
          )}

          {step === 'tools' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Select Customer Service Tools
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Choose which Shopify tools to enable for your AI customer service agent. We&apos;ll start with order lookup for testing.
              </p>

              <div className="space-y-3">
                {availableTools.map((tool, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      tool.enabled
                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                        : 'border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700/30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="text-2xl">{tool.icon}</div>
                        <div>
                          <h3 className={`font-medium ${tool.enabled ? 'text-green-900 dark:text-green-100' : 'text-gray-600 dark:text-gray-400'}`}>
                            {tool.name}
                          </h3>
                          <p className={`text-sm ${tool.enabled ? 'text-green-700 dark:text-green-300' : 'text-gray-500 dark:text-gray-500'}`}>
                            {tool.description}
                          </p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        tool.enabled
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-400'
                      }`}>
                        {tool.enabled ? 'Enabled' : 'Coming Soon'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={setupTools}
                className="w-full bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Setup Tools & Continue
              </button>
            </div>
          )}

          {step === 'ready' && (
            <div className="text-center space-y-6">
              <div className="text-6xl">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Your Shopify Integration is Ready!
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Your AI customer service agent is now connected to your Shopify store and ready to help customers with order inquiries.
              </p>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h3 className="font-medium text-green-900 dark:text-green-200 mb-2">
                  What your agent can do:
                </h3>
                <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                  <li>• Look up order details by order number</li>
                  <li>• Check order status and tracking information</li>
                  <li>• Provide shipping and delivery updates</li>
                  <li>• Answer questions about order contents</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/chat/shopify"
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-8 py-3 rounded-lg font-medium transition-all"
                >
                  <span>Start Chatting with Your Agent</span>
                  <span>→</span>
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center space-x-2 bg-white dark:bg-gray-800 border-2 border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 px-8 py-3 rounded-lg font-medium transition-all"
                >
                  <span>Back to Dashboard</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}