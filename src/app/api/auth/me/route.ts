import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { db, initDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const verified = verifyAuth(request);
    if (!verified) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const userQuery = await db.execute({
      sql: "SELECT id, username, bio FROM users WHERE id = ?",
      args: [verified.id]
    });

    if (userQuery.rows.length === 0) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = userQuery.rows[0];
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id as string,
        username: user.username as string,
        bio: (user.bio as string) || ""
      }
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}