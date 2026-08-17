import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Check,
  X,
  Trophy,
  Target,
  RotateCcw,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import {
  generateQuiz,
  getQuiz,
  submitAttempt,
  getQuizHistory,
} from "@/lib/quiz.functions";

export const Route = createFileRoute("/_authenticated/quiz")({
  head: () => ({
    meta: [
      { title: "Quiz Generator — AskNCERT" },
      {
        name: "description",
        content:
          "Generate NCERT MCQ quizzes on any chapter, get instant scoring with explanations, and track your weak topics over time.",
      },
    ],
  }),
  component: QuizPage,
});

type Phase = "setup" | "playing" | "result";

const SUGGESTIONS = [
  "Light — Reflection and Refraction",
  "Trigonometry basics",
  "The French Revolution",
  "Life Processes",
  "Chemical Reactions and Equations",
];

function QuizPage() {
  const qc = useQueryClient();
  const gen = useServerFn(generateQuiz);
  const fetchQuiz = useServerFn(getQuiz);
  const submit = useServerFn(submitAttempt);
  const history = useServerFn(getQuizHistory);

  const [phase, setPhase] = useState<Phase>("setup");
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);

  const [questions, setQuestions] = useState<any[]>([]);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    total: number;
    weak_topics: string[];
  } | null>(null);
  const startedRef = useRef<number>(0);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["quiz-history"],
    queryFn: () => history(),
  });

  async function start() {
    if (topic.trim().length < 2) {
      toast.error("Enter a chapter or topic first.");
      return;
    }
    setLoading(true);
    try {
      const { quizId: id } = await gen({
        data: {
          topic: topic.trim(),
          subject: subject.trim() || null,
          class_level: classLevel.trim() || null,
          difficulty,
          count,
        },
      });
      const { questions: qs } = await fetchQuiz({ data: { quizId: id } });
      setQuizId(id);
      setQuestions(qs);
      setAnswers(new Array(qs.length).fill(-1));
      setCurrent(0);
      setRevealed(false);
      setResult(null);
      startedRef.current = Date.now();
      setPhase("playing");
    } catch (e: any) {
      toast.error(e?.message || "Could not generate the quiz. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function choose(optIdx: number) {
    if (revealed) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[current] = optIdx;
      return next;
    });
    setRevealed(true);
  }

  async function next() {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setRevealed(false);
      return;
    }
    try {
      const res = await submit({
        data: {
          quizId: quizId!,
          answers,
          duration_sec: Math.round((Date.now() - startedRef.current) / 1000),
        },
      });
      setResult(res);
      setPhase("result");
      qc.invalidateQueries({ queryKey: ["quiz-history"] });
    } catch (e: any) {
      toast.error(e?.message || "Could not save your score");
    }
  }

  function reset() {
    setPhase("setup");
    setQuestions([]);
    setQuizId(null);
    setResult(null);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Quiz Generator</h1>
          <p className="text-sm text-muted-foreground">
            AI-made NCERT MCQs with instant scoring and weak-topic tracking.
          </p>
        </header>

        <AnimatePresence mode="wait">
          {phase === "setup" && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              <Card className="space-y-4 rounded-2xl p-5">
                <Input
                  placeholder="Chapter or topic — e.g. Light: Reflection and Refraction"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && start()}
                />
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setTopic(s)}
                      className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition hover:border-primary hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    placeholder="Subject (optional)"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                  <Input
                    placeholder="Class (optional) — e.g. 10"
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Difficulty</span>
                    {(["easy", "medium", "hard"] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDifficulty(d)}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs capitalize transition",
                          difficulty === d
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Questions</span>
                    {[5, 10, 15].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setCount(n)}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs transition",
                          count === n
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <Button onClick={start} disabled={loading} className="w-full">
                  <Sparkles className="mr-2 h-4 w-4" />
                  {loading ? "Generating your quiz…" : "Generate quiz"}
                </Button>
              </Card>

              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                  icon={Trophy}
                  label="Quizzes taken"
                  value={statsLoading ? null : String(stats?.quizzesTaken ?? 0)}
                />
                <StatCard
                  icon={Target}
                  label="Overall accuracy"
                  value={statsLoading ? null : `${stats?.accuracy ?? 0}%`}
                />
                <StatCard
                  icon={AlertTriangle}
                  label="Weak topics"
                  value={statsLoading ? null : String(stats?.weakTopics?.length ?? 0)}
                />
              </div>

              {!!stats?.weakTopics?.length && (
                <Card className="rounded-2xl p-5">
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Topics to revise
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {stats.weakTopics.map((w: any) => (
                      <button
                        key={w.topic}
                        onClick={() => setTopic(w.topic)}
                        className="rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-700 transition hover:bg-amber-500/20 dark:text-amber-400"
                      >
                        {w.topic} · missed {w.misses}×
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Tap a topic to instantly generate a focused quiz on it.
                  </p>
                </Card>
              )}

              {!!stats?.attempts?.length && (
                <Card className="rounded-2xl p-5">
                  <h2 className="mb-3 text-sm font-semibold">Recent attempts</h2>
                  <div className="space-y-2">
                    {stats.attempts.slice(0, 8).map((a: any) => {
                      const pct = a.total ? Math.round((a.score / a.total) * 100) : 0;
                      return (
                        <div
                          key={a.id}
                          className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {a.quiz?.topic ?? "Quiz"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(a.completed_at), "PP p")}
                            </p>
                          </div>
                          <Badge
                            variant={pct >= 70 ? "default" : pct >= 40 ? "secondary" : "destructive"}
                          >
                            {a.score}/{a.total}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
            </motion.div>
          )}

          {phase === "playing" && questions.length > 0 && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <Progress value={((current + 1) / questions.length) * 100} className="h-2 flex-1" />
                <span className="text-xs text-muted-foreground">
                  {current + 1}/{questions.length}
                </span>
              </div>

              <Card className="space-y-4 rounded-2xl p-5">
                <p className="text-base font-medium leading-relaxed">
                  {questions[current].question}
                </p>
                <div className="space-y-2">
                  {(questions[current].options as string[]).map((opt, i) => {
                    const chosen = answers[current] === i;
                    const correct = questions[current].correct_index === i;
                    return (
                      <button
                        key={i}
                        onClick={() => choose(i)}
                        disabled={revealed}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition",
                          !revealed && "hover:border-primary hover:bg-primary/5",
                          revealed && correct && "border-emerald-500 bg-emerald-500/10",
                          revealed && chosen && !correct && "border-destructive bg-destructive/10",
                          revealed && !correct && !chosen && "opacity-60",
                        )}
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="flex-1">{opt}</span>
                        {revealed && correct && <Check className="h-4 w-4 text-emerald-600" />}
                        {revealed && chosen && !correct && (
                          <X className="h-4 w-4 text-destructive" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {revealed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="rounded-xl bg-muted/60 p-3 text-sm"
                  >
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {questions[current].sub_topic || "Explanation"}
                    </p>
                    <p className="text-muted-foreground">{questions[current].explanation}</p>
                  </motion.div>
                )}

                <div className="flex justify-end">
                  <Button onClick={next} disabled={!revealed}>
                    {current < questions.length - 1 ? "Next question" : "Finish quiz"}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {phase === "result" && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <Card className="rounded-2xl p-8 text-center">
                <Trophy className="mx-auto mb-3 h-10 w-10 text-primary" />
                <p className="text-4xl font-bold">
                  {result.score}
                  <span className="text-2xl text-muted-foreground">/{result.total}</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {Math.round((result.score / Math.max(result.total, 1)) * 100)}% correct on “
                  {topic}”
                </p>
                <Progress
                  value={(result.score / Math.max(result.total, 1)) * 100}
                  className="mx-auto mt-4 h-2 max-w-xs"
                />
              </Card>

              {result.weak_topics.length > 0 && (
                <Card className="rounded-2xl p-5">
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Revise these
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {result.weak_topics.map((t) => (
                      <Badge key={t} variant="secondary">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={reset}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  New quiz
                </Button>
                <Button className="flex-1" onClick={start} disabled={loading}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Retry this topic
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string | null;
}) {
  return (
    <Card className="rounded-2xl p-4">
      <Icon className="mb-2 h-4 w-4 text-primary" />
      {value === null ? (
        <Skeleton className="h-7 w-16" />
      ) : (
        <p className="text-2xl font-semibold">{value}</p>
      )}
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}
