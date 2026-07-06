import { BookOpen, Globe, ExternalLink } from "lucide-react";

export type SourceItem = {
  title: string;
  url: string;
  snippet?: string;
};

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function faviconFor(url: string): string {
  try {
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
  } catch {
    return "";
  }
}

const NCERT_HOSTS = ["ncert.nic.in", "cbse.gov.in", "cbseacademic.nic.in", "askncert", "askncrt"];

function isNcert(url: string): boolean {
  const host = hostOf(url).toLowerCase();
  return NCERT_HOSTS.some((h) => host.includes(h));
}

function SourceCard({ item }: { item: SourceItem }) {
  const host = hostOf(item.url);
  const favicon = faviconFor(item.url);
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex min-w-0 items-start gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      {favicon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={favicon}
          alt=""
          className="mt-0.5 size-4 shrink-0 rounded-sm"
          loading="lazy"
          onError={(e) => ((e.currentTarget.style.visibility = "hidden"))}
        />
      ) : (
        <Globe className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[11px] font-medium text-muted-foreground">{host}</span>
          <ExternalLink className="size-2.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <div className="mt-0.5 line-clamp-2 text-xs font-semibold leading-snug text-foreground group-hover:text-primary">
          {item.title || host}
        </div>
      </div>
    </a>
  );
}

export function Sources({ items }: { items: SourceItem[] }) {
  if (!items || items.length === 0) return null;
  // De-dupe by url
  const seen = new Set<string>();
  const unique = items.filter((s) => {
    if (!s?.url || seen.has(s.url)) return false;
    seen.add(s.url);
    return true;
  });
  if (unique.length === 0) return null;

  const ncert = unique.filter((s) => isNcert(s.url));
  const web = unique.filter((s) => !isNcert(s.url));

  return (
    <div className="mt-4 space-y-3">
      {ncert.length > 0 && (
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary">
            <BookOpen className="size-3" /> NCERT sources
          </div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {ncert.map((s, i) => (
              <SourceCard key={`n-${i}`} item={s} />
            ))}
          </div>
        </div>
      )}
      {web.length > 0 && (
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <Globe className="size-3" /> Web sources
          </div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {web.map((s, i) => (
              <SourceCard key={`w-${i}`} item={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
