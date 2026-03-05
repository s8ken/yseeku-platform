'use client';

import React from 'react';
import { cn } from '@/lib/utils';

function renderInline(text: string, keyPrefix: string): React.ReactNode {
  const segments: React.ReactNode[] = [];
  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g;
  let cursor = 0;
  let m: RegExpExecArray | null;

  while ((m = pattern.exec(text)) !== null) {
    if (m.index > cursor) segments.push(text.slice(cursor, m.index));

    if (m[0].startsWith('**')) {
      segments.push(
        <strong key={`${keyPrefix}-b${m.index}`} className="font-semibold text-slate-900 dark:text-slate-100">
          {m[2]}
        </strong>
      );
    } else if (m[0].startsWith('*')) {
      segments.push(<em key={`${keyPrefix}-i${m.index}`}>{m[3]}</em>);
    } else {
      segments.push(
        <code
          key={`${keyPrefix}-c${m.index}`}
          className="px-1 py-0.5 rounded text-[0.85em] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono"
        >
          {m[4]}
        </code>
      );
    }
    cursor = m.index + m[0].length;
  }

  if (cursor < text.length) segments.push(text.slice(cursor));

  if (segments.length === 0) return null;
  if (segments.length === 1) return segments[0];
  return <>{segments}</>;
}

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export function MarkdownMessage({ content, className }: MarkdownMessageProps) {
  const nodes = React.useMemo(() => {
    const lines = content.split('\n');
    const result: React.ReactNode[] = [];
    let i = 0;
    let key = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Code block
      if (line.trimStart().startsWith('```')) {
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        result.push(
          <pre
            key={key++}
            className="my-2 p-3 rounded-lg bg-slate-900 dark:bg-slate-800 overflow-x-auto border border-slate-700"
          >
            <code className="text-xs font-mono text-slate-200 leading-relaxed">
              {codeLines.join('\n')}
            </code>
          </pre>
        );
        i++; // skip closing ```
        continue;
      }

      // Horizontal rule
      if (/^-{3,}$/.test(line.trim())) {
        result.push(
          <hr key={key++} className="my-3 border-slate-200 dark:border-slate-700" />
        );
        i++;
        continue;
      }

      // Heading h3
      const h3 = line.match(/^### (.+)/);
      if (h3) {
        result.push(
          <h3 key={key++} className="text-sm font-bold mt-3 mb-1 text-slate-900 dark:text-slate-100">
            {renderInline(h3[1], String(key))}
          </h3>
        );
        i++;
        continue;
      }

      // Heading h2
      const h2 = line.match(/^## (.+)/);
      if (h2) {
        result.push(
          <h2 key={key++} className="text-base font-bold mt-3 mb-1 text-slate-900 dark:text-slate-100">
            {renderInline(h2[1], String(key))}
          </h2>
        );
        i++;
        continue;
      }

      // Heading h1
      const h1 = line.match(/^# (.+)/);
      if (h1) {
        result.push(
          <h1 key={key++} className="text-lg font-bold mt-3 mb-1 text-slate-900 dark:text-slate-100">
            {renderInline(h1[1], String(key))}
          </h1>
        );
        i++;
        continue;
      }

      // Bullet list — collect consecutive bullet items
      if (/^[-•*] /.test(line)) {
        const items: React.ReactNode[] = [];
        while (i < lines.length && /^[-•*] /.test(lines[i])) {
          items.push(
            <li key={i}>{renderInline(lines[i].replace(/^[-•*] /, ''), `li-${i}`)}</li>
          );
          i++;
        }
        result.push(
          <ul key={key++} className="my-1 ml-4 list-disc space-y-0.5">
            {items}
          </ul>
        );
        continue;
      }

      // Numbered list — collect consecutive numbered items
      if (/^\d+\. /.test(line)) {
        const items: React.ReactNode[] = [];
        while (i < lines.length && /^\d+\. /.test(lines[i])) {
          items.push(
            <li key={i}>{renderInline(lines[i].replace(/^\d+\. /, ''), `li-${i}`)}</li>
          );
          i++;
        }
        result.push(
          <ol key={key++} className="my-1 ml-4 list-decimal space-y-0.5">
            {items}
          </ol>
        );
        continue;
      }

      // Empty line — vertical spacing between blocks
      if (line.trim() === '') {
        if (result.length > 0) {
          result.push(<div key={key++} className="h-2" />);
        }
        i++;
        continue;
      }

      // Normal paragraph
      result.push(
        <p key={key++} className="leading-relaxed">
          {renderInline(line, String(key))}
        </p>
      );
      i++;
    }

    return result;
  }, [content]);

  return (
    <div className={cn('text-sm text-slate-800 dark:text-slate-200 space-y-1', className)}>
      {nodes}
    </div>
  );
}
