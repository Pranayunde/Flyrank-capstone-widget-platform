const express = require("express");
const path = require("path");
const pool = require("./db/database");
const config = require("./config/env");

const authRoutes = require("./routes/authRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const widgetRoutes = require("./routes/widgetRoutes");
const publicWidgetRoutes = require("./routes/publicWidgetRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const submissionRateLimiter = require("./middleware/rateLimitMiddleware");

const app = express();

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
| The widget is designed to run on websites hosted on different origins.
| Therefore public widget/config/submission requests must support CORS.
*/
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Idempotency-Key"
  );

  res.setHeader(
    "Access-Control-Expose-Headers",
    "RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset, Retry-After"
  );

  // Browser preflight request
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

/*
|--------------------------------------------------------------------------
| JSON Body Parser
|--------------------------------------------------------------------------
| 10 KB prevents extremely large public payloads.
*/
app.use(express.json({ limit: "10kb" }));

/*
|--------------------------------------------------------------------------
| Versioned Widget JavaScript
|--------------------------------------------------------------------------
| Long cache because the URL contains the version.
| A future release can use widget.v2.js.
*/
app.get("/widget.v1.js", (req, res) => {
  res.setHeader(
    "Cache-Control",
    "public, max-age=31536000, immutable"
  );

  res.type("application/javascript");

  res.sendFile(
    path.join(__dirname, "public", "widget.v1.js")
  );
});

/*
|--------------------------------------------------------------------------
| Backward-compatible widget.js
|--------------------------------------------------------------------------
*/
app.get("/widget.js", (req, res) => {
  res.setHeader(
    "Cache-Control",
    "public, max-age=300"
  );

  res.type("application/javascript");

  res.sendFile(
    path.join(__dirname, "public", "widget.v1.js")
  );
});

/*
|--------------------------------------------------------------------------
| Static Public Files
|--------------------------------------------------------------------------
*/
app.use(
  express.static(
    path.join(__dirname, "public"),
    {
      index: false
    }
  )
);

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/
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

/*
|--------------------------------------------------------------------------
| Root
|--------------------------------------------------------------------------
*/
app.get("/", (req, res) => {
  res.status(200).json({
    message: "FlyRank Lead Capture Platform API is running"
  });
});

/*
|--------------------------------------------------------------------------
| Database Health
|--------------------------------------------------------------------------
*/
app.get("/health/db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.status(200).json({
      status: "ok",
      database: "connected",
      time: result.rows[0].now
    });
  } catch (error) {
    console.error(
      "Database connection error:",
      error.message
    );

    res.status(500).json({
      status: "error",
      database: "disconnected"
    });
  }
});

/*
|--------------------------------------------------------------------------
| Error Handler
|--------------------------------------------------------------------------
| Convert malformed JSON and oversized requests into clean JSON 4xx errors.
*/
app.use((error, req, res, next) => {
  if (error.type === "entity.too.large") {
    return res.status(413).json({
      error: "Request payload is too large"
    });
  }

  if (
    error instanceof SyntaxError &&
    error.status === 400 &&
    "body" in error
  ) {
    return res.status(400).json({
      error: "Invalid JSON payload"
    });
  }

  console.error(
    "Unhandled error:",
    error.message
  );

  return res.status(500).json({
    error: "Internal server error"
  });
});

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/
app.listen(config.port, () => {
  console.log(
    `🚀 Server running at http://localhost:${config.port}`
  );
});