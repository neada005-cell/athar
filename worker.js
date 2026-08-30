function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

const ORBIT_LIMIT = 12;

function makeSlots() {
  const out = [];
  for (let i = 0; i < ORBIT_LIMIT; i++) {
    const a = ((-90 + i * 30) * Math.PI) / 180;
    const far = i % 2 === 1;
    const rx = far ? 0.38 : 0.28;
    const ry = far ? 0.27 : 0.195;
    out.push({
      x: Math.min(0.86, Math.max(0.14, 0.5 + Math.cos(a) * rx)),
      y: Math.min(0.73, Math.max(0.26, 0.52 + Math.sin(a) * ry)),
    });
  }
  return out;
}
const SLOTS = makeSlots();

function clearance(age) {
  if (age <= 2) return 0.13;
  if (age <= 5) return 0.1;
  if (age <= 8) return 0.08;
  return 0.055;
}

function pickEmptiest(occupied) {
  const used = new Set(occupied.map((o) => o.slot));
  if (used.size >= SLOTS.length) return 0;
  let best = 0;
  let bestScore = -Infinity;
  for (let s = 0; s < SLOTS.length; s++) {
    if (used.has(s)) continue;
    const p = SLOTS[s];
    let minGap = 9;
    for (const o of occupied) {
      const q = SLOTS[o.slot];
      const dist = Math.hypot((p.x - q.x) * 1.7, p.y - q.y);
      minGap = Math.min(minGap, dist - clearance(0) - clearance(o.age));
    }
    const left = occupied.filter((o) => SLOTS[o.slot].x < 0.5).length;
    const right = occupied.filter((o) => SLOTS[o.slot].x >= 0.5).length;
    const top = occupied.filter((o) => SLOTS[o.slot].y < 0.52).length;
    const bot = occupied.filter((o) => SLOTS[o.slot].y >= 0.52).length;
    const score =
      minGap +
      (p.x < 0.5 ? right - left : left - right) * 0.05 +
      (p.y < 0.52 ? bot - top : top - bot) * 0.04;
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  return best;
}

function nextSlot(items) {
  const occupied = items
    .slice(0, ORBIT_LIMIT - 1)
    .map((it, i) => ({ slot: it.slot, age: i + 1 }))
    .filter((o) => o.slot != null && o.slot >= 0);
  return pickEmptiest(occupied);
}

export class Wall {
  constructor(state) {
    this.state = state;
  }

  async fetch(request) {
    const items = (await this.state.storage.get("items")) || [];

    if (request.method === "GET") {
      return Response.json({ items, count: items.length }, { headers: cors() });
    }

    if (request.method === "POST") {
      let body = "";
      let data = {};
      try {
        data = await request.json();
        body = String(data.body || "").replace(/\s+/g, " ").trim();
      } catch {
        return Response.json({ error: "bad" }, { status: 400, headers: cors() });
      }
      if (body.length < 2 || body.length > 80) {
        return Response.json({ error: "short" }, { status: 400, headers: cors() });
      }
      const incomingId = Number(data.id) || 0;
      const existing = incomingId ? items.find((it) => Number(it.id) === incomingId) : null;
      if (existing) {
        return Response.json(existing, { headers: cors() });
      }
      const row = {
        id: incomingId || Date.now(),
        text: body,
        slot: data.slot != null ? Number(data.slot) : nextSlot(items),
        createdAt: data.createdAt || new Date().toISOString(),
      };
      const next = [row, ...items].slice(0, 500);
      await this.state.storage.put("items", next);
      return Response.json(row, { headers: cors() });
    }

    return new Response("Method Not Allowed", { status: 405, headers: cors() });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/impacts") {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: cors() });
      }
      const id = env.WALL.idFromName("main");
      const stub = env.WALL.get(id);
      return stub.fetch(request);
    }

    return env.ASSETS.fetch(request);
  },
};
