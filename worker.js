function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store, no-cache",
  };
}

const PN_CH = "athar-neada005-wall";
const PN = "https://ps.pndsn.com";
const ORBIT_LIMIT = 18;
const MAX_ITEMS = 80;
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

async function readWall() {
  const res = await fetch(PN + "/v2/history/sub-key/demo/channel/" + PN_CH + "?count=20");
  const json = await res.json();
  const msgs = json[0] || [];
  const map = new Map();
  let count = 0;
  for (const m of msgs) {
    if (!m || !Array.isArray(m.items) || !m.items.length) continue;
    count = Math.max(count, Number(m.count) || 0);
    for (const it of m.items) {
      if (!it || !it.text) continue;
      map.set(String(it.id), {
        id: Number(it.id) || Date.now(),
        text: String(it.text),
        slot: it.slot,
        createdAt: it.createdAt,
      });
    }
  }
  const items = [...map.values()].sort((a, b) => Number(b.id) - Number(a.id));
  return { items: items, count: Math.max(count, items.length) };
}

async function writeWall(state) {
  if (!state.items.length) return;
  await fetch(PN + "/publish/demo/demo/0/" + PN_CH + "/0", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: state.items.slice(0, MAX_ITEMS), count: state.count }),
  });
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
        try {
          const wall = await readWall();
          return json(wall);
        } catch (e) {
          return json({ items: [], count: 0 });
        }
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
        const wall = await readWall();
        const row = {
          id: Date.now() * 100 + Math.floor(Math.random() * 100),
          text: body,
          slot: nextSlot(wall.items),
          createdAt: new Date().toISOString(),
        };
        const items = [row, ...wall.items].slice(0, MAX_ITEMS);
        const next = { items: items, count: wall.count + 1 };
        await writeWall(next);
        return json(row);
      }
      return new Response("Method Not Allowed", { status: 405, headers: cors() });
    }
    return env.ASSETS.fetch(request);
  },
};
