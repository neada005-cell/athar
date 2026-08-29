import { impactOrbit } from "@/lib/utils";

export function RippleField({ burstId }: { burstId: number | null }) {
  const burst = burstId != null ? impactOrbit(burstId, 0) : null;

  return (
    <svg className="absolute inset-0 size-full" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <circle
          key={i}
          className="ripple-ring"
          cx="50%"
          cy="46%"
          r="42%"
          style={{ animationDelay: `${i * -1.8}s` }}
        />
      ))}
      {burst ? (
        <circle
          key={burstId}
          className="ripple-burst"
          cx={`${burst.x * 100}%`}
          cy={`${burst.y * 100}%`}
          r="7%"
        />
      ) : null}
    </svg>
  );
}
