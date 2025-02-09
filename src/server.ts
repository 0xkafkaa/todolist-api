import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import express, { Request, Response } from "express";
import { z } from "zod";
import { userInputSchema, userSchema } from "./db/schema";
import { hashPassword } from "./utils/utils";
import { insertIntoUsers } from "./db/db-utils";

const db = drizzle(process.env.DATABASE_URL!);
const app = express();
app.use(express.json());
/* 
Sign-up Flow:
1. The user signs up using their credentials (email, password, etc.).
2. The password is hashed and stored in the database.
3. (Optional) Send an email verification link and activate the account upon confirmation.
*/

async function handleSignUp(req: Request, res: Response): Promise<any> {
  try {
    //    the user signs up using their credentials
    //   const { name, username, email, password } = req.body;
    let validation = userInputSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error?.format() });
    }

    // hash password
    const { password, ...rest } = validation.data;
    const hashedPassword = await hashPassword(password);

    // insert into db
    const data = await insertIntoUsers({ ...rest, password });
    return res.status(200).json({ status: "sucess", message: data });
  } catch (error: any) {
    console.log(error);
    if (error.message.includes("User already exists.")) {
      return res
        .status(400)
        .json({ status: "failure", message: error.message });
    }
    return res
      .status(500)
      .json({ status: "error", message: "Internal Server Error" });
  }
}

app.post("/signup", handleSignUp);
/*
Login Flow:
1. The user provides their credentials (email, password).
2. The backend verifies the credentials.
3. If valid, a JWT token is returned for authentication.
*/
app.listen(3000, () => console.log("Server running on port 3000"));
