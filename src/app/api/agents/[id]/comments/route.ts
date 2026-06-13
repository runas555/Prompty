import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { generateUUID } from "@/lib/utils";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDb();
    const { id: agentId } = params;

    // Считываем комментарии с профилями авторов
    const commentsResult = await db.execute({
      sql: `
        SELECT 
          c.id, 
          c.text, 
          c.prompt_version, 
          c.created_at, 
          u.username
        FROM comments c
        LEFT JOIN users u ON u.id = c.user_id
        WHERE c.agent_id = ?
        ORDER BY c.created_at DESC
      `,
      args: [agentId]
    });

    const comments = commentsResult.rows.map(row => ({
      id: row.id as string,
      text: row.text as string,
      promptVersion: Number(row.prompt_version),
      createdAt: Number(row.created_at),
      username: (row.username as string) || "Deleted User"
    }));

    return NextResponse.json(comments);
  } catch (error: any) {
    console.error("GET Comments error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDb();
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Только зарегистрированные пользователи могут оставлять комментарии" }, { status: 401 });
    }

    const { id: agentId } = params;
    const { text, promptVersion } = await request.json();

    if (!text || !text.trim() || !promptVersion) {
      return NextResponse.json({ error: "Введите текст комментария" }, { status: 400 });
    }

    const commentId = generateUUID();
    const now = Date.now();

    await db.execute({
      sql: "INSERT INTO comments (id, agent_id, user_id, text, prompt_version, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      args: [commentId, agentId, user.id, text.trim(), promptVersion, now]
    });

    return NextResponse.json({
      id: commentId,
      text: text.trim(),
      promptVersion,
      createdAt: now,
      username: user.username
    }, { status: 201 });

  } catch (error: any) {
    console.error("POST Comment Error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}