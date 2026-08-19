import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import type { UIMessage } from "ai";
import { ChatWindow } from "@/components/chat-window";
import { getConversation } from "@/lib/conversations.functions";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  component: ChatThread,
  errorComponent: ChatThreadError,
  notFoundComponent: ChatThreadMissing,
});

function ChatThread() {
  const { threadId } = Route.useParams();
  const fetchConvo = useServerFn(getConversation);

  const { data, isLoading, error } = useQuery({
    queryKey: ["conversation", threadId],
    queryFn: () => fetchConvo({ data: { id: threadId } }),
    staleTime: Infinity,
    gcTime: 0,
  });

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-5 animate-spin text-primary" />
      </div>
    );
  }

  if (error) throw error;
  if (!data) return <ChatThreadMissing />;

  return (
    <ChatWindow
      key={threadId}
      threadId={threadId}
      title={data.conversation.title}
      initialMessages={data.messages as unknown as UIMessage[]}
    />
  );
}

function ChatThreadError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <p className="text-sm font-medium">This chat couldn't be loaded.</p>
      <p className="max-w-sm text-xs text-muted-foreground">{error.message}</p>
      <button
        onClick={() => {
          router.invalidate();
          reset();
        }}
        className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        Try again
      </button>
    </div>
  );
}

function ChatThreadMissing() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <p className="text-sm font-medium">This chat no longer exists.</p>
      <Link
        to="/chat"
        className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        Start a new chat
      </Link>
    </div>
  );
}
