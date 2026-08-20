import { memo, useState, type ComponentPropsWithoutRef } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import { Check, Copy } from "lucide-react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          /* ignore */
        }
      }}
      className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/5 px-2 py-1 text-[11px] font-medium text-white/80 backdrop-blur transition hover:bg-white/10"
      aria-label="Copy code"
    >
      {copied ? (
        <>
          <Check className="size-3" /> Copied
        </>
      ) : (
        <>
          <Copy className="size-3" /> Copy
        </>
      )}
    </button>
  );
}

function prettyLabel(href?: string): string {
  if (!href) return "Source";
  try {
    const host = new URL(href).hostname.replace(/^www\./, "");
    if (host.endsWith("gov.in") || host.endsWith(".gov")) return "Official Government Source";
    if (host.includes("ncert") || host.includes("cbse")) return "NCERT / CBSE Source";
    return host;
  } catch {
    return "Source";
  }
}

const components: Components = {
  a: ({ href, children, ...rest }) => {
    const raw = typeof children === "string" ? children : Array.isArray(children) ? children.join("") : "";
    const looksLikeUrl = /^(https?:\/\/|www\.)/i.test(raw.trim()) || raw.trim().length > 60;
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={href}
        className="citation-link"
        {...rest}
      >
        {looksLikeUrl || !raw.trim() ? prettyLabel(href) : children}
      </a>
    );
  },

  table: ({ children, ...rest }) => (
    <div className="table-scroll">
      <table {...rest}>{children}</table>
    </div>
  ),
  pre: ({ children, ...rest }: ComponentPropsWithoutRef<"pre">) => {
    // Extract language + raw text from the child <code>
    let language = "";
    let rawText = "";
    if (
      children &&
      typeof children === "object" &&
      "props" in (children as object)
    ) {
      const child = children as {
        props?: { className?: string; children?: unknown };
      };
      const cls = child.props?.className ?? "";
      const match = /language-([a-zA-Z0-9+#-]+)/.exec(cls);
      if (match) language = match[1];
      const c = child.props?.children;
      rawText = typeof c === "string" ? c : Array.isArray(c) ? c.join("") : "";
    }
    return (
      <div className="group relative my-2">
        <div className="flex items-center justify-between rounded-t-xl border-b border-white/10 bg-slate-900 px-3 py-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
            {language || "code"}
          </span>
          <CopyButton text={rawText} />
        </div>
        <pre {...rest} className="!mt-0 !rounded-t-none">
          {children}
        </pre>
      </div>
    );
  },
};

function MarkdownMessageImpl({ children }: { children: string }) {
  return (
    <div className="prose-chat">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          rehypeKatex,
          [rehypeHighlight, { detect: true, ignoreMissing: true }],
        ]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

export const MarkdownMessage = memo(MarkdownMessageImpl);
