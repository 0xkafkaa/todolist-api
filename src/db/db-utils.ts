import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { users, userSchema } from "./schema";
const db = drizzle(process.env.DATABASE_URL!);

// insert into users table
export async function insertIntoUsers(
  userData: typeof users.$inferInsert
): Promise<any> {
  try {
    const data = await db
      .insert(users)
      .values(userData)
      .returning({ id: users.id, name: users.name, email: users.email });
    return data;
  } catch (error: any) {
    if (error.message.includes("duplicate key value")) {
      throw new Error(
        "User already exists. Please use a different email or username."
      );
    }
    throw new Error("Failed to insert user.");
  }
}
