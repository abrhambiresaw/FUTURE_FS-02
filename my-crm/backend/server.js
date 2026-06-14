import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { scrypt, timingSafeEqual, randomBytes } from "node:crypto";
import { promisify } from "node:util";
import { User } from "./models/user.js";
import { Customer, Deal, Lead, Task } from "./models/crmModels.js";

dotenv.config();

const app = express();
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const port = Number(process.env.PORT || 4000);
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/my_crm";
const jwtSecret = process.env.JWT_SECRET || "crm-suite-dev-secret";
const scryptAsync = promisify(scrypt);
const memoryUsers = new Map();
let useMemoryStore = false;

const demoUsers = [
  {
    email: "jordan@crmsuite.com",
    password: "demo123",
    name: "Jordan Lee",
    role: "Admin",
    company: "CRM Suite",
  },
  {
    email: "mia@crmsuite.com",
    password: "demo123",
    name: "Mia Carter",
    role: "Manager",
    company: "CRM Suite",
  },
  {
    email: "alex@crmsuite.com",
    password: "demo123",
    name: "Alex Kim",
    role: "Sales Agent",
    company: "CRM Suite",
  },
];

app.use(cors());
app.use(express.json());

function isValidEmail(email) {
  return typeof email === "string" && emailRegex.test(email.trim());
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(password, passwordHash) {
  const [salt, storedKey] = String(passwordHash || "").split(":");
  if (!salt || !storedKey) return false;

  const storedBuffer = Buffer.from(storedKey, "hex");
  const derivedKey = await scryptAsync(password, salt, storedBuffer.length);
  return (
    storedBuffer.length === derivedKey.length &&
    timingSafeEqual(storedBuffer, derivedKey)
  );
}

function createMemoryUser(fields) {
  return {
    _id: randomBytes(12).toString("hex"),
    company: "",
    role: "Manager",
    ...fields,
  };
}

async function findUserByEmail(email, includePassword = false) {
  if (useMemoryStore) {
    void includePassword;
    return memoryUsers.get(email) ?? null;
  }

  const query = User.findOne({ email });
  return includePassword ? query.select("+password +passwordHash") : query;
}

async function findUserById(id) {
  if (useMemoryStore) {
    return (
      Array.from(memoryUsers.values()).find(
        (user) => String(user._id) === String(id),
      ) ?? null
    );
  }

  return User.findById(id);
}

async function createUser(fields) {
  if (useMemoryStore) {
    const user = createMemoryUser(fields);
    memoryUsers.set(user.email, user);
    return user;
  }

  return User.create(fields);
}

async function saveUser(user) {
  if (useMemoryStore) {
    memoryUsers.set(user.email, user);
    return user;
  }

  return user.save();
}

function sendSession(response, user, status = 200) {
  response.status(status).json({
    success: true,
    token: jwt.sign(
      {
        sub: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: "7d" },
    ),
    user: {
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
}

function authRequired(request, response, next) {
  const header = String(request.headers.authorization || "");
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    response
      .status(401)
      .json({ success: false, message: "Missing authentication token." });
    return;
  }

  try {
    request.auth = jwt.verify(token, jwtSecret);
    next();
  } catch {
    response.status(401).json({
      success: false,
      message: "Invalid or expired authentication token.",
    });
  }
}

async function seedDemoUsers() {
  for (const seed of demoUsers) {
    const email = normalizeEmail(seed.email);
    const passwordHash = await hashPassword(seed.password);
    const existingUser = await findUserByEmail(email, true);
    if (!existingUser) {
      await createUser({
        email,
        name: seed.name,
        role: seed.role,
        company: seed.company,
        passwordHash,
      });
      continue;
    }

    if (!existingUser.passwordHash) {
      existingUser.passwordHash = existingUser.password
        ? await hashPassword(existingUser.password)
        : passwordHash;
      existingUser.password = undefined;
      await saveUser(existingUser);
    }
  }
}

app.get("/api/health", async (_request, response) => {
  response.json({ ok: true });
});

app.get("/api/auth/me", authRequired, async (request, response) => {
  const user = await findUserById(request.auth.sub);
  if (!user) {
    response
      .status(404)
      .json({ success: false, message: "Session user not found." });
    return;
  }

  sendSession(response, user);
});

app.post("/api/auth/login", async (request, response) => {
  const email = normalizeEmail(String(request.body?.email ?? ""));
  const password = String(request.body?.password ?? "");

  if (!isValidEmail(email)) {
    response
      .status(400)
      .json({ success: false, message: "Enter a valid email address." });
    return;
  }

  if (password.length < 4) {
    response.status(400).json({
      success: false,
      message: "Password must be at least 4 characters.",
    });
    return;
  }

  const user = await findUserByEmail(email, true);
  if (!user) {
    response.status(404).json({
      success: false,
      message: "Account not found. Register first or use a demo email.",
    });
    return;
  }

  if (!user.passwordHash && user.password) {
    user.passwordHash = await hashPassword(user.password);
    user.password = undefined;
    await saveUser(user);
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    response.status(401).json({ success: false, message: "Invalid password." });
    return;
  }

  sendSession(response, user);
});

app.post("/api/auth/register", async (request, response) => {
  const name = String(request.body?.name ?? "").trim();
  const email = normalizeEmail(String(request.body?.email ?? ""));
  const company = String(request.body?.company ?? "").trim();
  const password = String(request.body?.password ?? "");

  if (!name) {
    response
      .status(400)
      .json({ success: false, message: "Full name is required." });
    return;
  }

  if (!company) {
    response
      .status(400)
      .json({ success: false, message: "Company name is required." });
    return;
  }

  if (!isValidEmail(email)) {
    response
      .status(400)
      .json({ success: false, message: "Enter a valid email address." });
    return;
  }

  if (password.length < 6) {
    response.status(400).json({
      success: false,
      message: "Password must be at least 6 characters.",
    });
    return;
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    response.status(409).json({
      success: false,
      message: "An account with this email already exists.",
    });
    return;
  }

  const user = await createUser({
    name,
    email,
    company,
    passwordHash: await hashPassword(password),
    role: "Manager",
  });
  sendSession(response, user, 201);
});

app.post("/api/auth/forgot-password", async (request, response) => {
  const email = normalizeEmail(String(request.body?.email ?? ""));

  if (!isValidEmail(email)) {
    response
      .status(400)
      .json({ success: false, message: "Enter a valid email address." });
    return;
  }

  const user = await findUserByEmail(email);
  if (!user) {
    response
      .status(404)
      .json({ success: false, message: "No account found for that email." });
    return;
  }

  response.json({
    success: true,
    message: `Password reset link sent to ${email}.`,
  });
});

app.use((error, _request, response, _next) => {
  void _next;
  console.error("API error:", error);
  response.status(error.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong on the server."
        : error.message || "Something went wrong on the server.",
  });
});

async function start() {
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    await seedDemoUsers();

    await Promise.all([Customer.init(), Lead.init(), Deal.init(), Task.init()]);
  } catch (error) {
    useMemoryStore = true;
    await seedDemoUsers();
    console.warn(
      `MongoDB is unavailable, so auth is using in-memory demo users: ${error.message}`,
    );
  }

  app.listen(port, () => {
    console.log(`CRM backend listening on http://localhost:${port}`);
  });
}

start();

app.get("/api/customers", authRequired, async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/customers", authRequired, async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.put("/api/customers/:id", authRequired, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!customer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.delete("/api/customers/:id", authRequired, async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/tasks", authRequired, async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/tasks", authRequired, async (req, res) => {
  try {
    const task = await Task.create(req.body);
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.put("/api/tasks/:id", authRequired, async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!task)
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.delete("/api/tasks/:id", authRequired, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/leads", authRequired, async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.json({ success: true, data: leads });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/leads", authRequired, async (req, res) => {
  try {
    const lead = await Lead.create(req.body);
    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.put("/api/leads/:id", authRequired, async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!lead)
      return res
        .status(404)
        .json({ success: false, message: "Lead not found" });
    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.delete("/api/leads/:id", authRequired, async (req, res) => {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/deals", authRequired, async (req, res) => {
  try {
    const deals = await Deal.find().sort({ createdAt: -1 });
    res.json({ success: true, data: deals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/deals", authRequired, async (req, res) => {
  try {
    const deal = await Deal.create(req.body);
    res.json({ success: true, data: deal });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.put("/api/deals/:id", authRequired, async (req, res) => {
  try {
    const deal = await Deal.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!deal)
      return res
        .status(404)
        .json({ success: false, message: "Deal not found" });
    res.json({ success: true, data: deal });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.delete("/api/deals/:id", authRequired, async (req, res) => {
  try {
    await Deal.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/sync-all", authRequired, async (req, res) => {
  try {
    const [customers, leads, deals, tasks] = await Promise.all([
      Customer.find(),
      Lead.find(),
      Deal.find(),
      Task.find(),
    ]);
    res.json({
      success: true,
      data: { customers, leads, deals, tasks },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
