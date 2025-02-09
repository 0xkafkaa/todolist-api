import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { users, userSchema } from "./schema";
import { userLogin } from "../server";
import { eq } from "drizzle-orm";
const db = drizzle(process.env.DATABASE_URL!);

// insert into users table
export async function insertIntoUsers(
  userData: typeof users.$inferInsert
): Promise<void> {
  try {
    const data = await db
      .insert(users)
      .values(userData)
      .returning({ id: users.id, name: users.name, email: users.email });
    return;
  } catch (error: any) {
    if (error.message.includes("duplicate key value")) {
      throw new Error(
        "User already exists. Please use a different email or username."
      );
    }
    throw new Error("Failed to insert user.");
  }
}

export async function getUserInfo(
  userData: userLogin
): Promise<typeof users.$inferSelect> {
  try {
    const data = await db
      .select()
      .from(users)
      .where(eq(users.email, userData.email))
      .limit(1);
    if (!data[0]) {
      throw new Error("User didn't sign up");
    }
    return data[0];
  } catch (error: any) {
    throw new Error(error.message || "Database error");
  }
}
