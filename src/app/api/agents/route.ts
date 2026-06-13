import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { generateUUID } from "@/lib/utils";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const user = verifyAuth(request);
    
    // Считываем параметры фильтрации
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "all";
    const model = searchParams.get("model") || "all";
    const authorId = searchParams.get("authorId") || "";
    const likedBy = searchParams.get("likedBy") || "";

    let sqlQuery = `
      SELECT 
        a.id, 
        a.user_id,
        a.name, 
        a.category,
        a.model,
        a.tags,
        a.created_at,
        u.username,
        u.bio,
        u.avatar,
        pv.prompt, 
        pv.version, 
        pv.created_at as updated_at,
        (SELECT COUNT(*) FROM likes WHERE agent_id = a.id) as like_count,
        (SELECT COUNT(*) FROM comments WHERE agent_id = a.id) as comment_count,
        (SELECT COUNT(*) FROM likes WHERE agent_id = a.id AND user_id = ?) as has_liked
      FROM agents a
      LEFT JOIN users u ON u.id = a.user_id
      LEFT JOIN prompt_versions pv ON pv.agent_id = a.id
      WHERE pv.version = (
        SELECT MAX(version) FROM prompt_versions WHERE agent_id = a.id
      )
    `;

    const args: any[] = [user ? user.id : "guest_unauthorized"];

    if (category !== "all") {
      sqlQuery += " AND a.category = ?";
      args.push(category);
    }

    if (model !== "all") {
      sqlQuery += " AND a.model = ?";
      args.push(model);
    }

    if (authorId) {
      sqlQuery += " AND a.user_id = ?";
      args.push(authorId);
    }

    if (likedBy) {
      sqlQuery += " AND a.id IN (SELECT agent_id FROM likes WHERE user_id = ?)";
      args.push(likedBy);
    }

    sqlQuery += " ORDER BY a.created_at DESC";

    const queryResult = await db.execute({ sql: sqlQuery, args });

    const feed = queryResult.rows.map(row => ({
      id: row.id as string,
      userId: row.user_id as string,
      name: row.name as string,
      category: row.category as string,
      model: (row.model as string) || "any",
      tags: (row.tags as string) || "",
      createdAt: Number(row.created_at),
      username: (row.username as string) || "Deleted User",
      userBio: (row.bio as string) || "",
      avatar: (row.avatar as string) || "", // Возвращаем аватар автора
      prompt: row.prompt as string,
      version: Number(row.version),
      updatedAt: Number(row.updated_at),
      likeCount: Number(row.like_count),
      commentCount: Number(row.comment_count),
      hasLiked: Number(row.has_liked) > 0
    }));

    return NextResponse.json(feed);
  } catch (error: any) {
    console.error("GET /api/agents error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Пожалуйста, войдите в систему" }, { status: 401 });
    }

    const { name, prompt, category, model, tags } = await request.json();

    if (!name || !name.trim() || !prompt || !prompt.trim() || !category || !model) {
      return NextResponse.json({ error: "Заполните все поля" }, { status: 400 });
    }

    const cleanTags = tags 
      ? tags.split(",").map((t: string) => t.trim().toLowerCase()).filter((t: string) => t !== "").join(",") 
      : "";

    const agentId = generateUUID();
    const versionId = generateUUID();
    const now = Date.now();

    await db.execute({
      sql: "INSERT INTO agents (id, user_id, name, category, model, tags, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [agentId, user.id, name.trim(), category, model, cleanTags, now]
    });

    await db.execute({
      sql: "INSERT INTO prompt_versions (id, agent_id, prompt, version, created_at) VALUES (?, ?, ?, ?, ?)",
      args: [versionId, agentId, prompt.trim(), 1, now]
    });

    return NextResponse.json({ success: true, agentId }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/agents error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}