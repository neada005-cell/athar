import { createFileRoute } from "@tanstack/react-router";
import { listImpacts } from "@/lib/impacts";
import { WallPending, WallStage } from "@/components/wall-stage";

export const Route = createFileRoute("/")({
  loader: () => listImpacts(),
  staleTime: 0,
  pendingComponent: WallPending,
  component: Home,
});

function Home() {
  const initial = Route.useLoaderData();
  return <WallStage initial={initial} />;
}
