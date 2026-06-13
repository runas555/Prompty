import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { generateUUID } from "@/lib/utils";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await initDb();
    
    // Получаем всех агентов для свободного просмотра всеми гостями
    const queryResult = await db.execute(`
      SELECT 
        a.id, 
        a.user_id,
        a.name, 
        a.created_at,
        pv.prompt, 
        pv.version, 
        pv.created_at as updated_at
      FROM agents a
      LEFT JOIN prompt_versions pv ON pv.agent_id = a.id
      WHERE pv.version = (
        SELECT MAX(version) FROM prompt_versions WHERE agent_id = a.id
      )
      ORDER BY a.created_at DESC
    `);

    const agents = queryResult.rows.map(row => ({
      id: row.id as string,
      userId: row.user_id as string, // Передаем ID владельца для разграничения прав в UI
      name: row.name as string,
      createdAt: Number(row.created_at),
      prompt: row.prompt as string,
      version: Number(row.version),
      updatedAt: Number(row.updated_at)
    }));

    return NextResponse.json(agents);
  } catch (error: any) {
    console.error("GET /api/agents error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Для создания агентов необходима авторизация" }, { status: 401 });
    }

    const { name, prompt } = await request.json();

    if (!name || !name.trim() || !prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Заполните все поля формы" }, { status: 400 });
    }

    const agentId = generateUUID();
    const versionId = generateUUID();
    const now = Date.now();

    await db.execute({
      sql: "INSERT INTO agents (id, user_id, name, created_at) VALUES (?, ?, ?, ?)",
      args: [agentId, user.id, name.trim(), now]
    });

    await db.execute({
      sql: "INSERT INTO prompt_versions (id, agent_id, prompt, version, created_at) VALUES (?, ?, ?, ?, ?)",
      args: [versionId, agentId, prompt.trim(), 1, now]
    });

    return NextResponse.json({
      id: agentId,
      userId: user.id,
      name: name.trim(),
      createdAt: now,
      prompt: prompt.trim(),
      version: 1,
      updatedAt: now
    }, { status: 201 });

  } catch (error: any) {
    console.error("POST /api/agents error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}