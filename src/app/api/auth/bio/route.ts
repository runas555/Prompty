import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { db, initDb } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
    }

    const { bio } = await request.json();

    await db.execute({
      sql: "UPDATE users SET bio = ? WHERE id = ?",
      args: [bio ? bio.trim() : "", user.id]
    });

    return NextResponse.json({ success: true, bio: bio ? bio.trim() : "" });
  } catch (error: any) {
    console.error("Bio Update Error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}