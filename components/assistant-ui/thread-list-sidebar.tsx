'use client'

import { FC } from 'react'
import { 
  ThreadListPrimitive, 
  ThreadListItemPrimitive
} from '@assistant-ui/react'
import { 
  Plus, 
  MessageSquare, 
  Edit3,
  Check,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { Input } from '@/components/ui/input'

/**
 * ThreadList Sidebar Component
 * Provides session management UI for multi-turn conversations
 */
export const ThreadListSidebar: FC = () => {
  return (
    <div className="w-80 h-full bg-background border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <ThreadListPrimitive.Root className="flex flex-col h-full">
        {/* Header - aligned with chat area header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <ThreadListPrimitive.New>
                  <Plus className="h-4 w-4" />
                </ThreadListPrimitive.New>
              </Button>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Chat Sessions
              </h2>
            </div>
          </div>
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto">
          <ThreadListItems />
        </div>

        {/* Footer - aligned with chat area composer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700" style={{ height: '88px' }}>
          <ThreadListStats />
        </div>
      </ThreadListPrimitive.Root>
    </div>
  )
}


/**
 * New Chat Button styled as a session item (appears in the session list)
 */
const ThreadListNewItemButton: FC = () => {
  return (
    <ThreadListPrimitive.New asChild>
      <div className="w-full p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors border border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 flex-shrink-0">
            <Plus className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Start New Chat
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Click to create a new conversation
              </span>
            </div>
          </div>
        </div>
      </div>
    </ThreadListPrimitive.New>
  )
}

/**
 * Thread List Items
 */
const ThreadListItems: FC = () => {
  return (
    <div className="p-2 space-y-1">
      <ThreadListPrimitive.Items 
        components={{
          ThreadListItem: ThreadListItem
        }}
      />
      {/* New Chat Button as last item in the list */}
      <ThreadListNewItemButton />
    </div>
  )
}

/**
 * Individual Thread List Item
 */
const ThreadListItem: FC = () => {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')

  return (
    <ThreadListItemPrimitive.Root className="group relative">
      <ThreadListItemPrimitive.Trigger asChild>
        <div className="w-full p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 flex-shrink-0">
              <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <ThreadItemEditForm 
                  editTitle={editTitle}
                  setEditTitle={setEditTitle}
                  setIsEditing={setIsEditing}
                />
              ) : (
                <ThreadItemContent 
                  onEdit={(currentTitle: string) => {
                    setIsEditing(true)
                    setEditTitle(currentTitle)
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </ThreadListItemPrimitive.Trigger>
    </ThreadListItemPrimitive.Root>
  )
}

/**
 * Thread Item Content (Display Mode)
 */
interface ThreadItemContentProps {
  onEdit: (currentTitle: string) => void
}

const ThreadItemContent: FC<ThreadItemContentProps> = ({ onEdit }) => {
  return (
    <>
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" data-title>
          <ThreadListItemPrimitive.Title />
        </div>
        
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation()
              // Get the current title text content for editing
              const titleElement = e.currentTarget.closest('.group')?.querySelector('[data-title]')
              const currentTitle = titleElement?.textContent || 'Untitled Chat'
              onEdit(currentTitle)
            }}
          >
            <Edit3 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Auto-generated title • Click edit to change
        </span>
      </div>
    </>
  )
}

/**
 * Thread Item Edit Form
 */
interface ThreadItemEditFormProps {
  editTitle: string
  setEditTitle: (title: string) => void
  setIsEditing: (editing: boolean) => void
}

const ThreadItemEditForm: FC<ThreadItemEditFormProps> = ({ 
  editTitle, 
  setEditTitle, 
  setIsEditing 
}) => {
  const handleSave = () => {
    if (editTitle.trim()) {
      // Use ThreadListItemPrimitive.Rename to update the title
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditTitle('')
  }

  return (
    <ThreadListItemPrimitive.Rename asChild>
      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
        <Input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="h-8 text-sm"
          placeholder="Chat title..."
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSave()
            } else if (e.key === 'Escape') {
              handleCancel()
            }
          }}
        />
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleSave}
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCancel}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </ThreadListItemPrimitive.Rename>
  )
}


/**
 * Thread List Statistics
 */
const ThreadListStats: FC = () => {
  // For now, show static stats since we need to implement the actual thread list state
  const totalThreads = 0 // Will be populated when thread list is working

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Chat Sessions</span>
        <Badge variant="secondary" className="text-xs">
          {totalThreads}
        </Badge>
      </div>
      
      <div className="text-xs text-gray-400 dark:text-gray-500">
        Conversations have auto-generated titles that can be edited
      </div>
    </div>
  )
}