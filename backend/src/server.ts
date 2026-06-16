import dotenv from "dotenv";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import mongoose from "mongoose";
import http from "http";
import { Server as SocketIOServer, type Socket } from "socket.io";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { UserDocument, UserRole } from "./models/User.js";
import { UserModel } from "./models/User.js";
import { listingRouter } from "./routes/listingRoutes.js";
import { placesRouter } from "./routes/placesRoutes.js";
import { requireAuth } from "./middleware/auth.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT ?? 4000);
const MONGO_URI = process.env.MONGO_URI ?? "";
const JWT_SECRET = process.env.JWT_SECRET ?? "change_me_in_production";

if (!MONGO_URI) {
  throw new Error("MONGO_URI must be defined in .env");
}

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET must be defined in .env");
}

async function connectDatabase() {
  await mongoose.connect(MONGO_URI);
  console.log("[backend] Connected to MongoDB Atlas");
}

function createToken(user: UserDocument) {
  return jwt.sign(
    {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
}

app.get("/api/health", (_req, res) => {
  return res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/api/auth/register", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role, location } = req.body as {
      name: string;
      email: string;
      password: string;
      role: UserRole;
      location: { type: "Point"; coordinates: [number, number] };
    };

    if (!name || !email || !password || !role || !location) {
      return res.status(400).json({ message: "Missing required registration fields." });
    }

    const existingUser = await UserModel.findOne({ email }).lean();
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      role,
      location,
    });

    const token = createToken(user);
    return res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, location: user.location } });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await UserModel.findOne({ email }).exec();
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = createToken(user);
    return res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, location: user.location } });
  } catch (error) {
    next(error);
  }
});

app.get("/api/auth/me", requireAuth(), async (req: Request, res: Response) => {
  const authUser = req.authUser;
  if (!authUser) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await UserModel.findById(authUser.id).lean();
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  return res.json({
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      location: user.location,
    },
  });
});

app.use("/api/listings", listingRouter(io));
app.use("/api/places", placesRouter());

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[backend] Internal server error", error);
  res.status(500).json({ message: "Internal server error", error: error.message });
});

async function startServer() {
  try {
    await connectDatabase();
    server.listen(PORT, () => {
      console.log(`[backend] Server listening on http://localhost:${PORT}`);
    });

    io.on("connection", (socket: Socket) => {
      console.log(`[backend] Socket connected: ${socket.id}`);
      socket.on("disconnect", () => {
        console.log(`[backend] Socket disconnected: ${socket.id}`);
      });
    });
  } catch (error) {
    console.error("[backend] Failed to start server", error);
    process.exit(1);
  }
}

startServer();
