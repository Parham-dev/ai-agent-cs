'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    toolCalls?: Array<{
      name: string;
      args: Record<string, unknown>;
      result?: unknown;
    }>;
  };
}

interface ShopifyCredentials {
  storeName: string;
  accessToken: string;
}

interface StoreInfo {
  name: string;
  domain: string;
  email: string;
  country?: string;
  currency?: string;
}

export default function ShopifyChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState<ShopifyCredentials | null>(null);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load credentials and store info from localStorage
  useEffect(() => {
    const storedCredentials = localStorage.getItem('shopify_credentials');
    if (storedCredentials) {
      try {
        const creds = JSON.parse(storedCredentials);
        setCredentials(creds);
        
        // Fetch store info for display
        fetch('/api/integrations/shopify/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(creds)
        })
        .then(res => res.json())
        .then(data => {
          if (data.isValid && data.storeInfo) {
            setStoreInfo(data.storeInfo);
          }
        });
      } catch (error) {
        console.error('Failed to load credentials:', error);
      }
    }

    // Add welcome message
    const welcomeMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
              content: 'Hello! I&apos;m your AI product catalog assistant for your Shopify store. I can help you with:\n\n• Searching for products by name, vendor, or category\n• Getting detailed product information and specs\n• Checking inventory levels and pricing\n• Browsing your complete product catalog\n\nTry asking me something like &quot;Show me all your products&quot; or &quot;Search for products with \'shirt\' in the name&quot;.',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !credentials) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: messages.slice(-5), // Send last 5 messages for context
          agentConfig: {
            name: 'Shopify Product Assistant',
            instructions: `You are a helpful assistant for a Shopify store specializing in product information and catalog management. 

Your primary responsibilities:
- Helping customers find products
- Providing detailed product information
- Checking inventory and pricing
- Answering questions about the product catalog

Key capabilities:
- Finding specific products
- Product details and specifications
- Pricing and variants
- Inventory availability
- Product categories and types
- Store catalog browsing

Always provide helpful, detailed responses about products.`,
            integrations: [
              {
                type: 'shopify' as const,
                credentials
              }
            ],
            tools: []
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        metadata: data.metadata
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const exampleQueries = [
    "Show me all your products",
    "Search for products with 'shirt' in the name",
    "What's in stock right now?",
    "Tell me about your product categories"
  ];

  const handleExampleClick = (query: string) => {
    setInput(query);
  };

  if (!credentials) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Shopify Integration Required
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Please set up your Shopify integration first to use the chat interface.
          </p>
          <Link
            href="/setup/shopify"
            className="inline-flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <span>Setup Shopify Integration</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900">
      <div className="container mx-auto px-4 py-8 h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>
          </div>
          
          {storeInfo && (
            <div className="flex items-center space-x-3 bg-white dark:bg-gray-800 rounded-lg px-4 py-2 shadow-md">
              <div className="text-2xl">🛍️</div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">
                  {storeInfo.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {storeInfo.domain}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Chat Container */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Shopify Product Catalog Assistant</h1>
                <p className="text-sm opacity-90">Connected to your store • Ready to help</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-green-500 text-white'
                }`}>
                  {message.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                
                <div className={`flex-1 max-w-3xl ${message.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block p-4 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}>
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    
                    {/* Show tool calls if any */}
                    {message.metadata?.toolCalls && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <div className="text-xs opacity-75 mb-2">🔧 Tools used:</div>
                        {message.metadata.toolCalls.map((tool, index) => (
                          <div key={index} className="text-xs bg-white/10 rounded p-2 mb-1">
                            <strong>{tool.name}</strong>
                            {tool.args && (
                              <div className="text-xs opacity-75 mt-1">
                                {JSON.stringify(tool.args, null, 2)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${
                    message.role === 'user' ? 'text-right' : ''
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Example Queries */}
          {messages.length === 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Try these example queries:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {exampleQueries.map((query, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(query)}
                    className="text-left p-3 text-sm bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
                  >
                                         &quot;{query}&quot;
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about products, pricing, inventory, or browse the catalog..."
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <Send className="w-5 h-5" />
                <span>Send</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 