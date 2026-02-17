"use client";

import { HelpCircle, Info, Lightbulb, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface HelpTooltipProps {
  content: string;
  variant?: "default" | "info" | "tip" | "warning";
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
}

const iconMap = {
  default: HelpCircle,
  info: Info,
  tip: Lightbulb,
  warning: AlertCircle,
};

const colorMap = {
  default: "text-muted-foreground hover:text-primary",
  info: "text-blue-500 hover:text-blue-600",
  tip: "text-yellow-500 hover:text-yellow-600",
  warning: "text-orange-500 hover:text-orange-600",
};

export function HelpTooltip({ 
  content, 
  variant = "default", 
  className,
  side = "top"
}: HelpTooltipProps) {
  const Icon = iconMap[variant];
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors",
              colorMap[variant],
              className
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <p className="text-sm leading-relaxed">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}





