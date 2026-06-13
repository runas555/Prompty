import { NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_local_jwt_fallback_secret_key";

export async function POST(request: Request) {
  try {
    await initDb();
    const { username, password } = await request.json();

    if (!username || !username.trim() || !password || !password.trim()) {
      return NextResponse.json({ error: "Заполните все поля" }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();

    const result = await db.execute({
      sql: "SELECT id, username, password_hash, bio FROM users WHERE username = ?",
      args: [cleanUsername]
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Неправильное имя пользователя или пароль" }, { status: 401 });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password.trim(), user.password_hash as string);

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Неправильное имя пользователя или пароль" }, { status: 401 });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, bio: user.bio || "" }
    });

    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 30,
      path: "/"
    });

    return response;
  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}