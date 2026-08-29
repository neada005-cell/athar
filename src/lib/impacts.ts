import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";

export type Impact = {
  id: number;
  text: string;
  createdAt: string;
};

export type ImpactList = {
  items: Impact[];
  count: number;
};

const bodySchema = z.object({
  body: z.string().min(1).max(120),
});

function normalizeBody(raw: string) {
  return raw.replace(/\s+/g, " ").trim();
}

function rowToImpact(row: { id: number; body: string; created_at: string }): Impact {
  return { id: row.id, text: row.body, createdAt: row.created_at };
}

export const listImpacts = createServerFn({ method: "GET" }).handler(
  async (): Promise<ImpactList> => {
    const sql = await getSql();
    const rows = await sql<{ id: number; body: string; created_at: string }>`
      select id, body, created_at::text as created_at
      from impacts
      order by id desc
      limit 80
    `;
    const countRows = await sql<{ n: number }>`
      select count(*)::int as n from impacts
    `;
    return {
      items: rows.map(rowToImpact),
      count: countRows[0]?.n ?? 0,
    };
  },
);

export const listAllImpacts = createServerFn({ method: "GET" }).handler(
  async (): Promise<ImpactList> => {
    const sql = await getSql();
    const rows = await sql<{ id: number; body: string; created_at: string }>`
      select id, body, created_at::text as created_at
      from impacts
      order by id desc
      limit 500
    `;
    const countRows = await sql<{ n: number }>`
      select count(*)::int as n from impacts
    `;
    return {
      items: rows.map(rowToImpact),
      count: countRows[0]?.n ?? 0,
    };
  },
);

export const addImpact = createServerFn({ method: "POST" })
  .validator(bodySchema)
  .handler(async ({ data }): Promise<Impact> => {
    const body = normalizeBody(data.body);
    if (body.length < 2 || body.length > 80) {
      throw new Error("اكتب أثرُك في جملة قصيرة.");
    }
    const sql = await getSql();
    const rows = await sql<{ id: number; body: string; created_at: string }>`
      insert into impacts (body)
      values (${body})
      returning id, body, created_at::text as created_at
    `;
    const row = rows[0];
    if (!row) throw new Error("ما قدرنا نحفظ الأثر. جرّب مرة ثانية.");
    return rowToImpact(row);
  });
