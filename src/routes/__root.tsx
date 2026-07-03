import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { Splash } from "@/components/splash";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This page doesn't exist. Head back to your study space.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Go home
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn't load this page. Please try again.
        </p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
      { title: "AskNCERT — AI study assistant for NCERT students" },
      {
        name: "description",
        content:
          "AskNCERT is an AI-powered study assistant for Class 5-12 NCERT students. Ask questions, scan chapters, solve problems, save notes, and plan your study.",
      },
      { name: "theme-color", content: "#f7fbf8" },
      { property: "og:site_name", content: "AskNCERT" },
      { property: "og:title", content: "AskNCERT — AI study assistant for NCERT students" },
      {
        property: "og:description",
        content:
          "Ask anything from NCERT. Chapter scans, question solver, quizzes, notes and reminders — all powered by AI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "AskNCERT — AI study assistant for NCERT students" },
      {
        name: "twitter:description",
        content:
          "Ask anything from NCERT. Chapter scans, question solver, quizzes, notes and reminders — all powered by AI.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: "AskNCERT",
              url: "https://askncrt.lovable.app",
              description:
                "AI-powered study assistant built for Indian NCERT students from Class 5 to Class 12.",
            },
            {
              "@type": "WebSite",
              name: "AskNCERT",
              url: "https://askncrt.lovable.app",
              inLanguage: ["en", "hi"],
            },
            {
              "@type": "Service",
              name: "AskNCERT AI Study Assistant",
              serviceType: "Online tutoring and homework help",
              areaServed: "IN",
              audience: {
                "@type": "EducationalAudience",
                educationalRole: "student",
              },
              provider: { "@type": "Organization", name: "AskNCERT" },
              description:
                "NCERT homework help, chapter scans, question solving, quizzes and exam preparation for Class 5-12 students.",
            },
          ],
        }),
      },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <Splash />
      <Outlet />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: "12px",
            border: "1px solid var(--color-border)",
            background: "var(--color-card)",
            color: "var(--color-foreground)",
          },
        }}
      />
    </QueryClientProvider>
  );
}
