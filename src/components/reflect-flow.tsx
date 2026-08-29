import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { addImpact } from "@/lib/impacts";
import { useLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const LIMIT = 80;
type Phase = "intro" | "dark" | "write" | "done";

export function ReflectFlow() {
  const { t, toggle } = useLocale();
  const [phase, setPhase] = useState<Phase>("intro");
  const [showSkip, setShowSkip] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState("");
  const [kiosk, setKiosk] = useState(false);

  useEffect(() => {
    setKiosk(new URLSearchParams(window.location.search).get("kiosk") === "1");
  }, []);

  useEffect(() => {
    if (phase !== "dark") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("write");
      return;
    }
    const done = window.setTimeout(() => setPhase("write"), 5000);
    const skip = window.setTimeout(() => setShowSkip(true), 1800);
    return () => {
      window.clearTimeout(done);
      window.clearTimeout(skip);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "done" || !kiosk) return;
    const timeout = window.setTimeout(() => {
      setPhase("intro"); setDraft(""); setSaved(""); setShowSkip(false);
    }, 9000);
    return () => window.clearTimeout(timeout);
  }, [phase, kiosk]);

  const submit = async () => {
    const body = draft.replace(/\s+/g, " ").trim();
    if (body.length < 2) { setError(t.tooShort); return; }
    setBusy(true); setError("");
    try {
      const row = await addImpact({ data: { body } });
      setSaved(row.text); setPhase("done");
    } catch { setError(t.saveFail); }
    finally { setBusy(false); }
  };

  return (
    <main className="relative flex h-dvh flex-col bg-bg text-fg">
      <button type="button" onClick={toggle} className="absolute end-5 top-8 z-10 text-xs tracking-wide text-muted hover:text-fg">
        {t.langSwitch}
      </button>
      {phase === "intro" ? (
        <section className="mx-auto flex h-full w-full max-w-md flex-col justify-between px-6 py-10">
          <p className="text-xs text-muted">{t.club}</p>
          <div>
            <h1 className="font-display text-4xl leading-tight">
              {t.introTitle[0]}<br />{t.introTitle[1]}<br />{t.introTitle[2]}
            </h1>
            <p className="mt-5 text-sm leading-relaxed text-muted">{t.introBody}</p>
          </div>
          <Button size="wide" onClick={() => setPhase("dark")}>{t.enter}</Button>
        </section>
      ) : null}
      {phase === "dark" ? (
        <section className="flex h-full flex-col items-center justify-center px-6 text-center">
          <p className="rise-in max-w-sm font-display text-3xl leading-snug">{t.question}</p>
          <p className="mt-4 text-sm text-subtle">{t.think}</p>
          {showSkip ? (
            <Button variant="ghost" className="mt-10" onClick={() => setPhase("write")}>{t.skip}</Button>
          ) : <div className="mt-10 h-11" />}
        </section>
      ) : null}
      {phase === "write" ? (
        <section className="mx-auto flex h-full w-full max-w-md flex-col justify-between px-6 py-10">
          <div>
            <p className="text-xs text-muted">{t.question}</p>
            <h1 className="mt-3 font-display text-3xl leading-tight">{t.writeTitle}</h1>
          </div>
          <div>
            <Textarea id="impact-body" value={draft} maxLength={LIMIT} autoFocus placeholder={t.writePlaceholder}
              onChange={(e) => { setDraft(e.target.value); setError(""); }} />
            <div className="mt-2 flex items-center justify-between text-xs text-subtle">
              <span>{error || t.writeHint}</span>
              <span className="tabular-nums">{draft.length}/{LIMIT}</span>
            </div>
          </div>
          <Button size="wide" onClick={submit} disabled={busy}>{busy ? t.planting : t.plant}</Button>
        </section>
      ) : null}
      {phase === "done" ? (
        <section className="mx-auto flex h-full w-full max-w-md flex-col justify-between px-6 py-10 text-center">
          <p className="text-xs text-muted">{t.club}</p>
          <div>
            <p className="font-display text-4xl leading-tight">{t.doneTitle}</p>
            <p className="rise-in mt-6 font-display text-2xl leading-snug text-fg">{saved}</p>
            <p className="mt-5 text-sm text-muted">{t.doneHint}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button size="wide" onClick={() => { setDraft(""); setSaved(""); setShowSkip(false); setPhase("dark"); }}>{t.another}</Button>
            <Button asChild variant="outline" size="wide"><Link to="/">{t.back}</Link></Button>
          </div>
        </section>
      ) : null}
    </main>
  );
}
