import { NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await initDb();
    const { id } = params;

    // Выбираем все версии промптов для агента, отсортированные по убыванию версии
    const result = await db.execute({
      sql: "SELECT id, prompt, version, created_at FROM prompt_versions WHERE agent_id = ? ORDER BY version DESC",
      args: [id]
    });

    const versions = result.rows.map(row => ({
      id: row.id as string,
      prompt: row.prompt as string,
      version: Number(row.version),
      createdAt: Number(row.created_at)
    }));

    return NextResponse.json(versions);
  } catch (error: any) {
    console.error("GET /api/agents/[id]/versions error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}