function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store, no-cache",
  };
}

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

export class Wall {
  constructor(state) {
    this.state = state;
  }

  json(data, status) {
    return Response.json(data, { status: status || 200, headers: cors() });
  }

  async snapshot() {
    const items = (await this.state.storage.get("items")) || [];
    const seq = (await this.state.storage.get("seq")) || 0;
    const count = (await this.state.storage.get("count")) || items.length;
    return { items: items, seq: seq, count: count };
  }

  async broadcast() {
    const snap = await this.snapshot();
    const payload = JSON.stringify({ items: snap.items, count: snap.count });
    for (const ws of this.state.getWebSockets()) {
      try { ws.send(payload); } catch (e) {}
    }
  }

  async fetch(request) {
    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      this.state.acceptWebSocket(pair[1]);
      const snap = await this.snapshot();
      try { pair[1].send(JSON.stringify({ items: snap.items, count: snap.count })); } catch (e) {}
      return new Response(null, { status: 101, webSocket: pair[0] });
    }

    if (request.method === "GET") {
      const snap = await this.snapshot();
      return this.json({ items: snap.items, count: snap.count });
    }

    if (request.method === "POST") {
      let body = "";
      try {
        const data = await request.json();
        body = String(data.body || "").replace(/\s+/g, " ").trim();
      } catch (e) {
        return this.json({ error: "bad" }, 400);
      }
      if (body.length < 2 || body.length > 80) {
        return this.json({ error: "short" }, 400);
      }
      const snap = await this.snapshot();
      const nextSeq = snap.seq + 1;
      const row = {
        id: nextSeq,
        text: body,
        slot: nextSlot(snap.items),
        createdAt: new Date().toISOString(),
      };
      const next = [row, ...snap.items].slice(0, MAX_ITEMS);
      await this.state.storage.put({ seq: nextSeq, count: snap.count + 1, items: next });
      await this.broadcast();
      return this.json(row);
    }

    return new Response("Method Not Allowed", { status: 405, headers: cors() });
  }

  async webSocketMessage(ws) {
    const snap = await this.snapshot();
    try { ws.send(JSON.stringify({ items: snap.items, count: snap.count })); } catch (e) {}
  }
  async webSocketClose() {}
  async webSocketError() {}
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/impacts" || url.pathname === "/api/impacts/ws") {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: cors() });
      }
      const id = env.WALL.idFromName("athar-main");
      return env.WALL.get(id).fetch(request);
    }
    return env.ASSETS.fetch(request);
  },
};
