"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Button, type buttonVariants } from "./button";

export interface ResetButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  onReset: () => void;
  confirmationMessage?: string;
  showIcon?: boolean;
  disabled?: boolean;
}

const ResetButton = React.forwardRef<HTMLButtonElement, ResetButtonProps>(
  (
    {
      onReset,
      confirmationMessage = "Are you sure you want to reset? All entered data will be lost.",
      showIcon = true,
      className,
      variant = "outline",
      size = "default",
      children,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const handleReset = (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (confirmationMessage && !window.confirm(confirmationMessage)) {
        return;
      }
      onReset();
    };

    return (
      <Button
        ref={ref}
        type="button"
        variant={variant}
        size={size}
        onClick={handleReset}
        className={cn("flex items-center gap-2", className)}
        disabled={disabled}
        {...props}
      >
        {showIcon && <RefreshCw className="h-4 w-4" />}
        {children || "Reset"}
      </Button>
    );
  }
);

ResetButton.displayName = "ResetButton";

export { ResetButton };
