import {
  ActionBarPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from "@assistant-ui/react";
import type { FC } from "react";
import {
  ArrowDownIcon,
  Bot,
  CheckIcon,
  CopyIcon,
  SendHorizontalIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { MarkdownText } from "@/components/assistant-ui/markdown-text";
import type { ApiAgent } from "@/lib/types";

/**
 * Chat Thread Component
 * Optimized for two-column layout within DashboardLayout
 */
interface ChatThreadProps {
  agent?: ApiAgent | null;
}

export const ChatThread: FC<ChatThreadProps> = ({ agent }) => {
  return (
    <ThreadPrimitive.Root
      className="bg-background flex flex-col h-full max-h-full relative overflow-hidden"
      style={{
        ["--thread-max-width" as string]: "100%", // Full width within container
      }}
    >
      {/* Chat Messages Area */}
      <ThreadPrimitive.Viewport 
        className="flex-1 min-h-0 overflow-y-auto bg-inherit scrollbar-hide hover:scrollbar-show scroll-smooth"
        autoScroll
      >
        <div className="flex flex-col px-4 py-6 min-h-full max-w-4xl mx-auto">
          <ThreadWelcome agent={agent} />

          <ThreadPrimitive.Messages
            components={{
              UserMessage: UserMessage,
              EditComposer: EditComposer,
              AssistantMessage: AssistantMessage,
            }}
          />

          {/* Thinking indicator when AI is processing */}
          <ThreadPrimitive.If running>
            <ThinkingIndicator />
          </ThreadPrimitive.If>

          <ThreadPrimitive.If empty={false}>
            <div className="flex-grow min-h-8" />
          </ThreadPrimitive.If>
        </div>
      </ThreadPrimitive.Viewport>

      {/* Scroll to Bottom Button */}
      <ThreadScrollToBottom />

      {/* Composer at Bottom - positioned within container, aligned with sidebar footer */}
      <div className="flex-shrink-0 bg-background border-t border-gray-200 dark:border-gray-700" style={{ height: '80px' }}>
        <div className="p-4 h-full flex items-center">
          <div className="w-full max-w-4xl mx-auto">
            <Composer />
          </div>
        </div>
      </div>
    </ThreadPrimitive.Root>
  );
};

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <Button
        variant="outline"
        size="icon"
        className="absolute bottom-20 right-4 z-40 rounded-full disabled:invisible shadow-lg bg-background border-2 w-10 h-10"
      >
        <ArrowDownIcon className="h-4 w-4" />
      </Button>
    </ThreadPrimitive.ScrollToBottom>
  );
};

const ThreadWelcome: FC<{ agent?: ApiAgent | null }> = ({ agent }) => {
  // Create a friendly greeting based on agent name
  const getGreeting = () => {
    if (agent?.name) {
      return `Hi! I'm ${agent.name} 👋`;
    }
    return "How can I help you today?";
  };

  // Get description or fallback message
  const getDescription = () => {
    if (agent?.description) {
      return agent.description;
    }
    return "I'm here to assist you with any questions or concerns you may have.";
  };

  return (
    <ThreadPrimitive.Empty>
      <div className="flex w-full flex-col items-center justify-center min-h-[50vh] px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 mb-6 mx-auto">
            <Bot className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
            {getGreeting()}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-base max-w-lg mx-auto leading-relaxed">
            {getDescription()}
          </p>
        </div>
        <ThreadWelcomeSuggestions />
      </div>
    </ThreadPrimitive.Empty>
  );
};

const ThreadWelcomeSuggestions: FC = () => {
  return (
    <div className="mt-8 flex w-full items-stretch justify-center gap-3 max-w-3xl flex-wrap">
      <ThreadPrimitive.Suggestion
        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 flex flex-1 flex-col items-center justify-center rounded-2xl border border-gray-200 dark:border-gray-700 p-4 transition-colors ease-in cursor-pointer min-w-[200px]"
        prompt="I need help with my order"
        method="replace"
        autoSend
      >
        <span className="text-sm text-center font-medium text-gray-700 dark:text-gray-300">
          Help with my order
        </span>
      </ThreadPrimitive.Suggestion>
      <ThreadPrimitive.Suggestion
        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 flex flex-1 flex-col items-center justify-center rounded-2xl border border-gray-200 dark:border-gray-700 p-4 transition-colors ease-in cursor-pointer min-w-[200px]"
        prompt="What products do you offer?"
        method="replace"
        autoSend
      >
        <span className="text-sm text-center font-medium text-gray-700 dark:text-gray-300">
          Browse products
        </span>
      </ThreadPrimitive.Suggestion>
      <ThreadPrimitive.Suggestion
        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 flex flex-1 flex-col items-center justify-center rounded-2xl border border-gray-200 dark:border-gray-700 p-4 transition-colors ease-in cursor-pointer min-w-[200px]"
        prompt="I have a question about returns"
        method="replace"
        autoSend
      >
        <span className="text-sm text-center font-medium text-gray-700 dark:text-gray-300">
          Returns & refunds
        </span>
      </ThreadPrimitive.Suggestion>
    </div>
  );
};

const Composer: FC = () => {
  return (
    <ComposerPrimitive.Root className="relative flex w-full items-end rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 focus-within:border-gray-300 dark:focus-within:border-gray-600">
      <ComposerPrimitive.Input
        rows={1}
        autoFocus
        placeholder="Message..."
        className="placeholder:text-muted-foreground max-h-32 min-h-12 flex-grow resize-none border-none bg-transparent px-4 py-3 text-sm outline-none focus:ring-0 disabled:cursor-not-allowed"
      />
      <div className="absolute right-2 bottom-2">
        <ComposerAction />
      </div>
    </ComposerPrimitive.Root>
  );
};

const ComposerAction: FC = () => {
  return (
    <>
      <ThreadPrimitive.If running={false}>
        <ComposerPrimitive.Send asChild>
          <Button
            variant="default"
            size="icon"
            className="size-8 rounded-lg bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 disabled:opacity-50"
          >
            <SendHorizontalIcon className="size-4" />
          </Button>
        </ComposerPrimitive.Send>
      </ThreadPrimitive.If>
      <ThreadPrimitive.If running>
        <ComposerPrimitive.Cancel asChild>
          <Button
            variant="default"
            size="icon"
            className="size-8 rounded-lg bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            <CircleStopIcon />
          </Button>
        </ComposerPrimitive.Cancel>
      </ThreadPrimitive.If>
    </>
  );
};

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="flex w-full justify-end py-4">
      <div className="bg-muted text-foreground max-w-[min(80%,32rem)] break-normal rounded-3xl px-5 py-2.5">
        <MessagePrimitive.Parts />
      </div>
    </MessagePrimitive.Root>
  );
};

const EditComposer: FC = () => {
  return (
    <ComposerPrimitive.Root className="bg-muted my-4 flex w-full flex-col gap-2 rounded-xl">
      <ComposerPrimitive.Input className="text-foreground flex h-8 w-full resize-none bg-transparent p-4 pb-0 outline-none" />

      <div className="mx-3 mb-3 flex items-center justify-center gap-2 self-end">
        <ComposerPrimitive.Cancel asChild>
          <Button variant="ghost">Cancel</Button>
        </ComposerPrimitive.Cancel>
        <ComposerPrimitive.Send asChild>
          <Button>Send</Button>
        </ComposerPrimitive.Send>
      </div>
    </ComposerPrimitive.Root>
  );
};

const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="flex w-full flex-col justify-start py-4">
      <div className="text-foreground max-w-[min(80%,32rem)] break-normal leading-7">
        <MessagePrimitive.Parts components={{ Text: MarkdownText }} />
      </div>
      <div className="mt-2">
        <AssistantActionBar />
      </div>
    </MessagePrimitive.Root>
  );
};

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="never"
      className="text-muted-foreground flex gap-1"
    >
      <MessagePrimitive.If last>
        <ActionBarPrimitive.Copy asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MessagePrimitive.If copied>
              <CheckIcon className="h-4 w-4" />
            </MessagePrimitive.If>
            <MessagePrimitive.If copied={false}>
              <CopyIcon className="h-4 w-4" />
            </MessagePrimitive.If>
          </Button>
        </ActionBarPrimitive.Copy>
      </MessagePrimitive.If>
    </ActionBarPrimitive.Root>
  );
};

const CircleStopIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      width="16"
      height="16"
    >
      <rect width="10" height="10" x="3" y="3" rx="2" />
    </svg>
  );
};

const ThinkingIndicator: FC = () => {
  return (
    <div className="w-full grid grid-cols-[auto_auto_1fr] grid-rows-[auto_1fr] py-4">
      <div className="col-span-2 col-start-2 row-start-1 my-1.5 max-w-[80%] break-words leading-7">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
          </div>
          <span className="text-sm">AI is thinking...</span>
        </div>
      </div>
    </div>
  );
};