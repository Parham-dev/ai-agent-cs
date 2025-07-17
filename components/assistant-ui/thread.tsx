'use client'

import { 
  ThreadPrimitive,
  MessagePrimitive,
  ComposerPrimitive,
} from '@assistant-ui/react'
import { Bot, User, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Thread() {
  return (
    <ThreadPrimitive.Root className="flex h-full flex-col">
      {/* Messages Container */}
      <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto p-4 space-y-4">
        <ThreadPrimitive.Messages
          components={{
            UserMessage: UserMessage,
            AssistantMessage: AssistantMessage,
          }}
        />
      </ThreadPrimitive.Viewport>

      {/* Composer */}
      <div className="border-t bg-background p-4">
        <ComposerPrimitive.Root className="flex space-x-4">
          <ComposerPrimitive.Input 
            placeholder="Type your message..."
            className="flex-1 resize-none rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <ComposerPrimitive.Send asChild>
            <Button size="lg">
              <Send className="w-4 h-4" />
            </Button>
          </ComposerPrimitive.Send>
        </ComposerPrimitive.Root>
      </div>
    </ThreadPrimitive.Root>
  )
}

function UserMessage() {
  return (
    <MessagePrimitive.Root className="flex items-start space-x-3 flex-row-reverse space-x-reverse">
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-primary text-primary-foreground">
        <User className="w-4 h-4" />
      </div>
      
      <div className="flex-1 max-w-3xl text-right">
        <div className="bg-primary text-primary-foreground ml-auto inline-block rounded-2xl px-4 py-3">
          <div className="whitespace-pre-wrap text-sm">
            <MessagePrimitive.Content />
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-1 text-right">
          {/* CreatedAt timestamp will be added later */}
        </div>
      </div>
    </MessagePrimitive.Root>
  )
}

function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="flex items-start space-x-3">
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-muted text-muted-foreground">
        <Bot className="w-4 h-4" />
      </div>
      
      <div className="flex-1 max-w-3xl">
        <div className="bg-muted rounded-2xl px-4 py-3">
          <div className="whitespace-pre-wrap text-sm">
            <MessagePrimitive.Content />
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {/* CreatedAt timestamp will be added later */}
        </div>
      </div>
    </MessagePrimitive.Root>
  )
}