import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage, type FileUIPart } from "ai";
import { useEffect, useRef, useState } from "react";
import {
  Send,
  Camera,
  Mic,
  MicOff,
  Sparkles,
  Loader2,
  X,
  BookOpen,
  Zap,
  FileText,
  Image as ImageIcon,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MarkdownMessage } from "@/components/markdown-message";
import { Sources, type SourceItem } from "@/components/sources";
import { saveNote } from "@/lib/notes.functions";
import { listMemory } from "@/lib/user-memory.functions";
import { saveTurn } from "@/lib/conversations.functions";
import { useStudyTracker } from "@/lib/use-study-tracker";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  { icon: BookOpen, title: "Explain a chapter", hint: "Photosynthesis for Class 7 Science" },
  { icon: Zap, title: "Solve a question", hint: "Step-by-step math solution" },
  {
    icon: Sparkles,
    title: "Chapter MCQ quiz",
    hint: "5 MCQs on this chapter — hide answers, I'll try first",
  },
  { icon: FileText, title: "Summarise notes", hint: "Key points from a chapter" },
];

const QUICK_ACTIONS = [
  "Explain again in simpler words",
  "Explain in Hindi",
  "Ask me 5 MCQs on this chapter (don't reveal answers yet)",
  "Now show the MCQ answers with explanations",
  "Short answer",
  "Detailed answer",
  "Give an example",
];

type Attachment = { file: File; url: string };

export function ChatWindow({
  threadId,
  initialMessages,
  title,
}: {
  threadId: string;
  initialMessages: UIMessage[];
  title?: string | null;
}) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const { ping: pingStudy } = useStudyTracker("chat");

  const qc = useQueryClient();
  const persist = useServerFn(saveTurn);
  const messagesRef = useRef<UIMessage[]>(initialMessages);

  const { messages, sendMessage, status, regenerate } = useChat({
    id: threadId,
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onFinish: ({ message }) => {
      const prior = messagesRef.current;
      const lastUser = [...prior].reverse().find((m) => m.role === "user");
      const batch = [lastUser, message].filter(Boolean) as UIMessage[];
      persist({
        data: {
          conversationId: threadId,
          messages: batch.map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            parts: m.parts as any[],
          })),
        },
      })
        .then(() => qc.invalidateQueries({ queryKey: ["conversations"] }))
        .catch((e) => {
          console.error("save chat failed", e);
          toast.error("Couldn't save this message to your history.");
        });
    },
    onError: (err) => {
      const msg = err.message || "Chat failed";
      if (msg.includes("429")) toast.error("Rate limit hit — please wait a moment.");
      else if (msg.includes("402"))
        toast.error("AI credits exhausted. Please add credits in workspace settings.");
      else toast.error(msg);
    },
  });

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (!isLoading) textareaRef.current?.focus();
  }, [isLoading, threadId]);

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const next: Attachment[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name} is over 20MB`);
        continue;
      }
      next.push({ file, url: URL.createObjectURL(file) });
    }
    setAttachments((prev) => [...prev, ...next]);
  }

  async function fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function submit(text?: string) {
    const content = (text ?? input).trim();
    if (!content && attachments.length === 0) return;

    const parts: FileUIPart[] = [];
    for (const att of attachments) {
      const dataUrl = await fileToDataURL(att.file);
      parts.push({
        type: "file",
        mediaType: att.file.type || "application/octet-stream",
        url: dataUrl,
        filename: att.file.name,
      });
    }

    pingStudy();
    setInput("");
    attachments.forEach((a) => URL.revokeObjectURL(a.url));
    setAttachments([]);
    await sendMessage({
      text: content || "Please analyze the attached file.",
      files: parts.length ? parts : undefined,
    });
  }

  function toggleVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Voice input isn't supported in this browser. Try Chrome.");
      return;
    }
    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }
    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const t = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join(" ");
      setInput((prev) => (prev ? prev + " " : "") + t);
    };
    rec.onend = () => setRecording(false);
    rec.onerror = () => setRecording(false);
    rec.start();
    recognitionRef.current = rec;
    setRecording(true);
  }

  return (
    <div className="flex h-[100dvh] min-w-0 flex-1 flex-col md:h-screen">
      {/* Top bar */}
      <div className="flex items-center gap-2 border-b border-border bg-background/60 px-4 py-3 backdrop-blur-xl md:px-8">
        <div className="min-w-0 flex-1 truncate text-sm font-medium text-muted-foreground">
          {title && title !== "New chat" ? title : messages.length ? "Current chat" : "New chat"}
        </div>
        <PersonalizedPill />
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 pb-40 pt-8 md:px-8">
          {messages.length === 0 ? (
            <Welcome onPick={(hint) => setInput(hint)} />
          ) : (
            <div className="space-y-6">
              {messages.map((m) => (
                <ChatMessage
                  key={m.id}
                  message={m}
                  onQuickAction={(a) => submit(a)}
                  onRegenerate={() => {
                    pingStudy();
                    regenerate({ messageId: m.id });
                  }}
                  busy={isLoading}
                />
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && <Thinking />}
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="pointer-events-none sticky bottom-0 z-10 bg-gradient-to-t from-background via-background/95 to-transparent px-4 pb-4 pt-6">
        <div className="pointer-events-auto mx-auto max-w-3xl">
          {attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachments.map((a, i) => (
                <div
                  key={i}
                  className="group relative flex items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs"
                >
                  {a.file.type.startsWith("image/") ? (
                    <img src={a.url} alt="" className="size-8 rounded-md object-cover" />
                  ) : (
                    <FileText className="size-4 text-primary" />
                  )}
                  <span className="max-w-[140px] truncate font-medium">{a.file.name}</span>
                  <button
                    onClick={() =>
                      setAttachments((prev) => {
                        URL.revokeObjectURL(a.url);
                        return prev.filter((_, idx) => idx !== i);
                      })
                    }
                    className="rounded-full p-0.5 hover:bg-muted"
                    aria-label="Remove attachment"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="rounded-3xl border border-border bg-card p-2 shadow-soft"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={1}
              placeholder="Ask anything from NCERT…"
              className="max-h-40 min-h-[44px] w-full resize-none rounded-xl border-0 bg-transparent px-3 py-2.5 text-[15px] outline-none placeholder:text-muted-foreground/70"
            />
            <div className="mt-1 flex items-center justify-between gap-1 border-t border-border/60 pt-2">
              <div className="flex items-center gap-0.5">
                <IconBtn label="Camera" onClick={() => cameraInputRef.current?.click()} icon={Camera} />
                <IconBtn label="Gallery" onClick={() => fileInputRef.current?.click()} icon={ImageIcon} />
                <IconBtn label="PDF" onClick={() => pdfInputRef.current?.click()} icon={FileText} />
                <IconBtn
                  label={recording ? "Stop" : "Voice"}
                  onClick={toggleVoice}
                  icon={recording ? MicOff : Mic}
                  active={recording}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || (!input.trim() && attachments.length === 0)}
                className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
                aria-label="Send"
              >
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </button>
            </div>
          </form>
          <p className="mt-2 text-center text-[10px] uppercase tracking-widest text-muted-foreground/70">
            AI can make mistakes — double-check important answers
          </p>
        </div>
      </div>

      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf"
        hidden
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function PersonalizedPill() {
  const list = useServerFn(listMemory);
  const { data } = useQuery({
    queryKey: ["user_memory"],
    queryFn: () => list(),
    staleTime: 60_000,
  });
  if (!data || data.length === 0) return null;
  return (
    <span
      title={`Personalized with ${data.length} memor${data.length === 1 ? "y" : "ies"}`}
      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary"
    >
      <Sparkles className="size-2.5" /> Personalized
    </span>
  );
}

function Welcome({ onPick }: { onPick: (hint: string) => void }) {
  return (
    <div className="animate-fade-up my-auto flex flex-col items-center py-10 text-center">
      <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
        <Sparkles className="size-3" />
        AI Study Partner
      </div>
      <h1 className="max-w-lg text-balance font-display text-4xl font-bold leading-tight tracking-tight md:text-5xl">
        Ask anything from <span className="text-primary">NCERT</span>
      </h1>
      <p className="mt-3 max-w-md text-pretty text-muted-foreground">
        Class 5 – 12. Explain chapters, solve problems, generate quizzes, or scan a page from your
        textbook.
      </p>
      <div className="mt-8 grid w-full max-w-xl grid-cols-1 gap-2.5 sm:grid-cols-2">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            onClick={() => onPick(`${s.title}: ${s.hint}`)}
            className="group flex items-start gap-3 rounded-2xl border border-border bg-card/70 p-4 text-left transition-colors hover:border-primary/40 hover:bg-card"
          >
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
              <s.icon className="size-4" />
            </div>
            <div>
              <div className="text-sm font-semibold">{s.title}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{s.hint}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatMessage({
  message,
  onQuickAction,
  onRegenerate,
  busy,
}: {
  message: UIMessage;
  onQuickAction: (a: string) => void;
  onRegenerate: () => void;
  busy: boolean;
}) {
  const text = message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
  const filesShown = message.parts.filter((p): p is FileUIPart => p.type === "file");
  const isUser = message.role === "user";

  const sources: SourceItem[] = [];
  for (const p of message.parts as Array<{ type: string; state?: string; output?: unknown }>) {
    if (p.type === "tool-web_search" && (p.state === "output-available" || p.state === "result")) {
      const out = p.output as { results?: SourceItem[] } | undefined;
      if (out?.results && Array.isArray(out.results)) sources.push(...out.results);
    }
  }

  const save = useServerFn(saveNote);
  const saveMut = useMutation({
    mutationFn: async () => {
      const t = text.split("\n").find((l) => l.trim())?.slice(0, 80) || "Untitled note";
      return save({ data: { title: t, content: text } });
    },
    onSuccess: () => toast.success("Saved to notes"),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save"),
  });

  if (isUser) {
    return (
      <div className="animate-fade-up flex justify-end">
        <div className="max-w-[85%] rounded-3xl rounded-tr-md bg-primary px-4 py-2.5 text-primary-foreground">
          {filesShown.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {filesShown.map((f, i) =>
                f.mediaType?.startsWith("image/") && f.url ? (
                  <img key={i} src={f.url} alt="Uploaded study material shared with the AI tutor" className="max-h-40 rounded-xl" />
                ) : (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-xl bg-primary-foreground/15 px-2.5 py-1.5 text-xs"
                  >
                    <FileText className="size-3.5" />
                    {f.filename || "File"}
                  </div>
                ),
              )}
            </div>
          )}
          {text && <div className="whitespace-pre-wrap text-[15px] leading-relaxed">{text}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up flex gap-3">
      <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary shadow-glow">
        <Sparkles className="size-4 text-primary-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <MarkdownMessage>{text}</MarkdownMessage>
        <Sources items={sources} />
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending || !text}
            className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium hover:border-primary/40 hover:text-primary disabled:opacity-50"
          >
            {saveMut.isPending ? "Saving…" : "💾 Save note"}
          </button>
          <button
            onClick={onRegenerate}
            disabled={busy}
            title="Regenerate this answer"
            aria-label="Regenerate this answer"
            className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium hover:border-primary/40 hover:text-primary disabled:opacity-50"
          >
            <RefreshCw className="size-3" /> Regenerate
          </button>
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a}
              onClick={() => onQuickAction(a)}
              className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:border-primary/40 hover:text-primary"
            >
              {a}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Thinking() {
  return (
    <div className="flex gap-3">
      <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary">
        <Sparkles className="size-4 animate-pulse text-primary-foreground" />
      </div>
      <div className="flex items-center gap-1.5 pt-2 text-sm text-muted-foreground">
        <span className="size-1.5 animate-bounce rounded-full bg-primary" />
        <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
        <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
        <span className="ml-1.5">Thinking…</span>
      </div>
    </div>
  );
}

function IconBtn({
  icon: Icon,
  label,
  onClick,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        active && "bg-destructive/10 text-destructive hover:bg-destructive/15 hover:text-destructive",
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}
