import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="w-full text-zinc-200 font-sans selection:bg-zinc-800 selection:text-white">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-6 mb-3.5 border-b border-zinc-800/80 pb-2.5 flex items-center gap-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-zinc-100 mt-5 mb-2.5 border-b border-zinc-800/40 pb-1.5 flex items-center gap-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold tracking-wide text-zinc-200 mt-4 mb-2">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-sm leading-relaxed text-zinc-300 mb-3.5 max-w-[800px] font-normal">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="my-3 space-y-2 text-sm text-zinc-300 max-w-[800px] pl-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3 space-y-2 list-decimal list-inside text-sm text-zinc-300 max-w-[800px] pl-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="flex items-start gap-2.5 leading-relaxed text-zinc-300 text-sm">
              <span className="select-none text-zinc-500 mt-1 text-[10px] shrink-0">●</span>
              <div className="flex-1">{children}</div>
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-white bg-zinc-800/90 border border-zinc-700/60 px-1.5 py-0.5 rounded text-[13px]">
              {children}
            </strong>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-zinc-600 pl-4 my-4 text-zinc-400 italic text-sm leading-relaxed bg-zinc-900/40 py-1.5 rounded-r-lg">
              {children}
            </blockquote>
          ),
          code: ({ inline, className, children, ...props }: any) => {
            if (inline) {
              return (
                <code
                  className="font-mono text-[12px] text-zinc-200 bg-zinc-800/90 border border-zinc-700/60 px-1.5 py-0.5 rounded"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <div className="my-4 rounded-xl border border-zinc-800 bg-[#0c0c0c] p-4 overflow-x-auto shadow-sm">
                <pre className="font-mono text-xs text-zinc-200 leading-relaxed" {...props}>
                  {children}
                </pre>
              </div>
            );
          },
          pre: ({ children }) => (
            <div className="my-4 rounded-xl border border-zinc-800 bg-[#0c0c0c] p-4 overflow-x-auto shadow-sm">
              <pre className="font-mono text-xs text-zinc-200 leading-relaxed">{children}</pre>
            </div>
          ),
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-xl border border-zinc-800 shadow-sm max-w-[800px]">
              <table className="w-full text-left text-xs border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-200 font-semibold">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-3.5 py-2.5 font-semibold text-zinc-200 border-b border-zinc-800 text-xs">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3.5 py-2.5 border-b border-zinc-800/60 text-zinc-300 text-xs bg-zinc-900/30">
              {children}
            </td>
          ),
          hr: () => <hr className="border-zinc-800/80 my-6" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
