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
import { sendVerificationEmail } from "./services/mailService.js";

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

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
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
    const code = generateVerificationCode();
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    const user = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      role,
      location,
      isVerified: false,
      verificationCode: code,
      verificationCodeExpires: expiry,
    });

    sendVerificationEmail(user.email, code).catch((err) => {
      console.error("[backend] Failed to send registration email:", err);
    });

    return res.status(201).json({
      requiresVerification: true,
      email: user.email,
      message: "Verification code sent to your email.",
    });
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

    if (!user.isVerified) {
      const code = generateVerificationCode();
      user.verificationCode = code;
      user.verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();

      sendVerificationEmail(user.email, code).catch((err) => {
        console.error("[backend] Failed to send login verification email:", err);
      });

      return res.status(200).json({
        requiresVerification: true,
        email: user.email,
        message: "Please verify your email address. A code has been sent.",
      });
    }

    const token = createToken(user);
    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
      },
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/verify", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, code } = req.body as { email: string; code: string };

    if (!email || !code) {
      return res.status(400).json({ message: "Email and code are required." });
    }

    const user = await UserModel.findOne({ email }).exec();
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!user.verificationCode || user.verificationCode !== code) {
      return res.status(400).json({ message: "Invalid verification code." });
    }

    if (user.verificationCodeExpires && user.verificationCodeExpires < new Date()) {
      return res.status(400).json({ message: "Verification code has expired." });
    }

    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    const token = createToken(user);
    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
      },
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/resend-code", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body as { email: string };

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await UserModel.findOne({ email }).exec();
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const code = generateVerificationCode();
    user.verificationCode = code;
    user.verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    await sendVerificationEmail(user.email, code);

    return res.json({ message: "Verification code resent successfully." });
  } catch (error) {
    next(error);
  }
});

app.put("/api/auth/profile", requireAuth(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { name, location } = req.body as {
      name?: string;
      location?: { type: "Point"; coordinates: [number, number] };
    };

    const user = await UserModel.findById(authUser.id).exec();
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (name) user.name = name;
    if (location) user.location = location;

    await user.save();

    return res.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
      },
    });
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

import { initCronJobs } from "./services/cronService.js";

async function startServer() {
  try {
    await connectDatabase();

    initCronJobs(io);

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`[backend] Server listening on http://0.0.0.0:${PORT}`);
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
