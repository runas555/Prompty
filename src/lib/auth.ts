import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_local_jwt_fallback_secret_key";

export interface AuthUser {
  id: string;
  username: string;
}

export function verifyAuth(request: NextRequest): AuthUser | null {
  const cookieHeader = request.cookies.get("auth_token");
  if (!cookieHeader) return null;

  try {
    const token = cookieHeader.value;
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch (error) {
    return null;
  }
}