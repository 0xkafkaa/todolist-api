import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import express, {
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express";
import { z } from "zod";
import { userSignupSchema, userSchema, tasksSchema } from "./db/schema";
import { comparePassword, generateJWT, hashPassword } from "./utils/utils";
import {
  getAllTasks,
  getUserInfo,
  insertATask,
  insertIntoUsers,
} from "./db/db-utils";
import jwt from "jsonwebtoken";

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
      token: generateJWT({
        id: userData.id,
        email: userData.email,
        username: userData.username,
      }),
    });
  } catch (error: any) {
    return res.status(401).json({ status: "failure", message: error.message });
  }
}
app.get("/login", handleLogin);
/*
Middleware flow:
1. Check the jwt provided in the header
2. If the token is valid
*/
interface AuthRequest extends Request {
  user?: any;
}
const authMiddleware: RequestHandler = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const secret = String(process.env.JWTSECRET);
    if (!secret) {
      throw new Error("JWT_SECRET is not set in the environment variables");
    }
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error: any) {
    res.status(403).json({ message: "Invalid token", error: error.message });
    return;
  }
};

/*
Get Tasks flow:
- Authenticate the user using the middleware
- Get all the tasks
- Return a response
*/
async function handleGetTasks(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const tasks = await getAllTasks(user.id);
    res.status(200).json({ status: "success", data: tasks });
    return;
  } catch (error: any) {
    res.status(401).json({
      status: "failure",
      message: "Invalid user",
      error: error.message,
    });
  }
}
app.get("/getTasks", authMiddleware, handleGetTasks);
/*
Create Tasks flow:
- Authenticate the user using the middleware
- Insert a task in the db
- Return a response
*/
async function handlePostTasks(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const validations = tasksSchema.safeParse({ ...req.body, userId: user.id });
    if (!validations.success) {
      res.status(400).json({ status: "failure", message: "Invalid task." });
      return;
    }
    const newTask = validations.data;
    const task = await insertATask(newTask!);
    res
      .status(201)
      .json({ status: "success", message: "Task created.", data: task });
    return;
  } catch (error) {
    res
      .status(500)
      .json({ status: "failure", message: "Internal server error." });
    return;
  }
}
app.post("/createTask", authMiddleware, handlePostTasks);

/*
Update task flow:
- Authenticate the user using the middleware
- Select the task based on the taskID
- Update its status
- Return a response
*/

app.listen(3000, () => console.log("Server running on port 3000"));
