const express = require("express");
const pool = require("./db/database");
const config = require("./config/env");
const authRoutes = require("./routes/authRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const widgetRoutes = require("./routes/widgetRoutes");
const publicWidgetRoutes = require("./routes/publicWidgetRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const submissionRateLimiter = require("./middleware/rateLimitMiddleware");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

app.use(express.json({ limit: "10kb" }));
app.use(express.static("public"));

app.use("/auth", authRoutes);
app.use("/protected", protectedRoutes);
app.use("/api/widgets", widgetRoutes);
app.use("/widgets", publicWidgetRoutes);
app.use(
  "/submissions",
  submissionRateLimiter,
  submissionRoutes
);
app.use("/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "FlyRank Lead Capture Platform API is running"
  });
});

app.get("/health/db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      status: "ok",
      database: "connected",
      time: result.rows[0].now
    });
  } catch (error) {
    console.error("Database connection error:", error.message);

    res.status(500).json({
      status: "error",
      database: "disconnected"
    });
  }
});

app.listen(config.port, () => {
  console.log(`🚀 Server running at http://localhost:${config.port}`);
});