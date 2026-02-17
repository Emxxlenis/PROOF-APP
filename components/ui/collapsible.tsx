"use client";

import * as React from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

const Collapsible = CollapsiblePrimitive.Root;

const CollapsibleTrigger = CollapsiblePrimitive.Trigger;

const CollapsibleContent = CollapsiblePrimitive.Content;

// Extended trigger with chevron icon
const CollapsibleTriggerWithIcon = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger> & {
    label?: string;
  }
>(({ className, label, children, ...props }, ref) => (
  <CollapsiblePrimitive.Trigger
    ref={ref}
    className={cn(
      "flex items-center justify-between w-full text-left outline-none focus:outline-none",
      className
    )}
    {...props}
  >
    <span>{label || children}</span>
    <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
  </CollapsiblePrimitive.Trigger>
));
CollapsibleTriggerWithIcon.displayName = "CollapsibleTriggerWithIcon";

export {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleTriggerWithIcon,
  CollapsibleContent,
};
