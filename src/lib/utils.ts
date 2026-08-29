import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function arNum(n: number) {
  return n.toLocaleString("ar-SA");
}

const GOLDEN = Math.PI * (3 - Math.sqrt(5));
export const ORBIT_LIMIT = 14;

function round(n: number, digits = 3) {
  const p = 10 ** digits;
  return Math.round(n * p) / p;
}

export function impactOrbit(id: number, ageIndex: number) {
  const angle = id * GOLDEN;
  const ring = Math.max(0.12, 0.58 - ageIndex * 0.033);
  const x = 0.5 + Math.cos(angle) * ring * 1.15;
  const y = 0.46 + Math.sin(angle) * ring * 0.82;
  const scale = Math.max(0.22, 1 - ageIndex * 0.055);
  const opacity = Math.max(0, 1 - ageIndex * 0.07);
  return {
    x: round(Math.min(0.88, Math.max(0.12, x))),
    y: round(Math.min(0.74, Math.max(0.18, y))),
    scale: round(scale, 3),
    opacity: round(opacity, 2),
    visible: ageIndex < ORBIT_LIMIT && opacity > 0.08,
  };
}
