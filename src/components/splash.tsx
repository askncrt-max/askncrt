import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const KEY = "askncert_splash_shown";

export function Splash() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(KEY)) return;
    setShow(true);
    sessionStorage.setItem(KEY, "1");
    const t = setTimeout(() => setShow(false), 2400);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-background animate-splash-out">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-mesh absolute -top-[20%] -left-[10%] size-[70%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="animate-mesh absolute bottom-[-10%] right-[-10%] size-[60%] rounded-full bg-emerald-300/30 blur-[100px] [animation-delay:2s]" />
      </div>
      <div className="relative flex flex-col items-center text-center">
        <div className="animate-splash-logo grid size-20 place-items-center rounded-3xl bg-primary shadow-glow">
          <Sparkles className="size-9 text-primary-foreground" />
        </div>
        <h1 className="animate-splash-title mt-6 font-display text-5xl font-extrabold tracking-tight">
          Ask<span className="text-primary">NCERT</span>
        </h1>
        <p className="animate-splash-sub mt-2 text-sm font-medium text-muted-foreground">
          AI study partner · Class 5 – 12
        </p>
        <div className="animate-splash-sub mt-10 flex flex-col items-center gap-1 [animation-delay:400ms]">
          <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground/70">
            Made with 💚 by
          </span>
          <span className="font-display text-lg font-bold tracking-tight">Dhiraj</span>
        </div>
      </div>
    </div>
  );
}
