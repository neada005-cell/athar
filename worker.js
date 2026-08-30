function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store, no-cache",
  };
}

const STORE = new Request("https://athar.wall/items");
const ORBIT_LIMIT = 18;
const MAX_ITEMS = 500;
const ANGLES = Array.from(
  { length: ORBIT_LIMIT },
  (_, i) => -90 + (360 / ORBIT_LIMIT) * i + ((i % 3) - 1) * 5,
);

function angDist(a, b) {
  let d = Math.abs(a - b) % 360;
  if (d > 180) d = 360 - d;
  return d;
}
function needGap(age) {
  if (age <= 2) return 48;
  if (age <= 6) return 32;
  return 16;
}
function pickEmptiest(occupied) {
  const used = new Set(occupied.map((o) => o.slot));
  if (used.size >= ANGLES.length) return 0;
  let best = 0;
  let bestScore = -Infinity;
  for (let s = 0; s < ANGLES.length; s++) {
    if (used.has(s)) continue;
    let minGap = 180;
    for (const o of occupied) {
      minGap = Math.min(minGap, angDist(ANGLES[s], ANGLES[o.slot]) - needGap(o.age));
    }
    const left = occupied.filter((o) => Math.cos((ANGLES[o.slot] * Math.PI) / 180) < 0).length;
    const right = occupied.length - left;
    const onLeft = Math.cos((ANGLES[s] * Math.PI) / 180) < 0;
    const score = minGap + (onLeft ? right - left : left - right) * 4;
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

async function readState() {
  const hit = await caches.default.match(STORE);
  if (!hit) return { items: [], seq: 0, count: 0 };
  try {
    const data = await hit.json();
    const items = Array.isArray(data.items) ? data.items : [];
    return {
      items: items,
      seq: Number(data.seq) || items.length,
      count: Number(data.count) || items.length,
    };
  } catch (e) {
    return { items: [], seq: 0, count: 0 };
  }
}

async function writeState(state) {
  await caches.default.put(
    STORE,
    new Response(JSON.stringify(state), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "max-age=31536000",
      },
    }),
  );
}

function json(data, status) {
  return Response.json(data, { status: status || 200, headers: cors() });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/impacts") {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: cors() });
      }
      if (request.method === "GET") {
        const state = await readState();
        return json({ items: state.items, count: state.count });
      }
      if (request.method === "POST") {
        let body = "";
        try {
          const data = await request.json();
          body = String(data.body || "").replace(/\s+/g, " ").trim();
        } catch (e) {
          return json({ error: "bad" }, 400);
        }
        if (body.length < 2 || body.length > 80) {
          return json({ error: "short" }, 400);
        }
        const state = await readState();
        const seq = state.seq + 1;
        const row = {
          id: seq,
          text: body,
          slot: nextSlot(state.items),
          createdAt: new Date().toISOString(),
        };
        const items = [row, ...state.items].slice(0, MAX_ITEMS);
        await writeState({ items: items, seq: seq, count: state.count + 1 });
        return json(row);
      }
      return new Response("Method Not Allowed", { status: 405, headers: cors() });
    }
    return env.ASSETS.fetch(request);
  },
};
