import { createFileRoute } from "@tanstack/react-router";
import { ReflectFlow } from "@/components/reflect-flow";

export const Route = createFileRoute("/share")({
  component: SharePage,
});

function SharePage() {
  return <ReflectFlow />;
}
