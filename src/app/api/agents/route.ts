import { NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { generateUUID } from "@/lib/utils";

// Разрешаем CORS
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

export async function GET() {
  try {
    await initDb();
    
    // Получаем список агентов с их самыми свежими версиями промптов
    const queryResult = await db.execute(`
      SELECT 
        a.id, 
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

export async function POST(request: Request) {
  try {
    await initDb();
    const { name, prompt, adminToken } = await request.json();

    if (!name || !name.trim() || !prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Имя агента и промпт обязательны к заполнению" }, { status: 400 });
    }

    // Проверка авторизации
    const systemAdminToken = process.env.ADMIN_TOKEN;
    if (systemAdminToken && systemAdminToken.trim() !== "" && systemAdminToken !== adminToken) {
      return NextResponse.json({ error: "Неверный секретный токен администратора" }, { status: 401 });
    }

    const agentId = generateUUID();
    const versionId = generateUUID();
    const now = Date.now();

    // Записываем агента в транзакции
    await db.execute({
      sql: "INSERT INTO agents (id, name, created_at) VALUES (?, ?, ?)",
      args: [agentId, name.trim(), now]
    });

    await db.execute({
      sql: "INSERT INTO prompt_versions (id, agent_id, prompt, version, created_at) VALUES (?, ?, ?, ?, ?)",
      args: [versionId, agentId, prompt.trim(), 1, now]
    });

    return NextResponse.json({
      id: agentId,
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