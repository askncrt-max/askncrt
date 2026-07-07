import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles,
  BookOpen,
  Camera,
  Calendar,
  MessageSquare,
  Brain,
  Zap,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      {
        title:
          "AskNCERT — Free AI NCERT Study Assistant for Class 5-12 (CBSE & State Boards)",
      },
      {
        name: "description",
        content:
          "AskNCERT is a free AI study app for NCERT students. Solve doubts, scan chapters, get chapter summaries, MCQ quizzes, homework help & exam prep for Class 5 to 12 CBSE, ICSE and state boards — in English & Hindi.",
      },
      {
        name: "keywords",
        content:
          "askncert, ask ncert, ncert ai, ncert study app, ncert solutions, cbse ai tutor, class 10 ncert, class 12 ncert, ncert chapter summary, ncert quiz, ncert doubts, ai homework helper india, hindi study app",
      },
      { name: "author", content: "AskNCERT" },
      { property: "og:title", content: "AskNCERT — AI NCERT Study Assistant for Class 5-12" },
      {
        property: "og:description",
        content:
          "Ask any NCERT doubt, scan chapters, generate quizzes and study smarter. Free AI tutor for Indian students, in English and Hindi.",
      },
      { property: "og:url", content: "https://askncrt.lovable.app/" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://askncrt.lovable.app/" }],
  }),
});

function LandingPage() {
  useEffect(() => {
    // If signed-in, jump straight into the app.
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && data.session) {
        window.location.replace("/chat");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] size-[60%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute top-[10%] -right-[10%] size-[55%] rounded-full bg-emerald-200/40 blur-[100px] dark:bg-emerald-900/20" />
      </div>

      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 md:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-xl bg-primary shadow-glow">
            <Sparkles className="size-4 text-primary-foreground" />
          </div>
          <div>
            <div className="text-[15px] font-bold leading-none tracking-tight">AskNCERT</div>
            <div className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Class 5 – 12
            </div>
          </div>
        </Link>
        <Link
          to="/auth"
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Open app
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-8 pb-20 md:px-8 md:pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
            <Sparkles className="size-3" /> AI Study Partner for NCERT
          </div>
          <h1 className="text-balance font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            The <span className="text-primary">AI tutor</span> built for NCERT students,
            Class 5 – 12
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
            AskNCERT explains chapters, solves questions step-by-step, scans your textbook pages,
            generates quizzes, and remembers what you're studying — in English and Hindi. Free to
            start.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90"
            >
              Start learning free →
            </Link>
            <a
              href="#features"
              className="rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold hover:bg-muted"
            >
              See what it does
            </a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No credit card. Works on any phone. CBSE, ICSE, state boards.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 pb-20 md:px-8">
        <h2 className="mb-3 text-center font-display text-3xl font-bold tracking-tight md:text-4xl">
          Everything you need to ace NCERT
        </h2>
        <p className="mx-auto mb-12 max-w-xl text-center text-muted-foreground">
          One app for doubts, revision, quizzes, notes and planning — powered by up-to-date AI.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <Feature
            icon={MessageSquare}
            title="Ask any NCERT doubt"
            desc="Chapter concepts, formulas, numericals, English grammar, Hindi vyakaran — get clear step-by-step answers."
          />
          <Feature
            icon={Camera}
            title="Scan chapters & questions"
            desc="Click a photo of any textbook page or homework question. AskNCERT reads it and explains it."
          />
          <Feature
            icon={Zap}
            title="Live web search"
            desc="Latest news, exam dates, syllabus updates from Google, Wikipedia, Reddit and news sites — with sources."
          />
          <Feature
            icon={Brain}
            title="AI that remembers"
            desc="Save your class, board, weak topics and goals. AskNCERT personalizes every answer for you."
          />
          <Feature
            icon={BookOpen}
            title="Save notes & summaries"
            desc="Turn any answer into a note. Perfect for last-minute revision before exams."
          />
          <Feature
            icon={Calendar}
            title="Study planner"
            desc="Plan your week, track chapters, and never miss a homework deadline."
          />
        </div>
      </section>

      {/* Boards */}
      <section className="mx-auto max-w-6xl px-4 pb-20 md:px-8">
        <div className="rounded-3xl border border-border bg-card p-8 md:p-12">
          <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
            Built for every Indian student
          </h2>
          <p className="mt-2 text-muted-foreground">
            Covers NCERT textbooks used by CBSE, ICSE and most state boards.
          </p>
          <ul className="mt-6 grid gap-3 text-sm md:grid-cols-2">
            {[
              "Class 5 to Class 12 NCERT curriculum",
              "Maths, Science, Social Science, English, Hindi and more",
              "Bilingual — reply in English or simple Hindi",
              "Board exam prep, JEE / NEET foundation basics",
              "Homework help with photo upload",
              "MCQ quizzes and chapter revision",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-20 md:px-8">
        <h2 className="mb-8 text-center font-display text-3xl font-bold tracking-tight">
          Frequently asked
        </h2>
        <div className="space-y-3">
          <Faq
            q="Is AskNCERT free?"
            a="Yes. You can sign up and start asking questions for free. No credit card required."
          />
          <Faq
            q="Which classes and boards are supported?"
            a="Class 5 to Class 12 NCERT — used by CBSE, ICSE and most state boards across India."
          />
          <Faq
            q="Can I ask questions in Hindi?"
            a="Haan bilkul. Type in Hindi or English, or say 'explain in Hindi' and AskNCERT will reply in simple Devanagari Hindi."
          />
          <Faq
            q="Can I scan my textbook or homework?"
            a="Yes. Tap the camera icon, click a photo of the page or question, and AskNCERT will read it and explain it step-by-step."
          />
          <Faq
            q="Does AskNCERT remember me?"
            a="Yes — you can teach it your class, board, subjects and weak topics, and it will personalize every answer. You control what it remembers from Settings → AI Memory."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 pb-24 md:px-8">
        <div className="rounded-3xl bg-primary p-10 text-center text-primary-foreground shadow-glow md:p-14">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Ready to study smarter?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
            Join students across India using AskNCERT for daily homework, doubt clearing and exam
            prep.
          </p>
          <Link
            to="/auth"
            className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-background px-6 py-3 text-sm font-semibold text-foreground hover:opacity-90"
          >
            Start learning free →
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} AskNCERT — AI study assistant for NCERT students.
      </footer>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40">
      <div className="mb-3 grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
        <Icon className="size-5" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-2xl border border-border bg-card p-4 open:bg-card">
      <summary className="cursor-pointer list-none text-sm font-semibold marker:hidden">
        <span className="mr-2 text-primary">+</span>
        {q}
      </summary>
      <p className="mt-2 text-sm text-muted-foreground">{a}</p>
    </details>
  );
}
