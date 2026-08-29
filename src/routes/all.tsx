import { createFileRoute, Link } from "@tanstack/react-router";
import { listAllImpacts } from "@/lib/impacts";
import { useLocale } from "@/lib/i18n";

export const Route = createFileRoute("/all")({
  loader: () => listAllImpacts(),
  staleTime: 0,
  component: AllPage,
});

function AllPage() {
  const { t, toggle, formatNum } = useLocale();
  const data = Route.useLoaderData();
  return (
    <main className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-bg px-5 py-4 sm:px-8">
        <div>
          <p className="text-xs text-muted">{t.club}</p>
          <h1 className="mt-1 font-display text-2xl">{t.allTitle}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={toggle} className="rounded-sm px-3 py-2 text-xs tracking-wide text-muted hover:text-fg">
            {t.langSwitch}
          </button>
          <Link to="/" className="text-sm text-muted hover:text-fg">{t.back}</Link>
        </div>
      </header>
      <p className="px-5 pt-5 text-sm tabular-nums text-muted sm:px-8">
        <span className="text-fg">{formatNum(data.count)}</span> {t.planted}
      </p>
      {data.items.length === 0 ? (
        <p className="px-5 py-16 text-muted sm:px-8">{t.allEmpty}</p>
      ) : (
        <ol className="mx-auto max-w-2xl px-5 py-6 sm:px-8">
          {data.items.map((item) => (
            <li key={item.id} className="border-b border-border py-4 font-display text-xl leading-snug">{item.text}</li>
          ))}
        </ol>
      )}
    </main>
  );
}
