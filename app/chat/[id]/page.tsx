'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, Bot, User, Activity, Brain } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ApiAgent } from '@/lib/types'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  metadata?: {
    toolCalls?: Array<{
      name: string
      args: Record<string, unknown>
      result?: unknown
    }>
  }
}


export default function AgentChatPage() {
  const params = useParams()
  const agentId = params.id as string
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // State
  const [agent, setAgent] = useState<ApiAgent | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [agentLoading, setAgentLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load agent data
  const fetchAgent = useCallback(async () => {
    try {
      setAgentLoading(true)
      setError(null)
      const agentData = await apiClient.getAgent(agentId)
      setAgent(agentData)
    } catch (err) {
      console.error('Failed to fetch agent:', err)
      setError(err instanceof Error ? err.message : 'Failed to load agent')
    } finally {
      setAgentLoading(false)
    }
  }, [agentId])

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Send message handler
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !agent) return

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Send message to chat API
      const response = await fetch('/api/v2/agents/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: agent.id,
          message: userMessage.content,
          conversationHistory: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: data.success ? data.data.message : 'Sorry, there was an error processing your message.',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      console.error('Chat error:', err)
      const errorMessage: Message = {
        id: `msg-error-${Date.now()}`,
        role: 'assistant',
        content: '❌ Sorry, there was an error processing your message. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Effects
  useEffect(() => {
    if (agentId) {
      fetchAgent()
    }
  }, [agentId, fetchAgent])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Add welcome message when agent loads
  useEffect(() => {
    if (agent && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `👋 Hello! I'm **${agent.name}**.

${agent.systemPrompt || 'I\'m here to help you!'}

How can I help you today?`,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }, [agent, messages.length])

  if (agentLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading agent...</p>
        </div>
      </div>
    )
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Bot className="h-16 w-16 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">Agent not found</h3>
            <p className="text-muted-foreground">{error || 'The requested agent could not be found.'}</p>
          </div>
          <Button asChild>
            <Link href="/agents">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Agents
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/agents" className="flex items-center space-x-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Agents</span>
              </Link>
            </Button>
          </div>
          
          <div className="flex items-center space-x-3 bg-background rounded-lg px-4 py-2 shadow-md">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{agent.name}</p>
              <div className="flex items-center space-x-2">
                <Badge variant={agent.isActive ? "default" : "secondary"} className="text-xs">
                  {agent.isActive ? "Active" : "Inactive"}
                </Badge>
                <span className="text-xs text-muted-foreground">{agent.model}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 bg-background rounded-xl shadow-lg flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-6 py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-lg">{agent.name}</h1>
                <div className="flex items-center space-x-2 text-sm opacity-90">
                  <Activity className="w-4 h-4" />
                  <span>Ready to chat</span>
                  {agent.agentIntegrations && agent.agentIntegrations.length > 0 && (
                    <>
                      <span>•</span>
                      <span>{agent.agentIntegrations.length} integrations connected</span>
                    </>
                  )}
                </div>
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
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                
                <div className={`flex-1 max-w-3xl ${
                  message.role === 'user' ? 'text-right' : ''
                }`}>
                  <div className={`rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-auto inline-block'
                      : 'bg-muted'
                  }`}>
                    <div className="whitespace-pre-wrap text-sm">
                      {message.content}
                    </div>
                  </div>
                  <div className={`text-xs text-muted-foreground mt-1 ${
                    message.role === 'user' ? 'text-right' : ''
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-muted text-muted-foreground">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t bg-background p-4">
            <div className="flex space-x-4">
              <div className="flex-1">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Message ${agent.name}...`}
                  rows={1}
                  className="w-full resize-none rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={isLoading || !agent.isActive}
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading || !agent.isActive}
                size="lg"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            {!agent.isActive && (
              <p className="text-xs text-muted-foreground mt-2">
                This agent is currently inactive. Please activate it to start chatting.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
