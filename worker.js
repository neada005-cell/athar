const STORE = "https://athar.internal/impacts";

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

async function readItems() {
  const hit = await caches.default.match(STORE);
  if (!hit) return [];
  try {
    const data = await hit.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeItems(items) {
  await caches.default.put(
    STORE,
    new Response(JSON.stringify(items), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "max-age=31536000",
      },
    }),
  );
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/impacts") {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: cors() });
      }

      if (request.method === "GET") {
        const items = await readItems();
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
        const items = await readItems();
        const row = { id: Date.now(), text: body, createdAt: new Date().toISOString() };
        const next = [row, ...items].slice(0, 500);
        await writeItems(next);
        return Response.json(row, { headers: cors() });
      }

      return new Response("Method Not Allowed", { status: 405, headers: cors() });
    }

    return env.ASSETS.fetch(request);
  },
};
