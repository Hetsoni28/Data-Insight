"use client"

import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface BuilderAiInsightWidgetProps {
  widget: any
}

export function BuilderAiInsightWidget({ widget }: BuilderAiInsightWidgetProps) {
  return (
    <div className="w-full h-full overflow-y-auto p-4 text-sm text-slate-700 dark:text-slate-300">
      <div className="text-sm text-slate-700 dark:text-slate-300">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-4 mb-2 text-slate-900 dark:text-white" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-4 mb-2 text-slate-900 dark:text-white" {...props} />,
            h3: ({node, ...props}) => <h3 className="text-base font-bold mt-4 mb-2 text-slate-900 dark:text-white" {...props} />,
            p: ({node, ...props}) => <p className="mb-3 leading-relaxed" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-1" {...props} />,
            li: ({node, ...props}) => <li className="pl-1" {...props} />,
            strong: ({node, ...props}) => <strong className="font-bold text-slate-900 dark:text-white" {...props} />,
            a: ({node, ...props}) => <a className="text-emerald-600 hover:underline" {...props} />,
          }}
        >
          {widget.config?.text || 'Configure text in properties...'}
        </ReactMarkdown>
      </div>
    </div>
  )
}
