import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { generateUUID } from "@/lib/utils";
import { verifyAuth } from "@/lib/auth";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDb();
    const { id } = params;
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Запрещено без авторизации" }, { status: 401 });
    }

    const { name, prompt, category } = await request.json();

    if (!name || !name.trim() || !prompt || !prompt.trim() || !category) {
      return NextResponse.json({ error: "Заполните все поля" }, { status: 400 });
    }

    const agentCheck = await db.execute({
      sql: "SELECT * FROM agents WHERE id = ? AND user_id = ?",
      args: [id, user.id]
    });

    if (agentCheck.rows.length === 0) {
      return NextResponse.json({ error: "Пост не найден или доступ ограничен" }, { status: 404 });
    }

    await db.execute({
      sql: "UPDATE agents SET name = ?, category = ? WHERE id = ?",
      args: [name.trim(), category, id]
    });

    const lastVersionResult = await db.execute({
      sql: "SELECT MAX(version) as max_ver FROM prompt_versions WHERE agent_id = ?",
      args: [id]
    });

    const currentMaxVersion = Number(lastVersionResult.rows[0].max_ver) || 0;

    const lastPromptResult = await db.execute({
      sql: "SELECT prompt FROM prompt_versions WHERE agent_id = ? AND version = ?",
      args: [id, currentMaxVersion]
    });

    const lastPromptText = lastPromptResult.rows[0]?.prompt as string;
    let nextVersion = currentMaxVersion;
    const now = Date.now();

    if (lastPromptText !== prompt.trim()) {
      nextVersion = currentMaxVersion + 1;
      const versionId = generateUUID();
      await db.execute({
        sql: "INSERT INTO prompt_versions (id, agent_id, prompt, version, created_at) VALUES (?, ?, ?, ?, ?)",
        args: [versionId, id, prompt.trim(), nextVersion, now]
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PUT /api/agents/[id] error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDb();
    const { id } = params;
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Доступ ограничен" }, { status: 401 });
    }

    const agentCheck = await db.execute({
      sql: "SELECT * FROM agents WHERE id = ? AND user_id = ?",
      args: [id, user.id]
    });

    if (agentCheck.rows.length === 0) {
      return NextResponse.json({ error: "Пост не найден или доступ ограничен" }, { status: 404 });
    }

    await db.execute({ sql: "DELETE FROM agents WHERE id = ?", args: [id] });
    await db.execute({ sql: "DELETE FROM prompt_versions WHERE agent_id = ?", args: [id] });
    await db.execute({ sql: "DELETE FROM comments WHERE agent_id = ?", args: [id] });
    await db.execute({ sql: "DELETE FROM likes WHERE agent_id = ?", args: [id] });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/agents/[id] error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}