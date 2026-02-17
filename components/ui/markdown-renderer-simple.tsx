"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CheckCircle2 } from "lucide-react";

interface MarkdownRendererSimpleProps {
  content: string;
}

export function MarkdownRendererSimple({ content }: MarkdownRendererSimpleProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({node, ...props}) => <h1 className="text-base font-bold mt-3 mb-1 text-foreground" {...props} />,
        h2: ({node, ...props}) => <h2 className="text-sm font-bold mt-2 mb-1 text-foreground" {...props} />,
        h3: ({node, ...props}) => <h3 className="text-xs font-semibold mt-2 mb-1 text-foreground" {...props} />,
        p: ({node, ...props}) => <p className="mb-2 leading-relaxed text-xs text-foreground/90" {...props} />,
        ul: ({node, ...props}) => <ul className="list-none mb-2 space-y-1.5 ml-1" {...props} />,
        ol: ({node, ...props}) => <ol className="list-none mb-2 space-y-1.5 ml-1" {...props} />,
        li: ({node, ...props}: any) => (
          <li className="flex items-start gap-2 text-xs text-foreground/90">
            <CheckCircle2 className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
            <span>{props.children}</span>
          </li>
        ),
        strong: ({node, ...props}) => <strong className="font-bold text-foreground" {...props} />,
        code: ({node, inline, ...props}: any) => 
          inline ? (
            <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono" {...props} />
          ) : (
            <code className="block bg-muted p-2 rounded text-xs font-mono overflow-x-auto" {...props} />
          ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}




