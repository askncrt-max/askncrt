import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export function LegalDocument({
  title,
  description,
  sections,
  children,
}: {
  title: string;
  description: string;
  sections: LegalSection[];
  children?: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <Link
            to="/"
            className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to AskNCERT
          </Link>
          <Link to="/" className="flex shrink-0 items-center gap-2 text-sm font-bold">
            <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground">
              <ShieldCheck className="size-4" />
            </span>
            AskNCERT
          </Link>
        </div>
      </header>

      <article className="mx-auto w-full max-w-3xl px-5 pb-16 pt-10 sm:px-8 sm:pt-14">
        <p className="text-sm font-medium text-primary">AskNCERT · Legal</p>
        <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">{description}</p>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-b border-border pb-6 text-xs text-muted-foreground">
          <span>Effective date: 8 October 2026</span>
          <span>Last updated: 8 October 2026</span>
        </div>

        {children}

        <div className="divide-y divide-border">
          {sections.map((section) => (
            <section key={section.title} className="py-6 first:pt-7">
              <h2 className="text-lg font-semibold">{section.title}</h2>
              {section.paragraphs?.map((paragraph, index) => (
                <p key={index} className="mt-3 text-sm leading-7 text-muted-foreground">
                  {paragraph}
                </p>
              ))}
              {section.bullets && (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-muted-foreground marker:text-primary">
                  {section.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <footer className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-6 text-sm">
          <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>
          <Link to="/terms" className="text-primary hover:underline">Terms &amp; Conditions</Link>
          <Link to="/delete-account" className="text-primary hover:underline">Delete Account</Link>
          <a href="mailto:askncrt@gmail.com" className="text-primary hover:underline">Contact AskNCERT</a>
        </footer>
      </article>
    </main>
  );
}