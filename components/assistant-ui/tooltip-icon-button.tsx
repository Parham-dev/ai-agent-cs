import { forwardRef, ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";

interface TooltipIconButtonProps extends 
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  tooltip: string;
  side?: "top" | "bottom" | "left" | "right";
  children: ReactNode;
}

export const TooltipIconButton = forwardRef<HTMLButtonElement, TooltipIconButtonProps>(
  ({ tooltip, side = "bottom", children, ...props }, ref) => {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button ref={ref} {...props}>
            {children}
            <span className="sr-only">{tooltip}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side={side}>{tooltip}</TooltipContent>
      </Tooltip>
    );
  }
);

TooltipIconButton.displayName = "TooltipIconButton";
