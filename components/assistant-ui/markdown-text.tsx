import { TextMessagePartComponent } from "@assistant-ui/react";

export const MarkdownText: TextMessagePartComponent = ({ text }) => {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      {text}
    </div>
  );
};
