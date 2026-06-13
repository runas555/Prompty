import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDb();
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
    }

    const { id: agentId } = params;

    // Вставляем запись лайка, игнорируя дублирования на уровне СУБД
    await db.execute({
      sql: "INSERT OR IGNORE INTO likes (user_id, agent_id, created_at) VALUES (?, ?, ?)",
      args: [user.id, agentId, Date.now()]
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Like Error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDb();
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
    }

    const { id: agentId } = params;

    await db.execute({
      sql: "DELETE FROM likes WHERE user_id = ? AND agent_id = ?",
      args: [user.id, agentId]
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Unlike Error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}