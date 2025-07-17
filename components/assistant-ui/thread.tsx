import {
  ActionBarPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from "@assistant-ui/react";
import type { FC } from "react";
import {
  ArrowDownIcon,
  CheckIcon,
  CopyIcon,
  RefreshCwIcon,
  SendHorizontalIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { MarkdownText } from "@/components/assistant-ui/markdown-text";

export const Thread: FC = () => {
  return (
    <ThreadPrimitive.Root
      className="bg-background flex flex-col h-full relative"
      style={{
        ["--thread-max-width" as string]: "48rem",
      }}
    >
      {/* Chat Messages Area */}
      <ThreadPrimitive.Viewport 
        className="flex-1 overflow-y-auto bg-inherit"
        autoScroll
      >
        <div className="flex flex-col items-center px-4 py-6 pb-28 min-h-full">
          <ThreadWelcome />

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

      {/* Fixed Composer at Bottom */}
      <div className="fixed bottom-10 left-0 right-0 z-50 bg-background/98 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700">
        <div className="p-4 lg:ml-[280px]">
          <div className="w-full max-w-[var(--thread-max-width)] mx-auto">
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
        className="fixed bottom-24 z-40 rounded-full disabled:invisible shadow-lg bg-background border-2 lg:left-[calc(50%+140px)] left-1/2 transform -translate-x-1/2 w-10 h-10"
      >
        <ArrowDownIcon className="h-4 w-4" />
      </Button>
    </ThreadPrimitive.ScrollToBottom>
  );
};

const ThreadWelcome: FC = () => {
  return (
    <ThreadPrimitive.Empty>
      <div className="flex w-full max-w-4xl flex-col items-center justify-center min-h-[50vh] px-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            How can I help you today?
          </h1>
        </div>
        <ThreadWelcomeSuggestions />
      </div>
    </ThreadPrimitive.Empty>
  );
};

const ThreadWelcomeSuggestions: FC = () => {
  return (
    <div className="mt-8 flex w-full items-stretch justify-center gap-3 max-w-2xl">
      <ThreadPrimitive.Suggestion
        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 flex flex-1 flex-col items-center justify-center rounded-2xl border border-gray-200 dark:border-gray-700 p-4 transition-colors ease-in cursor-pointer"
        prompt="What services do you offer?"
        method="replace"
        autoSend
      >
        <span className="text-sm text-center font-medium text-gray-700 dark:text-gray-300">
          What services do you offer?
        </span>
      </ThreadPrimitive.Suggestion>
      <ThreadPrimitive.Suggestion
        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 flex flex-1 flex-col items-center justify-center rounded-2xl border border-gray-200 dark:border-gray-700 p-4 transition-colors ease-in cursor-pointer"
        prompt="How can I get support?"
        method="replace"
        autoSend
      >
        <span className="text-sm text-center font-medium text-gray-700 dark:text-gray-300">
          How can I get support?
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
    <MessagePrimitive.Root className="grid w-full max-w-[var(--thread-max-width)] auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-2 py-4 [&:where(>*)]:col-start-2">
      <div className="bg-muted text-foreground col-start-2 row-start-2 max-w-[calc(var(--thread-max-width)*0.8)] break-words rounded-3xl px-5 py-2.5">
        <MessagePrimitive.Parts />
      </div>
    </MessagePrimitive.Root>
  );
};


const EditComposer: FC = () => {
  return (
    <ComposerPrimitive.Root className="bg-muted my-4 flex w-full max-w-[var(--thread-max-width)] flex-col gap-2 rounded-xl">
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
    <MessagePrimitive.Root className="relative grid w-full max-w-[var(--thread-max-width)] grid-cols-[auto_auto_1fr] grid-rows-[auto_1fr] py-4">
      <div className="text-foreground col-span-2 col-start-2 row-start-1 my-1.5 max-w-[calc(var(--thread-max-width)*0.8)] break-words leading-7">
        <MessagePrimitive.Parts components={{ Text: MarkdownText }} />
      </div>

      <AssistantActionBar />
    </MessagePrimitive.Root>
  );
};

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="never"
      className="text-muted-foreground col-start-3 row-start-2 -ml-1 flex gap-1"
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
        <ActionBarPrimitive.Reload asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <RefreshCwIcon className="h-4 w-4" />
          </Button>
        </ActionBarPrimitive.Reload>
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
    <div className="w-full max-w-[var(--thread-max-width)] grid grid-cols-[auto_auto_1fr] grid-rows-[auto_1fr] py-4">
      <div className="col-span-2 col-start-2 row-start-1 my-1.5 max-w-[calc(var(--thread-max-width)*0.8)] break-words leading-7">
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
