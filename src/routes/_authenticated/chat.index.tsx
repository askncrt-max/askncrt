import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { startConversation } from "@/lib/conversations.functions";

export const Route = createFileRoute("/_authenticated/chat/")({
  component: ChatIndex,
});

function ChatIndex() {
  const navigate = useNavigate();
  const start = useServerFn(startConversation);
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    start({})
      .then(({ id }) =>
        navigate({ to: "/chat/$threadId", params: { threadId: id }, replace: true }),
      )
      .catch((e) => toast.error(e?.message || "Could not open chat"));
  }, [navigate, start]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <Loader2 className="size-5 animate-spin text-primary" />
    </div>
  );
}
