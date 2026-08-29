import { Link } from "@tanstack/react-router";
import { useLocale } from "@/lib/i18n";

export function InspireFlow() {
  const { t, toggle } = useLocale();

  return (
    <main className="relative z-10 h-dvh overflow-hidden bg-bg text-fg">
      <header className="absolute inset-x-0 top-0 z-20 flex items-start justify-between px-5 py-5 sm:px-8 sm:py-7">
        <button
          type="button"
          onClick={toggle}
          className="rounded-sm px-3 py-2 text-xs tracking-wide text-muted hover:text-fg"
        >
          {t.langSwitch}
        </button>
        <Link to="/" className="text-sm text-muted hover:text-fg">
          {t.back}
        </Link>
      </header>

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-lg">
          <p className="font-display text-2xl leading-snug sm:text-3xl">{t.inspireLead}</p>
          <p className="mt-6 text-lg leading-relaxed text-muted sm:text-xl">
            {t.inspireRest}
          </p>
        </div>
      </div>
    </main>
  );
}
