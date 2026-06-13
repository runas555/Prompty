import { NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { generateUUID } from "@/lib/utils";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    await initDb();
    const { username, password } = await request.json();

    if (!username || !username.trim() || !password || !password.trim()) {
      return NextResponse.json({ error: "Все поля формы обязательны" }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      return NextResponse.json({ error: "Имя должно содержать не менее 3 символов" }, { status: 400 });
    }
    if (password.trim().length < 6) {
      return NextResponse.json({ error: "Пароль должен содержать не менее 6 символов" }, { status: 400 });
    }

    const userCheck = await db.execute({
      sql: "SELECT id FROM users WHERE username = ?",
      args: [cleanUsername]
    });

    if (userCheck.rows.length > 0) {
      return NextResponse.json({ error: "Данное имя пользователя уже зарегистрировано" }, { status: 409 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password.trim(), salt);
    const userId = generateUUID();
    const now = Date.now();

    await db.execute({
      sql: "INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)",
      args: [userId, cleanUsername, passwordHash, now]
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    console.error("Register Error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}