import express from "express";
import { pool } from "./db.js";
import bcrypt from "bcrypt";
import "dotenv/config";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
app.use(express.json({ limit: "10kb" }));

app.get("/health", async (req, res) => {
  const { rows } = await pool.query("SELECT now()");
  res.json({ status: "ok", dbTime: rows[0].now });
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.post("/auth/signup", async (req, res) => {
  const { email, password } = req.body ?? {};

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "email and password is needed" });
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail.length > 254 || !EMAIL_RE.test(normalizedEmail)) {
    return res.status(400).json({ error: "email format is wrong" });
  }
  const passwordBytes = Buffer.byteLength(password, "utf-8");
  if (passwordBytes < 8 || passwordBytes > 72) {
    return res
      .status(400)
      .json({ error: "password has be less that 72 bytes" });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const { rows } = await pool.query(
      "INSERT INTO users(email,password_hash) Values($1,$2) RETURNING id,email",
      [normalizedEmail, passwordHash],
    );
    return res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "email already registered" });
    }
    throw err;
  }
});
app.use(errorHandler);
export default app;
