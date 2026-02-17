"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
  agentData?: {
    bgColor?: string;
    textColor?: string;
    color?: string;
  };
}

export function MarkdownRenderer({ content, agentData }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({node, ...props}) => (
          <h1 className="text-xl font-bold mt-5 mb-4 text-gray-800 border-b border-blue-200 pb-2 first:mt-0" {...props}>
            {props.children}
          </h1>
        ),
        h2: ({node, ...props}) => (
          <h2 className="text-lg font-bold mt-4 mb-3 text-gray-800 flex items-center gap-2 first:mt-0" {...props}>
            <div className={`w-1 h-5 ${agentData?.bgColor || 'bg-blue-600'} rounded-full`}></div>
            {props.children}
          </h2>
        ),
        h3: ({node, ...props}) => (
          <h3 className="text-base font-semibold mt-3 mb-2 text-gray-800" {...props}>{props.children}</h3>
        ),
        p: ({node, ...props}: any) => {
          const cleanedText = typeof props.children === 'string' 
            ? props.children.replace(/\{#[\w-]+\}/g, '') 
            : props.children;
          if (!cleanedText) return null;
          return <p className="mb-4 leading-relaxed text-gray-700 first:mt-0">{cleanedText}</p>;
        },
        ul: ({node, ...props}) => (
          <ul className="list-none mb-4 space-y-2 text-gray-700" {...props} />
        ),
        ol: ({node, ...props}) => (
          <ol className="list-none mb-4 space-y-2 text-gray-700" {...props} />
        ),
        li: ({node, ...props}: any) => {
          const isOrdered = node?.parent?.tagName === 'ol';
          const index = Array.from(node?.parent?.children || []).indexOf(node) + 1;
          const extractText = (children: any): any => {
            if (typeof children === 'string') return children.replace(/\{#[\w-]+\}/g, '');
            if (Array.isArray(children)) return children.map(extractText);
            if (children?.props?.children) return extractText(children.props.children);
            return children;
          };
          const content = extractText(props.children);
          return (
            <li className="flex items-start gap-2">
              {isOrdered ? (
                <span className={`flex-shrink-0 w-5 h-5 rounded-full ${agentData?.bgColor || 'bg-blue-600'} text-white flex items-center justify-center text-xs font-medium`}>
                  {index}
                </span>
              ) : (
                <span className={`flex-shrink-0 w-4 h-4 ${agentData?.textColor || 'text-blue-600'} mt-0.5`}>•</span>
              )}
              <span className="flex-1">{content}</span>
            </li>
          );
        },
        strong: ({node, ...props}: any) => (
          <strong className="font-semibold text-gray-800">{props.children}</strong>
        ),
        em: ({node, ...props}) => (
          <em className="text-gray-600 font-medium not-italic">{props.children}</em>
        ),
        code: ({node, inline, ...props}: any) => {
          return inline ? (
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800">{props.children}</code>
          ) : (
            <code className="block bg-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto my-3">{props.children}</code>
          );
        },
        blockquote: ({node, ...props}) => (
          <blockquote className={`border-l-4 border-${agentData?.color || 'blue-500'} pl-4 my-4 text-gray-600 bg-blue-50/50 py-3 rounded-r-lg`}>
            <span className="inline h-4 w-4 text-orange-500 mr-2">💡</span>
            {props.children}
          </blockquote>
        ),
        a: ({node, ...props}) => (
          <a className={`${agentData?.textColor || 'text-blue-600'} hover:underline font-medium`} target="_blank" rel="noopener noreferrer" {...props}>
            {props.children}
            <span className="inline h-3 w-3 ml-1">→</span>
          </a>
        ),
      }}
    >
      {content.replace(/\{#[\w-]+\}/g, '')}
    </ReactMarkdown>
  );
}




