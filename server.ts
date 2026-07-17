import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "data-db.json");

// Default initial categories
const DEFAULT_CATEGORIES = [
  "Gaji",
  "Material",
  "Consumable",
  "Tools",
  "Makan",
  "Air Minum",
  "Transportasi",
  "FEE MARKET",
  "Kopi Rokok",
  "Kesehatan",
  "Perlengkapan Pelindung",
  "Rental",
  "Mess karyawan",
  "Lain - Lain",
  "ATK",
  "Ppn 11%",
  "Ppn 11% Supplier",
  "Dana 2%",
  "BPJS JAKON",
  "Pph 4%"
];

// Read database helper
function readDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const data = JSON.parse(content);
      let updated = false;
      if (!data.users) {
        data.users = [
          { username: "admin", fullName: "Admin MCJ", password: "mcjxejt1515", role: "karyawan" },
          { username: "mcj x ejt", fullName: "Direktur Utama", password: "mcjejt1515", role: "direktur" }
        ];
        updated = true;
      }
      if (!Array.isArray(data.projects)) {
        data.projects = [];
        updated = true;
      }
      if (!Array.isArray(data.transactions)) {
        data.transactions = [];
        updated = true;
      }
      if (!Array.isArray(data.activities)) {
        data.activities = [];
        updated = true;
      }
      if (!Array.isArray(data.categories)) {
        data.categories = DEFAULT_CATEGORIES;
        updated = true;
      }
      if (typeof data.lastUpdated !== "number") {
        data.lastUpdated = Date.now();
        updated = true;
      }
      if (updated) {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
      }
      return data;
    }
  } catch (err) {
    console.error("Error reading database file, using defaults:", err);
  }
  return {
    projects: [],
    transactions: [],
    activities: [],
    categories: DEFAULT_CATEGORIES,
    users: [
      { username: "admin", fullName: "Admin MCJ", password: "mcjxejt1515", role: "karyawan" },
      { username: "mcj x ejt", fullName: "Direktur Utama", password: "mcjejt1515", role: "direktur" }
    ],
    lastUpdated: Date.now()
  };
}

// Write database helper
function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database file:", err);
  }
}

// In-memory Session Store
interface Session {
  username: string;
  fullName: string;
  role: string;
  expiresAt: number;
}
const SESSIONS = new Map<string, Session>();

// Helper to validate and get session user from Authorization header or cookie
function getSessionUser(req: express.Request): Session | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  const session = SESSIONS.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    SESSIONS.delete(token); // Cleanup expired session
    return null;
  }
  // Extend session on activity (sliding expiration of 2 hours)
  session.expiresAt = Date.now() + 2 * 60 * 60 * 1000;
  return session;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));

  // API Routes (Protected)
  app.get("/api/data", (req, res) => {
    const user = getSessionUser(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Sesi Anda telah berakhir. Silakan login kembali." });
    }
    const db = readDB();
    res.json(db);
  });

  app.post("/api/data/update", (req, res) => {
    const user = getSessionUser(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Sesi Anda telah berakhir. Silakan login kembali." });
    }
    // Auth authorization check: Project Manager and User/Direktur cannot write critical transactions
    if (user.role === "direktur" || user.role === "user") {
      return res.status(403).json({ success: false, message: "Anda tidak memiliki hak akses untuk mengubah data keuangan!" });
    }

    const { projects, transactions, activities, categories } = req.body;
    const db = readDB();

    if (projects !== undefined) db.projects = projects;
    if (transactions !== undefined) db.transactions = transactions;
    if (activities !== undefined) db.activities = activities;
    if (categories !== undefined) db.categories = categories;

    db.lastUpdated = Date.now();
    writeDB(db);

    res.json({ success: true, lastUpdated: db.lastUpdated, db });
  });

  app.get("/api/data/status", (req, res) => {
    const db = readDB();
    res.json({ lastUpdated: db.lastUpdated });
  });

  // User Auth & Management API
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username dan Password diperlukan!" });
    }
    const db = readDB();
    const user = db.users.find(
      (u: any) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
    );
    if (user) {
      // Generate secure 32-character hex token
      const token = crypto.randomBytes(16).toString("hex");
      const expiresAt = Date.now() + 2 * 60 * 60 * 1000; // 2 hours expiry
      SESSIONS.set(token, {
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        expiresAt
      });

      res.json({
        success: true,
        token,
        user: {
          username: user.username,
          fullName: user.fullName,
          role: user.role
        }
      });
    } else {
      res.status(401).json({ success: false, message: "Username atau Password salah!" });
    }
  });

  app.get("/api/auth/verify", (req, res) => {
    const user = getSessionUser(req);
    if (user) {
      res.json({
        success: true,
        user: {
          username: user.username,
          fullName: user.fullName,
          role: user.role
        }
      });
    } else {
      res.status(401).json({ success: false, message: "Sesi tidak valid atau telah berakhir." });
    }
  });

  app.post("/api/logout", (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      SESSIONS.delete(token);
    }
    res.json({ success: true, message: "Sesi berhasil dihapus." });
  });

  app.get("/api/users", (req, res) => {
    const user = getSessionUser(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Sesi Anda telah berakhir. Silakan login kembali." });
    }
    const db = readDB();
    const safeUsers = db.users.map((u: any) => ({
      username: u.username,
      fullName: u.fullName,
      role: u.role
    }));
    res.json(safeUsers);
  });

  app.post("/api/users/update", (req, res) => {
    const user = getSessionUser(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Sesi Anda telah berakhir. Silakan login kembali." });
    }
    // Only Admin or original Karyawan level can manage users
    if (user.role !== "admin" && user.role !== "karyawan") {
      return res.status(403).json({ success: false, message: "Hanya Admin yang dapat mengelola akun karyawan!" });
    }

    const { username, fullName, password, role, isDelete, action } = req.body;
    const targetUsername = username || req.body.username;
    if (!targetUsername) {
      return res.status(400).json({ success: false, message: "Username diperlukan!" });
    }

    const db = readDB();
    const cleanUsername = targetUsername.trim();

    if (isDelete || action === "delete") {
      if (cleanUsername === "admin") {
        return res.status(400).json({ success: false, message: "User admin utama tidak dapat dihapus!" });
      }
      db.users = db.users.filter((u: any) => u.username.toLowerCase() !== cleanUsername.toLowerCase());
    } else {
      const idx = db.users.findIndex((u: any) => u.username.toLowerCase() === cleanUsername.toLowerCase());
      if (idx >= 0) {
        // Update existing
        db.users[idx].fullName = fullName || db.users[idx].fullName;
        if (password) db.users[idx].password = password;
        db.users[idx].role = role || db.users[idx].role;
      } else {
        // Create new
        db.users.push({
          username: cleanUsername,
          fullName: fullName || cleanUsername,
          password: password || "123456",
          role: role || "karyawan"
        });
      }
    }

    db.lastUpdated = Date.now();
    writeDB(db);

    res.json({
      success: true,
      users: db.users.map((u: any) => ({
        username: u.username,
        fullName: u.fullName,
        role: u.role
      }))
    });
  });

  // Vite development or production build static middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
