import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDb();
    const { id: agentId } = params;

    const result = await db.execute({
      sql: "SELECT id, prompt, version, created_at FROM prompt_versions WHERE agent_id = ? ORDER BY version DESC",
      args: [agentId]
    });

    const versions = result.rows.map(row => ({
      id: row.id as string,
      prompt: row.prompt as string,
      version: Number(row.version),
      createdAt: Number(row.created_at)
    }));

    return NextResponse.json(versions);
  } catch (error: any) {
    console.error("GET Versions error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}