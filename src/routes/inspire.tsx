import { createFileRoute } from "@tanstack/react-router";
import { InspireFlow } from "@/components/inspire-flow";

export const Route = createFileRoute("/inspire")({
  component: InspirePage,
});

function InspirePage() {
  return <InspireFlow />;
}
