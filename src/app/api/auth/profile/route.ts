import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { db, initDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
    }

    // Считаем персональную статистику
    const promptsResult = await db.execute({
      sql: "SELECT COUNT(*) as count FROM agents WHERE user_id = ?",
      args: [user.id]
    });

    const commentsResult = await db.execute({
      sql: "SELECT COUNT(*) as count FROM comments WHERE user_id = ?",
      args: [user.id]
    });

    const likesResult = await db.execute({
      sql: "SELECT COUNT(*) as count FROM likes WHERE agent_id IN (SELECT id FROM agents WHERE user_id = ?)",
      args: [user.id]
    });

    return NextResponse.json({
      promptsCount: Number(promptsResult.rows[0].count) || 0,
      commentsCount: Number(commentsResult.rows[0].count) || 0,
      likesReceived: Number(likesResult.rows[0].count) || 0
    });
  } catch (error: any) {
    console.error("Profile Stats GET error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
    }

    const { bio, avatar } = await request.json();

    // Обновляем текстовое описание и аватар (Base64)
    await db.execute({
      sql: "UPDATE users SET bio = ?, avatar = ? WHERE id = ?",
      args: [bio ? bio.trim() : "", avatar || "", user.id]
    });

    return NextResponse.json({ success: true, bio, avatar });
  } catch (error: any) {
    console.error("Profile Save POST error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}