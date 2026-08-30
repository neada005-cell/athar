function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

const SLOT_COUNT = 8;

function hashId(id) {
  let x = Number(id) | 0;
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d);
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b);
  return (x ^ (x >>> 16)) >>> 0;
}

function nextSlot(items) {
  const used = new Set(
    items.slice(0, SLOT_COUNT).map((it) => it.slot).filter((s) => s != null),
  );
  const start = hashId(Date.now()) % SLOT_COUNT;
  for (let n = 0; n < SLOT_COUNT; n++) {
    const s = (start + n) % SLOT_COUNT;
    if (!used.has(s)) return s;
  }
  return start;
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
      try {
        const data = await request.json();
        body = String(data.body || "").replace(/\s+/g, " ").trim();
      } catch {
        return Response.json({ error: "bad" }, { status: 400, headers: cors() });
      }
      if (body.length < 2 || body.length > 80) {
        return Response.json({ error: "short" }, { status: 400, headers: cors() });
      }
      const row = {
        id: Date.now(),
        text: body,
        slot: nextSlot(items),
        createdAt: new Date().toISOString(),
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
