import bcrypt from "bcryptjs";
import "dotenv/config";
import jwt from "jsonwebtoken";
import { users } from "../db/schema";
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = parseInt(process.env.SALT || "10", 10);
  return await bcrypt.hash(password, saltRounds);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateJWT(payload: object): string {
  const secret = process.env.JWTSECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set in environment variables");
  }
  return jwt.sign(payload, secret, { expiresIn: "1h" });
}
