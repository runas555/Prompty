import { NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { generateUUID } from "@/lib/utils";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await initDb();
    const { id } = params;
    const { name, prompt, adminToken } = await request.json();

    if (!name || !name.trim() || !prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Имя агента и промпт обязательны к заполнению" }, { status: 400 });
    }

    // Проверка авторизации
    const systemAdminToken = process.env.ADMIN_TOKEN;
    if (systemAdminToken && systemAdminToken.trim() !== "" && systemAdminToken !== adminToken) {
      return NextResponse.json({ error: "Неверный секретный токен администратора" }, { status: 401 });
    }

    // Проверяем существование агента
    const agentCheck = await db.execute({
      sql: "SELECT * FROM agents WHERE id = ?",
      args: [id]
    });

    if (agentCheck.rows.length === 0) {
      return NextResponse.json({ error: "Агент не найден" }, { status: 404 });
    }

    // Обновляем имя агента, если оно изменилось
    await db.execute({
      sql: "UPDATE agents SET name = ? WHERE id = ?",
      args: [name.trim(), id]
    });

    // Находим последнюю версию, чтобы узнать новый номер версии
    const lastVersionResult = await db.execute({
      sql: "SELECT MAX(version) as max_ver FROM prompt_versions WHERE agent_id = ?",
      args: [id]
    });

    const currentMaxVersion = Number(lastVersionResult.rows[0].max_ver) || 0;

    // Сравниваем текст промпта с последней сохраненной версией
    const lastPromptResult = await db.execute({
      sql: "SELECT prompt FROM prompt_versions WHERE agent_id = ? AND version = ?",
      args: [id, currentMaxVersion]
    });

    const lastPromptText = lastPromptResult.rows[0]?.prompt as string;
    let nextVersion = currentMaxVersion;
    const now = Date.now();

    // Записываем новую версию только в случае, если текст промпта реально изменился
    if (lastPromptText !== prompt.trim()) {
      nextVersion = currentMaxVersion + 1;
      const versionId = generateUUID();
      await db.execute({
        sql: "INSERT INTO prompt_versions (id, agent_id, prompt, version, created_at) VALUES (?, ?, ?, ?, ?)",
        args: [versionId, id, prompt.trim(), nextVersion, now]
      });
    }

    return NextResponse.json({
      id,
      name: name.trim(),
      prompt: prompt.trim(),
      version: nextVersion,
      updatedAt: now
    });

  } catch (error: any) {
    console.error("PUT /api/agents/[id] error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await initDb();
    const { id } = params;
    
    // Считываем токен из заголовка или URL-параметра
    const { searchParams } = new URL(request.url);
    const adminToken = searchParams.get("adminToken");

    // Проверка авторизации
    const systemAdminToken = process.env.ADMIN_TOKEN;
    if (systemAdminToken && systemAdminToken.trim() !== "" && systemAdminToken !== adminToken) {
      return NextResponse.json({ error: "Неверный секретный токен администратора" }, { status: 401 });
    }

    // Удаляем агента (связанные версии удалятся каскадно благодаря ON DELETE CASCADE в SQLite/libSQL)
    await db.execute({
      sql: "DELETE FROM agents WHERE id = ?",
      args: [id]
    });

    await db.execute({
      sql: "DELETE FROM prompt_versions WHERE agent_id = ?",
      args: [id]
    });

    return NextResponse.json({ success: true, message: "Агент успешно удален" });

  } catch (error: any) {
    console.error("DELETE /api/agents/[id] error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}