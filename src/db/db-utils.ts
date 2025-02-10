import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { tasks, users } from "./schema";
import { userLogin } from "../server";
import { and, eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

// insert into users table
export async function insertIntoUsers(
  userData: typeof users.$inferInsert
): Promise<void> {
  try {
    const data = await db.insert(users).values(userData);
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

export async function insertATask(
  taskData: typeof tasks.$inferInsert
): Promise<typeof tasks.$inferInsert> {
  try {
    const data = await db.insert(tasks).values(taskData).returning();
    if (!data[0]) {
      throw new Error("Can't add invalid task.");
    }
    return data[0];
  } catch (error: any) {
    throw new Error(error.message || "Database error");
  }
}

export async function getAllTasks(
  userId: string
): Promise<(typeof tasks.$inferSelect)[]> {
  try {
    const data = await db.select().from(tasks).where(eq(tasks.userId, userId));
    if (!data) {
      throw new Error("Invalid user ID");
    }
    return data;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function getTaskByID(
  taskId: string,
  userId: string
): Promise<void> {
  try {
    const task = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.id, taskId)))
      .limit(1);
    if (!task[0]) {
      throw new Error("No such task.");
    }
    if (task[0].status == "Completed") {
      throw new Error("Task already completed");
    }
    await db
      .update(tasks)
      .set({ status: "Completed" })
      .where(eq(tasks.id, taskId));
    return;
  } catch (error: any) {
    throw new Error(error.message);
  }
}
export async function deleteTaskByID(
  taskId: string,
  userId: string
): Promise<void> {
  try {
    const task = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.id, taskId)))
      .limit(1);
    if (!task[0]) {
      throw new Error("No such task.");
    }

    await db.delete(tasks).where(eq(tasks.id, taskId));
    return;
  } catch (error: any) {
    throw new Error(error.message);
  }
}
