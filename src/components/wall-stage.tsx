import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { PenLine } from "lucide-react";
import { listImpacts, type Impact, type ImpactList } from "@/lib/impacts";
import { cn, impactOrbit } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { QrMark } from "@/components/qr-mark";
import { RippleField } from "@/components/ripple-field";

export function WallStage({ initial }: { initial: ImpactList }) {
  const { t, toggle, formatNum, lang } = useLocale();
  const [data, setData] = useState(initial);
  const [burstId, setBurstId] = useState<number | null>(null);
  const [shareHref, setShareHref] = useState("");
  const latestIdRef = useRef(initial.items[0]?.id ?? 0);

  useEffect(() => {
    const here = new URL(window.location.href);
    const share = new URL(here.href);
    share.pathname = "/share";
    share.search = "";
    share.hash = "";
    setShareHref(share.toString());
  }, []);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const next = await listImpacts();
        if (cancelled) return;
        const newest = next.items[0]?.id ?? 0;
        if (newest > latestIdRef.current) {
          latestIdRef.current = newest;
          setBurstId(newest);
        }
        setData(next);
      } catch {
        /* keep last frame */
      }
    };
    const id = window.setInterval(tick, 2500);
    void tick();
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <main className="wall-wash relative z-10 h-dvh overflow-hidden bg-bg text-fg">
      <RippleField burstId={burstId} />
      {data.items.map((item, index) => (
        <OrbitWord key={item.id} item={item} age={index} />
      ))}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between px-5 py-5 sm:px-8 sm:py-7">
        <div>
          <p className="text-xs tracking-wide text-muted">{t.club}</p>
          <p className="mt-1 text-sm text-fg/80">{t.fair}</p>
        </div>
        <div className="pointer-events-auto flex flex-col items-end gap-3">
          <button type="button" onClick={toggle} className="rounded-sm px-3 py-2 text-xs tracking-wide text-muted hover:text-fg">
            {t.langSwitch}
          </button>
          <p className={cn("text-sm tabular-nums text-muted", lang === "en" && "text-right")}>
            <span className="text-fg">{formatNum(data.count)}</span> {t.planted}
          </p>
          <Link to="/all" className="text-xs text-muted underline-offset-4 hover:text-fg hover:underline">
            {t.viewAll}
          </Link>
        </div>
      </header>
      <div className="pointer-events-none absolute inset-0 z-15 flex flex-col items-center justify-center px-6 text-center">
        <p className="hero-mark breathe relative z-20 text-fg">أثر</p>
        <p className="relative z-20 mt-5 max-w-md text-sm text-muted sm:mt-7 sm:text-base">{t.question}</p>
      </div>
      <div dir="ltr" className="safe-bottom absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-3 px-5 sm:px-8 sm:pb-8">
        <QrMark href={shareHref} caption={t.scan} className="flex w-28" />
        <div className="pointer-events-auto flex flex-col items-stretch gap-2">
          <Button asChild variant="outline" size="lg">
            <Link to="/inspire">{t.inspire}</Link>
          </Button>
          <Button asChild size="lg">
            <Link to="/share">
              <PenLine />
              {t.writeMine}
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

function OrbitWord({ item, age }: { item: Impact; age: number }) {
  const pos = impactOrbit(item.id, age);
  if (!pos.visible) return null;
  const words = item.text.trim().split(/\s+/).length;
  return (
    <p className={cn("orbit-word", words <= 3 && "orbit-word-full")} style={{
      left: `${(pos.x * 100).toFixed(2)}%`,
      top: `${(pos.y * 100).toFixed(2)}%`,
      opacity: pos.opacity,
      transform: `translate(-50%, -50%) scale(${pos.scale})`,
      fontSize: `${(0.62 + pos.scale * 0.38).toFixed(2)}rem`,
    }}>{item.text}</p>
  );
}

export function WallPending() {
  return (
    <main className="flex h-dvh items-center justify-center bg-bg text-fg">
      <p className="hero-mark text-fg">أثر</p>
    </main>
  );
}
