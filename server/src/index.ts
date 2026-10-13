import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";

if (
  !process.env.BETTER_AUTH_SECRET ||
  process.env.BETTER_AUTH_SECRET.includes("generate-with")
) {
  throw new Error("BETTER_AUTH_SECRET must be set to a strong random value");
}

const app = express();
const port = process.env.PORT || 3001;

app.use(helmet());
app.use(
  cors({
    origin: process.env.TRUSTED_ORIGINS?.split(",") ?? [],
    credentials: true,
  })
);
// Better Auth's toNodeHandler reads the raw body itself, so express.json()
// must not parse /api/auth/* requests — it consumes the stream and causes a 500.
app.use((req, res, next) => {
  if (req.path.startsWith("/api/auth")) return next();
  express.json()(req, res, next);
});

if (process.env.NODE_ENV === "production") {
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api/auth", authLimiter);
}

app.all("/api/auth/*splat", toNodeHandler(auth));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
