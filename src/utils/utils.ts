import bcrypt from "bcryptjs";
import "dotenv/config";

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = parseInt(process.env.SALT || "10", 10);
  return await bcrypt.hash(password, saltRounds);
}
