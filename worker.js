export class Wall {
  constructor(state) {
    this.state = state;
  }

  async fetch(request) {
    const items = (await this.state.storage.get("items")) || [];

    if (request.method === "GET") {
      return Response.json({ items, count: items.length });
    }

    if (request.method === "POST") {
      let body = "";
      try {
        const data = await request.json();
        body = String(data.body || "").replace(/\s+/g, " ").trim();
      } catch {
        return Response.json({ error: "bad" }, { status: 400 });
      }
      if (body.length < 2 || body.length > 80) {
        return Response.json({ error: "short" }, { status: 400 });
      }
      const row = { id: Date.now(), text: body, createdAt: new Date().toISOString() };
      const next = [row, ...items].slice(0, 500);
      await this.state.storage.put("items", next);
      return Response.json(row);
    }

    return new Response("Method Not Allowed", { status: 405 });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/impacts") {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      }
      const id = env.WALL.idFromName("main");
      return env.WALL.get(id).fetch(request);
    }
    return env.ASSETS.fetch(request);
  },
};
