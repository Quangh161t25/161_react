import React, { useState } from 'react';
import {
  Info,
  Lightbulb,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  CheckSquare,
  Square,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

// Helper to strip markdown to clean plain text for table cells/snippets
export function stripMarkdown(content: string): string {
  if (!content) return '';
  return content
    // Remove HTML tags
    .replace(/<[^>]*>?/gm, '')
    // Replace callout tags with clean labels
    .replace(/>?\s*\[!NOTE\]/gi, 'Lưu ý: ')
    .replace(/>?\s*\[!TIP\]/gi, 'Mẹo: ')
    .replace(/>?\s*\[!WARNING\]/gi, 'Cảnh báo: ')
    .replace(/>?\s*\[!IMPORTANT\]/gi, 'Quan trọng: ')
    .replace(/>?\s*\[!CAUTION\]/gi, 'Cẩn trọng: ')
    // Remove headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove blockquotes and list bullets
    .replace(/^[>*\-+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/^-\s*\[[ xX]\]\s+/gm, '')
    // Remove bold/italic/strike
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    // Remove inline code & code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Remove links & images: [text](url) -> text, ![alt](url) -> alt
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    // Remove table pipes
    .replace(/\|/g, ' ')
    // Collapse excess whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

interface MarkdownRendererProps {
  content: string;
  className?: string;
  onImageClick?: (url: string) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
  onImageClick,
}) => {
  if (!content || !content.trim()) {
    return <p className="text-muted-foreground italic text-center py-6">Chưa có nội dung...</p>;
  }

  // Pre-process: standardize newlines
  const rawText = content.replace(/\r\n/g, '\n');

  // Split into structural blocks
  const blocks = parseMarkdownBlocks(rawText);

  return (
    <div className={`markdown-body space-y-3.5 text-foreground text-xs sm:text-sm leading-relaxed ${className}`}>
      {blocks.map((block, idx) => (
        <React.Fragment key={idx}>{renderBlock(block, idx, onImageClick)}</React.Fragment>
      ))}
    </div>
  );
};

// Types of parsed blocks
type BlockType =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'callout'
  | 'blockquote'
  | 'code'
  | 'table'
  | 'ul'
  | 'ol'
  | 'checklist'
  | 'hr'
  | 'image'
  | 'paragraph';

interface ParsedBlock {
  type: BlockType;
  content: string;
  extra?: any;
}

function parseMarkdownBlocks(text: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  const lines = text.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // 1. Code block ```
    if (trimmed.startsWith('```')) {
      const lang = trimmed.replace('```', '').trim() || 'text';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push({
        type: 'code',
        content: codeLines.join('\n'),
        extra: { lang },
      });
      continue;
    }

    // 2. Alert Callouts: > [!NOTE], > [!TIP], > [!WARNING], > [!IMPORTANT], > [!CAUTION] or without >
    const calloutMatch = trimmed.match(/^>?\s*\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION|INFO)\]\s*(.*)$/i);
    if (calloutMatch) {
      const calloutType = calloutMatch[1].toUpperCase();
      const initialText = calloutMatch[2].replace(/^>\s*/, '').trim();
      const calloutLines: string[] = initialText ? [initialText] : [];
      i++;

      while (i < lines.length && lines[i].trim() && (lines[i].trim().startsWith('>') || !lines[i].trim().startsWith('#'))) {
        const nextTrim = lines[i].trim();
        if (nextTrim.match(/^>?\s*\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION|INFO)\]/i)) {
          break; // Next callout starts
        }
        calloutLines.push(nextTrim.replace(/^>\s*/, ''));
        i++;
      }

      blocks.push({
        type: 'callout',
        content: calloutLines.join('\n'),
        extra: { calloutType },
      });
      continue;
    }

    // 3. Headings
    if (trimmed.startsWith('# ')) {
      blocks.push({ type: 'h1', content: trimmed.replace(/^#\s+/, '') });
      i++;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'h2', content: trimmed.replace(/^##\s+/, '') });
      i++;
      continue;
    }
    if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'h3', content: trimmed.replace(/^###\s+/, '') });
      i++;
      continue;
    }
    if (trimmed.startsWith('#### ')) {
      blocks.push({ type: 'h4', content: trimmed.replace(/^####\s+/, '') });
      i++;
      continue;
    }

    // 4. Horizontal Rule
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      blocks.push({ type: 'hr', content: '' });
      i++;
      continue;
    }

    // 5. Standalone Image: ![alt](url)
    const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      blocks.push({
        type: 'image',
        content: imgMatch[2],
        extra: { alt: imgMatch[1] },
      });
      i++;
      continue;
    }

    // 6. Markdown Table: Starts with |
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        blocks.push({
          type: 'table',
          content: '',
          extra: { tableLines },
        });
        continue;
      }
    }

    // 7. Checklists: - [ ] or - [x]
    if (trimmed.match(/^[-*]\s*\[([ xX])\]\s+(.*)$/)) {
      const checkItems: { checked: boolean; text: string }[] = [];
      while (i < lines.length) {
        const itemMatch = lines[i].trim().match(/^[-*]\s*\[([ xX])\]\s+(.*)$/);
        if (!itemMatch) break;
        checkItems.push({
          checked: itemMatch[1].toLowerCase() === 'x',
          text: itemMatch[2],
        });
        i++;
      }
      blocks.push({
        type: 'checklist',
        content: '',
        extra: { checkItems },
      });
      continue;
    }

    // 8. Bullet List: - item or * item
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const listItems: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        listItems.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      blocks.push({
        type: 'ul',
        content: '',
        extra: { listItems },
      });
      continue;
    }

    // 9. Numbered List: 1. item
    if (trimmed.match(/^\d+\.\s+/)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].trim().match(/^\d+\.\s+/)) {
        listItems.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push({
        type: 'ol',
        content: '',
        extra: { listItems },
      });
      continue;
    }

    // 10. Generic Blockquote: > text
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s*/, ''));
        i++;
      }
      blocks.push({
        type: 'blockquote',
        content: quoteLines.join('\n'),
      });
      continue;
    }

    // 11. Normal Paragraph (gather consecutive text lines until blank line or special block)
    const pLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith('>') &&
      !lines[i].trim().startsWith('|') &&
      !lines[i].trim().startsWith('- ') &&
      !lines[i].trim().startsWith('* ') &&
      !lines[i].trim().match(/^\d+\.\s+/) &&
      !lines[i].trim().match(/^\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION|INFO)\]/i)
    ) {
      pLines.push(lines[i]);
      i++;
    }
    if (pLines.length > 0) {
      blocks.push({
        type: 'paragraph',
        content: pLines.join('\n'),
      });
    }
  }

  return blocks;
}

// Inline formatting parser for bold, italic, code, links, images
export function renderInlineContent(text: string): React.ReactNode {
  if (!text) return null;

  // Process inline code `code`
  const codeParts = text.split(/(`[^`]+`)/g);
  return codeParts.map((part, pIdx) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={pIdx}
          className="px-1.5 py-0.5 mx-0.5 rounded-md bg-muted font-mono text-[11px] text-primary font-semibold border border-border"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Process links [text](url) and images ![alt](url)
    const linkParts = part.split(/(!?\[[^\]]+\]\([^)]+\))/g);
    return linkParts.map((lPart, lIdx) => {
      // Image
      const imgMatch = lPart.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imgMatch) {
        return (
          <img
            key={`${pIdx}-${lIdx}`}
            src={imgMatch[2]}
            alt={imgMatch[1] || 'Image'}
            className="my-2 rounded-xl max-h-72 object-contain border border-border shadow-xs"
          />
        );
      }

      // Link
      const linkMatch = lPart.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        return (
          <a
            key={`${pIdx}-${lIdx}`}
            href={linkMatch[2]}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-0.5 text-primary hover:underline font-medium"
          >
            <span>{linkMatch[1]}</span>
            <ExternalLink className="w-3 h-3 inline-block" />
          </a>
        );
      }

      // Process bold **text** and italic *text*
      return renderBoldItalic(lPart, `${pIdx}-${lIdx}`);
    });
  });
}

function renderBoldItalic(text: string, keyPrefix: string): React.ReactNode {
  // Bold **...**
  const boldParts = text.split(/(\*\*[^*]+\*\*|__[^_]+__)/g);
  return boldParts.map((bPart, bIdx) => {
    if (
      (bPart.startsWith('**') && bPart.endsWith('**') && bPart.length > 4) ||
      (bPart.startsWith('__') && bPart.endsWith('__') && bPart.length > 4)
    ) {
      const inner = bPart.slice(2, -2);
      return (
        <strong key={`${keyPrefix}-b-${bIdx}`} className="font-bold text-foreground">
          {renderItalicOnly(inner, `${keyPrefix}-b-${bIdx}`)}
        </strong>
      );
    }
    return renderItalicOnly(bPart, `${keyPrefix}-b-${bIdx}`);
  });
}

function renderItalicOnly(text: string, keyPrefix: string): React.ReactNode {
  // Italic *...* or _..._
  const italicParts = text.split(/(\*[^*]+\*|_[^_]+_)/g);
  return italicParts.map((iPart, iIdx) => {
    if (
      (iPart.startsWith('*') && iPart.endsWith('*') && iPart.length > 2) ||
      (iPart.startsWith('_') && iPart.endsWith('_') && iPart.length > 2)
    ) {
      return (
        <em key={`${keyPrefix}-i-${iIdx}`} className="italic">
          {iPart.slice(1, -1)}
        </em>
      );
    }
    return iPart;
  });
}

// Render individual structural blocks
function renderBlock(
  block: ParsedBlock,
  idx: number,
  onImageClick?: (url: string) => void
): React.ReactNode {
  switch (block.type) {
    case 'h1':
      return (
        <h1
          key={idx}
          className="text-lg sm:text-xl font-bold text-foreground border-b border-border pb-2 pt-2 first:pt-0"
        >
          {renderInlineContent(block.content)}
        </h1>
      );

    case 'h2':
      return (
        <h2 key={idx} className="text-base sm:text-lg font-bold text-primary pt-2 first:pt-0">
          {renderInlineContent(block.content)}
        </h2>
      );

    case 'h3':
      return (
        <h3 key={idx} className="text-sm sm:text-base font-semibold text-foreground pt-1">
          {renderInlineContent(block.content)}
        </h3>
      );

    case 'h4':
    case 'h5':
    case 'h6':
      return (
        <h4 key={idx} className="text-xs sm:text-sm font-semibold text-foreground">
          {renderInlineContent(block.content)}
        </h4>
      );

    case 'callout': {
      const type = (block.extra?.calloutType || 'NOTE').toUpperCase();
      let borderBg = 'border-blue-500/30 bg-blue-500/10 text-blue-900 dark:text-blue-200';
      let titleColor = 'text-blue-600 dark:text-blue-400';
      let titleText = 'Lưu ý quan trọng';
      let IconComponent = Info;

      if (type === 'TIP') {
        borderBg = 'border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200';
        titleColor = 'text-emerald-600 dark:text-emerald-400';
        titleText = 'Mẹo thực thi';
        IconComponent = Lightbulb;
      } else if (type === 'WARNING') {
        borderBg = 'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200';
        titleColor = 'text-amber-600 dark:text-amber-400';
        titleText = 'Cảnh báo';
        IconComponent = AlertTriangle;
      } else if (type === 'IMPORTANT') {
        borderBg = 'border-purple-500/30 bg-purple-500/10 text-purple-900 dark:text-purple-200';
        titleColor = 'text-purple-600 dark:text-purple-400';
        titleText = 'Quan trọng';
        IconComponent = AlertCircle;
      } else if (type === 'CAUTION') {
        borderBg = 'border-rose-500/30 bg-rose-500/10 text-rose-900 dark:text-rose-200';
        titleColor = 'text-rose-600 dark:text-rose-400';
        titleText = 'Cẩn trọng';
        IconComponent = ShieldAlert;
      }

      return (
        <div key={idx} className={`my-3 p-3.5 sm:p-4 rounded-xl border ${borderBg} shadow-2xs`}>
          <div className={`flex items-center gap-1.5 font-bold text-xs uppercase tracking-wide mb-1.5 ${titleColor}`}>
            <IconComponent className="w-4 h-4 shrink-0" />
            <span>{titleText}</span>
          </div>
          <div className="text-xs leading-relaxed space-y-1">
            {block.content.split('\n').map((line, lIdx) => (
              <p key={lIdx}>{renderInlineContent(line)}</p>
            ))}
          </div>
        </div>
      );
    }

    case 'blockquote':
      return (
        <blockquote
          key={idx}
          className="border-l-4 border-primary/70 pl-3.5 py-1.5 italic text-muted-foreground my-2.5 bg-muted/20 rounded-r-lg"
        >
          {block.content.split('\n').map((line, lIdx) => (
            <p key={lIdx} className="leading-relaxed">
              {renderInlineContent(line)}
            </p>
          ))}
        </blockquote>
      );

    case 'code':
      return <CodeBlockComponent key={idx} code={block.content} lang={block.extra?.lang} />;

    case 'table': {
      const tableLines: string[] = block.extra?.tableLines || [];
      const headerLine = tableLines[0];
      const dataLines = tableLines.slice(2); // skip separator line |---|---|

      const parseRow = (line: string) =>
        line
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((c) => c.trim());

      const headers = parseRow(headerLine);

      return (
        <div key={idx} className="my-3 overflow-x-auto rounded-xl border border-border shadow-xs">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-muted text-foreground uppercase tracking-wider font-semibold border-b border-border">
              <tr>
                {headers.map((h, hIdx) => (
                  <th key={hIdx} className="px-3.5 py-2.5 border-r border-border last:border-r-0">
                    {renderInlineContent(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {dataLines.map((rowLine, rIdx) => {
                const cells = parseRow(rowLine);
                return (
                  <tr key={rIdx} className="hover:bg-muted/40 transition-colors">
                    {cells.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3.5 py-2 border-r border-border last:border-r-0 text-foreground">
                        {renderInlineContent(cell)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    case 'checklist': {
      const checkItems: { checked: boolean; text: string }[] = block.extra?.checkItems || [];
      return (
        <div key={idx} className="my-2 space-y-1.5">
          {checkItems.map((item, cIdx) => (
            <div key={cIdx} className="flex items-start gap-2 text-xs">
              {item.checked ? (
                <CheckSquare className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              ) : (
                <Square className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              )}
              <span className={item.checked ? 'line-through text-muted-foreground' : 'text-foreground'}>
                {renderInlineContent(item.text)}
              </span>
            </div>
          ))}
        </div>
      );
    }

    case 'ul': {
      const listItems: string[] = block.extra?.listItems || [];
      return (
        <ul key={idx} className="list-disc pl-5 space-y-1 my-2 text-xs">
          {listItems.map((item, lIdx) => (
            <li key={lIdx} className="text-foreground leading-relaxed">
              {renderInlineContent(item)}
            </li>
          ))}
        </ul>
      );
    }

    case 'ol': {
      const listItems: string[] = block.extra?.listItems || [];
      return (
        <ol key={idx} className="list-decimal pl-5 space-y-1 my-2 text-xs">
          {listItems.map((item, lIdx) => (
            <li key={lIdx} className="text-foreground leading-relaxed">
              {renderInlineContent(item)}
            </li>
          ))}
        </ol>
      );
    }

    case 'image':
      return (
        <div key={idx} className="my-3">
          <img
            src={block.content}
            alt={block.extra?.alt || 'Ghi chú ảnh'}
            onClick={() => onImageClick?.(block.content)}
            className="rounded-xl max-h-96 w-auto max-w-full border border-border shadow-xs hover:opacity-95 transition-opacity cursor-pointer"
          />
          {block.extra?.alt && (
            <p className="text-[11px] text-muted-foreground mt-1 italic text-center">{block.extra.alt}</p>
          )}
        </div>
      );

    case 'hr':
      return <hr key={idx} className="my-4 border-t border-border" />;

    case 'paragraph':
    default:
      return (
        <p key={idx} className="text-foreground/90 leading-relaxed">
          {renderInlineContent(block.content)}
        </p>
      );
  }
}

// Code Block with Copy Button & Language Badge
const CodeBlockComponent: React.FC<{ code: string; lang?: string }> = ({ code, lang }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-xl overflow-hidden border border-border bg-slate-950 dark:bg-slate-900 text-slate-100 shadow-md group">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900/90 border-b border-slate-800 text-[11px] font-mono text-slate-400">
        <span className="uppercase font-semibold tracking-wider">{lang || 'CODE'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-800"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
        </button>
      </div>
      <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};
