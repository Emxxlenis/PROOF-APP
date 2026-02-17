"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Play, CheckCircle2, ArrowRight, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface GuideStep {
  title: string;
  description: string;
  action?: string;
}

interface GuideCardProps {
  title: string;
  description: string;
  steps: GuideStep[];
  onStart?: () => void;
  completed?: boolean;
  variant?: "default" | "success" | "info";
  className?: string;
}

export function GuideCard({
  title,
  description,
  steps,
  onStart,
  completed = false,
  variant = "default",
  className,
}: GuideCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const variantStyles = {
    default: "border-primary/20 bg-primary/5",
    success: "border-green-500/20 bg-green-500/5",
    info: "border-blue-500/20 bg-blue-500/5",
  };

  return (
    <Card className={cn("border-2 transition-all", variantStyles[variant], className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{title}</CardTitle>
              {completed && (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Completado
                </Badge>
              )}
            </div>
            <CardDescription className="text-sm leading-relaxed">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isExpanded && (
          <div className="space-y-3 mb-4">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex gap-3 p-3 rounded-lg bg-background/50 border border-border/50"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">{step.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                  {step.action && (
                    <p className="text-xs text-primary mt-1 font-medium">
                      → {step.action}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Ocultar" : "Ver pasos"} ({steps.length})
          </Button>
          {onStart && (
            <Button
              size="sm"
              onClick={onStart}
              className="bg-gradient-to-r from-primary to-purple-600"
              disabled={completed}
            >
              {completed ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Completado
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Comenzar
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}





