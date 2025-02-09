import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import express, { Request, Response } from "express";
import { z } from "zod";
import { userSignupSchema, userSchema } from "./db/schema";
import { comparePassword, generateJWT, hashPassword } from "./utils/utils";
import { getUserInfo, insertIntoUsers } from "./db/db-utils";

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
    const validation = userSignupSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error?.format() });
    }

    const { password, ...rest } = validation.data;
    const hashedPassword = await hashPassword(password);

    await insertIntoUsers({ ...rest, password: hashedPassword });
    return res
      .status(201)
      .json({ status: "success", message: "Your account is created" });
  } catch (error: any) {
    console.log(error);
    console.error("Sign-up Error:", error);
    if (error.message.includes("User already exists.")) {
      return res
        .status(400)
        .json({ status: "failure", message: error.message });
    }
    return res.status(500).json({
      status: "error",
      message: "Something went wrong. Please try again.",
    });
  }
}

app.post("/signup", handleSignUp);
/*
Login Flow:
1. The user provides their credentials (email, password).
2. The backend verifies the credentials.
3. If valid, a JWT token is returned for authentication.
*/
const userLogin = z.object({
  email: z.string().email(),
  password: z.string(),
});
export type userLogin = z.infer<typeof userLogin>;
async function handleLogin(req: Request, res: Response): Promise<any> {
  try {
    const userCredentials = userLogin.safeParse(req.body);
    if (!userCredentials.success) {
      return res.status(400).json({ error: userCredentials.error?.format() });
    }
    const userData = await getUserInfo(userCredentials.data);
    const validUser = await comparePassword(
      userCredentials.data.password,
      userData.password
    );
    if (!validUser) {
      return res
        .status(401)
        .json({ status: "failure", message: "Invalid credentials." });
    }
    return res.status(200).json({
      status: "success",
      token: generateJWT({ id: userData.id, email: userData.email }),
    });
  } catch (error: any) {
    return res.status(401).json({ status: "failure", message: error.message });
  }
}
app.get("/login", handleLogin);
app.listen(3000, () => console.log("Server running on port 3000"));
