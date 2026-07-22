import express from "express";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { createServer as createViteServer } from "vite";
import { db } from "./src/db/index.ts";
import * as schema from "./src/db/schema.ts";
import { sql, eq } from "drizzle-orm";

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "MCJXEJTSUPERSECRETKEY123!";

// Retry wrapper for DB queries on transient connection drops
async function withRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 500): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      console.warn(`[DB Query Attempt ${attempt + 1} failed, retrying...]:`, err instanceof Error ? err.message : err);
      if (attempt < retries) {
        await new Promise((res) => setTimeout(res, delayMs * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

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

let dbLastUpdated = Date.now();

// JWT Auth Middleware
interface AuthRequest extends express.Request {
  user?: {
    username: string;
    fullName: string;
    role: string;
  };
}

const requireAuth = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Sesi Anda telah berakhir. Silakan login kembali." });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string; fullName: string; role: string };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Sesi Anda telah berakhir. Silakan login kembali." });
  }
};

// Seed Database Function
async function seedDatabase() {
  try {
    console.log("Checking if seeding is required...");
    // 1. Seed Categories if empty
    const existingCategories = await withRetry(() => db.select().from(schema.categories));
    if (existingCategories.length === 0) {
      console.log("Seeding default categories...");
      for (const cat of DEFAULT_CATEGORIES) {
        await withRetry(() => db.insert(schema.categories).values({
          id: cat,
          name: cat,
        }).onConflictDoNothing());
      }
    }

    // 2. Seed Users if empty
    const existingUsers = await withRetry(() => db.select().from(schema.users));
    if (existingUsers.length === 0) {
      console.log("Seeding default users...");
      await withRetry(() => db.insert(schema.users).values([
        { username: "admin", fullName: "Admin MCJ", password: "mcjxejt1515", role: "karyawan" },
        { username: "mcj x ejt", fullName: "Direktur Utama", password: "mcjejt1515", role: "direktur" }
      ]));
    }
    console.log("Database seeding check complete.");
  } catch (err) {
    console.error("Failed to seed database:", err);
  }
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  app.use(express.json({ limit: "50mb" }));

  // Run seed check
  await seedDatabase();

  // Active sockets and online users tracking
  const socketToUserMap = new Map<string, string>();
  const onlineUsersMap = new Map<string, { socketIds: Set<string>; fullName: string; role: string; lastSeen: number }>();

  const broadcastOnlineUsers = () => {
    const list = Array.from(onlineUsersMap.entries()).map(([username, data]) => ({
      username,
      fullName: data.fullName,
      role: data.role,
      lastSeen: data.lastSeen,
      isOnline: data.socketIds.size > 0
    }));
    io.emit("online_users_changed", list);
  };

  // Socket.io connection logging & real-time online status
  io.on("connection", (socket) => {
    console.log("Client connected via Socket.IO:", socket.id);

    socket.on("user_online", (userData: { username: string; fullName: string; role: string }) => {
      if (!userData || !userData.username) return;
      const cleanUsername = userData.username.trim().toLowerCase();
      socketToUserMap.set(socket.id, cleanUsername);

      const existing = onlineUsersMap.get(cleanUsername);
      if (existing) {
        existing.socketIds.add(socket.id);
        existing.lastSeen = Date.now();
        if (userData.fullName) existing.fullName = userData.fullName;
        if (userData.role) existing.role = userData.role;
      } else {
        onlineUsersMap.set(cleanUsername, {
          socketIds: new Set([socket.id]),
          fullName: userData.fullName || cleanUsername,
          role: userData.role || "karyawan",
          lastSeen: Date.now()
        });
      }
      broadcastOnlineUsers();
    });

    socket.on("user_offline", (userData: { username: string }) => {
      if (!userData || !userData.username) return;
      const cleanUsername = userData.username.trim().toLowerCase();
      const existing = onlineUsersMap.get(cleanUsername);
      if (existing) {
        existing.socketIds.delete(socket.id);
        existing.lastSeen = Date.now();
      }
      socketToUserMap.delete(socket.id);
      broadcastOnlineUsers();
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      const username = socketToUserMap.get(socket.id);
      if (username) {
        socketToUserMap.delete(socket.id);
        const existing = onlineUsersMap.get(username);
        if (existing) {
          existing.socketIds.delete(socket.id);
          existing.lastSeen = Date.now();
        }
        broadcastOnlineUsers();
      }
    });
  });

  // API Routes (Protected)
  app.get("/api/data", requireAuth, async (req: AuthRequest, res) => {
    try {
      const projectsData = await withRetry(() => db.select().from(schema.projects));
      const transactionsData = await withRetry(() => db.select().from(schema.transactions));
      const activitiesData = await withRetry(() => db.select().from(schema.activities));
      const categoriesData = await withRetry(() => db.select().from(schema.categories));
      const alertsData = await withRetry(() => db.select().from(schema.alerts));

      // Map numeric back to number for Transactions
      const transactionsMapped = transactionsData.map((t) => ({
        ...t,
        amount: Number(t.amount),
        items: t.items || [],
        contractItems: t.contractItems || [],
      }));

      const projectsMapped = projectsData.map((p) => ({
        ...p,
        contractValue: p.contractValue || { piping: 0, electrical: 0, mechanical: 0, scafolder: 0 },
        contractNames: p.contractNames || {},
        customContractItems: p.customContractItems || [],
      }));

      const categoriesMapped = categoriesData.map((c) => c.name);

      res.json({
        success: true,
        projects: projectsMapped,
        transactions: transactionsMapped,
        activities: activitiesData,
        categories: categoriesMapped,
        alerts: alertsData,
        lastUpdated: dbLastUpdated
      });
    } catch (err) {
      console.error("Failed to load data from database:", err);
      res.status(500).json({ success: false, message: "Gagal memuat data dari database." });
    }
  });

  app.post("/api/data/update", requireAuth, async (req: AuthRequest, res) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Sesi Anda telah berakhir. Silakan login kembali." });
    }

    // Role check
    if (user.role === "direktur" || user.role === "user") {
      return res.status(403).json({ success: false, message: "Anda tidak memiliki hak akses untuk mengubah data keuangan!" });
    }

    const { projects, transactions, activities, categories } = req.body;

    try {
      // Perform database updates inside transaction or sequence
      if (projects !== undefined && Array.isArray(projects)) {
        for (const p of projects) {
          if (!p.id || !p.name || !p.code) continue;
          await withRetry(() => db.insert(schema.projects).values({
            id: p.id,
            name: p.name,
            code: p.code,
            manager: p.manager || "Unassigned",
            pic: p.pic || "Unassigned",
            status: p.status || "PROGRES",
            startDate: p.startDate || new Date().toISOString().split("T")[0],
            expectedProfitPercent: Number(p.expectedProfitPercent) || 0,
            contractValue: p.contractValue || { piping: 0, electrical: 0, mechanical: 0, scafolder: 0 },
            ppnPercent: Number(p.ppnPercent) || 11,
            pphPercent: Number(p.pphPercent) || 4,
            budgetThresholdPercent: Number(p.budgetThresholdPercent) || 85,
            notes: p.notes || null,
            contractNames: p.contractNames || null,
            company: p.company || null,
            poNo: p.poNo || null,
            customContractItems: p.customContractItems || null,
            targetCompletionDate: p.targetCompletionDate || null,
          }).onConflictDoUpdate({
            target: schema.projects.id,
            set: {
              name: p.name,
              code: p.code,
              manager: p.manager || "Unassigned",
              pic: p.pic || "Unassigned",
              status: p.status || "PROGRES",
              startDate: p.startDate || new Date().toISOString().split("T")[0],
              expectedProfitPercent: Number(p.expectedProfitPercent) || 0,
              contractValue: p.contractValue || { piping: 0, electrical: 0, mechanical: 0, scafolder: 0 },
              ppnPercent: Number(p.ppnPercent) || 11,
              pphPercent: Number(p.pphPercent) || 4,
              budgetThresholdPercent: Number(p.budgetThresholdPercent) || 85,
              notes: p.notes || null,
              contractNames: p.contractNames || null,
              company: p.company || null,
              poNo: p.poNo || null,
              customContractItems: p.customContractItems || null,
              targetCompletionDate: p.targetCompletionDate || null,
            }
          }));
        }

        // Clean up deleted projects
        const projectIds = projects.map((p: any) => p.id).filter(Boolean);
        if (projectIds.length > 0) {
          await withRetry(() => db.delete(schema.projects).where(sql`id NOT IN (${sql.join(projectIds.map(id => sql`${id}`), sql`, `)})`));
        } else if (req.body.allowClearAll === true) {
          await withRetry(() => db.delete(schema.projects));
        }
      }

      if (transactions !== undefined && Array.isArray(transactions)) {
        for (const t of transactions) {
          if (!t.id || !t.projectId) continue;
          await withRetry(() => db.insert(schema.transactions).values({
            id: t.id,
            projectId: t.projectId,
            type: t.type,
            pic: t.pic || "System",
            date: t.date || new Date().toISOString().split("T")[0],
            invoiceNo: t.invoiceNo || null,
            petyCashNo: t.petyCashNo || null,
            poNo: t.poNo || null,
            supplier: t.supplier || null,
            status: t.status || "Belum Proses",
            description: t.description || "",
            paymentMethod: t.paymentMethod || null,
            category: t.category || "Lain - Lain",
            amount: String(t.amount || 0),
            items: t.items || null,
            contractItems: t.contractItems || null,
            company: t.company || null,
            requestId: t.requestId || null,
            transferProof: t.transferProof || null,
          }).onConflictDoUpdate({
            target: schema.transactions.id,
            set: {
              projectId: t.projectId,
              type: t.type,
              pic: t.pic || "System",
              date: t.date || new Date().toISOString().split("T")[0],
              invoiceNo: t.invoiceNo || null,
              petyCashNo: t.petyCashNo || null,
              poNo: t.poNo || null,
              supplier: t.supplier || null,
              status: t.status || "Belum Proses",
              description: t.description || "",
              paymentMethod: t.paymentMethod || null,
              category: t.category || "Lain - Lain",
              amount: String(t.amount || 0),
              items: t.items || null,
              contractItems: t.contractItems || null,
              company: t.company || null,
              requestId: t.requestId || null,
              transferProof: t.transferProof || null,
            }
          }));
        }

        // Clean up deleted transactions
        const transIds = transactions.map((t: any) => t.id).filter(Boolean);
        if (transIds.length > 0) {
          await withRetry(() => db.delete(schema.transactions).where(sql`id NOT IN (${sql.join(transIds.map(id => sql`${id}`), sql`, `)})`));
        } else if (req.body.allowClearAll === true) {
          await withRetry(() => db.delete(schema.transactions));
        }
      }

      if (activities !== undefined && Array.isArray(activities)) {
        for (const a of activities) {
          if (!a.id) continue;
          await withRetry(() => db.insert(schema.activities).values({
            id: a.id,
            type: a.type,
            action: a.action,
            description: a.description,
            pic: a.pic || "System",
            date: a.date || new Date().toISOString().split("T")[0],
            projectId: a.projectId || null,
          }).onConflictDoUpdate({
            target: schema.activities.id,
            set: {
              type: a.type,
              action: a.action,
              description: a.description,
              pic: a.pic || "System",
              date: a.date || new Date().toISOString().split("T")[0],
              projectId: a.projectId || null,
            }
          }));
        }

        // Clean up deleted activities
        const actIds = activities.map((a: any) => a.id).filter(Boolean);
        if (actIds.length > 0) {
          await withRetry(() => db.delete(schema.activities).where(sql`id NOT IN (${sql.join(actIds.map(id => sql`${id}`), sql`, `)})`));
        } else if (req.body.allowClearAll === true) {
          await withRetry(() => db.delete(schema.activities));
        }
      }

      if (categories !== undefined && Array.isArray(categories)) {
        for (const c of categories) {
          const nameStr = typeof c === "string" ? c : c.name;
          if (!nameStr) continue;
          await withRetry(() => db.insert(schema.categories).values({
            id: nameStr,
            name: nameStr,
          }).onConflictDoNothing());
        }

        // Clean up deleted categories
        const catNames = categories.map((c: any) => typeof c === "string" ? c : c.name).filter(Boolean);
        if (catNames.length > 0) {
          await withRetry(() => db.delete(schema.categories).where(sql`id NOT IN (${sql.join(catNames.map(name => sql`${name}`), sql`, `)})`));
        } else if (req.body.allowClearAll === true) {
          await withRetry(() => db.delete(schema.categories));
        }
      }

      dbLastUpdated = Date.now();

      // Broad-cast real-time update via socket.io
      io.emit("data_updated", { lastUpdated: dbLastUpdated });

      res.json({ success: true, lastUpdated: dbLastUpdated });
    } catch (err) {
      console.error("Failed to sync updates to PostgreSQL:", err);
      res.status(500).json({ success: false, message: "Gagal menyimpan sinkronisasi data ke PostgreSQL." });
    }
  });

  app.get("/api/data/status", (req, res) => {
    res.json({ lastUpdated: dbLastUpdated });
  });

  // User Auth & Management API
  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username dan Password diperlukan!" });
    }

    try {
      const cleanUsername = username.trim().toLowerCase();
      const usersFound = await withRetry(() => db.select().from(schema.users).where(eq(schema.users.username, cleanUsername)));
      const user = usersFound[0];

      if (user && user.password === password) {
        // Sign token with JWT
        const token = jwt.sign(
          {
            username: user.username,
            fullName: user.fullName,
            role: user.role
          },
          JWT_SECRET,
          { expiresIn: "12h" }
        );

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
    } catch (err) {
      console.error("Login failure:", err);
      res.status(500).json({ success: false, message: "Terjadi kesalahan pada server login." });
    }
  });

  // Public User Self-Registration API
  app.post("/api/register", async (req, res) => {
    const { username, fullName, password, role } = req.body;
    if (!username || !fullName || !password || !role) {
      return res.status(400).json({ success: false, message: "Semua kolom wajib diisi!" });
    }
    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, "");
    if (!cleanUsername) {
      return res.status(400).json({ success: false, message: "Username tidak valid!" });
    }

    if (password.length < 4) {
      return res.status(400).json({ success: false, message: "Password minimal harus memiliki panjang 4 karakter!" });
    }

    try {
      const exists = await db.select().from(schema.users).where(eq(schema.users.username, cleanUsername));
      if (exists.length > 0) {
        return res.status(400).json({ success: false, message: "Username sudah terdaftar! Gunakan username lain." });
      }

      await db.insert(schema.users).values({
        username: cleanUsername,
        fullName: fullName.trim(),
        password: password,
        role: role
      });

      dbLastUpdated = Date.now();
      io.emit("users_updated");

      res.json({
        success: true,
        message: "Pendaftaran akun karyawan berhasil! Silakan masuk dengan akun baru Anda."
      });
    } catch (err) {
      console.error("Registration failure:", err);
      res.status(500).json({ success: false, message: "Terjadi kesalahan pada server pendaftaran." });
    }
  });

  app.get("/api/auth/verify", requireAuth, (req: AuthRequest, res) => {
    if (req.user) {
      res.json({
        success: true,
        user: req.user
      });
    } else {
      res.status(401).json({ success: false, message: "Sesi tidak valid atau telah berakhir." });
    }
  });

  app.post("/api/logout", (req, res) => {
    res.json({ success: true, message: "Sesi berhasil dihapus." });
  });

  app.get("/api/users", requireAuth, async (req: AuthRequest, res) => {
    try {
      const dbUsers = await withRetry(() => db.select().from(schema.users));
      const safeUsers = dbUsers.map((u) => {
        const onlineEntry = onlineUsersMap.get(u.username);
        const isOnline = Boolean(onlineEntry && onlineEntry.socketIds.size > 0);
        return {
          username: u.username,
          fullName: u.fullName,
          role: u.role,
          isOnline: isOnline,
          lastSeen: onlineEntry ? onlineEntry.lastSeen : null
        };
      });
      res.json(safeUsers);
    } catch (err) {
      console.error("Load users failed:", err);
      res.status(500).json({ success: false, message: "Gagal memuat daftar karyawan." });
    }
  });

  app.get("/api/users/online", requireAuth, (req: AuthRequest, res) => {
    const list = Array.from(onlineUsersMap.entries())
      .filter(([_, data]) => data.socketIds.size > 0)
      .map(([username, data]) => ({
        username,
        fullName: data.fullName,
        role: data.role,
        lastSeen: data.lastSeen,
        isOnline: true
      }));
    res.json({ success: true, count: list.length, users: list });
  });

  app.post("/api/users/update", requireAuth, async (req: AuthRequest, res) => {
    const user = req.user;
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

    const cleanUsername = targetUsername.trim().toLowerCase();

    try {
      if (isDelete || action === "delete") {
        if (cleanUsername === "admin") {
          return res.status(400).json({ success: false, message: "User admin utama tidak dapat dihapus!" });
        }
        await db.delete(schema.users).where(eq(schema.users.username, cleanUsername));
      } else {
        await db.insert(schema.users).values({
          username: cleanUsername,
          fullName: fullName || cleanUsername,
          password: password || "123456",
          role: role || "karyawan"
        }).onConflictDoUpdate({
          target: schema.users.username,
          set: {
            fullName: fullName || undefined,
            password: password || undefined,
            role: role || undefined
          }
        });
      }

      dbLastUpdated = Date.now();
      io.emit("users_updated");

      const dbUsers = await db.select().from(schema.users);
      const safeUsers = dbUsers.map((u) => ({
        username: u.username,
        fullName: u.fullName,
        role: u.role
      }));

      res.json({
        success: true,
        users: safeUsers
      });
    } catch (err) {
      console.error("Users update failed:", err);
      res.status(500).json({ success: false, message: "Gagal mengupdate daftar karyawan." });
    }
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

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
